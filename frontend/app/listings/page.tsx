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

const getImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `http://127.0.0.1:3000${url}`;
};

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
  const searchQuery = searchParams.get('q') || '';
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      if (!isLoaded || !isSignedIn) return;
      setIsLoading(true);
      try {
        const token = await getToken();
        const params = new URLSearchParams();
        if (activeCategory !== 'ALL') {
          params.append('category', activeCategory);
        }
        if (searchQuery) {
          params.append('q', searchQuery);
        }
        let baseUrl = 'http://127.0.0.1:3000/listings/all';
        if (searchQuery) {
          baseUrl = 'http://127.0.0.1:3000/listings/recommendations';
        }

        const url = `${baseUrl}${params.toString() ? `?${params.toString()}` : ''}`;
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
  }, [isLoaded, isSignedIn, getToken, activeCategory, searchQuery]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-[#DC2626]" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white flex flex-col font-sans">
      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {searchQuery && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-zinc-100">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-black flex items-center gap-2">
                Search Results
              </h2>
              <p className="text-zinc-500 font-medium mt-1">
                Showing {listings.length} {listings.length === 1 ? 'item' : 'items'} matching "<span className="text-[#3252DF] font-bold">{searchQuery}</span>"
              </p>
            </div>
            <Link href="/listings" className="mt-4 sm:mt-0">
              <Button variant="outline" className="rounded-full border-zinc-200 text-zinc-600 hover:text-black hover:bg-zinc-50 font-bold">
                Clear Search
              </Button>
            </Link>
          </div>
        )}

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
              {searchQuery ? (
                <>No items found matching "<span className="font-bold text-black">{searchQuery}</span>" in <span className="font-bold text-black">{CATEGORIES.find(c => c.id === activeCategory)?.label}</span>.</>
              ) : (
                <>There are currently no items available in <span className="font-bold text-black">{CATEGORIES.find(c => c.id === activeCategory)?.label}</span>.</>
              )}
            </p>
            {searchQuery ? (
              <Link href="/listings">
                <Button size="lg" className="mt-8 bg-zinc-900 hover:bg-black text-white font-bold rounded-full shadow-lg">
                  Clear Search
                </Button>
              </Link>
            ) : (
              <Link href="/add-product">
                <Button size="lg" className="mt-8 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-full shadow-lg shadow-red-500/20">
                  Be the first to list one!
                </Button>
              </Link>
            )}
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
              src={getImageUrl(listing.images[0].url)}
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
