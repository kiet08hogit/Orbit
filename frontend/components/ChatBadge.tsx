"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { io, Socket } from "socket.io-client";
import axios from "axios";

export function ChatBadge({ initialCount }: { initialCount: number }) {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [unreadCount, setUnreadCount] = useState(initialCount);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Sync with backend to ensure 100% accuracy
  const syncUnreadCount = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await axios.get("http://localhost:3000/chat/unread-count", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(res.data.count || 0);
    } catch (err) {
      console.error("Failed to sync unread count:", err);
    }
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const newSocket = io(apiUrl, { transports: ["websocket"], autoConnect: false });

    const setupSocket = async () => {
      const token = await getToken();
      if(token) {
        newSocket.auth = { token };
        newSocket.on("connect", () => {
           newSocket.emit("authenticate");
        });
        newSocket.connect();
      }
    };
    setupSocket();
    setSocket(newSocket);

    return () => { newSocket.disconnect(); };
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (!socket) return;

    // When we receive a new message, sync the count
    const onReceiveMessage = () => {
      syncUnreadCount();
    };

    socket.on("receive_message", onReceiveMessage);
    socket.on("messages_read", onReceiveMessage); // when we read messages on another device or tab

    return () => {
      socket.off("receive_message", onReceiveMessage);
      socket.off("messages_read", onReceiveMessage);
    };
  }, [socket]);

  // Listen for local events when we open a chat on the frontend
  useEffect(() => {
    const handleLocalRead = () => {
      syncUnreadCount();
    };

    window.addEventListener("update_unread_count", handleLocalRead);
    return () => {
      window.removeEventListener("update_unread_count", handleLocalRead);
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      <MessageSquare className="h-5 w-5" />
      {unreadCount > 0 && (
        <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-black">
          {unreadCount > 5 ? "5+" : unreadCount}
        </div>
      )}
    </div>
  );
}
