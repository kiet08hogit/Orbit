"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Loader2, Filter, Tag } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  { id: "HOUSING", label: "DORM" },
  { id: "CLOTHES", label: "CLOTHES" },
  { id: "SCHOOL", label: "SCHOOL" },
  { id: "LEISURE", label: "LEISURE" },
  { id: "ACCESSORIES", label: "ACCESSORIES" },
  { id: "OTHER", label: "OTHER" },
  { id: "ALL", label: "ALL PRODUCTS" },
];

const getCategoryHeroInfo = (categoryId: string) => {
  switch (categoryId) {
    case "HOUSING":
      return { image: "/dorm.avif", objectPosition: "object-[50%_18%]" };
    case "CLOTHES":
      return { image: "/clothes.webp", objectPosition: "object-center" };
    case "SCHOOL":
      return { image: "/book.avif", objectPosition: "object-[50%_35%]" };
    case "LEISURE":
      return { image: "/kayak.jpg", objectPosition: "object-center" };
    case "ACCESSORIES":
    case "OTHER":
    case "ALL":
    default:
      return { image: "/dj.jpg", objectPosition: "object-[50%_18%]" };
  }
};

export default function ListingsGridPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "ALL";
  const searchQuery = searchParams.get("q") || "";
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      if (!isLoaded || !isSignedIn) return;
      setIsLoading(true);
      try {
        const token = await getToken();
        const params = new URLSearchParams();
        if (activeCategory !== "ALL") {
          params.append("category", activeCategory);
        }
        if (searchQuery) {
          params.append("q", searchQuery);
        }
        let baseUrl = "http://127.0.0.1:3000/listings/all";
        if (searchQuery) {
          baseUrl = "http://127.0.0.1:3000/listings/recommendations";
        }

        const url = `${baseUrl}${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setListings(res.data);
      } catch (err) {
        console.error("Failed to fetch listings", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [isLoaded, isSignedIn, getToken, activeCategory, searchQuery]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-card">
        <Loader2 className="h-10 w-10 animate-spin text-[#DC2626]" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background dark:bg-card flex flex-col font-sans">
      {/* Dynamic Hero Banner */}
      {!searchQuery && (
        <div className="relative w-full h-[350px] md:h-[450px] mb-8 overflow-hidden">
          <img
            src={getCategoryHeroInfo(activeCategory).image}
            alt="Category Hero"
            className={`absolute inset-0 w-full h-full object-cover ${getCategoryHeroInfo(activeCategory).objectPosition} z-0`}
          />
          {/* The white card overlay */}
          <div className="absolute left-8 md:left-[10%] top-1/2 -translate-y-1/2 bg-card rounded-2xl p-8 shadow-xl max-w-sm z-10 border border-border">
            <h2 className="text-2xl font-black text-foreground mb-6 leading-tight">
              Trying to pass down your items?
            </h2>
            <Link
              href="/add-product"
              className="block w-full text-center bg-foreground hover:bg-foreground/90 text-background font-bold py-3 px-6 rounded-lg transition-colors mb-4"
            >
              Sell now
            </Link>
            <div className="text-center">
              <a
                href="#"
                className="text-sm font-medium text-muted-foreground underline hover:text-foreground"
              >
                How it works
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {searchQuery && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-border">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                Search Results
              </h2>
              <p className="text-muted-foreground font-medium mt-1">
                Showing {listings.length}{" "}
                {listings.length === 1 ? "item" : "items"} matching "
                <span className="text-[#3252DF] font-bold">{searchQuery}</span>"
              </p>
            </div>
            <Link href="/listings" className="mt-4 sm:mt-0">
              <Button
                variant="outline"
                className="rounded-full border-border text-muted-foreground hover:text-foreground hover:bg-secondary font-bold"
              >
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-8">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="h-20 w-20 bg-secondary border border-border rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Filter className="h-8 w-8 text-zinc-300" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              No listings found
            </h3>
            <p className="text-muted-foreground font-medium max-w-sm">
              {searchQuery ? (
                <>
                  No items found matching "
                  <span className="font-bold text-foreground">
                    {searchQuery}
                  </span>
                  " in{" "}
                  <span className="font-bold text-foreground">
                    {CATEGORIES.find((c) => c.id === activeCategory)?.label}
                  </span>
                  .
                </>
              ) : (
                <>
                  There are currently no items available in{" "}
                  <span className="font-bold text-foreground">
                    {CATEGORIES.find((c) => c.id === activeCategory)?.label}
                  </span>
                  .
                </>
              )}
            </p>
            {searchQuery ? (
              <Link href="/listings">
                <Button
                  size="lg"
                  className="mt-8 bg-secondary hover:bg-foreground text-primary-foreground font-bold rounded-full shadow-sm"
                >
                  Clear Search
                </Button>
              </Link>
            ) : (
              <Link href="/add-product">
                <Button
                  size="lg"
                  className="mt-8 bg-[#DC2626] hover:bg-[#B91C1C] text-primary-foreground font-bold rounded-full shadow-sm shadow-red-500/20"
                >
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
        className="flex flex-col h-full bg-card rounded-[18px] border border-border shadow-sm overflow-hidden hover:-translate-y-1 transition-transform duration-300"
      >
        <div className="aspect-square relative flex items-center justify-center overflow-hidden bg-background">
          {listing.images && listing.images.length > 0 ? (
            <img
              src={getImageUrl(listing.images[0].url)}
              alt={listing.title}
              className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <Tag className="h-10 w-10 text-[#d2d2d7] z-10" />
          )}
        </div>
        <div className="p-3 md:p-4 flex flex-col gap-1 bg-card">
          <div className="font-semibold text-foreground text-[15px] md:text-[17px] leading-tight">
            ${listing.price.toFixed(2)}
          </div>
          <h3 className="text-muted-foreground text-[13px] md:text-[14px] font-normal leading-tight line-clamp-2">
            {listing.title}
          </h3>
        </div>
      </motion.div>
    </Link>
  );
}
