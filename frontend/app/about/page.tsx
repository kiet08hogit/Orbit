import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F9F6EE] font-sans flex flex-col items-center">
      
      {/* Main Content */}
      <div className="w-full max-w-4xl px-6 py-20 flex flex-col gap-12">
        
        <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-black transition-colors w-fit font-bold">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <h1 className="text-6xl md:text-8xl font-black text-black tracking-tighter uppercase leading-none">
          WHAT IS CIRCLO?
        </h1>

        <div className="w-full bg-white border-4 border-black p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6 hover:-translate-y-1 transition-transform">
          <h2 className="text-3xl font-bold text-black uppercase tracking-tight">The Problem</h2>
          <p className="text-xl text-zinc-700 leading-relaxed font-medium">
            Buying and selling on campus shouldn't be sketchy. Traditional marketplaces are full of scammers, irrelevant listings, and people who live miles away. You never know who you are actually meeting up with.
          </p>
        </div>

        <div className="w-full bg-black text-white border-4 border-black p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(229,43,46,1)] flex flex-col gap-6 transform md:-rotate-1 hover:-translate-y-1 transition-transform">
          <h2 className="text-3xl font-bold text-white uppercase tracking-tight">The Solution</h2>
          <p className="text-xl text-zinc-300 leading-relaxed font-medium">
            Circlo is an exclusive marketplace built specifically for UIC students. By requiring a verified @uic.edu email address, we ensure that every transaction is safe, local, and student-to-student. Pass the torch, save money, and match your needs.
          </p>
        </div>

      </div>

    </div>
  );
}
