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
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingInbox, setIsLoadingInbox] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        const res = await axios.get("http://localhost:3000/chat/inbox", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        setInbox(data);
          
        // If no active conversation but inbox has items, maybe select the first one
        if (!activeConversationId && data.length > 0 && !window.matchMedia('(max-width: 768px)').matches) {
          setActiveConversationId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch inbox:", err);
      } finally {
        setIsLoadingInbox(false);
      }
    };

    fetchInbox();
  }, [isLoaded, isSignedIn, getToken, router, activeConversationId]);

  // 2. Fetch Messages for Active Conversation
  useEffect(() => {
    if (!activeConversationId) return;

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const token = await getToken();
        const res = await axios.get(`http://localhost:3000/chat/inbox/${activeConversationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        setActiveConversation(data);
        setMessages(data.messages || []);
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
    const newSocket = io("http://localhost:3000", {
      transports: ["websocket"],
      autoConnect: false, // Prevent immediate connection before we attach the auth token
    });

    // Actually we need to pass the token with socket.io auth
    const setupSocket = async () => {
      const token = await getToken();
      if(token) {
        newSocket.auth = { token };
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

    const onReceiveMessage = (message: Message) => {
      // If it belongs to active chat, append it
      if (message.conversationId === activeConversationId) {
        setMessages((prev) => [...prev, message]);
      }
      
      // Update inbox preview to bump this conversation to top
      setInbox((prevInbox) => {
        const conversationIndex = prevInbox.findIndex(c => c.id === message.conversationId);
        if (conversationIndex === -1) return prevInbox; // need to fetch new conversation

        const updatedConversation = { ...prevInbox[conversationIndex] };
        updatedConversation.updatedAt = message.createdAt;
        updatedConversation.messages = [message]; // update latest message

        const newInbox = [...prevInbox];
        newInbox.splice(conversationIndex, 1);
        newInbox.unshift(updatedConversation);
        
        return newInbox;
      });
    };

    socket.on("receive_message", onReceiveMessage);

    // Join room when active conversation changes
    if (activeConversationId) {
      socket.emit("join_conversation", activeConversationId);
    }

    return () => {
      socket.off("receive_message", onReceiveMessage);
    };
  }, [socket, activeConversationId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId || !socket) return;

    const token = await getToken();

    // The backend uses @UseGuards(WsClerkAuthGuard) for send_message. We must ensure the socket has token or we pass it in payload if the guard looks for it.
    // To be safe, socket.io-client might have authenticated the connection.
    socket.emit("send_message", {
      conversationId: activeConversationId,
      content: newMessage,
    });

    setNewMessage("");
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

  // Get the active conversation's other member to display their name
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
                  {messages.map((msg, idx) => {
                    const isMe = msg.sender?.clerkUserId === clerkUser?.id || msg.senderId === (messages.find(m => m.sender?.clerkUserId === clerkUser?.id)?.senderId); // fallback logic if msg.sender is not populated right on receive
                    
                    // Slightly better logic for isMe when receiving a new socket message
                    const amISender = isMe || (!msg.sender && clerkUser?.id); 
                    const showAvatar = !amISender && (idx === messages.length - 1 || messages[idx + 1]?.senderId !== msg.senderId);

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2 max-w-[85%] ${amISender ? 'ml-auto flex-row-reverse' : ''}`}
                      >
                        {!amISender && (
                          <div className="w-8 shrink-0 flex items-end">
                            {showAvatar && (
                              <Avatar className="h-8 w-8 border border-zinc-200">
                                {msg.sender?.avatarUrl && <AvatarImage src={msg.sender.avatarUrl} />}
                                <AvatarFallback className="text-[10px] bg-white">{otherActiveInitial}</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        )}
                        <div className={`flex flex-col ${amISender ? 'items-end' : 'items-start'}`}>
                          <div 
                            className={`px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                              amISender 
                                ? "bg-[#3252DF] text-white rounded-br-sm" 
                                : "bg-white border border-zinc-200 text-zinc-900 rounded-bl-sm"
                            }`}
                          >
                            {msg.content}
                          </div>
                          <span className="text-[10px] text-zinc-400 mt-1 px-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

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
