"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Heart, MessageSquare, Tag, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import CampusMap from "@/components/CampusMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Seller {
  id: string;
  name?: string;
  username?: string;
  email?: string;
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

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      router.push("/");
      return;
    }

    const fetchListing = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`http://localhost:3000/listings/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error("Listing not found");
        }

        const data = await res.json();
        setListing(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch listing");
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [params.id, isLoaded, isSignedIn, getToken, router]);

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
            <Link href="/listings" className="inline-flex items-center gap-2 text-[#3252DF] font-bold hover:text-black transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format date
  const postedDate = new Date(listing.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 font-sans pb-20">
      
      {/* Top Nav Breadcrumb */}
      <div className="bg-white border-b border-zinc-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
          <Link href="/listings" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-black transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to All Products
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column: Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-white border border-zinc-200 rounded-3xl overflow-hidden relative shadow-sm">
              {listing.images && listing.images.length > 0 ? (
                <img 
                  src={`http://localhost:3000${listing.images[activeImageIndex].url}`} 
                  alt={listing.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 bg-zinc-50">
                  <Tag className="h-20 w-20 mb-4" />
                  <span className="font-bold">No Image Provided</span>
                </div>
              )}
              
              {/* Category Badge overlay */}
              <div className="absolute top-6 left-6">
                <Badge variant="outline" className="bg-white/90 backdrop-blur-md px-4 py-1.5 text-xs font-bold tracking-widest uppercase shadow-sm border-zinc-100">
                  {listing.category}
                </Badge>
              </div>
            </div>

            {/* Thumbnail Navigation */}
            {listing.images && listing.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {listing.images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImageIndex === idx ? 'border-[#3252DF] shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={`http://localhost:3000${img.url}`} 
                      alt="Thumbnail" 
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details & Actions */}
          <div className="flex flex-col">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Badge 
                  variant="outline" 
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                    listing.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 
                    listing.status === 'SOLD' ? 'bg-zinc-200 text-zinc-800 border-zinc-300' : 'bg-red-100 text-red-800 border-red-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${listing.status === 'ACTIVE' ? 'bg-emerald-600 animate-pulse' : 'bg-current'}`} />
                  {listing.status}
                </Badge>
                <span className="text-zinc-400 text-xs font-medium">
                  Posted {postedDate}
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black text-black mb-4 leading-tight">
                {listing.title}
              </h1>
              
              <div className="text-4xl font-black text-[#3252DF]">
                ${listing.price.toFixed(2)}
              </div>
            </div>

            {/* Seller Info Card */}
            <Card className="mb-8 rounded-2xl shadow-sm border-zinc-200">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 bg-zinc-100">
                    <AvatarFallback className="font-bold text-xl text-zinc-400">
                      {listing.seller?.email ? listing.seller.email[0].toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-zinc-900">{listing.seller?.email || 'UIC Student'}</h3>
                    <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold mt-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verified Student
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Button size="lg" className="flex-1 bg-[#3252DF] hover:bg-[#2842B3] text-white font-bold h-14 rounded-xl shadow-md">
                <MessageSquare className="mr-2 h-5 w-5" />
                Message Seller
              </Button>
              <Button size="lg" variant="outline" className="flex-1 font-bold h-14 rounded-xl border-2 border-zinc-200">
                Make Offer
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-16 h-14 rounded-xl border-2 border-zinc-200 hover:border-red-200 hover:bg-red-50 text-zinc-400 hover:text-red-500 p-0">
                <Heart className="h-6 w-6" />
              </Button>
            </div>

            {/* Description & Details */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
              
              <section>
                <h3 className="text-lg font-black text-black mb-3">Description</h3>
                <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">
                  {listing.description}
                </p>
              </section>

              <Separator className="bg-zinc-100" />

              <section>
                <h3 className="text-lg font-black text-black mb-4">Item Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-50 p-4 rounded-2xl">
                    <span className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Condition</span>
                    <span className="font-bold text-black text-sm">Lightly Used</span>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-2xl">
                    <span className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Availability</span>
                    <span className="font-bold text-black text-sm">For Sale</span>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>

        {/* Meetup Location / Campus Map */}
        <div className="mt-12 lg:mt-20">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-black flex items-center gap-2">
              <MapPin className="h-6 w-6 text-[#3252DF]" />
              Campus Meetup Location
            </h2>
            <p className="text-zinc-500 font-medium mt-1">
              Connect with the seller to decide on an exact building at UIC campus.
            </p>
          </div>
          
          <div className="w-full h-[600px]">
            <CampusMap />
          </div>
        </div>

      </main>
    </div>
  );
}
