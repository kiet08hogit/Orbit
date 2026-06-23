import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { AnimatedBeamHero } from "@/components/AnimatedBeamHero";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-card font-sans flex flex-col items-center">
      {/* Main Content */}
      <div className="w-full max-w-4xl px-6 py-24 md:py-32 flex flex-col gap-12">
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit font-normal text-[17px]">
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>

        <h1 className="text-[56px] md:text-[72px] font-semibold text-foreground tracking-tighter leading-[1.07] mb-8">
          What is Orbit?
        </h1>

        <div className="w-full bg-card rounded-[18px] border border-border shadow-sm p-8 md:p-12 flex flex-col gap-6">
          <h2 className="text-[28px] font-semibold text-foreground tracking-tight">The Problem</h2>
          <p className="text-[17px] md:text-[21px] text-foreground leading-[1.47] font-normal">
            Buying and selling on campus shouldn't be sketchy or complicated. Traditional marketplaces are full of scammers, irrelevant listings, and people who live miles away. Students lack a secure, localized space to trade dorm essentials, find subleases, or offer their skills without worrying about who they are actually meeting up with or paying hefty middleman fees.
          </p>
        </div>

        <div className="w-full bg-secondary rounded-[18px] shadow-sm p-8 md:p-12 flex flex-col gap-6">
          <h2 className="text-[28px] font-semibold text-foreground tracking-tight">Our Solution</h2>
          <p className="text-gray-500 dark:text-[#807d72] leading-relaxed">
            We built Orbit as an exclusive marketplace specifically for university students. By requiring a verified .edu email address, we ensure that every single transaction is safe, local, and student-to-student. We integrated secure payments through Stripe with a unique Meetup Code system, completely eliminating the anxiety of cash handoffs. It keeps the money in the campus community, helps students save, and makes finding what you need effortless.
          </p>
        </div>

        <div className="w-full bg-card rounded-[18px] border border-border shadow-sm p-8 md:p-12 flex flex-col gap-6">
          <h2 className="text-[28px] font-semibold text-foreground tracking-tight">The Ecosystem</h2>
          <p className="text-[17px] md:text-[21px] text-foreground leading-[1.47] font-normal">
            Orbit isn't just a marketplace for buying textbooks or selling your dorm fridge. It's the central hub for your entire university ecosystem. Need CS help, a resume review, or someone to help you move out? We've got you covered.
          </p>
        </div>

        <div className="w-full bg-secondary rounded-[18px] shadow-sm p-8 md:p-12 flex flex-col gap-6">
          <h2 className="text-[28px] font-semibold text-foreground tracking-tight">The Challenge</h2>
          <p className="text-gray-500 dark:text-[#807d72] mb-6 leading-relaxed">
            Building Orbit wasn't just about creating a marketplace; it was about engineering trust. The biggest challenge was designing a system that guaranteed safety without adding friction. We had to implement a strict yet seamless .edu verification process and build a custom escrow-like payment flow using Stripe and Meetup Codes. We needed to ensure that sellers felt confident they would get paid, and buyers felt confident they wouldn't get scammed—all while keeping the platform lightning fast and visually engaging for Gen Z students.
          </p>
        </div>

      </div>

    </div>
  );
}
