'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Loader2, Heart, Tag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const getImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://127.0.0.1:3000${url}`;
};

export default function WishlistPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [wishlist, setWishlist] = useState<any[]>([]);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isLoaded || !isSignedIn) return;
      try {
        const token = await getToken();
        const res = await axios.get(`http://127.0.0.1:3000/listings/wishlist`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWishlist(res.data);
      } catch (err) {
        console.error('Failed to fetch wishlist', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWishlist();
  }, [isLoaded, isSignedIn, getToken]);

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#f2f2f7]">
        <Loader2 className="h-10 w-10 animate-spin text-[#007AFF]" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f2f2f7] py-10 px-4 sm:px-6 font-sans relative overflow-hidden">

      <div className="max-w-6xl mx-auto z-10">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors mb-4 text-sm font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center">
              <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
            </div>
            <h1 className="text-[32px] font-semibold tracking-tight text-zinc-900">Your Wishlist</h1>
          </div>
        </div>

        {/* Wishlist Grid */}
        {wishlist && wishlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((listing: any, i: number) => (
              <motion.div 
                key={listing.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/listings/${listing.id}`} className="block h-full group active:scale-[0.98] transition-transform">
                  <div className="bg-white rounded-[20px] overflow-hidden border-transparent shadow-[0_2px_20px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] transition-all h-full flex flex-col">
                    {/* Image */}
                    <div className="aspect-square bg-zinc-50 relative overflow-hidden">
                      {listing.images && listing.images.length > 0 ? (
                        <img 
                          src={getImageUrl(listing.images[0].url)} 
                          alt={listing.title} 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-300">
                          <Tag className="h-10 w-10" />
                        </div>
                      )}
                      {/* Category Badge */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-white shadow-sm">
                          {listing.category}
                        </span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-zinc-900 text-[15px] leading-tight line-clamp-2 pr-2">
                          {listing.title}
                        </h3>
                      </div>
                      <div className="mt-auto pt-3 flex items-end justify-between">
                        <span className="text-[17px] font-semibold text-zinc-900">
                          ${Number(listing.price).toFixed(2)}
                        </span>
                        <span className="text-[11px] font-medium text-zinc-500">
                          {new Date(listing.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[20px] border-transparent p-16 flex flex-col items-center justify-center text-center shadow-[0_2px_20px_-8px_rgba(0,0,0,0.04)] max-w-2xl mx-auto mt-12">
            <div className="h-20 w-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
              <Heart className="h-10 w-10 text-zinc-300" />
            </div>
            <h3 className="text-[22px] font-semibold text-zinc-900 mb-2">Your Wishlist is Empty</h3>
            <p className="text-zinc-500 text-[15px] max-w-sm mb-8 leading-relaxed">
              Items you swipe right on or save will appear here so you can easily find them later.
            </p>
            <Link href="/swipe">
              <button className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-zinc-50 transition-transform active:scale-[0.98]">
                Start Swiping
              </button>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
