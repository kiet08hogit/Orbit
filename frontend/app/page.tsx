'use client';

import { SignUpButton, Show } from "@clerk/nextjs";
import Link from "next/link";
import { Bangers } from "next/font/google";
import { MousePointer2, Users, ShoppingBag, Banknote } from "lucide-react";

const bangers = Bangers({ weight: "400", subsets: ["latin"] });

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F9F6EE] p-4 md:p-8 font-sans flex flex-col">

      {/* Hero Image acting as Browser Window */}
      <div
        className="relative w-full max-w-[200vw] h-[70vh] md:h-[80vh] bg-cover bg-top rounded-[2rem] overflow-hidden flex flex-col items-center justify-center border-zinc-900/10 shadow-2xl"
        style={{ backgroundImage: 'url("/hero-bg.jpg")' }}
      >

        {/* Subtle dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />

        {/* Main Massive Text mimicking the reference */}
        <div className={`relative z-10 w-full px-4 flex flex-col items-center justify-center text-white drop-shadow-[0_8px_8px_rgba(0,0,0,0.8)] ${bangers.className}`}>

          <div className="flex items-center justify-center gap-4 -rotate-3 mb-2">
            <span className="text-[3.5rem] sm:text-[4rem] md:text-[5rem] lg:text-[6rem] leading-none transform -rotate-2">
              PASS
            </span>
            <span className="text-[3.5rem] sm:text-[4rem] md:text-[5rem] lg:text-[6rem] leading-none transform rotate-3">
              IT
            </span>
          </div>

          <div className="text-[3.5rem] sm:text-[5rem] md:text-[6rem] lg:text-[7rem] leading-none transform rotate-2">
            FORWARD!
          </div>

        </div>

        {/* Subtitles */}
        <div className="relative z-10 mt-12 flex flex-col items-center text-center px-4">
          <p className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-2 drop-shadow-md">
            Sell second-hand in your UIC community.
          </p>
          <p className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Match your needs.
          </p>

          <Show when="signed-out">
            <SignUpButton mode="modal">
              <div className="relative group cursor-pointer">
                <button className="bg-[#DC2626] px-8 py-4 text-2xl font-black text-white hover:bg-[#B91C1C] transition-colors shadow-xl">
                  JOIN THE COMMUNITY
                </button>
                <MousePointer2 className="absolute -bottom-6 -right-6 w-12 h-12 text-white fill-white stroke-black stroke-2 drop-shadow-lg transform -rotate-12 group-hover:scale-110 transition-transform" />
              </div>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <Link href="/listings">
              <div className="relative group cursor-pointer">
                <button className="bg-[#DC2626] px-8 py-4 text-2xl font-black text-white hover:bg-[#B91C1C] transition-colors shadow-xl">
                  ENTER MARKETPLACE
                </button>
                <MousePointer2 className="absolute -bottom-6 -right-6 w-12 h-12 text-white fill-white stroke-black stroke-2 drop-shadow-lg transform -rotate-12 group-hover:scale-110 transition-transform" />
              </div>
            </Link>
          </Show>
        </div>

      </div>

      {/* Featured Items & Stats Section */}
      <div className="w-full max-w-7xl mx-auto px-6 py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center z-10 relative">
        
        {/* Left: Trending Items */}
        <div className="flex flex-col gap-8">
          <h3 className="text-4xl md:text-5xl font-black text-black tracking-tight leading-none">
            Trending on Campus
          </h3>
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {[
              { title: "Vintage UIC Hoodie", price: "$25", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80" },
              { title: "Calculus Textbook", price: "$40", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80" },
              { title: "Mini Fridge", price: "$50", image: "https://images.unsplash.com/photo-1584513106517-91509cd98f62?w=500&q=80" },
              { title: "AirPods Pro", price: "$80", image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&q=80" },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm hover:shadow-xl overflow-hidden border border-zinc-100 transition-all group cursor-pointer">
                <div className="h-40 md:h-48 w-full bg-zinc-200 overflow-hidden relative">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4 md:p-5">
                  <p className="font-bold text-black truncate text-lg">{item.title}</p>
                  <p className="text-[#3252DF] font-black text-xl mt-1">{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Community Stats */}
        <div className="flex flex-col gap-10 lg:pl-12">
          <div>
            <h3 className="text-4xl md:text-5xl font-black text-black tracking-tight leading-none mb-4">
              The Circlo Impact
            </h3>
            <p className="text-xl text-zinc-600 font-medium">
              Join the fastest growing marketplace at UIC. Buy, sell, and trade safely with your peers.
            </p>
          </div>
          
          <div className="flex flex-col gap-8 mt-2">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-[2rem] bg-[#3252DF]/10 flex items-center justify-center text-[#3252DF] shrink-0">
                 <Users className="w-10 h-10" strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="text-5xl font-black text-black">500+</h4>
                <p className="text-zinc-500 font-bold text-xl mt-1">Active Students</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-[2rem] bg-[#DC2626]/10 flex items-center justify-center text-[#DC2626] shrink-0">
                 <ShoppingBag className="w-10 h-10" strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="text-5xl font-black text-black">1,200</h4>
                <p className="text-zinc-500 font-bold text-xl mt-1">Items Sold</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                 <Banknote className="w-10 h-10" strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="text-5xl font-black text-black">$5,000+</h4>
                <p className="text-zinc-500 font-bold text-xl mt-1">Saved by Community</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Content / Footer Section */}
      <div className="w-full flex flex-col items-center pt-24 pb-20 px-4 relative z-10 bg-[#F9F6EE]">
        
        <h2 className="text-4xl md:text-5xl font-bold text-black mb-8 tracking-tight">
          Welcome to Circlo
        </h2>
      
        
        <Show when="signed-in">
          <Link href="/swipe" className="text-2xl md:text-3xl font-bold text-black underline decoration-2 underline-offset-8 hover:text-[#DC2626] transition-colors mb-24 cursor-pointer">
            Enter Marketplace
          </Link>
        </Show>

        {/* Footer Info Section */}
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Map */}
          <div className="w-full h-96 bg-zinc-200 rounded-xl overflow-hidden border-4 border-white shadow-lg">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d11880.492291371428!2d-87.6565158!3d41.873523!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x880e2cc57fc7eebf%3A0x6b2e11df3196e738!2sUniversity%20of%20Illinois%20Chicago!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={false} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

          {/* Right: Links */}
          <div className="grid grid-cols-2 gap-y-12 gap-x-8 text-2xl font-medium text-black px-4">
            <Link href="#" className="hover:text-[#DC2626] transition-colors">Features</Link>
            <Link href="#" className="hover:text-[#DC2626] transition-colors">Policy & Terms</Link>
            <Link href="#" className="hover:text-[#DC2626] transition-colors">About Us</Link>
            <Link href="#" className="hover:text-[#DC2626] transition-colors">LinkedIn</Link>
            <Link href="#" className="hover:text-[#DC2626] transition-colors">Instagram</Link>
            <Link href="#" className="hover:text-[#DC2626] transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
