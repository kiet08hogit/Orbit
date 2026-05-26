import { SignUpButton, Show } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Bangers } from "next/font/google";
import { MousePointer2, Users, ShoppingBag, Banknote } from "lucide-react";

const bangers = Bangers({ weight: "400", subsets: ["latin"] });

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F9F6EE] font-sans flex flex-col">

      {/* Hero Image Full Width */}
      <div
        className="relative w-full h-[70vh] md:h-[80vh] bg-cover bg-top overflow-hidden flex flex-col items-center justify-center shadow-2xl"
        style={{ backgroundImage: 'url("/hero-bg.jpg")' }}
      >

        {/* Subtle dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />

        {/* Main Massive Text mimicking the reference */}
        <div className={`relative z-10 w-full px-4 flex flex-col items-center justify-center text-white drop-shadow-[0_8px_8px_rgba(0,0,0,0.8)] ${bangers.className}`}>

          <div className="flex items-center justify-center gap-4 -rotate-3 mb-2">
            <span className="text-[3.5rem] sm:text-[4rem] md:text-[5rem] lg:text-[6rem] leading-none transform -rotate-2">
              BUY.
            </span>
            <span className="text-[3.5rem] sm:text-[4rem] md:text-[5rem] lg:text-[6rem] leading-none transform rotate-3">
              SELL.
            </span>
          </div>

          <div className="text-[3.5rem] sm:text-[5rem] md:text-[6rem] lg:text-[6rem] leading-none transform rotate-2 text-center">
            MATCH YOUR NEEDS.
          </div>

        </div>

        {/* Subtitles */}
        <div className="relative z-10 mt-12 flex flex-col items-center text-center px-4">
          <p className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-8 drop-shadow-md">
            Pass on your pre-loved items
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



      {/* "What moves around Circlo" Section */}
      <div className="w-full bg-[#ffff] pt-8 pb-20 px-4 flex flex-col items-center justify-center relative z-10">
        <h2 className="text-sm md:text-base font-bold text-zinc-400 mb-6 uppercase tracking-[0.2em] text-center">
          What moves around Circlo
        </h2>

        <div className="flex flex-wrap justify-center items-center gap-3 md:gap-6 text-lg md:text-2xl font-medium text-black text-center max-w-5xl">
          <span className="hover:text-[#DC2626] transition-colors cursor-pointer">Dorm essentials</span>
          <span className="text-zinc-300 hidden md:block">•</span>
          <span className="hover:text-[#DC2626] transition-colors cursor-pointer">Clothes</span>
          <span className="text-zinc-300 hidden md:block">•</span>
          <span className="hover:text-[#DC2626] transition-colors cursor-pointer">Tickets</span>
          <span className="text-zinc-300 hidden md:block">•</span>
          <span className="hover:text-[#DC2626] transition-colors cursor-pointer">School</span>
          <span className="text-zinc-300 hidden md:block">•</span>
          <span className="hover:text-[#DC2626] transition-colors cursor-pointer">Events</span>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="w-full bg-black text-white pt-20 pb-12 px-6 lg:px-12 relative z-10">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">

          {/* Logo / Brand */}
          <div className="flex flex-col gap-6 md:col-span-1">
            <Link href="/" className="flex items-center -space-x-1">
              <Image src="/Circlo Logo White-02.png" alt="Circlo Logo" width={80} height={80} className="object-contain" />
              <span className="text-4xl font-black tracking-tighter text-white">Circlo</span>
            </Link>
            <p className="text-zinc-400 font-medium text-lg leading-relaxed">
              The exclusive marketplace for UIC students. Go Flames!
            </p>
          </div>

          {/* Product Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xl font-bold text-white mb-2 uppercase tracking-wider">Product</h4>
            <Link href="#" className="text-zinc-400 hover:text-white transition-colors text-lg font-medium">Features</Link>
            <Link href="/listings" className="text-zinc-400 hover:text-white transition-colors text-lg font-medium">Browse Items</Link>
            <Link href="/add-product" className="text-zinc-400 hover:text-white transition-colors text-lg font-medium">Start Listing</Link>
          </div>

          {/* Company Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xl font-bold text-white mb-2 uppercase tracking-wider">Company</h4>
            <Link href="#" className="text-zinc-400 hover:text-white transition-colors text-lg font-medium">About Us</Link>
            <Link href="#" className="text-zinc-400 hover:text-white transition-colors text-lg font-medium">Policy & Terms</Link>
          </div>

          {/* Social Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xl font-bold text-white mb-2 uppercase tracking-wider">Socials</h4>
            <Link href="#" className="text-zinc-400 hover:text-white transition-colors text-lg font-medium">Instagram</Link>
            <Link href="#" className="text-zinc-400 hover:text-white transition-colors text-lg font-medium">LinkedIn</Link>
            <Link href="#" className="text-zinc-400 hover:text-white transition-colors text-lg font-medium">Email</Link>
          </div>

        </div>

        {/* Copyright */}
        <div className="w-full max-w-7xl mx-auto mt-20 pt-8 border-t border-zinc-800 text-center md:text-left text-zinc-500 font-medium flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Circlo. All rights reserved.</p>
          <p>Built for UIC Students.</p>
        </div>
      </footer>

    </div>
  );
}
