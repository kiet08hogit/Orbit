"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, Loader2, ArrowLeft, MoreVertical, MessageSquare, AlertTriangle } from "lucide-react";
import axios from "axios";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const getImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://127.0.0.1:3000${url}`;
};

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

  // Meetup Verification States
  const [meetupVerificationCode, setMeetupVerificationCode] = useState("");
  const [activeMeetupCode, setActiveMeetupCode] = useState<any>(null); // For buyer side
  const [isStartingMeetup, setIsStartingMeetup] = useState(false);
  const [isVerifyingMeetup, setIsVerifyingMeetup] = useState(false);
  const [isMarkingAsSold, setIsMarkingAsSold] = useState(false);
  const [meetupError, setMeetupError] = useState("");
  const [meetupSuccess, setMeetupSuccess] = useState("");
  const [showBuyerMeetupModal, setShowBuyerMeetupModal] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<string | null>(null);

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

    const onMeetupCodeCreated = (payload: any) => {
      setActiveMeetupCode(payload);
      setShowBuyerMeetupModal(true);
      setTransactionStatus("MEETING_STARTED");
    };

    const onMeetupConfirmed = (payload: any) => {
      setTransactionStatus(payload.status || "MEETUP_CONFIRMED");
      setMeetupSuccess("Meetup confirmed successfully!");
      setMeetupError("");
      setShowBuyerMeetupModal(false);
      setActiveMeetupCode(null);
    };

    socket.on("receive_message", onReceiveMessage);
    socket.on("messages_read", onMessagesRead);
    socket.on("meetup_code_created", onMeetupCodeCreated);
    socket.on("meetup_confirmed", onMeetupConfirmed);

    return () => {
      socket.off("receive_message", onReceiveMessage);
      socket.off("messages_read", onMessagesRead);
      socket.off("meetup_code_created", onMeetupCodeCreated);
      socket.off("meetup_confirmed", onMeetupConfirmed);
    };
  }, [socket, activeConversationId]);

  const activeConversation = inbox.find(c => c.id === activeConversationId);
  const otherActiveMember = activeConversation?.members?.find(m => m.user.clerkUserId !== clerkUser?.id)?.user;
  const otherActiveName = otherActiveMember?.name || otherActiveMember?.username || "UIC Student";
  const otherActiveInitial = otherActiveName[0]?.toUpperCase() || "U";

  const latestListingMessage = [...messages].reverse().find(m => m.listingId);
  const activeListingId = latestListingMessage?.listingId;
  const [activeListingSellerId, setActiveListingSellerId] = useState<string | null>(null);
  const [activeTransaction, setActiveTransaction] = useState<any>(null);

  useEffect(() => {
    if (!activeListingId || !isSignedIn || !otherActiveMember) return;
    const fetchListingAndTransaction = async () => {
      try {
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
        
        const res = await axios.get(`${apiUrl}/listings/${activeListingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setActiveListingSellerId(res.data.seller?.clerkUserId || res.data.sellerId);

        const txRes = await axios.get(`${apiUrl}/transactions/active?listingId=${activeListingId}&otherUserId=${otherActiveMember.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (txRes.data) {
          setActiveTransaction(txRes.data);
          // If the status isn't meeting started yet, sync it
          if (txRes.data.orderStatus === 'PENDING_MEETUP' || txRes.data.orderStatus === 'PAID_PENDING_MEETUP') {
             setTransactionStatus(txRes.data.orderStatus);
          }
        } else {
          setActiveTransaction(null);
        }
      } catch (err) {
        console.error("Failed to fetch active listing and transaction");
      }
    };
    fetchListingAndTransaction();
  }, [activeListingId, isSignedIn, getToken, otherActiveMember]);

  // Fetch active meetup code for buyer
  useEffect(() => {
    if (!activeConversationId || !otherActiveMember || !activeListingId || !isSignedIn) return;

    const fetchActiveMeetup = async () => {
      try {
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
        const res = await axios.get(`${apiUrl}/transactions/active-meetup-code?listingId=${activeListingId}&sellerId=${otherActiveMember.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.activeCode) {
          setActiveMeetupCode(res.data.activeCode);
          setTransactionStatus("MEETING_STARTED");
          setShowBuyerMeetupModal(true);
        }
      } catch (err) {
        // Ignore errors, might not be a buyer or no active meetup
      }
    };
    fetchActiveMeetup();
  }, [activeConversationId, otherActiveMember, activeListingId, isSignedIn, getToken]);

  const handleStartMeetup = async () => {
    if (!activeListingId || !otherActiveMember) return;
    setIsStartingMeetup(true);
    setMeetupError("");
    setMeetupSuccess("");
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
      const res = await axios.post(`${apiUrl}/transactions/start-meetup`, {
        listingId: activeListingId,
        buyerId: otherActiveMember.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeetupSuccess(res.data.message);
      setTransactionStatus("MEETING_STARTED");
    } catch (err: any) {
      setMeetupError(err.response?.data?.message || "Failed to start meetup.");
    } finally {
      setIsStartingMeetup(false);
    }
  };

  const handleVerifyMeetup = async () => {
    if (!activeListingId || !otherActiveMember || !meetupVerificationCode) return;
    setIsVerifyingMeetup(true);
    setMeetupError("");
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
      const res = await axios.post(`${apiUrl}/transactions/verify-meetup-code`, {
        listingId: activeListingId,
        buyerId: otherActiveMember.id,
        code: meetupVerificationCode
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeetupSuccess(res.data.message);
      setTransactionStatus("MEETUP_CONFIRMED");
      setMeetupVerificationCode("");
    } catch (err: any) {
      setMeetupError(err.response?.data?.message || "Failed to verify code.");
    } finally {
      setIsVerifyingMeetup(false);
    }
  };

  const handleMarkAsSold = async () => {
    if (!activeTransaction) return;
    setIsMarkingAsSold(true);
    setMeetupError("");
    setMeetupSuccess("");
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
      await axios.post(`${apiUrl}/transactions/${activeTransaction.id}/mark-as-sold`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactionStatus("COMPLETED_BY_SELLER");
      setMeetupSuccess("Marked as sold successfully!");
    } catch (err: any) {
      setMeetupError(err.response?.data?.message || "Failed to mark as sold.");
    } finally {
      setIsMarkingAsSold(false);
    }
  };

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

  // The activeConversation variables are already defined above
  return (
    <div className="h-[calc(100vh-146px)] bg-white flex overflow-hidden font-sans">
      
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
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden bg-white ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
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
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-black leading-tight">{otherActiveName}</h2>
                  
                  {/* Meetup Verification UI (Header) */}
                  {activeListingSellerId === clerkUser?.id && activeListingId && activeTransaction && (
                    <div className="flex items-center gap-2 ml-2 md:ml-4 md:border-l md:border-zinc-200 md:pl-4">
                      {activeTransaction.paymentMethod === 'STRIPE' ? (
                        <>
                          {transactionStatus !== 'MEETUP_CONFIRMED' && transactionStatus !== 'COMPLETED_BY_SELLER' && transactionStatus !== 'MEETING_STARTED' && (
                            <Button 
                              size="sm" 
                              onClick={handleStartMeetup} 
                              disabled={isStartingMeetup}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs px-3 rounded-full"
                            >
                              {isStartingMeetup ? <Loader2 className="h-3 w-3 animate-spin" /> : "Verify Meetup"}
                            </Button>
                          )}
                          
                          {transactionStatus === 'MEETING_STARTED' && (
                            <div className="flex gap-1 items-center">
                              <Input 
                                placeholder="6-digit code" 
                                value={meetupVerificationCode}
                                onChange={(e) => setMeetupVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="bg-zinc-100 border-transparent focus-visible:ring-indigo-500 h-7 w-24 text-xs text-center rounded-full"
                                maxLength={6}
                              />
                              <Button 
                                size="sm" 
                                onClick={handleVerifyMeetup}
                                disabled={isVerifyingMeetup || meetupVerificationCode.length !== 6}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs px-3 shrink-0 rounded-full"
                              >
                                {isVerifyingMeetup ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={handleStartMeetup}
                                disabled={isStartingMeetup}
                                className="h-7 text-xs px-3 shrink-0 rounded-full ml-1"
                              >
                                {isStartingMeetup ? <Loader2 className="h-3 w-3 animate-spin" /> : "Resend Code"}
                              </Button>
                            </div>
                          )}

                          {(transactionStatus === 'MEETUP_CONFIRMED' || transactionStatus === 'COMPLETED_BY_SELLER') && (
                            <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                              ✓ Confirmed
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {transactionStatus !== 'COMPLETED_BY_SELLER' && (
                            <Button 
                              size="sm" 
                              onClick={handleMarkAsSold} 
                              disabled={isMarkingAsSold}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs px-3 rounded-full"
                            >
                              {isMarkingAsSold ? <Loader2 className="h-3 w-3 animate-spin" /> : "Mark as Sold"}
                            </Button>
                          )}
                          {transactionStatus === 'COMPLETED_BY_SELLER' && (
                            <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                              ✓ Sold
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Buyer View: Show Code Button */}
                  {activeListingSellerId !== clerkUser?.id && activeMeetupCode && transactionStatus === 'MEETING_STARTED' && (
                    <div className="flex items-center gap-2 ml-2 md:ml-4 md:border-l md:border-zinc-200 md:pl-4">
                      <Button 
                        size="sm" 
                        onClick={() => setShowBuyerMeetupModal(true)}
                        className="bg-zinc-900 hover:bg-black text-white h-7 text-xs px-3 rounded-full shadow-sm"
                      >
                        Show Code
                      </Button>
                    </div>
                  )}

                  {/* Buyer View: Confirmed Status */}
                  {activeListingSellerId !== clerkUser?.id && transactionStatus === 'MEETUP_CONFIRMED' && (
                    <div className="flex items-center gap-2 ml-2 md:ml-4 md:border-l md:border-zinc-200 md:pl-4">
                      <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                        ✓ Meetup Confirmed
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                {meetupError && <span className="text-[10px] text-red-500 font-bold hidden md:inline-block max-w-[120px] truncate">{meetupError}</span>}
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-black">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-zinc-50/30">
              {/* Seller Warning Banner for Direct Payment */}
              {activeListingSellerId === clerkUser?.id && transactionStatus === 'PENDING_MEETUP' && activeTransaction?.paymentMethod === 'DIRECT' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 shadow-sm mx-auto max-w-4xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-amber-800 text-sm">Direct Payment Meetup</span>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Collect payment (Cash, Zelle, etc.) directly from the buyer when you meet. After they have paid and received the item, click "Mark as Sold" at the top.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Seller Warning Banner for Stripe Payment */}
              {activeListingSellerId === clerkUser?.id && transactionStatus === 'MEETING_STARTED' && (!activeTransaction || activeTransaction.paymentMethod === 'STRIPE') && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 shadow-sm mx-auto max-w-4xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-amber-800 text-sm">Important: Finalizing the transaction</span>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Ask the buyer for the confirmation code only after they have inspected and accepted the item. Entering the code completes the transaction and releases the payout.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isLoadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg, index) => {
                    const isMine = msg.sender?.clerkUserId === clerkUser?.id || msg.senderId === clerkUser?.id;
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
                                    <img src={getImageUrl(msg.listing.images[0].url)} alt="listing" className="h-full w-full object-cover" />
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
                      <img src={getImageUrl(contextListing.images[0].url)} alt="listing" className="h-full w-full object-cover" />
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
            <div className="p-4 border-t border-zinc-200 bg-white shrink-0 pb-safe">
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
      
      {/* Buyer Meetup Modal */}
      <Dialog open={showBuyerMeetupModal} onOpenChange={setShowBuyerMeetupModal}>
        <DialogContent className="sm:max-w-sm rounded-3xl p-6 shadow-2xl border-0 overflow-hidden bg-white [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-center mb-1">Meetup Code</DialogTitle>
            <DialogDescription className="text-sm text-center text-zinc-500 mb-6 px-4">
              Only share this code after you inspect the item and agree to complete the purchase.
            </DialogDescription>
          </DialogHeader>

          {activeMeetupCode && (
            <div className="flex flex-col gap-6">
              <div className="bg-zinc-100 rounded-2xl p-6 flex items-center justify-center">
                <span className="text-5xl font-black tracking-widest text-[#3252DF]">
                  {activeMeetupCode.code}
                </span>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="font-bold text-amber-800 text-sm">Warning</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  After the seller enters this code, the transaction is final in Circlo.
                </p>
              </div>

              <Button 
                onClick={() => setShowBuyerMeetupModal(false)}
                className="w-full rounded-full h-12 font-bold bg-[#3252DF] hover:bg-[#2841B3] text-white transition-colors"
              >
                Got it
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
