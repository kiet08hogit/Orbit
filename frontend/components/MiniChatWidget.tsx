"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";
import { usePathname } from "next/navigation";

export function MiniChatWidget() {
  const { getToken, userId } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(
    null,
  );
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Do not show widget on full chat page
  if (pathname?.startsWith("/chat")) return null;

  useEffect(() => {
    if (userId) {
      const newSocket = io("http://127.0.0.1:3000", {
        auth: { token: "dummy" },
        query: { userId },
      });

      newSocket.on("connect", async () => {
        const token = await getToken();
        newSocket.emit("authenticate", { token });
      });

      newSocket.on("receive_message", (msg: any) => {
        // If it's the active conversation, append it
        setMessages((prev) => {
          if (activeConversation && msg.conversationId === activeConversation) {
            return [...prev, msg];
          }
          return prev;
        });

        // Always show toast if it's not our own message and we're not actively looking at it
        if (
          msg.senderId !== userId &&
          (!isOpen || msg.conversationId !== activeConversation)
        ) {
          const senderName =
            msg.sender?.name || msg.sender?.username || "Someone";
          toast({
            title: `New message from ${senderName}`,
            description:
              msg.content.length > 40
                ? msg.content.substring(0, 40) + "..."
                : msg.content,
            duration: 5000,
          });
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
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
      setMessages(res.data.messages || []);

      // Notify backend to mark as read
      socket?.emit("mark_read", { conversationId: convId });
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

  if (!userId) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-card border border-border shadow-2xl rounded-2xl w-[320px] h-[450px] mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-2">
              {activeConversation ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => {
                    setActiveConversation(null);
                    loadInbox();
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              ) : (
                <MessageSquare className="h-5 w-5 ml-1" />
              )}
              <h3 className="font-bold text-sm">
                {activeConversation ? "Chat" : "Messages"}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 bg-background relative overflow-hidden flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !activeConversation ? (
              <ScrollArea className="flex-1">
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
              </ScrollArea>
            ) : (
              <>
                <ScrollArea className="flex-1 p-3">
                  <div className="flex flex-col gap-3 pb-2">
                    {messages.map((msg, idx) => {
                      const isMe = msg.sender.clerkUserId === userId;
                      return (
                        <div
                          key={idx}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-3 py-2 text-[13px] ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"}`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className="p-2 bg-card border-t border-border">
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
          <MessageSquare className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
