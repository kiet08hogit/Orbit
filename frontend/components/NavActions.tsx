import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";
import { ChatBadge } from "./ChatBadge";
import { WishlistBadge } from "./WishlistBadge";

export async function NavActions() {
  const { userId, getToken } = await auth();

  if (!userId) return null;

  let unreadCount = 0;
  let wishlistCount = 0;
  
  try {
    const token = await getToken();
    if (token) {
      const res = await axios.get("http://127.0.0.1:3000/chat/unread-count", {
        headers: { Authorization: `Bearer ${token}` }
      });
      unreadCount = res.data.count || 0;
      
      const wishRes = await axios.get("http://127.0.0.1:3000/listings/wishlist-count", {
        headers: { Authorization: `Bearer ${token}` }
      });
      wishlistCount = wishRes.data.count || 0;
    }
  } catch (err) {
    console.error("Failed to fetch badge counts (SSR):", err);
  }

  return (
    <div className="flex items-center gap-4">
      {/* Wishlist Link with Badge */}
      <Link href="/wishlist" className="text-zinc-500 hover:text-white transition-colors">
        <WishlistBadge initialCount={wishlistCount} />
      </Link>

      {/* Chat Link with Badge */}
      <Link href="/chat" className="relative text-zinc-500 hover:text-white transition-colors">
        <ChatBadge initialCount={unreadCount} />
      </Link>
    </div>
  );
}
