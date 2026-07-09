"use client";

import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";

export default function PurchaseHistoryPage() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState("buying");
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState({ buying: [], selling: [] });
  const [offers, setOffers] = useState({ sent: [], received: [] });
  const [activeActionOffer, setActiveActionOffer] = useState<string | null>(null);

  const filters = ["All", "Completed", "Cancelled", "Reserved"];

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const [historyRes, offersSentRes, offersReceivedRes] = await Promise.all([
          axios.get(`http://127.0.0.1:3000/transactions/history`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`http://127.0.0.1:3000/offers/me/sent`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`http://127.0.0.1:3000/offers/me/received`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setHistory(historyRes.data);
        setOffers({
          sent: offersSentRes.data,
          received: offersReceivedRes.data,
        });
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [getToken]);

  const renderEmptyState = (type: string) => {
    let title = "";
    let description = "";

    if (type === "buying") {
      title = "No purchase history yet.";
      description = "Your completed and cancelled purchases will appear here.";
    } else if (type === "selling") {
      title = "No sales history yet.";
      description = "Once you finalize a sale, it will be recorded here.";
    } else if (type === "offers-sent") {
      title = "No offers sent.";
      description = "When you make an offer on an item, it will appear here.";
    } else if (type === "offers-received") {
      title = "No offers received.";
      description = "When someone makes an offer on your listings, it will appear here.";
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground font-medium mb-1">{title}</p>
        <p className="text-muted-foreground text-sm mb-6">{description}</p>
        <Link href="/home">
          <Button className="rounded-full px-8 py-5 font-bold shadow-sm bg-[#FF5A00] hover:bg-[#E04D00] text-white">
            Browse Listings
          </Button>
        </Link>
      </div>
    );
  };

  const renderTransactions = (transactions: any[]) => {
    // Apply filters
    const filtered = transactions.filter((t) => {
      if (activeFilter === "All") return true;
      if (
        activeFilter === "Completed" &&
        (t.orderStatus === "COMPLETED" ||
          t.orderStatus === "COMPLETED_BY_SELLER" ||
          t.orderStatus === "MEETUP_CONFIRMED")
      )
        return true;
      if (
        activeFilter === "Cancelled" &&
        (t.orderStatus === "CANCELLED" ||
          t.orderStatus === "EXPIRED" ||
          t.orderStatus === "DECLINED")
      )
        return true;
      if (
        activeFilter === "Reserved" &&
        t.orderStatus === "PAID_PENDING_MEETUP"
      )
        return true;
      return false;
    });

    if (filtered.length === 0) return renderEmptyState(activeTab);

    return (
      <div className="space-y-4">
        {filtered.map((tx) => (
          <div
            key={tx.id}
            className="p-4 border border-border rounded-xl flex items-start gap-4"
          >
            <div className="w-20 h-20 bg-secondary rounded-lg overflow-hidden shrink-0">
              {tx.listing.images?.[0]?.url && (
                <img
                  src={tx.listing.images[0].url}
                  alt={tx.listing.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <h3 className="font-bold text-foreground">
                  {tx.listing.title}
                </h3>
                <span className="font-bold text-foreground">
                  ${(tx.amount / 100).toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Status:{" "}
                <span className="font-semibold">
                  {tx.orderStatus.replace(/_/g, " ")}
                </span>
              </p>
              <div className="inline-block px-3 py-1 bg-secondary rounded-full text-xs font-semibold text-muted-foreground">
                Payment:{" "}
                {tx.paymentMethod === "STRIPE"
                  ? "Orbit Secure Payment"
                  : "Direct / In-Person"}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleOfferAction = async (offerId: string, action: 'accept' | 'reject' | 'cancel') => {
    setActiveActionOffer(offerId);
    try {
      const token = await getToken();
      if (action === 'cancel') {
        await axios.delete(`http://127.0.0.1:3000/offers/${offerId}`, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.patch(`http://127.0.0.1:3000/offers/${offerId}/${action}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      }
      
      // Refresh offers
      const [offersSentRes, offersReceivedRes] = await Promise.all([
        axios.get(`http://127.0.0.1:3000/offers/me/sent`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`http://127.0.0.1:3000/offers/me/received`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setOffers({
        sent: offersSentRes.data,
        received: offersReceivedRes.data,
      });
    } catch (error) {
      console.error(`Failed to ${action} offer`, error);
    } finally {
      setActiveActionOffer(null);
    }
  };

  const renderOffers = (offersList: any[], type: 'sent' | 'received') => {
    if (offersList.length === 0) return renderEmptyState(`offers-${type}`);

    return (
      <div className="space-y-4">
        {offersList.map((offer) => (
          <div
            key={offer.id}
            className="p-4 border border-border rounded-xl flex flex-col md:flex-row items-start gap-4"
          >
            <div className="flex gap-4 w-full md:w-auto">
              <Link href={`/listings/${offer.listingId}`} className="w-20 h-20 bg-secondary rounded-lg overflow-hidden shrink-0 block hover:opacity-80 transition-opacity">
                {offer.listing.images?.[0]?.url && (
                  <img
                    src={offer.listing.images[0].url}
                    alt={offer.listing.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </Link>
              <div className="flex-1 md:hidden">
                <Link href={`/listings/${offer.listingId}`} className="hover:underline">
                  <h3 className="font-bold text-foreground line-clamp-1">{offer.listing.title}</h3>
                </Link>
                <span className="font-bold text-foreground text-lg">${offer.price}</span>
              </div>
            </div>

            <div className="flex-1 w-full flex flex-col md:flex-row justify-between gap-4">
              <div>
                <Link href={`/listings/${offer.listingId}`} className="hidden md:block hover:underline">
                  <h3 className="font-bold text-foreground">{offer.listing.title}</h3>
                </Link>
                <div className="flex items-center gap-2 mt-1 mb-2">
                  <span className="font-bold text-foreground md:text-lg hidden md:block">
                    Offer: ${offer.price}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    offer.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    offer.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {offer.status}
                  </span>
                </div>
                {type === 'received' && (
                  <p className="text-sm text-muted-foreground">
                    From: <Link href={`/profile/${offer.buyer.id}`} className="font-medium hover:underline">{offer.buyer.name || offer.buyer.username}</Link>
                  </p>
                )}
              </div>

              {offer.status === 'PENDING' && (
                <div className="flex gap-2 self-start mt-2 md:mt-0 w-full md:w-auto">
                  {type === 'received' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleOfferAction(offer.id, 'reject')}
                        disabled={activeActionOffer === offer.id}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleOfferAction(offer.id, 'accept')}
                        disabled={activeActionOffer === offer.id}
                      >
                        {activeActionOffer === offer.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full md:w-auto text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleOfferAction(offer.id, 'cancel')}
                      disabled={activeActionOffer === offer.id}
                    >
                      Cancel Offer
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F7F4] dark:bg-background pt-10 px-4 pb-20">
      <div className="max-w-[800px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-[20px] shadow-sm border border-border p-6 md:p-8"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                Transactions & Offers
              </h1>
              <p className="text-sm text-muted-foreground font-medium mt-1">
                Review your completed orders, active reservations, and offers.
              </p>
            </div>
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                placeholder="Search History..."
                className="pl-9 rounded-full bg-secondary/50 border-border focus-visible:ring-1"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            defaultValue="buying"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList className="w-full justify-start border-b border-border rounded-none h-auto p-0 bg-transparent gap-6 overflow-x-auto scrollbar-hide">
              <TabsTrigger
                value="buying"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-bold whitespace-nowrap"
              >
                Buying History
              </TabsTrigger>
              <TabsTrigger
                value="selling"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-bold text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap"
              >
                Selling History
              </TabsTrigger>
              <TabsTrigger
                value="offers-sent"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-bold text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap"
              >
                Offers Sent
              </TabsTrigger>
              <TabsTrigger
                value="offers-received"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-bold text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap"
              >
                Offers Received
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="flex items-center gap-3 py-6 overflow-x-auto scrollbar-hide">
              <span className="text-sm font-bold text-foreground whitespace-nowrap">
                Filter:
              </span>
              <div className="flex gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                      activeFilter === filter
                        ? "bg-foreground text-background"
                        : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <TabsContent value="buying" className="mt-0 outline-none">
                  {renderTransactions(history.buying)}
                </TabsContent>

                <TabsContent value="selling" className="mt-0 outline-none">
                  {renderTransactions(history.selling)}
                </TabsContent>

                <TabsContent value="offers-sent" className="mt-0 outline-none">
                  {renderOffers(offers.sent, 'sent')}
                </TabsContent>

                <TabsContent value="offers-received" className="mt-0 outline-none">
                  {renderOffers(offers.received, 'received')}
                </TabsContent>
              </>
            )}
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
