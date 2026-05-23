'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Loader2, Search, Filter, Sparkles, Tag } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setListings(data);
        }
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

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">

        {/* Hero Banner for ALL PRODUCTS */}
        {activeCategory === 'ALL' && (
          <div className="relative w-full h-[500px] mb-12 rounded-2xl overflow-hidden shadow-sm group">
            <img
              src="/hero1.jpg"
              alt="FlamesPorium Hero"
              className="absolute inset-0 w-full h-[65vh] object-cover z-0"
            />
            {/* The white card overlay */}
            <div className="absolute left-8 md:left-16 top-2/3 -translate-y-1/2 bg-white rounded-2xl p-8 shadow-xl max-w-sm z-10">
              <h2 className="text-2xl font-black text-black mb-6 leading-tight">
                Trying to pass down your items?
              </h2>
              <Link
                href="/add-product"
                className="block w-full text-center bg-[#3252DF] hover:bg-[#272343] text-white font-bold py-3 px-6 rounded-lg transition-colors mb-4"
              >
                Sell now
              </Link>
              <div className="text-center">
                <a href="#" className="text-sm font-bold text-zinc-600 underline hover:text-black">
                  How it works
                </a>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#DC2626]" />
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <Link href={`/listings/${listing.id}`} key={listing.id}>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-full"
                >
                  <Card className="rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col h-full border-zinc-200">
                    {/* Image or Placeholder */}
                    <div className="aspect-square bg-zinc-50 relative flex items-center justify-center overflow-hidden border-b border-zinc-100">
                      {listing.images && listing.images.length > 0 ? (
                        <img
                          src={`http://localhost:3000${listing.images[0].url}`}
                          alt={listing.title}
                          className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <>
                          <Tag className="h-12 w-12 text-zinc-200 z-10" />
                        </>
                      )}
                    </div>

                    {/* Content */}
                    <CardContent className="p-4 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
                          {listing.category}
                        </span>
                        <Badge variant="secondary" className="text-[10px] font-bold bg-emerald-50 text-emerald-600 uppercase hover:bg-emerald-100">
                          {listing.status}
                        </Badge>
                      </div>
                      <h3 className="font-black text-zinc-900 text-lg leading-tight mb-1 line-clamp-1 group-hover:text-[#DC2626] transition-colors">
                        {listing.title}
                      </h3>
                      <p className="text-zinc-500 text-sm line-clamp-2 mb-3">
                        {listing.description}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-3 border-t border-zinc-100">
                        <div className="font-black text-lg text-black">
                          ${listing.price.toFixed(2)}
                        </div>
                        <div className="text-xs font-bold text-zinc-400">
                          {listing.seller?.email ? listing.seller.email.split('@')[0] : 'Seller'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
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
