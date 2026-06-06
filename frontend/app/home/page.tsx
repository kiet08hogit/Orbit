'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Loader2, Tag, Flame, Eye, ChevronRight } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

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

export default function Home() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [recommendedListings, setRecommendedListings] = useState<Listing[]>([]);
  const [hotListings, setHotListings] = useState<Listing[]>([]);
  const [viewedListings, setViewedListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      if (!isLoaded || !isSignedIn) return;
      setIsLoading(true);
      try {
        const token = await getToken();
        const url = 'http://127.0.0.1:3000/listings/all';
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const recUrl = 'http://127.0.0.1:3000/listings/recommended';
        const recRes = await axios.get(recUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const hotUrl = 'http://127.0.0.1:3000/listings/hot';
        const hotRes = await axios.get(hotUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const viewedUrl = 'http://127.0.0.1:3000/listings/viewed';
        const viewedRes = await axios.get(viewedUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setListings(res.data);
        setRecommendedListings(recRes.data);
        setHotListings(hotRes.data);
        setViewedListings(viewedRes.data);
      } catch (err) {
        console.error('Failed to fetch listings', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [isLoaded, isSignedIn, getToken]);

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
        ) : (
          <div className="space-y-16">
            <ProductSection
              title={<span className="flex items-center gap-2">For you <span className="text-red-600 font-black">!</span></span>}
              listings={recommendedListings.length > 0 ? recommendedListings : listings}
              viewMoreHref="/listings?sort=recommended"
            />
            <ProductSection
              title={<span className="flex items-center gap-2">Hot @ UIC <Flame className="h-6 w-6 text-orange-500 fill-orange-500" /> </span>}
              listings={hotListings}
              viewMoreHref="/listings?sort=hot"
            />
            <ProductSection
              title={<span className="flex items-center gap-2">You've viewed <Eye className="h-6 w-6 text-blue-500" /></span>}
              listings={viewedListings}
              viewMoreHref="/listings?sort=recent"
            />
            <ProductSection
              title={<span className="flex items-center gap-2">New Listings </span>}
              listings={listings.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
              viewMoreHref="/listings?sort=newest"
            />
          </div>
        )}
      </main>
    </div>
  );
}

function ProductSection({ title, listings, viewMoreHref }: { title: React.ReactNode, listings: Listing[], viewMoreHref?: string }) {
  if (listings.length === 0) return null;
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-black">{title}</h2>
        {viewMoreHref && (
          <Link href={viewMoreHref} className="hidden sm:flex items-center text-sm font-bold text-[#3252DF] hover:text-[#2841B3] transition-colors group">
            View More
            <ChevronRight className="h-4 w-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>
      <div className="flex overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 gap-4 md:gap-6 snap-x snap-mandatory hide-scrollbar">
        {listings.map((listing) => (
          <div key={listing.id} className="min-w-[160px] md:min-w-[240px] w-[160px] md:w-[240px] flex-none snap-start">
            <ListingCard listing={listing} />
          </div>
        ))}
      </div>
      {viewMoreHref && (
        <div className="mt-6 sm:hidden">
          <Link href={viewMoreHref} className="flex items-center justify-center w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-lg text-sm font-bold transition-colors">
            View More
          </Link>
        </div>
      )}
    </section>
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
