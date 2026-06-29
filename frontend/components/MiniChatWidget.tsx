"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function MiniChatWidget() {
  const { getToken, userId } = useAuth();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(
    null,
  );
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if we are on the full chat page

  useEffect(() => {
    let newSocket: Socket | null = null;
    
    if (userId) {
      const initSocket = async () => {
        const token = await getToken();

        // Fetch initial unread count
        try {
          const res = await axios.get(`http://127.0.0.1:3000/chat/unread-count`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUnreadCount(res.data.count || 0);
        } catch (e) { console.error(e); }

        newSocket = io("http://127.0.0.1:3000", {
          auth: { token },
          query: { userId },
        });

        newSocket.on("connect", () => {
          newSocket!.emit("authenticate", { token });
        });

        newSocket.on("receive_message", (msg: any) => {
          // If it's the active conversation, append it
          setMessages((prev) => {
            if (activeConversation && msg.conversationId === activeConversation) {
              return [...prev, msg];
            }
            return prev;
          });

          // If it's not us and not active/open, increment unread count
          if (msg.senderId !== userId && (!isOpen || msg.conversationId !== activeConversation)) {
            setUnreadCount(prev => prev + 1);
          }

          // If we are viewing it, tell backend we read it
          if (msg.senderId !== userId && isOpen && activeConversation && msg.conversationId === activeConversation) {
            newSocket!.emit("mark_read", { conversationId: activeConversation });
          }

          // Always show toast if it's not our own message and we're not actively looking at it
          if (
            msg.senderId !== userId &&
            (!isOpen || msg.conversationId !== activeConversation)
          ) {
            const senderName =
              msg.sender?.name || msg.sender?.username || "Someone";
            toast(`New message from ${senderName}`, {
              description:
                msg.content.length > 40
                  ? msg.content.substring(0, 40) + "..."
                  : msg.content,
              duration: 5000,
            });
          }
        });
        
        newSocket.on("messages_read", (payload: { conversationId: string }) => {
          if (activeConversation && payload.conversationId === activeConversation) {
            setMessages(prev => prev.map(m => m.senderId === userId ? { ...m, isRead: true } : m));
          }
        });
        
        setSocket(newSocket);
      };

      initSocket();

      return () => {
        newSocket?.disconnect();
      };
    }
  }, [userId, activeConversation, isOpen]);

  const loadInbox = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const res = await axios.get(`http://127.0.0.1:3000/chat/inbox`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversation = async (convId: string) => {
    try {
      setIsLoading(true);
      setActiveConversation(convId);
      const token = await getToken();
      const res = await axios.get(
        `http://127.0.0.1:3000/chat/inbox/${convId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      // The API returns an array directly, not an object with a messages property
      setMessages(Array.isArray(res.data) ? res.data : res.data.messages || []);

      // Notify backend to mark as read and manually refresh unread count
      socket?.emit("mark_read", { conversationId: convId });
      
      const unreadRes = await axios.get(`http://127.0.0.1:3000/chat/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(unreadRes.data.count || 0);

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && !activeConversation) {
      loadInbox();
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !socket) return;

    socket.emit("send_message", {
      conversationId: activeConversation,
      content: newMessage,
    });

    setNewMessage("");
  };

  if (!userId || pathname?.startsWith("/chat")) return null;

  // Render header logic
  const activeConvDetails = activeConversation ? conversations.find(c => c.id === activeConversation) : null;
  const activeOtherMember = activeConvDetails?.members.find((m: any) => m.user.clerkUserId !== userId)?.user;
  
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-card border border-border shadow-2xl rounded-2xl w-[380px] h-[550px] mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-3 flex flex-col shadow-sm z-10 gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                {activeConversation ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => {
                      setActiveConversation(null);
                      loadInbox();
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                ) : (
                  <MessageSquare className="h-5 w-5 ml-1 shrink-0" />
                )}
                {activeConversation ? (
                  <Link href={`/profile/${activeOtherMember?.clerkUserId || activeOtherMember?.id}`} className="hover:opacity-80 transition-opacity">
                    <h3 className="font-bold text-sm truncate">
                      {activeOtherMember?.name || activeOtherMember?.username || "Chat"}
                    </h3>
                  </Link>
                ) : (
                  <h3 className="font-bold text-sm truncate">Messages</h3>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {activeConversation && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => window.location.href = `/chat?id=${activeConversation}`}
                    title="Open in full chat"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {/* Context Buttons Row */}
            {activeConversation && (
              <div className="flex items-center gap-2 pl-9">
                <Button
                  size="sm"
                  onClick={() => window.location.href = `/chat?id=${activeConversation}`}
                  className="bg-white/20 hover:bg-white/30 h-6 text-[10px] px-2 rounded-full text-white border-none"
                >
                  Verify Meetup
                </Button>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 bg-background relative overflow-hidden flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !activeConversation ? (
              <div className="flex-1 overflow-y-auto min-h-0">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No conversations yet
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {conversations.map((conv) => {
                      const otherMember = conv.members.find(
                        (m: any) => m.user.clerkUserId !== userId,
                      )?.user;
                      const lastMessage = conv.messages[0];
                      return (
                        <div
                          key={conv.id}
                          onClick={() => loadConversation(conv.id)}
                          className="p-3 border-b border-border hover:bg-secondary/50 cursor-pointer flex gap-3 items-center transition-colors"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={otherMember?.avatarUrl} />
                            <AvatarFallback>
                              {otherMember?.name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[13px] font-bold text-foreground truncate">
                              {otherMember?.name || otherMember?.username}
                            </h4>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {lastMessage?.content || "No messages"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-3 min-h-0">
                  <div className="flex flex-col gap-3 pb-2">
                    {messages.map((msg, idx) => {
                      const isMe = msg.sender.clerkUserId === userId;
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}
                        >
                          {msg.listing && (
                            <div className="bg-muted p-2 rounded-lg flex items-center gap-2 max-w-[85%] border border-border cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => window.location.href = `/listings/${msg.listing.id}`}>
                              {msg.listing.images?.[0]?.url ? (
                                <img src={msg.listing.images[0].url.startsWith('http') ? msg.listing.images[0].url : `http://127.0.0.1:3000${msg.listing.images[0].url}`} alt={msg.listing.title} className="w-10 h-10 object-cover rounded-md" />
                              ) : (
                                <div className="w-10 h-10 bg-secondary rounded-md" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-bold truncate">{msg.listing.title}</p>
                                <p className="text-[11px] text-muted-foreground">${msg.listing.price}</p>
                              </div>
                            </div>
                          )}
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"}`}
                          >
                            {msg.content}
                          </div>
                          {isMe && msg.isRead && (
                            <span className="text-[10px] text-emerald-500 font-bold tracking-wide mr-1 mt-0.5">
                              • Seen
                            </span>
                          )}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
                <div className="p-2 bg-card border-t border-border shrink-0">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 h-9 bg-secondary border-none text-[13px] rounded-full px-4"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!newMessage.trim()}
                      className="h-9 w-9 rounded-full bg-primary shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <Button
        onClick={handleOpen}
        size="icon"
        className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl transition-transform hover:scale-105 active:scale-95"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <MessageSquare className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-3 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-primary">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        )}
      </Button>
    </div>
  );
}
