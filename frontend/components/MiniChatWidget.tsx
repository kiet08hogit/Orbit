"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, ArrowLeft, Loader2, ExternalLink, Image as ImageIcon, MoreHorizontal, Copy, Reply, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
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
  
  // New States
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showSharedMedia, setShowSharedMedia] = useState(false);

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
              
            toast.custom((t) => (
              <div
                onClick={() => {
                  toast.dismiss(t);
                  setIsOpen(true);
                  loadConversation(msg.conversationId);
                }}
                className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl shadow-lg cursor-pointer hover:bg-secondary/50 transition-colors w-[320px] pointer-events-auto"
              >
                <Avatar className="h-10 w-10 shrink-0 border border-border">
                  <AvatarImage src={msg.sender?.avatarUrl} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground font-bold">{senderName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-foreground truncate">{senderName}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {msg.content || (msg.imageUrls && msg.imageUrls.length > 0 ? "Sent an image" : "New message")}
                  </span>
                </div>
              </div>
            ), {
              duration: 4000,
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
    }

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [userId, getToken, isOpen, activeConversation]);

  // Handle custom event to open minichat from external pop-up notification
  useEffect(() => {
    const handleOpenMiniChat = (e: any) => {
      if (e.detail?.conversationId) {
        setIsOpen(true);
        loadConversation(e.detail.conversationId);
      }
    };
    window.addEventListener('open-minichat', handleOpenMiniChat);
    return () => window.removeEventListener('open-minichat', handleOpenMiniChat);
  }, []);

  const loadInbox = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get("http://127.0.0.1:3000/chat/conversations", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    setActiveConversation(conversationId);
    setIsLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get(`http://127.0.0.1:3000/chat/conversation/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.reverse());
      
      if (socket) {
        socket.emit("mark_read", { conversationId });
      }
      
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || !socket) return;
    if (!newMessage.trim() && selectedImages.length === 0) return;

    if (selectedImages.length > 0) {
      setIsUploadingImages(true);
      try {
        const token = await getToken();
        const formData = new FormData();
        selectedImages.forEach((img) => formData.append("images", img));
        if (newMessage.trim()) {
            formData.append("content", newMessage);
        }
        if (replyingToMessage) {
            formData.append("replyToId", replyingToMessage.id);
        }
        
        await axios.post(
          `http://127.0.0.1:3000/chat/message/${activeConversation}/images`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setSelectedImages([]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploadingImages(false);
      }
    } else {
      socket.emit("send_message", {
        conversationId: activeConversation,
        content: newMessage,
        replyToId: replyingToMessage?.id,
      });
    }

    setNewMessage("");
    setReplyingToMessage(null);
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (selectedImages.length + filesArray.length > 5) {
        alert("Maximum 5 images allowed");
        return;
      }
      setSelectedImages((prev) => [...prev, ...filesArray]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const removeSelectedImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (!userId || pathname?.startsWith("/chat")) return null;

  // Render header logic
  const activeConvDetails = activeConversation ? conversations.find(c => c.id === activeConversation) : null;
  const activeOtherMember = activeConvDetails?.members.find((m: any) => m.user.clerkUserId !== userId)?.user;
  
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Shared Media Dialog */}
      <Dialog open={showSharedMedia} onOpenChange={setShowSharedMedia}>
        <DialogContent className="sm:max-w-[400px]">
          <h2 className="font-bold text-lg">Shared Media</h2>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {messages.filter(m => m.imageUrls?.length > 0).flatMap(m => m.imageUrls).map((url, i) => (
              <img key={i} src={url.startsWith('http') ? url : `http://127.0.0.1:3000${url}`} className="aspect-square object-cover rounded-md" alt="Shared" />
            ))}
          </div>
        </DialogContent>
      </Dialog>

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
                  <div className="flex items-center gap-1.5 cursor-pointer hover:bg-primary-foreground/10 p-1 rounded-md transition-colors min-w-0" onClick={() => setShowSharedMedia(true)}>
                    <Avatar className="h-6 w-6 border border-primary-foreground/20 shrink-0">
                      <AvatarImage src={activeOtherMember?.avatarUrl} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px]">
                        {activeOtherMember?.name?.[0] || activeOtherMember?.username?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-sm truncate">
                      {activeOtherMember?.name || activeOtherMember?.username || "Chat"}
                    </h3>
                    <ChevronRight className="h-3 w-3 shrink-0 opacity-70" />
                  </div>
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
                          <div className={`flex items-center gap-1 group ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                            <div className="flex flex-col max-w-[85%]">
                              {msg.replyTo && (
                                <div className={`flex flex-col text-[10px] bg-black/5 dark:bg-white/5 rounded-xl px-2 py-1 mb-1 border-l-2 ${isMe ? "border-primary" : "border-muted-foreground"} overflow-hidden opacity-80 cursor-pointer`}>
                                  <span className="font-bold">{msg.replyTo.sender.name || msg.replyTo.sender.username}</span>
                                  <span className="line-clamp-1">{msg.replyTo.content || "Images"}</span>
                                </div>
                              )}
                              <div
                                className={`rounded-2xl px-3 py-2 text-[13px] break-words ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"}`}
                              >
                                {msg.imageUrls && msg.imageUrls.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-1">
                                    {msg.imageUrls.map((url: string, i: number) => (
                                      <img key={i} src={url.startsWith('blob:') ? url : `http://127.0.0.1:3000${url}`} alt="Attached" className="max-w-[120px] max-h-[120px] rounded-md object-cover" />
                                    ))}
                                  </div>
                                )}
                                {msg.content}
                              </div>
                            </div>
                            
                            {/* Actions Dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded-full shrink-0">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isMe ? "end" : "start"} className="w-28 rounded-xl text-xs">
                                {msg.content && (
                                  <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigator.clipboard.writeText(msg.content)}>
                                    <Copy className="h-3 w-3" /> Copy
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => setReplyingToMessage(msg)}>
                                  <Reply className="h-3 w-3" /> Reply
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                <div className="flex flex-col bg-card border-t border-border shrink-0">
                  {/* Replying To Prefix */}
                  {replyingToMessage && (
                    <div className="px-3 py-1.5 bg-secondary border-b border-border flex items-center justify-between shadow-inner">
                      <div className="flex flex-col flex-1 min-w-0 border-l-2 border-primary pl-2 py-0.5">
                        <span className="text-[10px] font-bold text-foreground">
                          Replying to {replyingToMessage.sender?.name || replyingToMessage.sender?.username || 'User'}
                        </span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1">
                          {replyingToMessage.content || "Images"}
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-5 w-5 ml-2 rounded-full shrink-0" onClick={() => setReplyingToMessage(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Selected Images Preview */}
                  {selectedImages.length > 0 && (
                    <div className="flex gap-2 p-2 bg-secondary overflow-x-auto">
                      {selectedImages.map((img, idx) => (
                        <div key={idx} className="relative h-12 w-12 shrink-0 rounded-md overflow-hidden">
                          <img src={URL.createObjectURL(img)} className="h-full w-full object-cover" alt="Selected" />
                          <button type="button" onClick={() => removeSelectedImage(idx)} className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full h-3 w-3 flex items-center justify-center text-[8px]">
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-2">
                    <form onSubmit={handleSendMessage} className="flex gap-1 items-center">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 h-8 bg-secondary border-none text-[12px] rounded-full px-3 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={isUploadingImages || (!newMessage.trim() && selectedImages.length === 0)}
                        className="h-8 w-8 rounded-full bg-primary shrink-0 transition-transform active:scale-95"
                      >
                        {isUploadingImages ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      </Button>
                    </form>
                  </div>
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
