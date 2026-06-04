"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, Loader2, ArrowLeft, MoreVertical, MessageSquare } from "lucide-react";
import axios from "axios";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// Interfaces
interface UserPreview {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  clerkUserId: string;
}

interface Message {
  id: string;
  content: string;
  conversationId: string;
  senderId: string;
  createdAt: string;
  sender?: UserPreview;
  isRead?: boolean;
  listingId?: string | null;
  listing?: {
    id: string;
    title: string;
    price: number;
    images?: { url: string }[];
  } | null;
}

interface Conversation {
  id: string;
  updatedAt: string;
  members: { user: UserPreview }[];
  messages: Message[];
}

export default function ChatPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultConversationId = searchParams?.get("id");

  const [socket, setSocket] = useState<Socket | null>(null);
  const [inbox, setInbox] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(defaultConversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingInbox, setIsLoadingInbox] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshInbox, setRefreshInbox] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [contextListing, setContextListing] = useState<any | null>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch listing context and pre-fill meetup
  useEffect(() => {
    const listingId = searchParams?.get("listingId");
    const meetupLocation = searchParams?.get("meetupLocation");

    // Pre-fill text for meetup location ONCE if we have it and haven't fetched it yet
    if (meetupLocation && !newMessage && !contextListing) {
      setNewMessage(`I want to meetup here: ${decodeURIComponent(meetupLocation)}`);
    }

    if (listingId && activeConversationId && !isLoadingMessages && messages.length >= 0) {
      // Check if we already have a message with this listing
      // If it's a meetup request, we bypass this check so the listing is always attached for context
      const hasListing = meetupLocation ? false : messages.some((m) => m.listingId === listingId);
      if (!hasListing) {
        // Fetch the listing if we don't have it yet
        if (!contextListing || contextListing.id !== listingId) {
          const fetchListing = async () => {
            try {
              const token = await getToken();
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
              const res = await axios.get(`${apiUrl}/listings/${listingId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setContextListing(res.data);
            } catch (err) {
              console.error("Failed to fetch context listing:", err);
            }
          };
          fetchListing();
        }
      } else {
        // If we already sent it, clear context listing
        setContextListing(null);
      }
    }
  }, [messages, searchParams, activeConversationId, isLoadingMessages, getToken, contextListing, newMessage]);

  // 1. Fetch Inbox
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/");
      return;
    }

    const fetchInbox = async () => {
      try {
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
        const res = await axios.get(`${apiUrl}/chat/inbox`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        setInbox(data);
          
        // Only auto-select if we don't have an active one AND it's a fresh load (not a background refresh)
        if (!activeConversationId && data.length > 0 && refreshInbox === 0 && !window.matchMedia('(max-width: 768px)').matches) {
          setActiveConversationId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch inbox:", err);
      } finally {
        setIsLoadingInbox(false);
      }
    };

    fetchInbox();
  }, [isLoaded, isSignedIn, getToken, router, refreshInbox]);

  // 2. Fetch Messages for Active Conversation
  useEffect(() => {
    if (!activeConversationId) return;

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
        const res = await axios.get(`${apiUrl}/chat/inbox/${activeConversationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        // The backend returns an array of messages directly
        setMessages(Array.isArray(data) ? data : []);

      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeConversationId, getToken]);

  // 3. Socket Setup
  useEffect(() => {
    if (!isSignedIn) return;

    // Connect to WebSocket server
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
    const newSocket = io(apiUrl, {
      transports: ["websocket"],
      autoConnect: false,
    });

    const setupSocket = async () => {
      const token = await getToken();
      if(token) {
        newSocket.auth = { token };
        
        // Register the connect listener BEFORE calling connect().
        // This way it fires on the initial connection AND on every auto-reconnect,
        // guaranteeing we always re-join our personal room.
        newSocket.on("connect", () => {
           console.log("Socket connected, authenticating...");
           newSocket.emit("authenticate");
        });
        
        newSocket.connect();
      }
    };
    setupSocket();

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isSignedIn, getToken]);

  // 4. Socket Listeners
  useEffect(() => {
    if (!socket) return;

    // If we have an active chat, let the server know we're looking at it
    if (activeConversationId) {
      socket.emit("mark_read", { conversationId: activeConversationId });
      window.dispatchEvent(new Event("update_unread_count"));
    }

    const onReceiveMessage = (message: Message) => {
      // If it belongs to active chat, append it
      if (message.conversationId === activeConversationId) {
        setMessages((prev) => [...prev, message]);
        // Also emit that we've read this new incoming message
        socket.emit("mark_read", { conversationId: activeConversationId });
        window.dispatchEvent(new Event("update_unread_count"));
      }
      
      // Update inbox preview to bump this conversation to top
      setInbox((prevInbox) => {
        const conversationIndex = prevInbox.findIndex(c => c.id === message.conversationId);
        
        // If the conversation is brand new (we don't have it in inbox yet), we need to fetch it!
        if (conversationIndex === -1) {
          setRefreshInbox(prev => prev + 1);
          return prevInbox;
        }

        const updatedConversation = { ...prevInbox[conversationIndex] };
        updatedConversation.updatedAt = message.createdAt;
        updatedConversation.messages = [message]; // update latest message

        const newInbox = [...prevInbox];
        newInbox.splice(conversationIndex, 1);
        newInbox.unshift(updatedConversation);
        
        return newInbox;
      });
    };

    const onMessagesRead = (payload: { conversationId: string }) => {
      if (payload.conversationId === activeConversationId) {
        setMessages((prev) => prev.map(msg => ({ ...msg, isRead: true })));
      }
    };

    socket.on("receive_message", onReceiveMessage);
    socket.on("messages_read", onMessagesRead);

    return () => {
      socket.off("receive_message", onReceiveMessage);
      socket.off("messages_read", onMessagesRead);
    };
  }, [socket, activeConversationId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId || !socket) return;

    const listingId = searchParams?.get("listingId");
    const meetupLocation = searchParams?.get("meetupLocation");
    let attachListingId = undefined;

    // Only attach if it hasn't been sent yet in this conversation (unless it's a meetup request)
    if (listingId && contextListing) {
      const hasListing = meetupLocation ? false : messages.some((m) => m.listingId === listingId);
      if (!hasListing) {
        attachListingId = listingId;
      }
    }

    socket.emit("send_message", {
      conversationId: activeConversationId,
      content: newMessage,
      listingId: attachListingId
    });

    setNewMessage("");

    // If we attached it, clear from URL and state
    if (attachListingId) {
      setContextListing(null);
      router.replace(`/chat?id=${activeConversationId}`);
    }
  };

  const filteredInbox = inbox.filter((conv) => {
    const otherMember = conv.members?.find(m => m.user.clerkUserId !== clerkUser?.id);
    const otherName = otherMember?.user?.name || otherMember?.user?.username || "Unknown";
    return otherName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!isLoaded || isLoadingInbox && inbox.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-zinc-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#3252DF]" />
      </div>
    );
  }

  // Get the active conversation from the inbox to display their name
  const activeConversation = inbox.find(c => c.id === activeConversationId);
  const otherActiveMember = activeConversation?.members?.find(m => m.user.clerkUserId !== clerkUser?.id)?.user;
  const otherActiveName = otherActiveMember?.name || otherActiveMember?.username || "UIC Student";
  const otherActiveInitial = otherActiveName[0]?.toUpperCase() || "U";

  return (
    <div className="h-[calc(100vh-4rem)] bg-white flex overflow-hidden font-sans">
      
      {/* ─── SIDEBAR (INBOX) ─── */}
      <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-zinc-200 bg-zinc-50/50 ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-zinc-200 bg-white">
          <h1 className="text-xl font-black text-black mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search conversations..." 
              className="pl-9 bg-zinc-100 border-transparent focus-visible:ring-[#3252DF]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredInbox.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 text-zinc-300" />
              <p className="text-sm font-medium">No messages yet</p>
            </div>
          ) : (
            filteredInbox.map((conv) => {
              const otherMember = conv.members?.find(m => m.user.clerkUserId !== clerkUser?.id)?.user;
              const name = otherMember?.name || otherMember?.username || "UIC Student";
              const initial = name[0]?.toUpperCase() || "U";
              const latestMessage = conv.messages?.[0]?.content || "Started a conversation";
              const date = new Date(conv.updatedAt);
              const isToday = date.toDateString() === new Date().toDateString();
              const timeString = isToday 
                ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) 
                : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
              const isActive = activeConversationId === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full p-4 flex gap-3 items-start text-left transition-colors border-b border-zinc-100 last:border-0 ${
                    isActive ? "bg-white border-l-4 border-l-[#3252DF] shadow-sm" : "hover:bg-zinc-100/50 border-l-4 border-l-transparent"
                  }`}
                >
                  <Avatar className="h-12 w-12 border border-zinc-200 shrink-0">
                    {otherMember?.avatarUrl && <AvatarImage src={otherMember.avatarUrl} alt={name} />}
                    <AvatarFallback className="bg-zinc-100 text-zinc-600 font-bold">{initial}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-bold text-black truncate pr-2">{name}</span>
                      <span className="text-xs text-zinc-400 shrink-0">{timeString}</span>
                    </div>
                    <p className={`text-sm truncate ${isActive ? "text-zinc-700 font-medium" : "text-zinc-500"}`}>
                      {latestMessage}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── MAIN CHAT AREA ─── */}
      <div className={`flex-1 flex flex-col bg-white ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        {!activeConversationId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
            <MessageSquare className="h-16 w-16 mb-4 text-zinc-200" />
            <p className="text-lg font-medium text-zinc-500">Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-zinc-200 flex items-center px-4 justify-between bg-white/80 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden -ml-2 text-zinc-500 hover:text-black"
                  onClick={() => setActiveConversationId(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10 border border-zinc-200">
                  {otherActiveMember?.avatarUrl && <AvatarImage src={otherActiveMember.avatarUrl} />}
                  <AvatarFallback className="bg-zinc-100 text-zinc-600 font-bold">{otherActiveInitial}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-bold text-black leading-tight">{otherActiveName}</h2>
                  {/* You could add an online status indicator here in the future */}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-black">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/30">
              {isLoadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg, index) => {
                    const isMine = msg.senderId === clerkUser?.id;
                    const showAvatar = !isMine && (index === 0 || messages[index - 1].senderId !== msg.senderId);

                    return (
                      <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isMine ? "ml-auto flex-row-reverse" : ""}`}>
                        {/* Avatar */}
                        {!isMine && (
                          <div className="w-8 shrink-0 flex flex-col justify-end">
                            {showAvatar && (
                              <Avatar className="h-8 w-8 border border-zinc-200">
                                <AvatarImage src={msg.sender?.avatarUrl || ""} />
                                <AvatarFallback className="bg-zinc-100 text-zinc-500 text-xs font-bold">
                                  {msg.sender?.name?.[0]?.toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        )}

                        <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                          <div
                            className={`rounded-2xl px-4 py-2.5 shadow-sm text-[15px] leading-relaxed ${
                              isMine 
                                ? "bg-[#3252DF] text-white rounded-br-none" 
                                : "bg-white border border-zinc-100 text-zinc-800 rounded-bl-none"
                            }`}
                          >
                            {/* Embedded Listing Snippet */}
                            {msg.listing && (
                              <div className={`mb-2 p-2 rounded-xl flex items-center gap-3 border ${isMine ? 'bg-white/10 border-white/20' : 'bg-zinc-50 border-zinc-200'}`} onClick={() => router.push(`/listings/${msg.listing?.id}`)} style={{ cursor: 'pointer' }}>
                                <div className="h-12 w-12 rounded-lg bg-zinc-200 overflow-hidden shrink-0">
                                  {msg.listing.images && msg.listing.images.length > 0 ? (
                                    <img src={`http://127.0.0.1:3000${msg.listing.images[0].url}`} alt="listing" className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full bg-zinc-300" />
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className={`text-xs font-bold line-clamp-1 ${isMine ? 'text-white' : 'text-zinc-900'}`}>{msg.listing.title}</span>
                                  <span className={`text-sm font-black ${isMine ? 'text-white/90' : 'text-[#3252DF]'}`}>${msg.listing.price}</span>
                                </div>
                              </div>
                            )}
                            
                            {msg.content}
                          </div>
                          
                          <span className="text-[10px] text-zinc-400 font-medium mt-1 px-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            {isMine && msg.isRead && (
                              <span className="ml-1 font-bold text-emerald-500 tracking-wide">
                                • Seen
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Context Bar */}
            {contextListing && (
              <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between shadow-inner shrink-0">
                <div className="flex items-center gap-3 w-full">
                  <div className="h-10 w-10 rounded-md bg-zinc-200 overflow-hidden shrink-0 border border-zinc-300">
                    {contextListing.images && contextListing.images.length > 0 ? (
                      <img src={`http://127.0.0.1:3000${contextListing.images[0].url}`} alt="listing" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-zinc-300" />
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-xs font-bold text-zinc-900 line-clamp-1">{contextListing.title}</span>
                    <span className="text-[10px] text-zinc-500 font-medium truncate">This listing will be attached to your first message.</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 shrink-0 text-zinc-400 hover:text-zinc-600 rounded-full"
                    onClick={() => {
                      setContextListing(null);
                      router.replace(`/chat?id=${activeConversationId}`);
                    }}
                  >
                    <span className="sr-only">Dismiss</span>
                    &times;
                  </Button>
                </div>
              </div>
            )}

            {/* Chat Input */}
            <div className="p-4 border-t border-zinc-200 bg-white shrink-0">
              <form 
                onSubmit={handleSendMessage}
                className="flex gap-2 items-center max-w-4xl mx-auto"
              >
                <Input
                  placeholder="Type a message..."
                  className="flex-1 rounded-full bg-zinc-100 border-transparent focus-visible:ring-[#3252DF] focus-visible:bg-white h-12 px-5"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="rounded-full h-12 w-12 p-0 shrink-0 bg-[#b81d68] hover:bg-[#961754] shadow-sm disabled:opacity-50 transition-transform active:scale-95"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
      
    </div>
  );
}
