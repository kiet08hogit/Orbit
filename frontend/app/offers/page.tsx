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

export default function OffersPage() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState("my_offers");
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState({ my_offers: [], received_offers: [], meetups: [] });

  const filters = ["All", "Pending", "Accepted", "Declined", "Expired", "Cancelled"];

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await axios.get(`http://127.0.0.1:3000/transactions/offers`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOffers(res.data);
      } catch (error) {
        console.error("Failed to fetch offers", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, [getToken]);

  const renderEmptyState = (type: string) => {
    let title = "";
    let description = "";

    if (type === "my_offers") {
      title = "No offers sent yet.";
      description = "Ready to discover great finds on campus? Browse listings to get started!";
    } else if (type === "received_offers") {
      title = "No offers received yet.";
      description = "Your items are waiting to be discovered! Offers from other students will appear here.";
    } else if (type === "meetups") {
      title = "No active meetups.";
      description = "Once an offer is accepted and secured, your meetups will be tracked here.";
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

  const renderTransactions = (transactions: any[], type: string) => {
    const filtered = transactions.filter(t => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Pending" && (t.orderStatus === "PENDING_PAYMENT" || t.orderStatus === "PENDING_MEETUP")) return true;
      if (activeFilter === "Accepted" && (t.orderStatus === "PAID_PENDING_MEETUP" || t.orderStatus === "MEETING_STARTED")) return true;
      if (activeFilter === "Declined" && t.orderStatus === "DECLINED") return true;
      if (activeFilter === "Expired" && t.orderStatus === "EXPIRED") return true;
      if (activeFilter === "Cancelled" && t.orderStatus === "CANCELLED") return true;
      return false;
    });

    if (filtered.length === 0) return renderEmptyState(type);

    return (
      <div className="space-y-4">
        {filtered.map((tx) => (
          <div key={tx.id} className="p-4 border border-border rounded-xl flex items-start gap-4">
            <div className="w-20 h-20 bg-secondary rounded-lg overflow-hidden shrink-0">
              {tx.listing.images?.[0]?.url && (
                <img src={tx.listing.images[0].url} alt={tx.listing.title} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 flex flex-col justify-between h-full">
              <div className="flex justify-between">
                <h3 className="font-bold text-foreground">{tx.listing.title}</h3>
                <span className="font-bold text-foreground">${(tx.amount / 100).toFixed(2)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 mb-2">
                Status: <span className="font-semibold">{tx.orderStatus.replace(/_/g, ' ')}</span>
              </p>
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
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">Offers</h1>
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input 
                placeholder="Search Offers..." 
                className="pl-9 rounded-full bg-secondary/50 border-border focus-visible:ring-1"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="my_offers" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start border-b border-border rounded-none h-auto p-0 bg-transparent gap-8">
              <TabsTrigger 
                value="my_offers"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-bold"
              >
                My Offers ({offers.my_offers.length})
              </TabsTrigger>
              <TabsTrigger 
                value="received_offers"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-bold text-muted-foreground data-[state=active]:text-foreground"
              >
                Offers Received ({offers.received_offers.length})
              </TabsTrigger>
              <TabsTrigger 
                value="meetups"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 font-bold text-muted-foreground data-[state=active]:text-foreground"
              >
                Active Meetups ({offers.meetups.length})
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="flex items-center gap-3 py-6 overflow-x-auto scrollbar-hide">
              <span className="text-sm font-bold text-foreground whitespace-nowrap">Filter:</span>
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
                <TabsContent value="my_offers" className="mt-0 outline-none">
                  {renderTransactions(offers.my_offers, "my_offers")}
                </TabsContent>
                
                <TabsContent value="received_offers" className="mt-0 outline-none">
                  {renderTransactions(offers.received_offers, "received_offers")}
                </TabsContent>
                
                <TabsContent value="meetups" className="mt-0 outline-none">
                  {renderTransactions(offers.meetups, "meetups")}
                </TabsContent>
              </>
            )}
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
