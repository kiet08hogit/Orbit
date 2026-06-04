"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { io, Socket } from "socket.io-client";
import axios from "axios";

export function WishlistBadge({ initialCount }: { initialCount: number }) {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [wishlistCount, setWishlistCount] = useState(initialCount);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Sync with backend to ensure 100% accuracy
  const syncWishlistCount = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await axios.get("http://127.0.0.1:3000/listings/wishlist-count", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWishlistCount(res.data.count || 0);
    } catch (err) {
      console.error("Failed to sync wishlist count:", err);
    }
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
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

    // When we receive a wishlist update, sync the count
    const onWishlistUpdate = () => {
      syncWishlistCount();
    };

    socket.on("update_wishlist_count", onWishlistUpdate);

    return () => {
      socket.off("update_wishlist_count", onWishlistUpdate);
    };
  }, [socket]);

  return (
    <div className="relative flex items-center justify-center">
      <Heart className="h-5 w-5" />
      {wishlistCount > 0 && (
        <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-black">
          {wishlistCount > 99 ? "99+" : wishlistCount}
        </div>
      )}
    </div>
  );
}
