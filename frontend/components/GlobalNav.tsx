"use client";

import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { SignInButton, Show } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomUserButton } from "@/components/CustomUserButton";
import React from "react";

export function GlobalNav({ navActions }: { navActions?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-50 w-full bg-[rgba(0,0,0,0.8)] backdrop-blur-[20px] backdrop-saturate-[180%] border-b border-white/10 transition-colors duration-300">
      <div className="flex h-[44px] md:h-[48px] w-full items-center justify-between px-4 sm:px-8 lg:px-10 gap-4">
        {/* Logo */}
        <div className="flex items-center shrink-0">
          <Link href="/" className="flex items-center -space-x-1 text-lg font-semibold tracking-tighter text-white hover:opacity-80 transition-opacity">
            <Image src="/Circlo Logo White-02.png" alt="Circlo Logo" width={50} height={50} className="object-contain" />
            <span>Circlo</span>
          </Link>
        </div>

        {/* Middle Section (Search Bar) */}
        <Show when="signed-in">
          <div className="flex-1 max-w-md hidden md:block px-4">
            <form action="/listings" className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <Input
                type="text"
                name="q"
                placeholder="Search Products..."
                className="w-full h-[32px] rounded-full pl-9 bg-zinc-800/50 border-white/10 text-[13px] text-white placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:bg-zinc-800/80 transition-all"
              />
            </form>
          </div>
        </Show>

        {/* Right Side Actions */}
        <nav className="flex items-center gap-2 md:gap-4 shrink-0">
          <Show when="signed-out">
            <div className="flex items-center gap-1 md:gap-3">
              <Link href="/about">
                <Button variant="ghost" className="text-[#e8e8ed] hover:text-white hover:bg-transparent text-[12px] font-normal transition-colors h-8 px-2 md:px-3">
                  About Circlo
                </Button>
              </Link>
              <SignInButton mode="modal">
                <Button className="rounded-full bg-white hover:bg-zinc-200 text-black text-[12px] font-normal border-none transition-all h-[32px] px-4">
                  Log In / Sign Up
                </Button>
              </SignInButton>
            </div>
          </Show>
          <Show when="signed-in">
            <div className="flex items-center gap-3">
              <Link href="/add-product">
                <Button variant="default" className="hidden sm:flex h-[32px] rounded-full text-[12px] font-medium bg-[#1d1d1f] hover:bg-white/10 text-white border border-white/10 shadow-sm transition-colors">
                  + Create Listing
                </Button>
              </Link>
              <div className="scale-90 opacity-80 hover:opacity-100 transition-opacity flex items-center">
                {navActions}
              </div>
              <div className="scale-90 flex items-center">
                <CustomUserButton />
              </div>
            </div>
          </Show>
        </nav>
      </div>
    </header>
  );
}
