'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Loader2, Filter, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";

interface Seller {
  id: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  email?: string;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  status: string;
  seller: Seller;
  createdAt: string;
  images?: { url: string }[];
}

const CATEGORIES = [
  { id: 'HOUSING', label: 'DORM' },
  { id: 'CLOTHES', label: 'CLOTHES' },
  { id: 'SCHOOL', label: 'SCHOOL' },
  { id: 'LEISURE', label: 'LEISURE' },
  { id: 'ACCESSORIES', label: 'ACCESSORIES' },
  { id: 'OTHER', label: 'OTHER' },
  { id: 'ALL', label: 'ALL PRODUCTS' },
];

export default function ListingsGridPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category') || 'ALL';
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      if (!isLoaded || !isSignedIn) return;
      setIsLoading(true);
      try {
        const token = await getToken();
        // If 'ALL' is selected, don't pass the category query parameter
        const url = activeCategory === 'ALL'
          ? 'http://localhost:3000/listings/all'
          : `http://localhost:3000/listings/all?category=${activeCategory}`;
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setListings(res.data);
      } catch (err) {
        console.error('Failed to fetch listings', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [isLoaded, isSignedIn, getToken, activeCategory]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-[#DC2626]" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white flex flex-col font-sans">

      {/* Hero Banner */}
      <div className="relative w-full h-[500px] mb-12 overflow-hidden">
        <img
          src="/dj.jpg"
          alt="Circlo Hero"
          className="absolute inset-0 w-full h-full object-cover object-[50%_18%] z-0"
        />
        
        {/* The white card overlay */}
        <div className="absolute left-8 md:left-[10%] top-1/2 -translate-y-1/2 bg-white rounded-xl p-8 shadow-xl max-w-sm z-10 border border-zinc-100">
          <h2 className="text-2xl font-black text-black mb-6 leading-tight">
            Trying to pass down your items?
          </h2>
          <Link
            href="/add-product"
            className="block w-full text-center bg-[#b81d68] hover:bg-[#961754] text-white font-bold py-3 px-6 rounded-lg transition-colors mb-4"
          >
            Sell now
          </Link>
          <div className="text-center">
            <a href="#" className="text-sm font-medium text-zinc-600 underline hover:text-black">
              How it works
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 pb-12">

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#DC2626]" />
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="h-20 w-20 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Filter className="h-8 w-8 text-zinc-300" />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">No listings found</h3>
            <p className="text-zinc-500 font-medium max-w-sm">
              There are currently no items available in <span className="font-bold text-black">{CATEGORIES.find(c => c.id === activeCategory)?.label}</span>.
            </p>
            <Link href="/add-product">
              <Button size="lg" className="mt-8 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-full shadow-lg shadow-red-500/20">
                Be the first to list one!
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}



function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listings/${listing.id}`} className="block h-full group">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col h-full"
      >
        <div className="aspect-square relative flex items-center justify-center overflow-hidden mb-3 bg-zinc-100">
          {listing.images && listing.images.length > 0 ? (
            <img
              src={`http://localhost:3000${listing.images[0].url}`}
              alt={listing.title}
              className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <Tag className="h-10 w-10 text-zinc-300 z-10" />
          )}
        </div>
        <div className="font-bold text-black text-base md:text-lg leading-none mb-1">
          ${listing.price.toFixed(2)}
        </div>
        <h3 className="text-zinc-500 text-sm leading-tight line-clamp-2">
          {listing.title}
        </h3>
      </motion.div>
    </Link>
  );
}
