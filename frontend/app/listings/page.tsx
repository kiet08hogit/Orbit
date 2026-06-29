"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Loader2,
  Settings2,
  ListFilter,
  CheckCircle2,
  AlertCircle,
  BadgeCheck,
  Star,
  Heart,
  GraduationCap,
  Filter,
  Tag,
} from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Seller {
  id: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  email?: string;
  university?: string;
  isEduVerified?: boolean;
  reviewsReceived?: any[];
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
  { id: "DORM", label: "DORM" },
  { id: "SUBLEASE", label: "SUBLEASE" },
  { id: "CLOTHES", label: "CLOTHES" },
  { id: "SCHOOL", label: "SCHOOL" },
  { id: "LEISURE", label: "LEISURE" },
  { id: "ACCESSORIES", label: "ACCESSORIES" },
  { id: "OTHER", label: "OTHER" },
  { id: "ALL", label: "ALL PRODUCTS" },
];

const getCategoryHeroInfo = (category: string | null) => {
  switch (category) {
    case "DORM":
      return {
        image: "/dorm.avif",
        objectPosition: "object-[50%_18%]",
        title: "Dorm Essentials",
        description: "Move in and settle with all the essentials.",
      };
    case "SUBLEASE":
      return {
        image: "/sublease.jpg",
        objectPosition: "object-center",
        title: "Subleases",
        description: "Find a spot or sublet yours.",
      };
    case "CLOTHES":
      return {
        image: "/clothes.webp",
        objectPosition: "object-center",
        title: "Clothing & Apparel",
        description: "Refresh your wardrobe with great finds on campus.",
      };
    case "SCHOOL":
      return {
        image: "/book.avif",
        objectPosition: "object-[50%_35%]",
        title: "School Supplies",
        description: "Everything you need for your classes, for less.",
      };
    case "LEISURE":
      return {
        image: "/kayak.jpg",
        objectPosition: "object-center",
        title: "Leisure & Hobbies",
        description: "Find gear and tickets for your weekend adventures.",
      };
    case "ACCESSORIES":
      return {
        image: "/dj.jpg",
        objectPosition: "object-center",
        title: "Accessories",
        description: "Complete your look with the perfect accessories.",
      };
    default:
      return {
        image: "/dj.jpg",
        objectPosition: "object-center",
        title: "Trying to pass down your items?",
        description:
          "Sell your items quickly and safely to other students on campus.",
      };
  }
};

export default function ListingsGridPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "ALL";
  const searchQuery = searchParams.get("q") || "";
  const [listings, setListings] = useState<Listing[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    const fetchListings = async () => {
      if (!isLoaded) return;
      setIsLoading(true);
      try {
        let headers: any = {};
        if (isSignedIn) {
          const token = await getToken();
          headers = { Authorization: `Bearer ${token}` };

          // Fetch user profile to get university
          try {
            const userRes = await axios.get("http://127.0.0.1:3000/users/me", {
              headers,
            });
            setUserProfile(userRes.data);
          } catch (e) {}
        }

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
        const res = await axios.get(url, { headers });

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

  const itemsPerPage = 9;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedListings = listings.slice(startIndex, endIndex);
  const totalPages = Math.ceil(listings.length / itemsPerPage);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background dark:bg-card flex flex-col font-sans">
      {/* Dynamic Hero Banner */}
      {!searchQuery && (
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 mt-6">
          <div className="flex flex-col md:flex-row bg-[#e6e5e0] dark:bg-[#181922] rounded-[20px] overflow-hidden border border-border h-auto md:h-[300px]">
            {/* Left Side (Text) */}
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center items-start">
              <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3 leading-tight">
                {getCategoryHeroInfo(activeCategory).title}
              </h2>
              <p className="text-muted-foreground font-medium text-sm md:text-base mb-6 max-w-sm">
                {getCategoryHeroInfo(activeCategory).description}
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
                src={getCategoryHeroInfo(activeCategory).image}
                alt="Category Hero"
                className={`absolute inset-0 w-full h-full object-cover ${getCategoryHeroInfo(activeCategory).objectPosition}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content with Sidebar Layout */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0 hidden md:block space-y-8 mt-[70px]">
          <div>
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">
              Distance
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="w-5 h-5 rounded border border-border group-hover:border-foreground flex items-center justify-center bg-foreground text-background">
                  ✓
                </div>
                <span className="text-sm font-medium text-foreground">All</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="w-5 h-5 rounded border border-border group-hover:border-foreground"></div>
                <span className="text-sm font-medium text-muted-foreground">
                  @ {userProfile?.university || "your university"}
                </span>
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">
              Prices
            </h3>
            <div className="space-y-3">
              {["All", "$0 to $50", "$50 to $100", "$100 to $300", "$300+"].map(
                (price, idx) => (
                  <label
                    key={price}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div
                      className={`w-5 h-5 rounded border border-border group-hover:border-foreground ${idx === 0 ? "bg-foreground text-background flex items-center justify-center" : ""}`}
                    >
                      {idx === 0 && "✓"}
                    </div>
                    <span
                      className={`text-sm font-medium ${idx === 0 ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {price}
                    </span>
                  </label>
                ),
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">
              Condition
            </h3>
            <div className="space-y-3">
              {["Any", "New", "Like New", "Good", "Fair"].map((cond, idx) => (
                <label
                  key={cond}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div
                    className={`w-5 h-5 rounded border border-border group-hover:border-foreground ${idx === 0 ? "bg-foreground text-background flex items-center justify-center" : ""}`}
                  >
                    {idx === 0 && "✓"}
                  </div>
                  <span
                    className={`text-sm font-medium ${idx === 0 ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {cond}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">
              Buying Options
            </h3>
            <div className="space-y-3">
              {["Any", "Meetup on campus", "Self pickup"].map((opt, idx) => (
                <label
                  key={opt}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div
                    className={`w-5 h-5 rounded border border-border group-hover:border-foreground ${idx === 0 ? "bg-foreground text-background flex items-center justify-center" : ""}`}
                  >
                    {idx === 0 && "✓"}
                  </div>
                  <span
                    className={`text-sm font-medium ${idx === 0 ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {opt}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Listings Grid */}
        <div className="flex-1 min-w-0">
          {searchQuery ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-border">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                  Search Results
                </h2>
                <p className="text-muted-foreground font-medium mt-1">
                  ( {displayedListings.length} of {listings.length} listings )
                  matching "
                  <span className="text-[#3252DF] font-bold">
                    {searchQuery}
                  </span>
                  "
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
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-border">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-foreground">
                  {CATEGORIES.find((c) => c.id === activeCategory)?.label ||
                    "ALL PRODUCTS"}
                </h2>
                <p className="text-muted-foreground font-medium mt-1">
                  ( {displayedListings.length} of {listings.length} listings )
                </p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#DC2626]" />
            </div>
          ) : listings.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-x-4 gap-y-6">
                {displayedListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 mb-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage((p) => p - 1);
                          }}
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>

                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 &&
                            pageNum <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                href="#"
                                isActive={pageNum === currentPage}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(pageNum);
                                }}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }

                        if (
                          pageNum === currentPage - 2 ||
                          pageNum === currentPage + 2
                        ) {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }

                        return null;
                      })}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages)
                              setCurrentPage((p) => p + 1);
                          }}
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="h-20 w-20 bg-secondary border border-border rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Filter className="h-8 w-8 text-zinc-300" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                No listings found
              </h3>
              <p className="text-muted-foreground font-medium max-w-sm">
                There are currently no items available in this category.
              </p>
            </div>
          )}
        </div>
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

          <div className="mt-auto pt-2 text-[10px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-t border-border/50">
            {listing.seller?.university ? (
              <span className="truncate flex items-center gap-1.5">
                <GraduationCap className="h-3 w-3 shrink-0" />
                {listing.seller.university}
              </span>
            ) : (
              <span />
            )}
            
            <div className="flex items-center gap-2">
              {listing.seller?.reviewsReceived && listing.seller.reviewsReceived.length > 0 && (
                <div className="flex items-center gap-0.5 text-amber-500">
                  <Star className="h-3 w-3 fill-current" />
                  <span>
                    {(
                      listing.seller.reviewsReceived.reduce((sum: number, r: any) => sum + r.rating, 0) /
                      listing.seller.reviewsReceived.length
                    ).toFixed(1)}
                  </span>
                </div>
              )}
              {listing.seller?.isEduVerified && (
                <div title="Verified .edu Email">
                  <BadgeCheck className="h-4 w-4 text-blue-500" />
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
