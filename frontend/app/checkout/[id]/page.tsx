"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

function CheckoutForm({ clientSecret, listingId }: { clientSecret: string; listingId: string }) {
 const stripe = useStripe();
 const elements = useElements();
 const router = useRouter();
 const [isLoading, setIsLoading] = useState(false);
 const [errorMessage, setErrorMessage] = useState("");

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();

 if (!stripe || !elements) return;

 setIsLoading(true);
 setErrorMessage("");

 const { error } = await stripe.confirmPayment({
 elements,
 confirmParams: {
 return_url: `${window.location.origin}/chat`,
 },
 });

 if (error) {
 setErrorMessage(error.message || "An unexpected error occurred.");
 }
 setIsLoading(false);
 };

 return (
 <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-2xl border border-border shadow-sm">
 <PaymentElement options={{ layout: "tabs" }} />
 {errorMessage && (
 <div className="text-sm font-bold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
 {errorMessage}
 </div>
 )}
 <Button type="submit" disabled={!stripe || !elements || isLoading}
 className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-primary-foreground font-bold shadow-sm"
 >
 {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Authorize Payment"}
 </Button>
 <p className="text-xs text-center text-muted-foreground font-medium px-4">
 Your card will only be held, not charged. The funds are safely stored in Escrow until you confirm the meetup with the seller.
 </p>
 </form>
 );
}

export default function CheckoutPage() {
 const params = useParams();
 const router = useRouter();
 const { getToken, isLoaded, isSignedIn } = useAuth();
 const [clientSecret, setClientSecret] = useState("");
 const [listing, setListing] = useState<any>(null);
 const [isInitializing, setIsInitializing] = useState(true);

 useEffect(() => {
 if (!isLoaded) return;
 if (!isSignedIn) {
 router.push("/sign-in");
 return;
 }

 const initCheckout = async () => {
 try {
 const token = await getToken();
 // Fetch listing
 const listingRes = await axios.get(`http://127.0.0.1:3000/listings/${params.id}`, {
 headers: { Authorization: `Bearer ${token}` }
 });
 setListing(listingRes.data);

 // Create Payment Intent
 const intentRes = await axios.post(`http://127.0.0.1:3000/payments/intent`, { listingId: params.id },
 { headers: { Authorization: `Bearer ${token}` } }
 );
 setClientSecret(intentRes.data.clientSecret);
 } catch (err: any) {
 console.error("Checkout initialization failed:", err);
 alert(err.response?.data?.message || "Failed to initialize checkout.");
 router.back();
 } finally {
 setIsInitializing(false);
 }
 };

 initCheckout();
 }, [isLoaded, isSignedIn, params.id, getToken, router]);

 if (isInitializing) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-secondary">
 <Loader2 className="h-10 w-10 animate-spin text-[#3252DF]" />
 </div>
 );
 }

 if (!clientSecret || !listing) return null;

 return (
 <div className="min-h-[calc(100vh-4rem)] bg-secondary py-12 px-4 sm:px-6 font-sans">
 <div className="max-w-xl mx-auto">
 <button onClick={() => router.back()}
 className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground mb-8 transition-colors"
 >
 <ArrowLeft className="h-4 w-4" />
 Back to Listing
 </button>

 <div className="mb-8 flex items-center gap-4">
 <div className="h-16 w-16 bg-secondary rounded-2xl overflow-hidden shrink-0">
 {listing.images && listing.images.length > 0 ? (
 <img src={listing.images[0].url.startsWith('http') ? listing.images[0].url : `http://127.0.0.1:3000${listing.images[0].url}`} alt={listing.title} className="h-full w-full object-cover" />
 ) : null}
 </div>
 <div>
 <h1 className="text-2xl font-black text-foreground leading-tight mb-1">Checkout</h1>
 <p className="text-muted-foreground text-sm font-bold truncate max-w-[300px]">{listing.title}</p>
 </div>
 <div className="ml-auto text-right">
 <span className="text-2xl font-black text-emerald-600">${listing.price.toFixed(2)}</span>
 </div>
 </div>

 <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-8 flex gap-4 items-start">
 <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
 <div>
 <h3 className="font-bold text-emerald-900 text-sm mb-1">Protected by Orbit Escrow</h3>
 <p className="text-xs text-emerald-800 leading-relaxed">
 Your payment is held securely in escrow. We won't release the funds to the seller until you meet up and enter the 6-digit confirmation code.
 </p>
 </div>
 </div>

 <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
 <CheckoutForm clientSecret={clientSecret} listingId={params.id as string} />
 </Elements>
 </div>
 </div>
 );
}
