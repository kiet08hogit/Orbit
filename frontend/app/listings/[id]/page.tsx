"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import axios from "axios";
import { Loader2, ArrowLeft, Heart, MessageSquare, Tag, MapPin, CheckCircle2, Shield, ChevronRight, DollarSign } from "lucide-react";
import Link from "next/link";
import CampusMap from "@/components/CampusMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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
 acceptsDirectPayment: boolean;
 acceptsProtectedPayment: boolean;
 location?: string;
 brand?: string;
 colors?: string;
 size?: string;
 material?: string;
 weatherFound?: string;
}

const getImageUrl = (url?: string) => {
 if (!url) return "";
 if (url.startsWith("http")) return url;
 return `http://127.0.0.1:3000${url}`;
};

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

 const [showReportDialog, setShowReportDialog] = useState(false);
 const [reportReason, setReportReason] = useState("");
 const [isSubmittingReport, setIsSubmittingReport] = useState(false);
 const [reportSubmitted, setReportSubmitted] = useState(false);

 const [showPaymentModal, setShowPaymentModal] = useState(false);
 const [isReserving, setIsReserving] = useState(false);

 useEffect(() => {
 if (!isLoaded) return;

 if (!isSignedIn) {
 router.push("/");
 return;
 }

 const fetchListingAndView = async () => {
 try {
 const token = await getToken();
 const res = await axios.get(`http://127.0.0.1:3000/listings/${params.id}`, {
 headers: { Authorization: `Bearer ${token}` },
 });

 const data = res.data;
 setListing(data);

 // Record View
 axios.post(`http://127.0.0.1:3000/listings/${params.id}/view`, {}, {
 headers: { Authorization: `Bearer ${token}` },
 }).catch(e => console.error("Failed to record view", e));

 // Check if wishlisted
 const wishlistRes = await axios.get(`http://127.0.0.1:3000/listings/wishlist`, {
 headers: { Authorization: `Bearer ${token}` },
 });
 const isLiked = wishlistRes.data.some((item: any) => item.id === params.id);
 setIsWishlisted(isLiked);

 } catch (err: any) {
 setError(err.message || "Failed to fetch listing");
 } finally {
 setIsLoading(false);
 }
 };

 fetchListingAndView();
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

 const handleDirectReservation = async () => {
 if (!isSignedIn) return router.push("/sign-in");
 setIsReserving(true);
 try {
 const token = await getToken();
 await axios.post(`http://127.0.0.1:3000/transactions/direct-reservation`, { listingId: listing?.id }, {
 headers: { Authorization: `Bearer ${token}` }
 });
 // Start conversation
 const res = await axios.post(`http://127.0.0.1:3000/chat/conversation/${listing?.seller.clerkUserId}`, {}, {
 headers: { Authorization: `Bearer ${token}` }
 });
 if (res.data) {
 router.push(`/chat?id=${res.data.id}`);
 }
 } catch (err) {
 console.error(err);
 alert("Failed to reserve listing.");
 } finally {
 setIsReserving(false);
 setShowPaymentModal(false);
 }
 };

 const handleProtectedReservation = () => {
 if (!isSignedIn) return router.push("/sign-in");
 router.push(`/checkout/${listing?.id}`);
 };

 const handleWishlistToggle = async () => {
 if (!listing) return;
 const newValue = !isWishlisted;
 setIsWishlisted(newValue);

 try {
 const token = await getToken();
 await axios.post(`http://127.0.0.1:3000/listings/${listing.id}/swipe`, { type: newValue ? "LIKE" : "SKIP" }, { headers: { Authorization: `Bearer ${token}` } }
 );
 } catch (err) {
 console.error("Failed to update wishlist:", err);
 setIsWishlisted(!newValue);
 }
 };

 const handleReportListing = async () => {
 if (!reportReason.trim()) return;
 setIsSubmittingReport(true);
 try {
 const token = await getToken();
 await axios.post(
 "http://127.0.0.1:3000/reports",
 {
 listingId: listing?.id,
 reason: reportReason,
 },
 { headers: { Authorization: `Bearer ${token}` } }
 );
 setReportSubmitted(true);
 setTimeout(() => setShowReportDialog(false), 2000);
 } catch (err) {
 console.error("Failed to submit report", err);
 alert("Failed to submit report. Please try again.");
 } finally {
 setIsSubmittingReport(false);
 }
 };

 if (!isLoaded || isLoading) {
 return (
 <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-card">
 <Loader2 className="h-10 w-10 animate-spin text-[#3252DF]" />
 </div>
 );
 }

 if (error || !listing) {
 return (
 <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-secondary p-4">
 <Card className="max-w-md w-full p-8 text-center rounded-2xl border-border">
 <CardContent className="p-0">
 <h2 className="text-xl font-bold text-foreground mb-2">Oops!</h2>
 <p className="text-muted-foreground mb-6">{error || "Listing not found"}</p>
 <Link
 href="/listings"
 className="inline-flex items-center gap-2 text-[#3252DF] font-bold hover:text-foreground transition-colors"
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
 <div className="min-h-[calc(100vh-4rem)] bg-card font-sans">
 {/* Breadcrumb */}
 <div className="border-b border-border">
 <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12 py-3">
 <nav className="flex items-center gap-2 text-sm">
 <Link
 href="/home"
 className="text-muted-foreground hover:text-foreground transition-colors font-medium"
 >
 Home
 </Link>
 <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
 <Link
 href={`/listings?category=${listing.category}`}
 className="text-muted-foreground hover:text-foreground transition-colors font-medium"
 >
 {categoryLabel}
 </Link>
 <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
 <span className="text-foreground font-semibold truncate max-w-[300px]">
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
 className={`w-[100px] h-[100px] rounded-md overflow-hidden border-2 transition-all duration-200 bg-secondary ${activeImageIndex === idx
 ? "border-[#6C5CE7] ring-2 ring-[#6C5CE7]/30 opacity-100"
 : "border-border opacity-70 hover:opacity-100 hover:border-zinc-500"
 }`}
 >
 <img
 src={getImageUrl(img.url)}
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
 className="aspect-square bg-secondary border border-border rounded-2xl overflow-hidden relative"
 >
 {listing.images && listing.images.length > 0 ? (
 <motion.img
 key={activeImageIndex}
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ duration: 0.3 }}
 src={getImageUrl(listing.images[activeImageIndex].url)}
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
 className={`shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all bg-secondary ${activeImageIndex === idx
 ? "border-[#6C5CE7] opacity-100"
 : "border-border opacity-70"
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
 <h1 className="text-xl md:text-2xl font-black text-foreground leading-tight mb-3">
 {listing.title}
 </h1>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.15 }}
 className="mb-1"
 >
 <span className="text-2xl font-black text-foreground">
 ${listing.price.toFixed(2)}
 </span>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5"
 >
 <Shield className="h-3.5 w-3.5" />
 <span>Includes Buyer Protection</span>
 </motion.div>

 {/* Extended Details */}
 {(listing.brand || listing.size || listing.material || listing.colors || listing.location) && (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.22 }}
 className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2 mb-5 p-4 bg-secondary rounded-2xl border border-border"
 >
 {listing.brand && (
 <div>
 <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Brand</p>
 <p className="text-sm font-semibold text-foreground">{listing.brand}</p>
 </div>
 )}
 {listing.size && (
 <div>
 <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Size</p>
 <p className="text-sm font-semibold text-foreground">{listing.size}</p>
 </div>
 )}
 {listing.material && (
 <div>
 <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Material</p>
 <p className="text-sm font-semibold text-foreground">{listing.material}</p>
 </div>
 )}
 {listing.colors && (
 <div>
 <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Color</p>
 <p className="text-sm font-semibold text-foreground">{listing.colors}</p>
 </div>
 )}
 {listing.location && (
 <div>
 <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Location</p>
 <p className="text-sm font-semibold text-foreground">{listing.location}</p>
 </div>
 )}
 {listing.weatherFound && (
 <div>
 <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Weather Found</p>
 <p className="text-sm font-semibold text-foreground">{listing.weatherFound}</p>
 </div>
 )}
 </motion.div>
 )}

 {/* Description */}
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.25 }}
 className="mb-5"
 >
 <h3 className="text-base font-bold text-foreground mb-2">Description</h3>
 <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
 {listing.description}
 </p>
 </motion.div>

 <Separator className="mb-5 bg-secondary" />

 {/* Seller Info */}
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 }}
 className="flex items-center gap-3 mb-1.5"
 >
 <Avatar className="h-10 w-10 border border-border">
 {listing.seller?.avatarUrl && (
 <AvatarImage
 src={listing.seller.avatarUrl}
 alt={sellerName}
 />
 )}
 <AvatarFallback className="font-bold text-sm text-muted-foreground bg-secondary">
 {sellerInitial}
 </AvatarFallback>
 </Avatar>
 <div>
 <p className="text-sm">
 Listed by{" "}
 <span className="font-bold text-foreground">{sellerName}</span>
 </p>
 <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-bold mt-0.5">
 <CheckCircle2 className="h-3 w-3" />
 UIC Verified
 </div>
 </div>
 </motion.div>

 <p className="text-xs text-muted-foreground mb-5">Posted {postedDate}</p>

 <Separator className="mb-5 bg-secondary" />

 <p className="text-xs text-muted-foreground mb-4">
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
 className="w-full bg-secondary hover:bg-foreground text-foreground hover:text-background font-bold h-11 rounded-lg shadow-sm text-sm"
 >
 Edit Listing
 </Button>
 </Link>
 ) : (
 <>
 <Button
 size="lg"
 onClick={() => {
 if (!isSignedIn) { router.push("/sign-in"); return; }
 setShowPaymentModal(true);
 }}
 disabled={isReserving}
 className="w-full bg-orange-500 hover:bg-orange-600 text-primary-foreground font-bold h-11 rounded-lg shadow-sm text-sm"
 >
 {isReserving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
 {isReserving ? "Reserving..." : "Reserve Your Order"}
 </Button>

 <div className="grid grid-cols-2 gap-3">
 <Button
 size="lg"
 variant="outline"
 onClick={handleWishlistToggle}
 className={`font-bold h-11 rounded-lg border-border text-sm transition-all ${isWishlisted
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
 className="font-bold h-11 rounded-lg border-border text-sm hover:border-zinc-300"
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
 <h3 className="text-base font-black text-foreground">
 Campus Meetup Location
 </h3>
 </div>
 <p className="text-xs text-muted-foreground mb-3">
 Connect with the seller to decide on an exact building at UIC
 campus.
 </p>

 {/* Map container — fills remaining height, min 500px */}
 <div className="w-full flex-1 min-h-[500px] rounded-2xl overflow-hidden border border-border shadow-sm">
 <CampusMap onLocationSelect={handleMeetupRequest} />
 </div>

 {/* Report Button */}
 <div className="mt-8 pt-6 border-t border-border flex justify-center">
 <button onClick={() => setShowReportDialog(true)}
 className="text-xs font-semibold text-muted-foreground hover:text-red-500 transition-colors underline underline-offset-4"
 >
 Report this listing
 </button>
 </div>
 </motion.div>
 </div>
 </main>

 {/* Report Dialog */}
 <Dialog open={showReportDialog} onOpenChange={(open) => {
 setShowReportDialog(open);
 if (!open) {
 setReportReason("");
 setReportSubmitted(false);
 }
 }}>
 <DialogContent className="sm:max-w-md rounded-2xl p-6 shadow-2xl border-0 overflow-hidden bg-card">
 <DialogHeader>
 <DialogTitle className="text-xl font-black text-center mb-1">Report Listing</DialogTitle>
 <DialogDescription className="text-sm text-center text-muted-foreground mb-6">
 Why are you reporting this listing?
 </DialogDescription>
 </DialogHeader>

 {reportSubmitted ? (
 <div className="py-8 flex flex-col items-center justify-center text-emerald-600">
 <CheckCircle2 className="h-12 w-12 mb-3" />
 <p className="font-bold">Report Submitted</p>
 <p className="text-sm text-emerald-600/80 mt-1 text-center">Thank you for keeping our community safe.</p>
 </div>
 ) : (
 <div className="flex flex-col gap-4">
 <Textarea placeholder="Please describe the issue..." rows={4} value={reportReason}
 onChange={(e) => setReportReason(e.target.value)}
 className="bg-secondary border-border resize-none rounded-2xl"
 />
 <div className="flex items-center gap-3 mt-2">
 <Button variant="ghost" onClick={() => setShowReportDialog(false)} className="flex-1 rounded-full font-bold h-11">
 Cancel
 </Button>
 <Button onClick={handleReportListing} disabled={isSubmittingReport || !reportReason.trim()} className="flex-1 rounded-full font-bold h-11 bg-red-600 hover:bg-red-700 text-primary-foreground border-0 shadow-sm">
 {isSubmittingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Report"}
 </Button>
 </div>
 </div>
 )}
 </DialogContent>
 </Dialog>

 {/* Payment Method Modal */}
 <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
 <DialogContent className="sm:max-w-md rounded-2xl p-6 shadow-2xl border-0 overflow-hidden bg-card">
 <DialogHeader>
 <DialogTitle className="text-xl font-black">Choose Payment Method</DialogTitle>
 <DialogDescription className="text-muted-foreground">
 How would you like to pay for {listing.title}?
 </DialogDescription>
 </DialogHeader>

 <div className="flex flex-col gap-4 mt-4">
 {listing.acceptsProtectedPayment && (
 <div className="border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-4 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
 onClick={handleProtectedReservation}
 >
 <div className="flex items-center gap-3 mb-1">
 <Shield className="h-5 w-5 text-emerald-600" />
 <span className="font-bold text-foreground">Protected Payment</span>
 </div>
 <p className="text-sm text-muted-foreground ml-8">Pay securely with card. Funds are held until you confirm the meetup.</p>
 </div>
 )}

 {listing.acceptsDirectPayment && (
 <div className="border-2 border-border hover:border-[#3252DF] hover:bg-[#3252DF]/5 rounded-2xl p-4 cursor-pointer transition-colors"
 onClick={handleDirectReservation}
 >
 <div className="flex items-center gap-3 mb-1">
 <DollarSign className="h-5 w-5 text-muted-foreground" />
 <span className="font-bold text-foreground">Direct Payment</span>
 </div>
 <p className="text-sm text-muted-foreground ml-8">Pay with Cash, Zelle, or Venmo when you meet the seller.</p>
 </div>
 )}
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
