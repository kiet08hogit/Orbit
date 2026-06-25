"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, ChevronDown } from "lucide-react";
import { SignInButton, Show } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomUserButton } from "@/components/CustomUserButton";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React from "react";

import { NotificationsMenu } from "@/components/NotificationsMenu";

export function GlobalNav({ navActions }: { navActions?: React.ReactNode }) {
  const pathname = usePathname() || "";

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border transition-colors duration-300">
      <div className="flex h-[44px] md:h-[48px] w-full items-center justify-between px-4 sm:px-8 lg:px-10 gap-4">
        {/* Logo */}
        <div className="flex items-center shrink-0">
          <Link
            href="/"
            className="flex items-center -space-x-1 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/Orbit_logo_transparent.png"
              alt="Orbit Logo"
              width={50}
              height={50}
              className="object-contain dark:invert-0 invert"
            />
            <span className="text-xl sm:text-2xl font-black tracking-tighter text-foreground">
              Orbit
            </span>
          </Link>
        </div>

        {/* Middle Section (Search Bar & Mode Switcher) */}
        <Show when="signed-in">
          <div className="flex-1 max-w-lg hidden md:block px-4">
            <div className="flex items-center gap-2 w-full">
              {/* Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap shrink-0 rounded-md border border-border bg-secondary text-foreground text-[13px] font-semibold h-[32px] px-3 gap-1 hover:bg-secondary/80">
                  {pathname.startsWith("/community")
                    ? "Community"
                    : "Marketplace"}
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[140px] rounded-xl border-border bg-popover shadow-lg"
                >
                  <DropdownMenuItem className="cursor-pointer p-0">
                    <Link
                      href="/home"
                      className="w-full h-full font-medium px-2 py-1.5 block"
                    >
                      Marketplace
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer p-0">
                    <Link
                      href="/community"
                      className="w-full h-full font-medium px-2 py-1.5 block"
                    >
                      Community
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Search Bar */}
              <form action="/listings" className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  name="q"
                  placeholder="Search Products..."
                  className="w-full h-[32px] rounded-md pl-9 bg-secondary border-none text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:bg-secondary/80 transition-all font-mono"
                />
              </form>
            </div>
          </div>
        </Show>

        {/* Right Side Actions */}
        <nav className="flex items-center gap-2 md:gap-4 shrink-0">
          <AnimatedThemeToggler />
          <Show when="signed-out">
            <div className="flex items-center gap-1 md:gap-3">
              <Link href="/about">
                <Button
                  variant="ghost"
                  className="text-foreground hover:text-foreground hover:bg-transparent text-[14px] font-medium transition-colors h-8 px-2 md:px-3 rounded-md"
                >
                  About Orbit
                </Button>
              </Link>
              <SignInButton mode="modal">
                <Button className="rounded-md bg-primary hover:opacity-90 text-primary-foreground text-[14px] font-medium border-none transition-all h-[32px] px-4">
                  Log In / Sign Up
                </Button>
              </SignInButton>
            </div>
          </Show>
          <Show when="signed-in">
            <div className="flex items-center gap-3">
              <Link href="/add-product">
                <Button
                  variant="default"
                  className="hidden sm:flex h-[32px] rounded-md text-[14px] font-medium bg-primary hover:opacity-90 text-primary-foreground border-none transition-colors"
                >
                  + Create Listing
                </Button>
              </Link>
              <div className="scale-90 opacity-80 hover:opacity-100 transition-opacity flex items-center">
                {navActions}
              </div>
              <NotificationsMenu />
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
