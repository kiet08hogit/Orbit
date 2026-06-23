"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { X, Heart, Sparkles, AlertCircle, ShoppingBag, MapPin, Loader2 } from "lucide-react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuroraText } from "@/components/ui/aurora-text";
import { Backlight } from "@/components/ui/backlight";

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
 seller: Seller;
 images?: { url: string }[];
}

const getImageUrl = (url?: string) => {
 if (!url) return "";
 if (url.startsWith("http")) return url;
 return `http://127.0.0.1:3000${url}`;
};

export default function SwipePage() {
 const { getToken, isLoaded, isSignedIn } = useAuth();
 const [listings, setListings] = useState<Listing[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [userProfile, setUserProfile] = useState<any>(null);

 useEffect(() => {
 if (!isLoaded || !isSignedIn) return;
 const fetchFeed = async () => {
 try {
 const token = await getToken();

 // Fetch user profile to get university
 try {
 const userRes = await axios.get("http://127.0.0.1:3000/users/me", { headers: { Authorization: `Bearer ${token}` } });
 setUserProfile(userRes.data);
 } catch (e) {}

 const res = await axios.get("http://127.0.0.1:3000/listings", {
 headers: { Authorization: `Bearer ${token}` }
 });
 setListings(res.data);
 } catch (err) {
 console.error("Failed to fetch swipe feed:", err);
 } finally {
 setIsLoading(false);
 }
 };
 fetchFeed();
 }, [isLoaded, isSignedIn, getToken]);

 const activeListing = listings[0];
 const nextListing = listings[1];

 // Motion values for the drag effect
 const x = useMotionValue(0);
 const rotate = useTransform(x, [-200, 200], [-15, 15]);
 const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
 // Opacity for the "LIKE" and "NOPE" stamps based on drag offset
 const likeOpacity = useTransform(x, [20, 100], [0, 1]);
 const nopeOpacity = useTransform(x, [-20, -100], [0, 1]);

 const handleSwipe = async (direction: "left" | "right") => {
 if (!activeListing) return;
 const listingId = activeListing.id;
 const interactionType = direction === "right" ? "LIKE" : "SKIP";

 // Optimistically remove the top card
 setListings((prev) => prev.slice(1));
 try {
 const token = await getToken();
 await axios.post(`http://127.0.0.1:3000/listings/${listingId}/swipe`, { type: interactionType }, { headers: { Authorization: `Bearer ${token}` } }
 );
 } catch (err) {
 console.error(`Failed to record ${interactionType} swipe:`, err);
 }
 };

 const handleDragEnd = (event: any, info: PanInfo) => {
 const offset = info.offset.x;
 const velocity = info.velocity.x;

 if (offset > 100 || velocity > 500) {
 handleSwipe("right");
 } else if (offset < -100 || velocity < -500) {
 handleSwipe("left");
 }
 };

 if (!isLoaded || isLoading) {
 return (
 <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-card">
 <Loader2 className="h-10 w-10 animate-spin text-[#3252DF]" />
 </div>
 );
 }

 return (
 <div className="min-h-[calc(100vh-4rem)] bg-background dark:bg-card flex flex-col font-sans overflow-hidden">
 
 <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col md:flex-row gap-8">
 
 {/* Sidebar Filters */}
 <aside className="w-full md:w-64 shrink-0 hidden md:block space-y-8 mt-[70px]">
 <div>
 <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Distance</h3>
 <div className="space-y-3">
 <label className="flex items-center gap-3 cursor-pointer group">
 <div className="w-5 h-5 rounded border border-border group-hover:border-foreground flex items-center justify-center bg-foreground text-background">✓</div>
 <span className="text-sm font-medium text-foreground">All</span>
 </label>
 <label className="flex items-center gap-3 cursor-pointer group">
 <div className="w-5 h-5 rounded border border-border group-hover:border-foreground"></div>
 <span className="text-sm font-medium text-muted-foreground">@ {userProfile?.university || 'your university'}</span>
 </label>
 </div>
 </div>

 <div>
 <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Prices</h3>
 <div className="space-y-3">
 {['All', '$0 to $50', '$50 to $100', '$100 to $300', '$300+'].map((price, idx) => (
 <label key={price} className="flex items-center gap-3 cursor-pointer group">
 <div className={`w-5 h-5 rounded border border-border group-hover:border-foreground ${idx === 0 ? 'bg-foreground text-background flex items-center justify-center' : ''}`}>
 {idx === 0 && '✓'}
 </div>
 <span className={`text-sm font-medium ${idx === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{price}</span>
 </label>
 ))}
 </div>
 </div>

 <div>
 <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Condition</h3>
 <div className="space-y-3">
 {['Any', 'New', 'Like New', 'Good', 'Fair'].map((cond, idx) => (
 <label key={cond} className="flex items-center gap-3 cursor-pointer group">
 <div className={`w-5 h-5 rounded border border-border group-hover:border-foreground ${idx === 0 ? 'bg-foreground text-background flex items-center justify-center' : ''}`}>
 {idx === 0 && '✓'}
 </div>
 <span className={`text-sm font-medium ${idx === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{cond}</span>
 </label>
 ))}
 </div>
 </div>

 <div>
 <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Buying Options</h3>
 <div className="space-y-3">
 {['Any', 'Meetup on campus', 'Self pickup'].map((opt, idx) => (
 <label key={opt} className="flex items-center gap-3 cursor-pointer group">
 <div className={`w-5 h-5 rounded border border-border group-hover:border-foreground ${idx === 0 ? 'bg-foreground text-background flex items-center justify-center' : ''}`}>
 {idx === 0 && '✓'}
 </div>
 <span className={`text-sm font-medium ${idx === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{opt}</span>
 </label>
 ))}
 </div>
 </div>
 </aside>

 {/* Swipe Deck Container */}
 <div className="flex-1 flex flex-col items-center justify-center min-h-[700px] relative">
 {/* Title / Header */}
 <div className="absolute top-0 text-center z-20">
 <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center justify-center gap-2">
 <AuroraText colors={["#3252DF", "#6366F1", "#A855F7", "#3b82f6"]}>Match Your Needs</AuroraText>
 </h1>
 <p className="text-sm font-medium text-muted-foreground mt-1">Swipe right to save to your wishlist</p>
 </div>

 <div className="relative h-[600px] w-full max-w-[400px] mt-16 flex items-center justify-center">
 <AnimatePresence>
 {activeListing ? (
 <>
 {/* NEXT CARD (Background) */}
 {nextListing && (
 <motion.div
 key={nextListing.id}
 className="absolute inset-0 z-0 flex flex-col overflow-hidden rounded-[24px] bg-card shadow-sm border border-border"
 initial={{ scale: 0.9, y: 20, opacity: 0.8 }}
 animate={{ scale: 0.95, y: 10, opacity: 1 }}
 transition={{ duration: 0.3 }}
 >
 <div className="relative flex-1 bg-secondary">
 <img src={nextListing.images && nextListing.images.length > 0 ? getImageUrl(nextListing.images[0].url) : "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&q=80"} alt={nextListing.title} className="absolute inset-0 h-full w-full object-cover"
 />
 </div>
 <div className="p-6 bg-card flex flex-col justify-end h-[40%]">
 <div className="flex justify-between items-start mb-2">
 <h2 className="text-2xl font-black text-foreground truncate pr-2">{nextListing.title}</h2>
 <span className="text-2xl font-black text-[#3252DF]">${nextListing.price}</span>
 </div>
 </div>
 </motion.div>
 )}

 {/* ACTIVE CARD (Foreground) */}
 <motion.div
 key={activeListing.id}
 className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
 style={{ x, rotate, opacity }}
 drag="x"
 dragConstraints={{ left: 0, right: 0 }}
 onDragEnd={handleDragEnd}
 whileDrag={{ scale: 1.02 }}
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ x: x.get() > 0 ? 300 : -300, opacity: 0, transition: { duration: 0.3 } }}
 >
 <Backlight blur={40} className="w-full h-full">
 <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[24px] bg-card shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border">
 {/* LIKE STAMP */}
 <motion.div style={{ opacity: likeOpacity }}
 className="absolute top-12 left-8 z-30 pointer-events-none"
 >
 <div className="border-4 border-emerald-500 text-emerald-500 font-black text-4xl py-1 px-4 rounded-2xl -rotate-12 uppercase tracking-widest bg-card/10 backdrop-blur-sm">
 LIKE
 </div>
 </motion.div>

 {/* NOPE STAMP */}
 <motion.div style={{ opacity: nopeOpacity }}
 className="absolute top-12 right-8 z-30 pointer-events-none"
 >
 <div className="border-4 border-rose-500 text-rose-500 font-black text-4xl py-1 px-4 rounded-2xl rotate-12 uppercase tracking-widest bg-card/10 backdrop-blur-sm">
 NOPE
 </div>
 </motion.div>

 {/* Card Image */}
 <div className="relative flex-1 bg-secondary overflow-hidden">
 {activeListing.images && activeListing.images.length > 0 ? (
 <img src={getImageUrl(activeListing.images[0].url)} alt={activeListing.title}
 className="absolute inset-0 h-full w-full object-cover pointer-events-none"
 />
 ) : (
 <div className="absolute inset-0 flex items-center justify-center bg-secondary">
 <ShoppingBag className="h-24 w-24 text-zinc-300" />
 </div>
 )}
 {/* Category Badge overlaying the image */}
 <div className="absolute top-4 left-4 z-20">
 <Badge variant="outline" className="bg-card/90 backdrop-blur-md text-foreground border-transparent font-bold px-3 py-1 text-xs shadow-sm uppercase tracking-wider">
 {activeListing.category}
 </Badge>
 </div>
 {/* Bottom gradient so text is readable if image is bright */}
 <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />
 </div>
 {/* Card Details */}
 <div className="p-6 bg-card relative z-20 border-t border-border">
 <div className="flex justify-between items-start mb-3 gap-2">
 <h2 className="text-2xl font-black text-foreground leading-tight">{activeListing.title}</h2>
 <span className="text-2xl font-black text-[#3252DF] shrink-0">${activeListing.price}</span>
 </div>
 <p className="text-sm font-medium text-muted-foreground line-clamp-3 mb-5 leading-relaxed">
 {activeListing.description}
 </p>
 <div className="flex items-center gap-3 pt-4 border-t border-border">
 <Avatar className="h-10 w-10 border border-border shadow-sm">
 <AvatarImage src={activeListing.seller?.avatarUrl} />
 <AvatarFallback className="bg-secondary font-bold text-muted-foreground">
 {activeListing.seller?.name?.[0]?.toUpperCase() || "U"}
 </AvatarFallback>
 </Avatar>
 <div className="flex flex-col">
 <span className="text-sm font-bold text-foreground">{activeListing.seller?.name || "Anonymous Seller"}</span>
 <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 uppercase tracking-wider">
 <MapPin className="h-3 w-3" /> UIC Verified
 </span>
 </div>
 </div>
 </div>
 </div>
 </Backlight>
 </motion.div>
 </>
 ) : (
 <motion.div initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 className="flex h-full w-full flex-col items-center justify-center rounded-[24px] border border-border bg-card shadow-sm p-8 text-center"
 >
 <div className="rounded-full bg-secondary p-6 mb-5">
 <AlertCircle className="h-12 w-12 text-muted-foreground" />
 </div>
 <h3 className="text-2xl font-black text-foreground tracking-tight mb-2">You're all caught up!</h3>
 <p className="text-muted-foreground font-medium">Check back later for more listings from the UIC community.</p>
 <Button variant="outline" className="mt-6 font-bold rounded-full border-border"
 onClick={() => window.location.reload()}
 >
 Refresh Feed
 </Button>
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 {/* Action Buttons */}
 <div className="mt-8 flex items-center justify-center gap-6 z-20">
 <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
 <Button
 variant="outline"
 size="icon"
 onClick={() => handleSwipe("left")}
 disabled={!activeListing}
 className="h-16 w-16 rounded-full border-2 border-rose-200 text-rose-500 bg-card hover:bg-rose-50 hover:text-rose-600 shadow-xl shadow-rose-500/10 transition-colors"
 >
 <X className="h-7 w-7 stroke-[3]" />
 </Button>
 </motion.div>
 <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
 <Button
 variant="outline"
 size="icon"
 onClick={() => handleSwipe("right")}
 disabled={!activeListing}
 className="h-16 w-16 rounded-full border-2 border-emerald-200 text-emerald-500 bg-card hover:bg-emerald-50 hover:text-emerald-600 shadow-xl shadow-emerald-500/10 transition-colors"
 >
 <Heart className="h-7 w-7 stroke-[3] fill-emerald-500/20" />
 </Button>
 </motion.div>
 </div>

 </div>
 </main>
 </div>
 );
}
