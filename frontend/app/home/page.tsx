"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Loader2, Tag, Flame, Eye, ChevronRight, Heart } from "lucide-react";
import axios from "axios";
import Link from "next/link";

interface Seller {
  id: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  email?: string;
  university?: string;
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
        const url = "http://127.0.0.1:3000/listings/all";
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const recUrl = "http://127.0.0.1:3000/listings/recommended";
        const recRes = await axios.get(recUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const hotUrl = "http://127.0.0.1:3000/listings/hot";
        const hotRes = await axios.get(hotUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const viewedUrl = "http://127.0.0.1:3000/listings/viewed";
        const viewedRes = await axios.get(viewedUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setListings(res.data);
        setRecommendedListings(recRes.data);
        setHotListings(hotRes.data);
        setViewedListings(viewedRes.data);
      } catch (err) {
        console.error("Failed to fetch listings", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [isLoaded, isSignedIn, getToken]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-card">
        <Loader2 className="h-10 w-10 animate-spin text-[#DC2626]" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background dark:bg-card flex flex-col font-sans">
      {/* Hero Banner */}
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 mt-6 mb-8">
        <div className="flex flex-col md:flex-row bg-[#e6e5e0] dark:bg-[#181922] rounded-[20px] overflow-hidden border border-border h-auto md:h-[300px]">
          {/* Left Side (Text) */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center items-start">
            <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3 leading-tight">
              Trying to pass down your items?
            </h2>
            <p className="text-muted-foreground font-medium text-sm md:text-base mb-6 max-w-sm">
              Sell your items quickly and safely to other students on campus.
            </p>
            <Link
              href="/add-product"
              className="bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-bold py-2.5 px-6 rounded-lg transition-colors text-sm"
            >
              Sell now
            </Link>
          </div>

          {/* Right Side (Image) */}
          <div className="w-full md:w-1/2 h-[200px] md:h-full relative">
            <img
              src="/dj.jpg"
              alt="Orbit Hero"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
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
              title={
                <span className="flex items-center gap-2">
                  For you <span className="text-red-600 font-black">!</span>
                </span>
              }
              listings={
                recommendedListings.length > 0 ? recommendedListings : listings
              }
              viewMoreHref="/listings?sort=recommended"
            />
            <ProductSection
              title={
                <span className="flex items-center gap-2">
                  Hot @ UIC{" "}
                  <Flame className="h-6 w-6 text-orange-500 fill-orange-500" />{" "}
                </span>
              }
              listings={hotListings}
              viewMoreHref="/listings?sort=hot"
            />
            <ProductSection
              title={
                <span className="flex items-center gap-2">
                  You've viewed <Eye className="h-6 w-6 text-blue-500" />
                </span>
              }
              listings={viewedListings}
              viewMoreHref="/listings?sort=recent"
            />
            <ProductSection
              title={
                <span className="flex items-center gap-2">New Listings </span>
              }
              listings={listings
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )}
              viewMoreHref="/listings?sort=newest"
            />
          </div>
        )}
      </main>
    </div>
  );
}

function ProductSection({
  title,
  listings,
  viewMoreHref,
}: {
  title: React.ReactNode;
  listings: Listing[];
  viewMoreHref?: string;
}) {
  if (listings.length === 0) return null;
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[24px] md:text-[28px] font-semibold text-foreground tracking-tight">
          {title}
        </h2>
        {viewMoreHref && (
          <Link
            href={viewMoreHref}
            className="hidden sm:flex items-center text-[17px] font-normal text-[#0066cc] hover:underline transition-colors group"
          >
            View More
            <ChevronRight className="h-4 w-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>
      <div className="flex overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0 gap-4 md:gap-5 snap-x snap-mandatory hide-scrollbar">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="min-w-[140px] md:min-w-[180px] w-[140px] md:w-[180px] flex-none snap-start"
          >
            <ListingCard listing={listing} />
          </div>
        ))}
      </div>
      {viewMoreHref && (
        <div className="mt-6 sm:hidden">
          <Link
            href={viewMoreHref}
            className="flex items-center justify-center w-full py-3 bg-card border border-border text-foreground rounded-[14px] text-[17px] font-normal transition-colors hover:bg-secondary"
          >
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
        className="flex flex-col h-full bg-card rounded-[16px] border border-border shadow-sm overflow-hidden hover:-translate-y-1 transition-transform duration-300 relative"
      >
        <div className="aspect-[4/3] relative flex items-center justify-center overflow-hidden bg-background">
          {listing.images && listing.images.length > 0 ? (
            <img
              src={getImageUrl(listing.images[0].url)}
              alt={listing.title}
              className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <Tag className="h-10 w-10 text-[#d2d2d7] z-10" />
          )}

          {/* Transparent Heart Button */}
          <button
            className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Add wishlist logic here
            }}
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3 flex flex-col gap-1 bg-card flex-1">
          <div className="font-semibold text-foreground text-[15px] md:text-[16px] leading-tight">
            ${listing.price.toFixed(2)}
          </div>
          <h3 className="text-muted-foreground text-[13px] md:text-[14px] font-normal leading-tight line-clamp-2 mb-1">
            {listing.title}
          </h3>

          {listing.seller?.university && (
            <div className="mt-auto pt-2 text-[10px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-t border-border/50">
              <span className="truncate flex items-center gap-1.5">
                🎓 {listing.seller.university}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
