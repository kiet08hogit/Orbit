import { SignUpButton, Show } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Bangers } from "next/font/google";
import {
  MousePointer2,
  Users,
  ShoppingBag,
  Banknote,
  BookOpen,
  Headphones,
  Laptop,
  TabletSmartphone,
  Smartphone,
  Book,
  Shirt,
  Glasses,
  Sparkles,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import OrbitingCircles from "@/components/magicui/orbiting-circles";
import { Meteors } from "@/components/ui/meteors";
import { TextAnimate } from "@/components/ui/text-animate";
import { Globe } from "@/components/ui/globe";

const bangers = Bangers({ weight: "400", subsets: ["latin"] });

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-card relative overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative w-full h-[85vh] md:h-[90vh] bg-background overflow-hidden flex flex-col items-center justify-start pt-16 md:pt-20">
        <div className="flex flex-col items-center justify-start w-full z-10 relative">
          {/* Main Title - Cursor Hero Display */}
          <h1 className="text-[40px] md:text-[56px] font-semibold tracking-tighter text-center max-w-4xl px-4 text-foreground mb-4 leading-tight">
            Find What You Need On Campus with Orbit
          </h1>

          {/* Subtitle */}
          <p className="text-[21px] md:text-[28px] text-center text-foreground max-w-3xl px-4 mb-10 leading-[1.14] font-medium tracking-tight">
            Buy. Sell. <br />
            Swap in your uni community.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-row justify-center items-center gap-4 px-4 relative z-20">
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <button className="inline-flex items-center justify-center bg-primary text-primary-foreground px-[22px] py-[11px] rounded-md text-[16px] font-medium hover:opacity-90 active:scale-95 transition-all cursor-pointer">
                  Join The Community
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/add-product">
                <button className="inline-flex items-center justify-center bg-primary text-primary-foreground px-[22px] py-[11px] rounded-md text-[16px] font-medium hover:opacity-90 active:scale-95 transition-all cursor-pointer">
                  Sell an Item
                </button>
              </Link>
            </Show>
            <Link href="/faqs">
              <button className="inline-flex items-center justify-center bg-transparent text-foreground hover:opacity-80 border-none px-[22px] py-[11px] rounded-md text-[16px] font-medium active:scale-95 transition-all cursor-pointer">
                FAQs &gt;
              </button>
            </Link>
          </div>

          {/* Interactive 3D Globe centerpiece */}
          <div className="relative flex h-[600px] md:h-[800px] w-full max-w-[800px] items-center justify-center bg-transparent -mt-12 md:-mt-32 pointer-events-none z-0">
            <Globe className="opacity-90" />
          </div>
        </div>
      </div>

      {/* "What is Orbit?" Section */}
      <div className="relative flex flex-col w-full items-center bg-[#0a0a0a] text-white dark:bg-[#f7f7f4] dark:text-[#26251e] z-10 border-t border-[#333] dark:border-[#e6e5e0] pt-24 pb-16">
        <div className="flex flex-col lg:flex-row w-full px-8 lg:px-24 items-center justify-between mb-16">
          {/* Left Side: Text */}
          <div className="flex-1 flex flex-col items-start justify-center text-left z-20 space-y-6 lg:pr-12">
            <h2 className="text-[40px] md:text-[56px] font-semibold tracking-tighter leading-[1.07]">
              What is Orbit?
            </h2>
            <p className="text-[19px] md:text-[22px] font-medium leading-relaxed tracking-tight max-w-xl text-gray-400 dark:text-[#5a5852]">
              Orbit is the student exclusive marketplace to buy,
              sell, and swap anything. Stop making big companies richer, make
              your friends richer instead, all you need to do is to Orbit it.
            </p>

            {/* Features (Aligned Vertically) */}
            <div className="w-full flex flex-col gap-6 mt-8 pt-8 border-t border-[#333] dark:border-[#e6e5e0]">
              <div className="flex flex-row items-center text-left gap-4">
                <div className="bg-[#1a1a1a] dark:bg-[#ffffff] p-2 rounded-full shadow-sm border border-[#333] dark:border-[#e6e5e0]">
                  <Users className="h-4 w-4 text-[#f54e00]" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold mb-0.5">
                    Verified Students
                  </h3>
                  <p className="text-gray-400 dark:text-[#807d72] text-[13px] leading-snug m-0">
                    Buy and sell with peers you trust via school email.
                  </p>
                </div>
              </div>
              <div className="flex flex-row items-center text-left gap-4">
                <div className="bg-[#1a1a1a] dark:bg-[#ffffff] p-2 rounded-full shadow-sm border border-[#333] dark:border-[#e6e5e0]">
                  <MessageCircle className="h-4 w-4 text-[#f54e00]" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold mb-0.5">In-App Chat</h3>
                  <p className="text-gray-400 dark:text-[#807d72] text-[13px] leading-snug m-0">
                    No sketchy DMs. Keep communication safely in the app.
                  </p>
                </div>
              </div>
              <div className="flex flex-row items-center text-left gap-4">
                <div className="bg-[#1a1a1a] dark:bg-[#ffffff] p-2 rounded-full shadow-sm border border-[#333] dark:border-[#e6e5e0]">
                  <ShieldCheck className="h-4 w-4 text-[#f54e00]" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold mb-0.5">
                    Protected Payments
                  </h3>
                  <p className="text-gray-400 dark:text-[#807d72] text-[13px] leading-snug m-0">
                    Orbit Escrow ensures safe transactions & protects money.
                  </p>
                </div>
              </div>
              <div className="flex flex-row items-center text-left gap-4">
                <div className="bg-[#1a1a1a] dark:bg-[#ffffff] p-2 rounded-full shadow-sm border border-[#333] dark:border-[#e6e5e0]">
                  <Smartphone className="h-4 w-4 text-[#f54e00]" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold mb-0.5">Swipe to Buy</h3>
                  <p className="text-gray-400 dark:text-[#807d72] text-[13px] leading-snug m-0">
                    Buy your item just by swiping.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Display */}
          <div className="flex-1 relative flex h-[450px] md:h-[450px] w-full items-center justify-center mt-16 lg:mt-0">
            <div className="absolute -top-8 md:-top-12 text-center z-10 w-full">
              <div className="text-[34px] font-semibold tracking-tighter">
                Find your items
              </div>
              <div className="text-[17px] text-gray-400 dark:text-[#807d72] mt-1">
                Dorm • Clothes • School • Events • Services • Uni Community
              </div>
            </div>

            {/* Orbiting Circles */}
            <OrbitingCircles
              className="size-[50px] border-none bg-transparent"
              duration={25}
              delay={20}
              radius={100}
              pathClassName="stroke-white/20 dark:stroke-black/20"
            >
              <TabletSmartphone className="h-10 w-10" />
            </OrbitingCircles>
            <OrbitingCircles
              className="size-[50px] border-none bg-transparent"
              duration={25}
              delay={10}
              radius={100}
              pathClassName="stroke-white/20 dark:stroke-black/20"
            >
              <Book className="h-9 w-9" />
            </OrbitingCircles>
            <OrbitingCircles
              className="size-[60px] border-none bg-transparent"
              radius={180}
              duration={35}
              reverse
              pathClassName="stroke-white/20 dark:stroke-black/20"
            >
              <Shirt className="h-10 w-10" />
            </OrbitingCircles>
            <OrbitingCircles
              className="size-[60px] border-none bg-transparent"
              radius={180}
              duration={35}
              delay={17}
              reverse
              pathClassName="stroke-white/20 dark:stroke-black/20"
            >
              <Glasses className="h-10 w-10" />
            </OrbitingCircles>
          </div>
        </div>
      </div>

      {/* Container for Themed Sections */}
      <div className="w-full bg-[#0a0a0a] text-white dark:bg-[#f7f7f4] dark:text-[#26251e]">
        {/* Community Offering Section */}
        <div className="w-full max-w-7xl mx-auto py-24 px-6 lg:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 tracking-tight">
            See what your community is offering
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center group cursor-pointer">
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-4 shadow-sm border border-[#333] dark:border-[#e6e5e0]">
                <img
                  src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800"
                  alt="Item"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-xl font-bold mb-1">Item</h3>
              <p className="text-sm text-gray-400 dark:text-[#807d72]">
                dorm, clothing, school and more
              </p>
            </div>
            <div className="flex flex-col items-center text-center group cursor-pointer">
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-4 shadow-sm border border-[#333] dark:border-[#e6e5e0]">
                <img
                  src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800"
                  alt="Service"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-xl font-bold mb-1">Service</h3>
              <p className="text-sm text-gray-400 dark:text-[#807d72]">
                Academic and Career tutoring, or moving
              </p>
            </div>
            <div className="flex flex-col items-center text-center group cursor-pointer">
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-4 shadow-sm border border-[#333] dark:border-[#e6e5e0]">
                <img
                  src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800"
                  alt="Sublease"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-xl font-bold mb-1">Sublease</h3>
              <p className="text-sm text-gray-400 dark:text-[#807d72]">
                Apartments or rooms for sublease
              </p>
            </div>
          </div>
        </div>

        {/* Shop by Category Section */}
        <div className="w-full max-w-7xl mx-auto py-16 px-6 lg:px-12">
          <h2 className="text-3xl font-bold mb-8 tracking-tight">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <Link href="/listings?category=HOUSING" className="group block">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-3 bg-[#1a1a1a] border border-[#333] dark:bg-white dark:border-[#e6e5e0]">
                <img
                  src="https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=600"
                  alt="Dorm"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-center font-semibold text-sm">
                Furniture & Dorm
              </h3>
            </Link>
            <Link href="/listings?category=OTHER" className="group block">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-3 bg-[#1a1a1a] border border-[#333] dark:bg-white dark:border-[#e6e5e0]">
                <img
                  src="https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=600"
                  alt="Electronics"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-center font-semibold text-sm">Electronics</h3>
            </Link>
            <Link href="/listings?category=SCHOOL" className="group block">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-3 bg-[#1a1a1a] border border-[#333] dark:bg-white dark:border-[#e6e5e0]">
                <img
                  src="https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&q=80&w=600"
                  alt="School Supplies"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-center font-semibold text-sm">
                School Supplies
              </h3>
            </Link>
            <Link href="/listings?category=CLOTHES" className="group block">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-3 bg-[#1a1a1a] border border-[#333] dark:bg-white dark:border-[#e6e5e0]">
                <img
                  src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=600"
                  alt="Clothing"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-center font-semibold text-sm">Clothing</h3>
            </Link>
            <Link href="/listings?category=LEISURE" className="group block">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-3 bg-[#1a1a1a] border border-[#333] dark:bg-white dark:border-[#e6e5e0]">
                <img
                  src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600"
                  alt="Event Tickets"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-center font-semibold text-sm">
                Event Tickets
              </h3>
            </Link>
            <Link href="/listings?category=OTHER" className="group block">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-3 bg-[#1a1a1a] border border-[#333] dark:bg-white dark:border-[#e6e5e0]">
                <img
                  src="https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=600"
                  alt="Transportation"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-center font-semibold text-sm">
                Transportation
              </h3>
            </Link>
            <Link href="/listings?category=OTHER" className="group block">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-3 bg-[#1a1a1a] border border-[#333] dark:bg-white dark:border-[#e6e5e0]">
                <img
                  src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=600"
                  alt="Handmade"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-center font-semibold text-sm">Handmade</h3>
            </Link>
            <Link href="/listings?category=ACCESSORIES" className="group block">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-3 bg-[#1a1a1a] border border-[#333] dark:bg-white dark:border-[#e6e5e0]">
                <img
                  src="https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&q=80&w=600"
                  alt="Accessories"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-center font-semibold text-sm">Accessories</h3>
            </Link>
          </div>
        </div>

        {/* Shop by Campus Section */}
        <div className="w-full max-w-7xl mx-auto py-16 px-6 lg:px-12 mb-20">
          <h2 className="text-3xl font-bold mb-8 tracking-tight">
            Shop by Campus
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="group cursor-pointer">
              <div className="w-full h-48 md:h-56 rounded-2xl overflow-hidden mb-3 bg-[#1a1a1a] border border-[#333] dark:bg-white dark:border-[#e6e5e0] relative">
                <img
                  src="/UIC.webp"
                  alt="UIC"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-center font-semibold text-base">
                University of Illinois Chicago
              </h3>
            </div>
            <div className="group cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
              <div className="w-full h-48 md:h-56 rounded-2xl overflow-hidden mb-3 bg-[#1a1a1a] border border-[#333] dark:bg-white dark:border-[#e6e5e0] relative">
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                  <span className="bg-white text-black dark:bg-[#26251e] dark:text-white text-sm font-bold px-4 py-2 rounded-full">
                    Coming Soon
                  </span>
                </div>
                <img
                  src="/UIUC.jpg"
                  alt="UIUC"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="text-center font-semibold text-base">
                University of Illinois Urbana-Champaign
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="w-full bg-secondary text-secondary-foreground pt-20 pb-12 px-6 lg:px-12 relative z-10 border-t border-border">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Logo / Brand */}
          <div className="flex flex-col gap-6 md:col-span-1">
            <Link href="/" className="flex items-center -space-x-1 ">
              <Image
                src="/Orbit_logo_transparent.png"
                alt="Orbit Logo"
                width={80}
                height={80}
                className="object-contain dark:invert-0 invert"
              />
              <span className=" text-xl sm:text-2xl font-black tracking-tighter text-foreground">
                Orbit
              </span>
            </Link>
          </div>

          {/* Product Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[14px] font-semibold text-foreground mb-2 uppercase tracking-wide">
              Engineers
            </h4>
            <Link
              href="https://www.linkedin.com/in/ntkiet-ho/"
              className="text-muted-foreground hover:text-foreground transition-colors text-[14px] font-normal inline-flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect width="4" height="12" x="2" y="9" />
                <circle cx="4" cy="4" r="2" />
              </svg>
              Nguyen Tuan Kiet Ho
            </Link>
          </div>

          {/* Company Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[14px] font-semibold text-foreground mb-2 uppercase tracking-wide">
              Company
            </h4>
            <Link
              href="/about"
              className="text-muted-foreground hover:text-foreground transition-colors text-[14px] font-normal"
            >
              About Us
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors text-[14px] font-normal"
            >
              Policy & Terms
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[14px] font-semibold text-foreground mb-2 uppercase tracking-wide">
              Socials
            </h4>
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors text-[14px] font-normal"
            >
              Instagram
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors text-[14px] font-normal"
            >
              LinkedIn
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors text-[14px] font-normal"
            >
              Email
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="w-full max-w-7xl mx-auto mt-20 pt-8 border-t border-border text-center md:text-left text-muted-foreground font-normal text-[14px] flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Orbit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
