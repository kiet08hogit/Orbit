import { SignUpButton, Show } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Bangers } from "next/font/google";
import { MousePointer2, Users, ShoppingBag, Banknote, BookOpen, Headphones, Laptop, TabletSmartphone, Book, Shirt, Glasses, Sparkles } from "lucide-react";
import OrbitingCircles from "@/components/magicui/orbiting-circles";
import { Meteors } from "@/components/ui/meteors";
import { TextAnimate } from "@/components/ui/text-animate";
import { Globe } from "@/components/ui/globe";

const bangers = Bangers({ weight: "400", subsets: ["latin"] });

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-x-hidden">

      {/* Hero Section (Dark Tile) */}
      <div className="relative w-full h-[85vh] md:h-[90vh] bg-[#000000] overflow-hidden flex flex-col items-center justify-start pt-24 md:pt-32">
        <div className="flex flex-col items-center justify-start w-full z-10 relative">

          {/* Main Title - Apple Hero Display (56px) */}
          <h1 className="text-[40px] md:text-[56px] font-semibold tracking-tighter text-center max-w-4xl px-4 text-white mb-4 leading-[1.07]">
            Find What You Need On Campus with Circlo
          </h1>

          {/* Subtitle - Apple Lead (28px) */}
          <p className="text-[21px] md:text-[28px] text-center text-[#a0a0a0] max-w-3xl px-4 mb-10 leading-[1.14] font-normal tracking-tight">
            Buy. Sell. <br />
            Swap in your uni community.
          </p>

          {/* Action Buttons - Apple Pill */}
          <div className="flex flex-row justify-center items-center gap-4 px-4 relative z-20">
            <Show when="signed-out">
              <SignUpButton mode="modal" asChild>
                <button className="inline-flex items-center justify-center bg-white text-black px-[22px] py-[11px] rounded-full text-[17px] font-normal hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer">
                  Join The Community
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/add-product">
                <button className="inline-flex items-center justify-center bg-white text-black px-[22px] py-[11px] rounded-full text-[17px] font-normal hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer">
                  Sell an Item
                </button>
              </Link>
            </Show>
            <Link href="/faqs">
              <button className="inline-flex items-center justify-center bg-transparent text-[#2997ff] border-none px-[22px] py-[11px] rounded-full text-[17px] font-normal hover:underline active:scale-95 transition-all cursor-pointer">
                FAQs &gt;
              </button>
            </Link>
          </div>

          {/* Interactive 3D Globe centerpiece */}
          <div className="relative flex h-[500px] md:h-[650px] w-full max-w-[800px] items-center justify-center overflow-hidden bg-transparent mt-8 pointer-events-none">
            <Globe className="opacity-90" />
          </div>
        </div>
      </div>



      {/* "What is Circlo?" Section (Parchment Tile) */}
      <div className="relative flex flex-col lg:flex-row min-h-[700px] w-full items-center justify-between bg-[#f5f5f7] text-[#1d1d1f] z-10 px-8 lg:px-24 py-24">

        {/* Left Side: Text */}
        <div className="flex-1 flex flex-col items-start justify-center text-left z-20 space-y-6 lg:pr-12">
          <h2 className="text-[40px] md:text-[56px] font-semibold tracking-tighter text-[#1d1d1f] leading-[1.07]">
            What is Circlo?
          </h2>
          <p className="text-[21px] md:text-[28px] text-[#1d1d1f] font-normal leading-[1.14] tracking-tight max-w-xl">
            Circlo is a student exclusive marketplace where you are able to buy, sell, and swap items with just students, staff and faculty.
          </p>

          <Link href="/about" className="mt-4">
            <button className="inline-flex items-center justify-center bg-[#1d1d1f] text-white px-[22px] py-[11px] rounded-full text-[17px] font-normal hover:opacity-90 active:scale-95 transition-all cursor-pointer">
              Learn more
            </button>
          </Link>
        </div>

        {/* Right Side: Apple Style Orbit Display */}
        <div className="flex-1 relative flex h-[450px] md:h-[550px] w-full items-center justify-center mt-16 lg:mt-0">

          <div className="absolute top-0 text-center z-10 w-full">
            <div className="text-[34px] font-semibold tracking-tighter text-[#1d1d1f]">
              Find your items
            </div>
            <div className="text-[17px] text-[#7a7a7a] mt-1">Dorm • Clothes • School • Events • Uni Community</div>
          </div>

          {/* Orbiting Circles */}
          <OrbitingCircles className="size-[50px] border-none bg-transparent" duration={25} delay={20} radius={100}>
            <TabletSmartphone className="h-10 w-10 text-[#0066cc]" />
          </OrbitingCircles>
          <OrbitingCircles className="size-[50px] border-none bg-transparent" duration={25} delay={10} radius={100}>
            <Book className="h-9 w-9 text-[#0066cc]" />
          </OrbitingCircles>
          <OrbitingCircles className="size-[60px] border-none bg-transparent" radius={180} duration={35} reverse>
            <Shirt className="h-10 w-10 text-[#1d1d1f]" />
          </OrbitingCircles>
          <OrbitingCircles className="size-[60px] border-none bg-transparent" radius={180} duration={35} delay={17} reverse>
            <Glasses className="h-10 w-10 text-[#1d1d1f]" />
          </OrbitingCircles>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="w-full bg-white text-[#1d1d1f] pt-20 pb-12 px-6 lg:px-12 relative z-10 border-t border-[#e0e0e0]">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">

          {/* Logo / Brand */}
          <div className="flex flex-col gap-6 md:col-span-1">
            <Link href="/" className="flex items-center -space-x-1 ">
              <Image src="/Circlo Logo White-02.png" alt="Circlo Logo" width={80} height={80} className="object-contain invert" />
              <span className=" text-xl sm:text-2xl font-black tracking-tighter text-[#1d1d1f]">Circlo</span>
            </Link>

          </div>

          {/* Product Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[14px] font-semibold text-[#1d1d1f] mb-2 uppercase tracking-wide">Engineers</h4>
            <Link href="https://www.linkedin.com/in/ntkiet-ho/" className="text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors text-[14px] font-normal inline-flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
              Nguyen Tuan Kiet Ho
            </Link>

          </div>

          {/* Company Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[14px] font-semibold text-[#1d1d1f] mb-2 uppercase tracking-wide">Company</h4>
            <Link href="/about" className="text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors text-[14px] font-normal">About Us</Link>
            <Link href="#" className="text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors text-[14px] font-normal">Policy & Terms</Link>
          </div>

          {/* Social Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[14px] font-semibold text-[#1d1d1f] mb-2 uppercase tracking-wide">Socials</h4>
            <Link href="#" className="text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors text-[14px] font-normal">Instagram</Link>
            <Link href="#" className="text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors text-[14px] font-normal">LinkedIn</Link>
            <Link href="#" className="text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors text-[14px] font-normal">Email</Link>
          </div>

        </div>

        {/* Copyright */}
        <div className="w-full max-w-7xl mx-auto mt-20 pt-8 border-t border-[#e0e0e0] text-center md:text-left text-[#7a7a7a] font-normal text-[14px] flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Circlo. All rights reserved.</p>

        </div>
      </footer>

    </div>
  );
}
