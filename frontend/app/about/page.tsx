import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] font-sans flex flex-col items-center">
      
      {/* Main Content */}
      <div className="w-full max-w-4xl px-6 py-24 md:py-32 flex flex-col gap-12">
        
        <Link href="/" className="flex items-center gap-2 text-[#7a7a7a] hover:text-zinc-900 transition-colors w-fit font-normal text-[17px]">
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>

        <h1 className="text-[56px] md:text-[72px] font-semibold text-zinc-900 tracking-tighter leading-[1.07] mb-8">
          What is Orbit?
        </h1>

        <div className="w-full bg-white rounded-[18px] border border-[#e0e0e0] shadow-sm p-8 md:p-12 flex flex-col gap-6">
          <h2 className="text-[28px] font-semibold text-zinc-900 tracking-tight">The Problem</h2>
          <p className="text-[17px] md:text-[21px] text-zinc-900 leading-[1.47] font-normal">
            Buying and selling on campus shouldn't be sketchy. Traditional marketplaces are full of scammers, irrelevant listings, and people who live miles away. You never know who you are actually meeting up with.
          </p>
        </div>

        <div className="w-full bg-zinc-50 rounded-[18px] shadow-sm p-8 md:p-12 flex flex-col gap-6">
          <h2 className="text-[28px] font-semibold text-white tracking-tight">The Solution</h2>
          <p className="text-[17px] md:text-[21px] text-[#cccccc] leading-[1.47] font-normal">
            Orbit is an exclusive marketplace built specifically for UIC students. By requiring a verified @uic.edu email address, we ensure that every transaction is safe, local, and student-to-student. Pass the torch, save money, and match your needs.
          </p>
        </div>

      </div>

    </div>
  );
}
