"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Send,
  Loader2,
  ArrowLeft,
  MoreVertical,
  MessageSquare,
  AlertTriangle,
  BadgeCheck,
  Star,
  Image as ImageIcon,
  ChevronRight,
  Copy,
  Reply,
  X,
  MoreHorizontal,
} from "lucide-react";
import axios from "axios";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  isEduVerified?: boolean;
  reviewsReceived?: { rating: number }[];
}

interface Message {
  id: string;
  content: string;
  conversationId: string;
  senderId: string;
  createdAt: string;
  sender?: UserPreview;
  isRead?: boolean;
  imageUrls?: string[];
  listingId?: string | null;
  listing?: {
    id: string;
    title: string;
    price: number;
    images?: { url: string }[];
  } | null;
  replyToId?: string | null;
  replyTo?: {
    sender: { name: string | null; username: string | null };
    content: string;
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
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(defaultConversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingInbox, setIsLoadingInbox] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshInbox, setRefreshInbox] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [showSharedMedia, setShowSharedMedia] = useState(false);

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
  const [transactionStatus, setTransactionStatus] = useState<string | null>(
    null,
  );

  // AI and Manual Proposal States
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [meetupUpdate, setMeetupUpdate] = useState<any>(null);
  const [showMeetupProposalModal, setShowMeetupProposalModal] = useState(false);
  const [manualMeetupLocation, setManualMeetupLocation] = useState("");
  const [manualMeetupTime, setManualMeetupTime] = useState("");
  const [isProposing, setIsProposing] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  // Verification Dashboard States
  const [isVerificationBoardOpen, setIsVerificationBoardOpen] = useState(false);
  const [sellerTransactions, setSellerTransactions] = useState<any[]>([]);
  const [isFetchingSellerTransactions, setIsFetchingSellerTransactions] =
    useState(false);
  const [transactionCodes, setTransactionCodes] = useState<
    Record<string, string>
  >({});
  const [dashboardActionLoading, setDashboardActionLoading] = useState<
    Record<string, boolean>
  >({});

  // Buyer Dashboard States
  const [isBuyerVerificationBoardOpen, setIsBuyerVerificationBoardOpen] =
    useState(false);
  const [buyerTransactions, setBuyerTransactions] = useState<any[]>([]);
  const [isFetchingBuyerTransactions, setIsFetchingBuyerTransactions] =
    useState(false);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedImages]);

  // Fetch listing context and pre-fill meetup
  useEffect(() => {
    const listingId = searchParams?.get("listingId");
    const meetupLocation = searchParams?.get("meetupLocation");

    // Pre-fill text for meetup location ONCE if we have it and haven't fetched it yet
    if (meetupLocation && !newMessage && !contextListing) {
      setNewMessage(
        `I want to meetup here: ${decodeURIComponent(meetupLocation)}`,
      );
    }

    if (
      listingId &&
      activeConversationId &&
      !isLoadingMessages &&
      messages.length >= 0
    ) {
      // Check if we already have a message with this listing
      // If it's a meetup request, we bypass this check so the listing is always attached for context
      const hasListing = meetupLocation
        ? false
        : messages.some((m) => m.listingId === listingId);
      if (!hasListing) {
        // Fetch the listing if we don't have it yet
        if (!contextListing || contextListing.id !== listingId) {
          const fetchListing = async () => {
            try {
              const token = await getToken();
              const apiUrl =
                process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
              const res = await axios.get(`${apiUrl}/listings/${listingId}`, {
                headers: { Authorization: `Bearer ${token}` },
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
  }, [
    messages,
    searchParams,
    activeConversationId,
    isLoadingMessages,
    getToken,
    contextListing,
    newMessage,
  ]);

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
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
        const res = await axios.get(`${apiUrl}/chat/inbox`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        setInbox(data);
        // Only auto-select if we don't have an active one AND it's a fresh load (not a background refresh)
        if (
          !activeConversationId &&
          data.length > 0 &&
          refreshInbox === 0 &&
          !window.matchMedia("(max-width: 768px)").matches
        ) {
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
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
        const res = await axios.get(
          `${apiUrl}/chat/inbox/${activeConversationId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
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
      if (token) {
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
        const conversationIndex = prevInbox.findIndex(
          (c) => c.id === message.conversationId,
        );
        // If the conversation is brand new (we don't have it in inbox yet), we need to fetch it!
        if (conversationIndex === -1) {
          setRefreshInbox((prev) => prev + 1);
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
        setMessages((prev) => prev.map((msg) => ({ ...msg, isRead: true })));
      }
    };

    const onMeetupCodeCreated = (payload: any) => {
      // Refresh buyer transactions to get the new code
      fetchBuyerTransactions();
      // Automatically open the board if they received a code
      setIsBuyerVerificationBoardOpen(true);
    };

    const onMeetupConfirmed = (payload: any) => {
      setTransactionStatus(payload.status || "MEETUP_CONFIRMED");
      setMeetupSuccess("Meetup confirmed successfully!");
      setMeetupError("");
      setShowBuyerMeetupModal(false);
      setActiveMeetupCode(null);
    };

    const onAiMeetupSuggestion = (payload: any) => {
      setAiSuggestion(payload);
    };

    const onMeetupUpdate = (payload: any) => {
      setMeetupUpdate(payload);
      setAiSuggestion(null); // clear suggestion if action taken
    };

    const onMessageImagesUploaded = (updatedMessage: Message) => {
      setMessages((prev) => {
        const idx = prev.findIndex(m => m.id.startsWith('temp-'));
        if (idx !== -1) {
          const newMsgs = [...prev];
          newMsgs[idx] = updatedMessage;
          return newMsgs;
        }
        return [...prev, updatedMessage];
      });
      setRefreshInbox((r) => r + 1);
    };

    socket.on("receive_message", onReceiveMessage);
    socket.on("messages_read", onMessagesRead);
    socket.on("meetup_code_created", onMeetupCodeCreated);
    socket.on("meetup_confirmed", onMeetupConfirmed);
    socket.on("ai_meetup_suggestion", onAiMeetupSuggestion);
    socket.on("meetup_update", onMeetupUpdate);
    socket.on("message_images_uploaded", onMessageImagesUploaded);

    return () => {
      socket.off("receive_message", onReceiveMessage);
      socket.off("messages_read", onMessagesRead);
      socket.off("meetup_code_created", onMeetupCodeCreated);
      socket.off("meetup_confirmed", onMeetupConfirmed);
      socket.off("ai_meetup_suggestion", onAiMeetupSuggestion);
      socket.off("meetup_update", onMeetupUpdate);
      socket.off("message_images_uploaded", onMessageImagesUploaded);
    };
  }, [socket, activeConversationId]);

  const activeConversation = inbox.find((c) => c.id === activeConversationId);
  const otherActiveMember = activeConversation?.members?.find(
    (m) => m.user.clerkUserId !== clerkUser?.id,
  )?.user;
  const otherActiveName =
    otherActiveMember?.name || otherActiveMember?.username || "UIC Student";
  const otherActiveInitial = otherActiveName[0]?.toUpperCase() || "U";

  const latestListingMessage = [...messages].reverse().find((m) => m.listingId);
  const activeListingId = latestListingMessage?.listingId;
  const [activeListingSellerId, setActiveListingSellerId] = useState<
    string | null
  >(null);
  const [activeTransaction, setActiveTransaction] = useState<any>(null);

  useEffect(() => {
    if (!activeListingId || !isSignedIn || !otherActiveMember) return;
    const fetchListingAndTransaction = async () => {
      try {
        const token = await getToken();
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
        const res = await axios.get(`${apiUrl}/listings/${activeListingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setActiveListingSellerId(
          res.data.seller?.clerkUserId || res.data.sellerId,
        );

        const txRes = await axios.get(
          `${apiUrl}/transactions/active?listingId=${activeListingId}&otherUserId=${otherActiveMember.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (txRes.data) {
          setActiveTransaction(txRes.data);
          // If the status isn't meeting started yet, sync it
          if (
            txRes.data.orderStatus === "PENDING_MEETUP" ||
            txRes.data.orderStatus === "PAID_PENDING_MEETUP"
          ) {
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
    if (
      !activeConversationId ||
      !otherActiveMember ||
      !activeListingId ||
      !isSignedIn
    )
      return;

    const fetchActiveMeetup = async () => {
      try {
        const token = await getToken();
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
        const res = await axios.get(
          `${apiUrl}/transactions/active-meetup-code?listingId=${activeListingId}&sellerId=${otherActiveMember.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
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
  }, [
    activeConversationId,
    otherActiveMember,
    activeListingId,
    isSignedIn,
    getToken,
  ]);

  const handleStartMeetup = async () => {
    if (!activeListingId || !otherActiveMember) return;
    setIsStartingMeetup(true);
    setMeetupError("");
    setMeetupSuccess("");
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
      const res = await axios.post(
        `${apiUrl}/transactions/start-meetup`,
        {
          listingId: activeListingId,
          buyerId: otherActiveMember.id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setMeetupSuccess(res.data.message);
      setTransactionStatus("MEETING_STARTED");
    } catch (err: any) {
      setMeetupError(err.response?.data?.message || "Failed to start meetup.");
    } finally {
      setIsStartingMeetup(false);
    }
  };

  const handleVerifyMeetup = async () => {
    if (!activeTransaction || !meetupVerificationCode) return;
    setIsVerifyingMeetup(true);
    setMeetupError("");
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
      const res = await axios.post(
        `${apiUrl}/transactions/verify-meetup-code`,
        {
          transactionId: activeTransaction.id,
          code: meetupVerificationCode,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
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
      await axios.post(
        `${apiUrl}/transactions/${activeTransaction.id}/mark-as-sold`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setTransactionStatus("COMPLETED_BY_SELLER");
      setMeetupSuccess("Marked as sold successfully!");
    } catch (err: any) {
      setMeetupError(err.response?.data?.message || "Failed to mark as sold.");
    } finally {
      setIsMarkingAsSold(false);
    }
  };

  const fetchSellerTransactions = async () => {
    setIsFetchingSellerTransactions(true);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
      const res = await axios.get(`${apiUrl}/transactions/active/seller`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter strictly for the current buyer we are chatting with
      if (otherActiveMember) {
        const filtered = res.data.filter(
          (t: any) => t.buyerId === otherActiveMember.id,
        );
        setSellerTransactions(filtered);
      } else {
        setSellerTransactions([]);
      }
    } catch (err) {
      console.error("Failed to fetch seller transactions", err);
    } finally {
      setIsFetchingSellerTransactions(false);
    }
  };

  const openVerificationBoard = () => {
    fetchSellerTransactions();
    setIsVerificationBoardOpen(true);
  };

  const fetchBuyerTransactions = async () => {
    setIsFetchingBuyerTransactions(true);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
      const res = await axios.get(`${apiUrl}/transactions/active/buyer`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter for the current seller we are chatting with
      if (otherActiveMember) {
        const filtered = res.data.filter(
          (t: any) => t.sellerId === otherActiveMember.id,
        );
        setBuyerTransactions(filtered);
      } else {
        setBuyerTransactions([]);
      }
    } catch (err) {
      console.error("Failed to fetch buyer transactions", err);
    } finally {
      setIsFetchingBuyerTransactions(false);
    }
  };

  const openBuyerVerificationBoard = () => {
    fetchBuyerTransactions();
    setIsBuyerVerificationBoardOpen(true);
  };

  const handleDashboardStartMeetup = async (
    listingId: string,
    buyerId: string,
    transactionId: string,
  ) => {
    setDashboardActionLoading((prev) => ({ ...prev, [transactionId]: true }));
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
      await axios.post(
        `${apiUrl}/transactions/start-meetup`,
        { listingId, buyerId },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      // Refresh the board
      await fetchSellerTransactions();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to start meetup.");
    } finally {
      setDashboardActionLoading((prev) => ({
        ...prev,
        [transactionId]: false,
      }));
    }
  };

  const handleDashboardVerifyMeetup = async (transactionId: string) => {
    const code = transactionCodes[transactionId];
    if (!code || code.length !== 6) return;

    setDashboardActionLoading((prev) => ({ ...prev, [transactionId]: true }));
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
      await axios.post(
        `${apiUrl}/transactions/verify-meetup-code`,
        { transactionId, code },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      // Refresh the board
      await fetchSellerTransactions();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to verify code.");
    } finally {
      setDashboardActionLoading((prev) => ({
        ...prev,
        [transactionId]: false,
      }));
    }
  };

  const handleDashboardMarkAsSold = async (transactionId: string) => {
    setDashboardActionLoading((prev) => ({ ...prev, [transactionId]: true }));
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
      await axios.post(
        `${apiUrl}/transactions/${transactionId}/mark-as-sold`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      await fetchSellerTransactions();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to mark as sold.");
    } finally {
      setDashboardActionLoading((prev) => ({
        ...prev,
        [transactionId]: false,
      }));
    }
  };

  const handleProposeMeetup = async (
    location: string,
    time: string,
    transactionId: string,
  ) => {
    setIsProposing(true);
    setMeetupError("");
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
      // Ensure time is somewhat valid Date, if AI gave "3:00 PM" we might need to parse it or just send it if it's a string.
      // Wait, backend expects `time: Date`. If AI passes "3:00 PM today", JS Date parsing might fail.
      // Let's just create a generic date for today + the time string if we can't parse it.
      let parsedTime = new Date(time);
      if (isNaN(parsedTime.getTime())) {
        // Fallback if AI gave an unparseable time
        parsedTime = new Date();
        parsedTime.setHours(parsedTime.getHours() + 2); // default +2 hours
      }
      await axios.post(
        `${apiUrl}/transactions/${transactionId}/meetup/propose`,
        {
          location,
          time: parsedTime.toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setAiSuggestion(null);
      setShowMeetupProposalModal(false);
      setMeetupSuccess("Meetup proposed successfully!");
    } catch (err: any) {
      setMeetupError(err.response?.data?.message || "Failed to propose meetup");
    } finally {
      setIsProposing(false);
    }
  };

  const handleAcceptMeetup = async (transactionId: string) => {
    setIsAccepting(true);
    setMeetupError("");
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
      await axios.post(
        `${apiUrl}/transactions/${transactionId}/meetup/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setMeetupSuccess("Meetup accepted successfully!");
    } catch (err: any) {
      setMeetupError(err.response?.data?.message || "Failed to accept meetup");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length + selectedImages.length > 5) {
        alert("You can only upload up to 5 images at a time.");
        return;
      }
      setSelectedImages((prev) => [...prev, ...files]);
    }
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversationId) return;
    if (!newMessage.trim() && selectedImages.length === 0) return;

    let attachListingId: string | undefined = undefined;
    if (contextListing?.id) {
      const listingId = contextListing.id;
      const meetupLocation = searchParams?.get("meetupLocation");
      const hasListing = meetupLocation
        ? false
        : messages.some((m) => m.listingId === listingId);
      if (!hasListing) {
        attachListingId = listingId;
      }
    }

    if (selectedImages.length > 0) {
      setIsUploadingImages(true);
      try {
        const formData = new FormData();
        selectedImages.forEach((img) => formData.append("images", img));
        if (newMessage.trim()) {
            formData.append("content", newMessage);
        }
        if (replyingToMessage) {
            formData.append("replyToId", replyingToMessage.id);
        }
        
        // Optimistically add to UI with local blobs
        const optimisticMessage: Message = {
            id: 'temp-' + Date.now(),
            content: newMessage,
            conversationId: activeConversationId,
            senderId: clerkUser?.id || '',
            createdAt: new Date().toISOString(),
            imageUrls: selectedImages.map(f => URL.createObjectURL(f)),
            replyToId: replyingToMessage?.id || null,
            replyTo: replyingToMessage ? {
              sender: { name: replyingToMessage.sender?.name || null, username: replyingToMessage.sender?.username || null },
              content: replyingToMessage.content
            } : null,
            sender: {
                id: clerkUser?.id || '',
                name: clerkUser?.fullName || null,
                username: clerkUser?.username || null,
                avatarUrl: clerkUser?.imageUrl || null,
                clerkUserId: clerkUser?.id || '',
            }
        };
        setMessages(prev => [...prev, optimisticMessage]);

        const token = await getToken();
        await axios.post(
          `http://localhost:3000/chat/message/${activeConversationId}/images`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } catch (err) {
        console.error("Failed to upload images", err);
        alert("Failed to upload images. Please try again.");
      } finally {
        setIsUploadingImages(false);
        setSelectedImages([]);
      }
    } else {
      socket?.emit("send_message", {
        conversationId: activeConversationId,
        content: newMessage,
        listingId: attachListingId,
        replyToId: replyingToMessage?.id,
      });
    }

    setNewMessage("");
    setReplyingToMessage(null);

    if (attachListingId && selectedImages.length === 0) {
      setContextListing(null);
      router.replace(`/chat?id=${activeConversationId}`);
    }
  };

  const filteredInbox = inbox.filter((conv) => {
    const otherMember = conv.members?.find(
      (m) => m.user.clerkUserId !== clerkUser?.id,
    );
    const otherName =
      otherMember?.user?.name || otherMember?.user?.username || "Unknown";
    return otherName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!isLoaded || (isLoadingInbox && inbox.length === 0)) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background dark:bg-card">
        <Loader2 className="h-10 w-10 animate-spin text-[#0066cc]" />
      </div>
    );
  }

  // The activeConversation variables are already defined above
  return (
    <div className="h-[calc(100vh-146px)] bg-card flex overflow-hidden font-sans">
      {/* ─── SIDEBAR (INBOX) ─── */}
      <div
        className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-black/5 bg-card ${activeConversationId ? "hidden md:flex" : "flex"}`}
      >
        <div className="p-4 border-b border-black/5 bg-card">
          <h1 className="text-[22px] font-semibold text-foreground mb-4">
            Messages
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 bg-foreground/5 border-transparent focus-visible:ring-transparent h-9 rounded-[10px] text-[15px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredInbox.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 text-zinc-300" />
              <p className="text-sm font-medium">No messages yet</p>
            </div>
          ) : (
            filteredInbox.map((conv) => {
              const otherMember = conv.members?.find(
                (m) => m.user.clerkUserId !== clerkUser?.id,
              )?.user;
              const name =
                otherMember?.name || otherMember?.username || "UIC Student";
              const initial = name[0]?.toUpperCase() || "U";
              const latestMessage =
                conv.messages?.[0]?.content || "Started a conversation";
              const date = new Date(conv.updatedAt);
              const isToday = date.toDateString() === new Date().toDateString();
              const timeString = isToday
                ? date.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : date.toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  });
              const isActive = activeConversationId === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full p-4 flex gap-3 items-start text-left transition-colors border-b border-black/5 last:border-0 ${
                    isActive ? "bg-foreground/5" : "hover:bg-foreground/5"
                  }`}
                >
                  <Avatar className="h-12 w-12 border border-border shrink-0">
                    {otherMember?.avatarUrl && (
                      <AvatarImage src={otherMember.avatarUrl} alt={name} />
                    )}
                    <AvatarFallback className="bg-secondary text-muted-foreground font-bold">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span
                        className={`font-semibold truncate pr-2 ${isActive ? "text-foreground" : "text-foreground"}`}
                      >
                        {name}
                      </span>
                      <span
                        className={`text-xs shrink-0 ${isActive ? "text-muted-foreground" : "text-muted-foreground"}`}
                      >
                        {timeString}
                      </span>
                    </div>
                    <p
                      className={`text-[15px] truncate ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                    >
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
      <div
        className={`flex-1 flex flex-col min-w-0 overflow-hidden bg-card ${!activeConversationId ? "hidden md:flex" : "flex"}`}
      >
        {!activeConversationId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4 text-zinc-200" />
            <p className="text-lg font-medium text-muted-foreground">
              Select a conversation to start chatting
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-[60px] border-b border-black/5 flex items-center px-4 justify-between bg-card shrink-0 z-10 relative">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden -ml-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setActiveConversationId(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <Link 
                    href={`/profile/${otherActiveMember?.clerkUserId || otherActiveMember?.id}`}
                    className="hover:opacity-80 transition-opacity"
                  >
                    <Avatar className="h-10 w-10 border border-border">
                      {otherActiveMember?.avatarUrl && (
                        <AvatarImage src={otherActiveMember.avatarUrl} />
                      )}
                      <AvatarFallback className="bg-secondary text-muted-foreground font-bold">
                        {otherActiveInitial}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  <div 
                    className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-1.5 -ml-1.5 rounded-xl transition-colors"
                    onClick={() => setShowSharedMedia(true)}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <h2 className="font-semibold text-foreground text-[15px]">
                          {otherActiveName}
                        </h2>
                        {otherActiveMember?.isEduVerified && (
                          <div title="Verified .edu Email">
                            <BadgeCheck className="h-4 w-4 text-blue-500" />
                          </div>
                        )}
                      </div>
                      {otherActiveMember?.reviewsReceived && otherActiveMember.reviewsReceived.length > 0 && (
                        <div className="flex items-center gap-0.5 text-amber-500 mt-0.5">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="text-xs font-bold">
                            {(
                              otherActiveMember.reviewsReceived.reduce((sum: number, r: any) => sum + r.rating, 0) /
                              otherActiveMember.reviewsReceived.length
                            ).toFixed(1)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1 font-normal">
                            ({otherActiveMember.reviewsReceived.length})
                          </span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />
                  </div>
                </div>

                  {/* Verification Dashboard Button (Seller) */}
                  <div className="flex items-center gap-2 ml-2 md:ml-4 md:border-l md:border-border md:pl-4">
                    <Button
                      size="sm"
                      onClick={openVerificationBoard}
                      className="bg-indigo-600 hover:bg-indigo-700 text-primary-foreground h-7 text-xs px-3 rounded-full shadow-sm"
                    >
                      Verify Meetup
                    </Button>
                  </div>

                  {/* Buyer View: Dashboard Button */}
                  {activeListingSellerId !== clerkUser?.id && (
                    <div className="flex items-center gap-2 ml-2 md:ml-4 md:border-l md:border-border md:pl-4">
                      <Button
                        size="sm"
                        onClick={openBuyerVerificationBoard}
                        className="bg-secondary hover:bg-foreground hover:text-secondary h-7 text-xs px-3 rounded-full shadow-sm text-foreground"
                      >
                        My Purchases
                      </Button>
                    </div>
                  )}
                </div>

              <div className="flex items-center gap-2 shrink-0">
                {meetupError && (
                  <span className="text-[10px] text-red-500 font-bold hidden md:inline-block max-w-[120px] truncate">
                    {meetupError}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-card">
              {/* Seller Warning Banner for Direct Payment */}
              {activeListingSellerId === clerkUser?.id &&
                transactionStatus === "PENDING_MEETUP" &&
                activeTransaction?.paymentMethod === "DIRECT" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 shadow-sm mx-auto max-w-4xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-amber-800 text-sm">
                          Direct Payment Meetup
                        </span>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          Collect payment (Cash, Zelle, etc.) directly from the
                          buyer when you meet. After they have paid and received
                          the item, click "Mark as Sold" at the top.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Seller Warning Banner for Stripe Payment */}
              {activeListingSellerId === clerkUser?.id &&
                transactionStatus === "MEETING_STARTED" &&
                (!activeTransaction ||
                  activeTransaction.paymentMethod === "STRIPE") && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 shadow-sm mx-auto max-w-4xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-amber-800 text-sm">
                          Important: Finalizing the transaction
                        </span>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          Ask the buyer for the confirmation code only after
                          they have inspected and accepted the item. Entering
                          the code completes the transaction and releases the
                          payout.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {isLoadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg, index) => {
                    const isMine =
                      msg.sender?.clerkUserId === clerkUser?.id ||
                      msg.senderId === clerkUser?.id;
                    const showAvatar =
                      !isMine &&
                      (index === 0 ||
                        messages[index - 1].senderId !== msg.senderId);

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-[85%] ${isMine ? "ml-auto flex-row-reverse" : ""}`}
                      >
                        {/* Avatar */}
                        {!isMine && (
                          <div className="w-8 shrink-0 flex flex-col justify-end">
                            {showAvatar && (
                              <Avatar className="h-8 w-8 border border-border">
                                {msg.sender?.avatarUrl && (
                                  <AvatarImage
                                    src={msg.sender.avatarUrl}
                                  />
                                )}
                                <AvatarFallback className="bg-secondary text-muted-foreground text-xs font-bold">
                                  {msg.sender?.name?.[0]?.toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        )}

                        <div
                          className={`flex flex-col group ${isMine ? "items-end" : "items-start"}`}
                        >
                          <div className={`flex items-center gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                            <div className="flex flex-col max-w-[100%]">
                              {msg.replyTo && (
                                <div className={`flex flex-col text-xs bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2 mb-1 border-l-2 ${isMine ? "border-primary" : "border-muted-foreground"} overflow-hidden opacity-80 cursor-pointer`}>
                                  <span className="font-bold">{msg.replyTo.sender.name || msg.replyTo.sender.username}</span>
                                  <span className="line-clamp-1">{msg.replyTo.content || "Images"}</span>
                                </div>
                              )}
                              <div
                                className={`px-4 py-2.5 text-[15px] leading-[1.35] max-w-[100%] break-words ${
                                  isMine
                                    ? "bg-primary text-primary-foreground rounded-[22px]"
                                    : "bg-secondary text-foreground rounded-[22px]"
                                }`}
                              >
                                {/* Embedded Listing Snippet */}
                                {msg.listing && (
                                  <div
                                    className={`mb-2 p-2 rounded-2xl flex items-center gap-3 border ${isMine ? "bg-card/10 border-white/20" : "bg-card border-border shadow-sm"}`}
                                    onClick={() =>
                                      router.push(`/listings/${msg.listing?.id}`)
                                    }
                                    style={{ cursor: "pointer" }}
                                  >
                                    <div className="h-12 w-12 rounded-lg bg-secondary overflow-hidden shrink-0">
                                      {msg.listing.images &&
                                      msg.listing.images.length > 0 ? (
                                        <img
                                          src={getImageUrl(
                                            msg.listing.images[0].url,
                                          )}
                                          alt="listing"
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="h-full w-full bg-zinc-300" />
                                      )}
                                    </div>
                                    <div className="flex flex-col">
                                      <span
                                        className={`text-xs font-bold line-clamp-1 ${isMine ? "text-primary-foreground" : "text-foreground"}`}
                                      >
                                        {msg.listing.title}
                                      </span>
                                      <span
                                        className={`text-sm font-black ${isMine ? "text-primary-foreground/90" : "text-primary"}`}
                                      >
                                        ${msg.listing.price}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {msg.imageUrls && msg.imageUrls.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {msg.imageUrls.map((url, idx) => (
                                      <img 
                                        key={idx} 
                                        src={url.startsWith('blob:') ? url : getImageUrl(url)} 
                                        className="rounded-md max-w-[200px] max-h-[200px] object-cover" 
                                        alt="Attachment" 
                                      />
                                    ))}
                                  </div>
                                )}
                                {msg.content}
                              </div>
                            </div>
                            
                            {/* Message Actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-full shrink-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isMine ? "end" : "start"} className="w-32 rounded-xl">
                                {msg.content && (
                                  <DropdownMenuItem 
                                    className="cursor-pointer gap-2"
                                    onClick={() => navigator.clipboard.writeText(msg.content)}
                                  >
                                    <Copy className="h-4 w-4" />
                                    Copy
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  className="cursor-pointer gap-2"
                                  onClick={() => setReplyingToMessage(msg)}
                                >
                                  <Reply className="h-4 w-4" />
                                  Reply
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium mt-1 px-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
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

            {/* AI Suggestion Banner */}
            <AnimatePresence>
              {aiSuggestion &&
                aiSuggestion.transactionId === activeTransaction?.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="mx-4 mb-3 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl shadow-sm relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-indigo-900 text-sm">
                            Meetup Detected 🤖
                          </span>
                        </div>
                        <p className="text-xs text-indigo-800 leading-relaxed max-w-[280px]">
                          Looks like you're discussing a meetup. Want to
                          officially propose{" "}
                          <strong>{aiSuggestion.location}</strong> at{" "}
                          <strong>{aiSuggestion.time}</strong>?
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleProposeMeetup(
                              aiSuggestion.location,
                              aiSuggestion.time,
                              aiSuggestion.transactionId,
                            )
                          }
                          disabled={isProposing}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs h-8 px-4 shadow-sm"
                        >
                          {isProposing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Propose This"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAiSuggestion(null)}
                          className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100/50 rounded-full text-xs h-8"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>

            {/* Meetup Update Banner (e.g., Buyer sees proposal) */}
            <AnimatePresence>
              {meetupUpdate &&
                meetupUpdate.transactionId === activeTransaction?.id &&
                meetupUpdate.type === "PROPOSED" &&
                activeListingSellerId !== clerkUser?.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mx-4 mb-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-emerald-900 text-sm">
                            New Meetup Proposal 📍
                          </span>
                        </div>
                        <p className="text-xs text-emerald-800 leading-relaxed max-w-[280px]">
                          Seller proposed meeting at{" "}
                          <strong>{meetupUpdate.location}</strong>. Accept to
                          lock it in!
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleAcceptMeetup(meetupUpdate.transactionId)
                          }
                          disabled={isAccepting}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs h-8 px-4 shadow-sm"
                        >
                          {isAccepting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Accept"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setMeetupUpdate(null)}
                          className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100/50 rounded-full text-xs h-8"
                        >
                          Not now
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>

            {/* Context Bar */}
            {contextListing && (
              <div className="px-4 py-3 bg-secondary border-t border-border flex items-center justify-between shadow-inner shrink-0">
                <div className="flex items-center gap-3 w-full">
                  <div className="h-10 w-10 rounded-md bg-secondary overflow-hidden shrink-0 border border-zinc-300">
                    {contextListing.images &&
                    contextListing.images.length > 0 ? (
                      <img
                        src={getImageUrl(contextListing.images[0].url)}
                        alt="listing"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-zinc-300" />
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-xs font-bold text-foreground line-clamp-1">
                      {contextListing.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium truncate">
                      This listing will be attached to your first message.
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-muted-foreground rounded-full"
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
            
            {/* Replying To Prefix */}
            {replyingToMessage && (
              <div className="px-4 py-2 bg-secondary border-t border-border flex items-center justify-between shadow-inner shrink-0">
                <div className="flex flex-col flex-1 min-w-0 border-l-2 border-primary pl-3 py-1">
                  <span className="text-xs font-bold text-foreground">
                    Replying to {replyingToMessage.sender?.name || replyingToMessage.sender?.username || 'User'}
                  </span>
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {replyingToMessage.content || "Images"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-2 rounded-full"
                  onClick={() => setReplyingToMessage(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Selected Images Preview */}
            {selectedImages.length > 0 && (
              <div className="flex gap-2 p-2 px-4 bg-secondary overflow-x-auto">
                {selectedImages.map((img, idx) => (
                  <div key={idx} className="relative h-16 w-16 shrink-0 rounded-md overflow-hidden">
                    <img src={URL.createObjectURL(img)} className="h-full w-full object-cover" alt="Selected" />
                    <button
                      type="button"
                      onClick={() => removeSelectedImage(idx)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full h-4 w-4 flex items-center justify-center text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Chat Input */}
            <div className="p-4 bg-card border-t border-black/5 shrink-0 pb-safe">
              <form
                onSubmit={handleSendMessage}
                className="flex gap-2 items-center max-w-4xl mx-auto"
              >
                <div className="flex-1 rounded-full border border-border flex items-center px-2 min-h-[44px] bg-card">
                  {activeListingSellerId === clerkUser?.id &&
                    activeTransaction && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowMeetupProposalModal(true)}
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0 mr-1"
                      >
                        <span className="text-xl leading-none font-light">
                          +
                        </span>
                      </Button>
                    )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0 mr-1"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                  />
                  <Input
                    placeholder="Message..."
                    className="flex-1 bg-transparent border-transparent focus-visible:ring-0 text-[15px] h-[40px] px-2 shadow-sm placeholder:text-muted-foreground"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  {(newMessage.trim() || selectedImages.length > 0) && (
                    <button
                      type="submit"
                      disabled={isUploadingImages || (!newMessage.trim() && selectedImages.length === 0)}
                      className="text-[#0095f6] font-semibold text-[15px] ml-2 hover:text-foreground transition-colors"
                    >
                      {isUploadingImages ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </>
        )}
      </div>
      {/* Buyer Meetup Modal */}
      <Dialog
        open={showBuyerMeetupModal}
        onOpenChange={setShowBuyerMeetupModal}
      >
        <DialogContent className="sm:max-w-sm rounded-2xl p-6 shadow-2xl border-0 overflow-hidden bg-card [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-center mb-1">
              Meetup Code
            </DialogTitle>
            <DialogDescription className="text-sm text-center text-muted-foreground mb-6 px-4">
              Only share this code after you inspect the item and agree to
              complete the purchase.
            </DialogDescription>
          </DialogHeader>

          {activeMeetupCode && (
            <div className="flex flex-col gap-6">
              <div className="bg-secondary rounded-2xl p-6 flex items-center justify-center">
                <span className="text-5xl font-black tracking-widest text-[#0066cc]">
                  {activeMeetupCode.code}
                </span>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="font-bold text-amber-800 text-sm">
                    Warning
                  </span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  After the seller enters this code, the transaction is final in
                  Orbit.
                </p>
              </div>

              <Button
                onClick={() => setShowBuyerMeetupModal(false)}
                className="w-full rounded-full h-12 font-bold bg-[#0066cc] hover:bg-[#005bb5] text-primary-foreground transition-colors"
              >
                Got it
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={showMeetupProposalModal}
        onOpenChange={setShowMeetupProposalModal}
      >
        <DialogContent className="sm:max-w-md rounded-2xl p-6 shadow-2xl border-0 overflow-hidden bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-black mb-1">
              Propose a Meetup
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mb-4">
              Set a time and place for the buyer to meet you. They will need to
              accept this proposal.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">
                Location
              </label>
              <Input
                placeholder="e.g. Student Center, quad, library..."
                value={manualMeetupLocation}
                onChange={(e) => setManualMeetupLocation(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">
                Date & Time
              </label>
              <Input
                type="datetime-local"
                value={manualMeetupTime}
                onChange={(e) => setManualMeetupTime(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Button
              onClick={() =>
                activeTransaction &&
                handleProposeMeetup(
                  manualMeetupLocation,
                  manualMeetupTime,
                  activeTransaction.id,
                )
              }
              disabled={
                !manualMeetupLocation || !manualMeetupTime || isProposing
              }
              className="w-full rounded-xl h-12 font-bold bg-[#0066cc] hover:bg-[#005bb5] text-primary-foreground transition-colors mt-2"
            >
              {isProposing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Send Proposal"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification Dashboard Modal */}
      <Dialog
        open={isVerificationBoardOpen}
        onOpenChange={setIsVerificationBoardOpen}
      >
        <DialogContent className="sm:max-w-2xl rounded-3xl p-6 shadow-2xl border-0 overflow-hidden bg-card max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0 mb-4">
            <DialogTitle className="text-2xl font-black">
              Verify Meetups
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Manage your active transactions with this buyer.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {isFetchingSellerTransactions ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : sellerTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center border rounded-3xl border-dashed bg-foreground/5">
                <AlertTriangle className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                <h3 className="font-semibold text-lg text-foreground">
                  No Active Meetups
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You don't have any pending transactions with this buyer.
                </p>
              </div>
            ) : (
              sellerTransactions.map((t: any) => (
                <div
                  key={t.id}
                  className="flex flex-col sm:flex-row gap-4 p-4 border rounded-3xl shadow-sm bg-background hover:shadow-md transition-shadow"
                >
                  {/* Item Image & Info */}
                  <div className="h-20 w-20 shrink-0 rounded-2xl overflow-hidden bg-muted flex items-center justify-center">
                    {t.listing?.images?.[0]?.url ? (
                      <img
                        src={getImageUrl(t.listing.images[0].url)}
                        alt="item"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground font-medium">
                        No img
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-bold text-[17px] truncate text-foreground">
                      {t.listing?.title || "Unknown Item"}
                    </h3>
                    <p className="text-sm font-black text-emerald-600 mt-0.5">
                      ${(t.amount / 100).toFixed(2)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground">
                        {t.paymentMethod}
                      </span>
                      <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                        {t.orderStatus.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end sm:justify-center sm:w-48 shrink-0">
                    {/* DIRECT PAYMENT: Mark as sold */}
                    {t.paymentMethod === "DIRECT" &&
                      t.orderStatus !== "COMPLETED_BY_SELLER" && (
                        <Button
                          size="sm"
                          onClick={() => handleDashboardMarkAsSold(t.id)}
                          disabled={dashboardActionLoading[t.id]}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold h-10 shadow-sm"
                        >
                          {dashboardActionLoading[t.id] ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            "Mark as Sold"
                          )}
                        </Button>
                      )}

                    {/* DIRECT PAYMENT: Sold */}
                    {t.paymentMethod === "DIRECT" &&
                      t.orderStatus === "COMPLETED_BY_SELLER" && (
                        <div className="text-[13px] font-black text-emerald-600 flex items-center justify-center gap-1.5 bg-emerald-50 w-full h-10 rounded-full border border-emerald-100 shadow-sm">
                          ✓ Sold
                        </div>
                      )}

                    {/* STRIPE PAYMENT: Start Meetup */}
                    {t.paymentMethod === "STRIPE" &&
                      (t.orderStatus === "PENDING_MEETUP" ||
                        t.orderStatus === "PAID_PENDING_MEETUP" ||
                        t.orderStatus === "ACCEPTED") && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleDashboardStartMeetup(
                              t.listingId,
                              t.buyerId,
                              t.id,
                            )
                          }
                          disabled={dashboardActionLoading[t.id]}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold h-10 shadow-sm"
                        >
                          {dashboardActionLoading[t.id] ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            "Generate Code"
                          )}
                        </Button>
                      )}

                    {/* STRIPE PAYMENT: Verify Meetup */}
                    {t.paymentMethod === "STRIPE" &&
                      t.orderStatus === "MEETING_STARTED" && (
                        <div className="flex flex-col w-full gap-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="6 digits"
                              value={transactionCodes[t.id] || ""}
                              onChange={(e) =>
                                setTransactionCodes((prev) => ({
                                  ...prev,
                                  [t.id]: e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 6),
                                }))
                              }
                              className="bg-secondary/50 border-transparent focus-visible:ring-indigo-500 h-10 text-center rounded-2xl flex-1 font-bold text-[15px]"
                              maxLength={6}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleDashboardVerifyMeetup(t.id)}
                              disabled={
                                dashboardActionLoading[t.id] ||
                                transactionCodes[t.id]?.length !== 6
                              }
                              className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 rounded-2xl font-bold px-4 shrink-0 shadow-sm"
                            >
                              {dashboardActionLoading[t.id] ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                "Verify"
                              )}
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleDashboardStartMeetup(
                                t.listingId,
                                t.buyerId,
                                t.id,
                              )
                            }
                            disabled={dashboardActionLoading[t.id]}
                            className="h-7 text-xs font-semibold px-3 text-muted-foreground hover:text-foreground mx-auto rounded-full"
                          >
                            Resend Code
                          </Button>
                        </div>
                      )}

                    {/* STRIPE PAYMENT: Confirmed */}
                    {t.paymentMethod === "STRIPE" &&
                      (t.orderStatus === "MEETUP_CONFIRMED" ||
                        t.orderStatus === "COMPLETED") && (
                        <div className="text-[13px] font-black text-emerald-600 flex items-center justify-center gap-1.5 bg-emerald-50 w-full h-10 rounded-full border border-emerald-100 shadow-sm">
                          ✓ Confirmed
                        </div>
                      )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Buyer Dashboard Modal */}
      <Dialog
        open={isBuyerVerificationBoardOpen}
        onOpenChange={setIsBuyerVerificationBoardOpen}
      >
        <DialogContent className="sm:max-w-2xl rounded-3xl p-6 shadow-2xl border-0 overflow-hidden bg-card max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0 mb-4">
            <DialogTitle className="text-2xl font-black">
              My Purchases
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Manage your purchases and meetup codes with this seller.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {isFetchingBuyerTransactions ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : buyerTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center border rounded-3xl border-dashed bg-foreground/5">
                <AlertTriangle className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                <h3 className="font-semibold text-lg text-foreground">
                  No Active Purchases
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You don't have any pending purchases with this seller.
                </p>
              </div>
            ) : (
              buyerTransactions.map((t: any) => (
                <div
                  key={t.id}
                  className="flex flex-col sm:flex-row gap-4 p-4 border rounded-3xl shadow-sm bg-background hover:shadow-md transition-shadow"
                >
                  {/* Item Image & Info */}
                  <div className="h-20 w-20 shrink-0 rounded-2xl overflow-hidden bg-muted flex items-center justify-center">
                    {t.listing?.images?.[0]?.url ? (
                      <img
                        src={getImageUrl(t.listing.images[0].url)}
                        alt="item"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground font-medium">
                        No img
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-bold text-[17px] truncate text-foreground">
                      {t.listing?.title || "Unknown Item"}
                    </h3>
                    <p className="text-sm font-black text-emerald-600 mt-0.5">
                      ${(t.amount / 100).toFixed(2)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground">
                        {t.paymentMethod}
                      </span>
                      <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                        {t.orderStatus.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end sm:justify-center sm:w-48 shrink-0">
                    {/* DIRECT PAYMENT */}
                    {t.paymentMethod === "DIRECT" &&
                      t.orderStatus !== "COMPLETED_BY_SELLER" && (
                        <div className="text-[11px] font-bold text-amber-600 flex flex-col items-center justify-center gap-1 bg-amber-50 w-full py-2 px-3 rounded-2xl border border-amber-100 text-center">
                          Pay the seller when you meet in person.
                        </div>
                      )}
                    {t.paymentMethod === "DIRECT" &&
                      t.orderStatus === "COMPLETED_BY_SELLER" && (
                        <div className="text-[13px] font-black text-emerald-600 flex items-center justify-center gap-1.5 bg-emerald-50 w-full h-10 rounded-full border border-emerald-100 shadow-sm">
                          ✓ Received
                        </div>
                      )}

                    {/* STRIPE PAYMENT: Waiting for seller */}
                    {t.paymentMethod === "STRIPE" &&
                      (t.orderStatus === "PENDING_MEETUP" ||
                        t.orderStatus === "PAID_PENDING_MEETUP" ||
                        t.orderStatus === "ACCEPTED") && (
                        <div className="text-[11px] font-bold text-muted-foreground flex flex-col items-center justify-center gap-1 bg-secondary w-full py-2 px-3 rounded-2xl text-center">
                          Waiting for seller to generate code.
                        </div>
                      )}

                    {/* STRIPE PAYMENT: Show Code */}
                    {t.paymentMethod === "STRIPE" &&
                      t.orderStatus === "MEETING_STARTED" && (
                        <div className="flex flex-col items-center justify-center w-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl py-2">
                          <span className="text-[10px] uppercase font-black text-indigo-600/70 dark:text-indigo-400/70 tracking-widest mb-0.5">
                            Meetup Code
                          </span>
                          <span className="text-2xl font-black tracking-[0.2em] text-indigo-700 dark:text-indigo-300">
                            {t.meetupCode || "------"}
                          </span>
                        </div>
                      )}

                    {/* STRIPE PAYMENT: Confirmed */}
                    {t.paymentMethod === "STRIPE" &&
                      (t.orderStatus === "MEETUP_CONFIRMED" ||
                        t.orderStatus === "COMPLETED") && (
                        <div className="text-[13px] font-black text-emerald-600 flex items-center justify-center gap-1.5 bg-emerald-50 w-full h-10 rounded-full border border-emerald-100 shadow-sm">
                          ✓ Verified
                        </div>
                      )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Shared Media Dialog */}
      <Dialog open={showSharedMedia} onOpenChange={setShowSharedMedia}>
        <DialogContent className="sm:max-w-xl rounded-3xl p-0 overflow-hidden border-0 bg-card/95 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col h-[70vh]">
            <div className="p-4 border-b border-border/50 shrink-0 bg-secondary/30">
              <h2 className="text-xl font-black text-foreground">Details</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <h3 className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider">Shared Photos</h3>
              {messages.flatMap(m => m.imageUrls || []).length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {messages.flatMap(m => m.imageUrls || []).reverse().map((url, idx) => (
                    <a key={idx} href={url.startsWith('blob:') ? url : getImageUrl(url)} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-xl overflow-hidden hover:opacity-80 transition-opacity bg-secondary">
                      <img 
                        src={url.startsWith('blob:') ? url : getImageUrl(url)} 
                        alt="Shared media" 
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm font-medium">No media shared yet</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
