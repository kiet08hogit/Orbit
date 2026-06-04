"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import axios from "axios";
import { Loader2, ArrowLeft, Heart, MessageSquare, Tag, MapPin, CheckCircle2, Shield, ChevronRight } from "lucide-react";
import Link from "next/link";
import CampusMap from "@/components/CampusMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface Seller {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
  clerkUserId?: string;
}

interface ListingImage {
  id: string;
  url: string;
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
  images: ListingImage[];
}

const CATEGORY_LABELS: Record<string, string> = {
  HOUSING: "Dorm",
  CLOTHES: "Clothes",
  SCHOOL: "School",
  LEISURE: "Leisure",
  ACCESSORIES: "Accessories",
  OTHER: "Other",
};

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push("/");
      return;
    }

    const fetchListing = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`http://127.0.0.1:3000/listings/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data;
        setListing(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch listing");
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [params.id, isLoaded, isSignedIn, getToken, router]);

  const handleTalkToSeller = async () => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    
    setIsStartingChat(true);
    try {
      const token = await getToken();
      const res = await axios.post(`http://127.0.0.1:3000/chat/conversation/${listing?.seller.clerkUserId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.status === 200 || res.status === 201) {
        const conversation = res.data;
        router.push(`/chat?id=${conversation.id}&listingId=${listing?.id}`);
      } else {
        console.error("Failed to start conversation");
        setIsStartingChat(false);
      }
    } catch (err) {
      console.error("Error starting chat:", err);
      setIsStartingChat(false);
    }
  };

  const handleMeetupRequest = async (building: any) => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    try {
      const token = await getToken();
      const res = await axios.post(`http://127.0.0.1:3000/chat/conversation/${listing?.seller.clerkUserId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 200 || res.status === 201) {
        const conversation = res.data;
        const meetupLocation = encodeURIComponent(building.name);
        router.push(`/chat?id=${conversation.id}&listingId=${listing?.id}&meetupLocation=${meetupLocation}`);
      }
    } catch (err) {
      console.error("Error starting chat:", err);
    }
  };

  const handleWishlistToggle = async () => {
    if (!listing) return;
    
    const newValue = !isWishlisted;
    setIsWishlisted(newValue);

    try {
      const token = await getToken();
      await axios.post(`http://127.0.0.1:3000/listings/${listing.id}/swipe`, 
        { type: newValue ? "LIKE" : "SKIP" }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to update wishlist:", err);
      setIsWishlisted(!newValue);
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-[#3252DF]" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-zinc-50 p-4">
        <Card className="max-w-md w-full p-8 text-center rounded-2xl border-zinc-200">
          <CardContent className="p-0">
            <h2 className="text-xl font-bold text-zinc-900 mb-2">Oops!</h2>
            <p className="text-zinc-500 mb-6">{error || "Listing not found"}</p>
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 text-[#3252DF] font-bold hover:text-black transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const postedDate = new Date(listing.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const categoryLabel = CATEGORY_LABELS[listing.category] || listing.category;
  const sellerName =
    listing.seller?.name ||
    listing.seller?.username ||
    listing.seller?.email?.split("@")[0] ||
    "UIC Student";
  const sellerInitial = sellerName[0]?.toUpperCase() || "U";
  const isOwner = userId === listing.seller?.clerkUserId || userId === listing.seller?.id;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white font-sans">
      {/* Breadcrumb */}
      <div className="border-b border-zinc-100">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/home"
              className="text-zinc-400 hover:text-black transition-colors font-medium"
            >
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            <Link
              href={`/listings?category=${listing.category}`}
              className="text-zinc-400 hover:text-black transition-colors font-medium"
            >
              {categoryLabel}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            <span className="text-zinc-900 font-semibold truncate max-w-[300px]">
              {listing.title}
            </span>
          </nav>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12 py-8">
        {/* ── 3-Column Grid: Images | Info | Map ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* ═══════ COLUMN 1: Images (thumbnails + main) ═══════ */}
          <div className="lg:col-span-4 flex gap-3">
            {/* Vertical thumbnail strip — always visible */}
            {listing.images && listing.images.length > 0 && (
              <div className="hidden sm:flex flex-col gap-2 shrink-0">
                {listing.images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-[100px] h-[100px] rounded-md overflow-hidden border-2 transition-all duration-200 bg-zinc-800 ${activeImageIndex === idx
                        ? "border-[#6C5CE7] ring-2 ring-[#6C5CE7]/30 opacity-100"
                        : "border-zinc-700 opacity-70 hover:opacity-100 hover:border-zinc-500"
                      }`}
                  >
                    <img
                      src={`http://127.0.0.1:3000${img.url}`}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="aspect-square bg-zinc-100 border border-zinc-200 rounded-2xl overflow-hidden relative"
              >
                {listing.images && listing.images.length > 0 ? (
                  <motion.img
                    key={activeImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    src={`http://127.0.0.1:3000${listing.images[activeImageIndex].url}`}
                    alt={listing.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300">
                    <Tag className="h-16 w-16 mb-3" />
                    <span className="font-bold text-sm">No Image</span>
                  </div>
                )}
              </motion.div>

              {/* Mobile thumbnail strip (horizontal) */}
              {listing.images && listing.images.length > 0 && (
                <div className="flex sm:hidden gap-2 mt-3 overflow-x-auto pb-2">
                  {listing.images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all bg-zinc-800 ${activeImageIndex === idx
                          ? "border-[#6C5CE7] opacity-100"
                          : "border-zinc-700 opacity-70"
                        }`}
                    >
                      <img
                        src={`http://127.0.0.1:3000${img.url}`}
                        alt={`Thumb ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ═══════ COLUMN 2: Product Info ═══════ */}
          <div className="lg:col-span-3 flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-xl md:text-2xl font-black text-black leading-tight mb-3">
                {listing.title}
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-1"
            >
              <span className="text-2xl font-black text-black">
                ${listing.price.toFixed(2)}
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1.5 text-xs text-zinc-500 mb-5"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Includes Buyer Protection</span>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mb-5"
            >
              <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
                {listing.description}
              </p>
            </motion.div>

            <Separator className="mb-5 bg-zinc-100" />

            {/* Seller Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3 mb-1.5"
            >
              <Avatar className="h-10 w-10 border border-zinc-200">
                {listing.seller?.avatarUrl && (
                  <AvatarImage
                    src={listing.seller.avatarUrl}
                    alt={sellerName}
                  />
                )}
                <AvatarFallback className="font-bold text-sm text-zinc-500 bg-zinc-100">
                  {sellerInitial}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm">
                  Listed by{" "}
                  <span className="font-bold text-black">{sellerName}</span>
                </p>
                <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-bold mt-0.5">
                  <CheckCircle2 className="h-3 w-3" />
                  UIC Verified
                </div>
              </div>
            </motion.div>

            <p className="text-xs text-zinc-400 mb-5">Posted {postedDate}</p>

            <Separator className="mb-5 bg-zinc-100" />

            <p className="text-xs text-zinc-500 mb-4">
              Meet the seller to seal the deal – you'll only be charged once you
              give them the verification to confirm the transaction.
            </p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="space-y-3"
            >
              {isOwner ? (
                <Link href={`/listings/${listing.id}/edit`}>
                  <Button
                    size="lg"
                    className="w-full bg-zinc-900 hover:bg-black text-white font-bold h-11 rounded-lg shadow-sm text-sm"
                  >
                    Edit Listing
                  </Button>
                </Link>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="w-full bg-[#b81d68] hover:bg-[#961754] text-white font-bold h-11 rounded-lg shadow-sm text-sm"
                  >
                    Reserve Your Order
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleWishlistToggle}
                      className={`font-bold h-11 rounded-lg border-zinc-200 text-sm transition-all ${isWishlisted
                          ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700"
                          : "hover:border-zinc-300"
                        }`}
                    >
                      <Heart
                        className={`mr-1.5 h-4 w-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""
                          }`}
                      />
                      Wishlist
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleTalkToSeller}
                      disabled={isStartingChat}
                      className="font-bold h-11 rounded-lg border-zinc-200 text-sm hover:border-zinc-300"
                    >
                      {isStartingChat ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <MessageSquare className="mr-1.5 h-4 w-4" />
                      )}
                      Talk To Seller
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </div>

          {/* ═══════ COLUMN 3: Campus Map (large) ═══════ */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-5 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-[#3252DF]" />
              <h3 className="text-base font-black text-black">
                Campus Meetup Location
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mb-3">
              Connect with the seller to decide on an exact building at UIC
              campus.
            </p>

            {/* Map container — fills remaining height, min 500px */}
            <div className="w-full flex-1 min-h-[500px] rounded-xl overflow-hidden border border-zinc-200 shadow-sm">
              <CampusMap onLocationSelect={handleMeetupRequest} />
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
