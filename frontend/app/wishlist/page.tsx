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
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-zinc-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#3252DF]" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 py-10 px-4 sm:px-6 font-sans relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-[#3252DF]/10 blur-[100px]" />
      <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 rounded-full bg-[#DC2626]/10 blur-[100px]" />

      <div className="max-w-6xl mx-auto z-10">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-black transition-colors mb-4 text-sm font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center">
              <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-black">Your Wishlist</h1>
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
                <Link href={`/listings/${listing.id}`} className="block h-full group">
                  <div className="bg-white rounded-2xl overflow-hidden border border-zinc-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
                    {/* Image */}
                    <div className="aspect-square bg-zinc-100 relative overflow-hidden">
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
                        <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wider text-black shadow-sm">
                          {listing.category}
                        </span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-black text-sm leading-tight line-clamp-2 pr-2 group-hover:text-[#3252DF] transition-colors">
                          {listing.title}
                        </h3>
                      </div>
                      <div className="mt-auto pt-3 flex items-end justify-between">
                        <span className="text-lg font-black text-[#DC2626]">
                          ${Number(listing.price).toFixed(2)}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
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
          <div className="bg-white rounded-3xl border border-zinc-200 p-16 flex flex-col items-center justify-center text-center shadow-sm max-w-2xl mx-auto mt-12">
            <div className="h-20 w-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6 border border-zinc-100">
              <Heart className="h-10 w-10 text-zinc-300" />
            </div>
            <h3 className="text-2xl font-black text-black mb-2">Your Wishlist is Empty</h3>
            <p className="text-zinc-500 text-base font-medium max-w-sm mb-8">
              Items you swipe right on or save will appear here so you can easily find them later.
            </p>
            <Link href="/swipe">
              <button className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-colors">
                Start Swiping
              </button>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
