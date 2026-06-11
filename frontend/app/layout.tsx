import type { Metadata } from "next";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton, SignOutButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image";
import { Search, MessageSquare, ShoppingCart, Shield } from "lucide-react";
import { ClientNav } from "./ClientNav";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { OnboardingCheck } from "@/components/OnboardingCheck";
import { CustomUserButton } from "@/components/CustomUserButton";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { NavActions } from "@/components/NavActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "Circlo | Verified UIC Student Marketplace",
  description: "Buy, sell, and swap items safely with verified @uic.edu student profiles.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  const isUic = email ? email.endsWith("@uic.edu") : true;

  return (
    <html lang="en" className={cn("h-full", "font-sans", inter.variable)}>
      <body className="h-full bg-zinc-50 text-[17px] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 antialiased">
        <ClerkProvider
          appearance={{
            layout: {
              socialButtonsPlacement: "top",
            },
            elements: {
              formButtonPrimary: "bg-[#272343] hover:bg-[#1A182D] text-white",
            }
          }}
        >
          {/* Aesthetic Header */}
          <header className="sticky top-0 z-50 w-full bg-[#2a2a2c] backdrop-blur-md border-b border-white/10 transition-colors duration-300">
            <div className="flex h-12 md:h-14 w-full items-center justify-between px-4 sm:px-8 lg:px-10 gap-4">
              {/* Logo */}
              <div className="flex items-center shrink-0">
                <Link href="/" className="flex items-center -space-x-1 text-xl sm:text-2xl font-black tracking-tighter text-white">
                  <Image src="/Circlo Logo White-02.png" alt="Circlo Logo" width={70} height={70} className="object-contain" />
                  <span>Circlo</span>
                </Link>
              </div>

              {/* Middle Section (Search Bar) */}
              <Show when="signed-in">
                <div className="flex-1 max-w-xl hidden md:block px-8">
                  <form action="/listings" className="relative w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      name="q"
                      placeholder="Search Products..."
                      className="w-full rounded-full pl-10 bg-zinc-50 border-zinc-200 focus-visible:ring-[#3252DF] text-black  "
                    />
                  </form>
                </div>
              </Show>

              {/* Right Side Actions */}
              <nav className="flex items-center gap-2 md:gap-4 shrink-0">
                <Show when="signed-out">
                  <div className="flex items-center gap-1 md:gap-3">
                    <Link href="/about">
                      <Button className="rounded-full  text-white hover:text-white hover:bg-transparent text-[12px] md:text-[14px] font-normal transition-colors px-2 md:px-4">
                        About Circlo
                      </Button>
                    </Link>
                    <SignInButton mode="modal">
                      <Button className="rounded-full bg-white hover:bg-zinc-200 text-black text-[12px] md:text-[14px] font-normal border-none transition-all px-4">
                        Log In / Sign Up
                      </Button>
                    </SignInButton>
                  </div>
                </Show>
                <Show when="signed-in">
                  <div className="flex items-center gap-4">
                    {/* {isUic && (
                      <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        UIC Verified
                      </span>
                    )} */}
                    <Link href="/add-product">
                      <Button variant="default" className="hidden sm:flex rounded-full font-bold bg-[#272343] hover:bg-black text-white gap-2">
                        + Create Listing
                      </Button>
                    </Link>
                    <NavActions />

                    <CustomUserButton />
                  </div>
                </Show>
              </nav>
            </div>

            {/* Bottom Row: Categories and Links */}
            <Show when="signed-in">
              <ClientNav />
              <OnboardingCheck />
            </Show>
          </header>

          <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
            {isUic ? (
              <div className="w-full">{children}</div>
            ) : (
              <div className="relative w-full max-w-md rounded-3xl border border-zinc-200 bg-white shadow-xl text-center space-y-8 overflow-hidden mx-4 my-8 p-10">
                {/* Background glows */}
                <div className="absolute -top-24 -left-24 -z-10 h-48 w-48 rounded-full bg-[#3252DF]/10 blur-[80px]" />
                <div className="absolute -bottom-24 -right-24 -z-10 h-48 w-48 rounded-full bg-[#3252DF]/10 blur-[80px]" />

                <div className="flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-[#3252DF]/5 text-[#3252DF] border border-[#3252DF]/10 shadow-sm">
                    <Shield className="h-10 w-10" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-3xl font-black tracking-tight text-black">UIC Email Required</h2>
                  <p className="text-sm font-medium text-zinc-500 leading-relaxed px-2">
                    Circlo is an exclusive marketplace for verified UIC students. Please sign in with an email address ending in <strong className="text-[#3252DF]">@uic.edu</strong> to join the community.
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-100 text-xs text-zinc-500 space-y-1">
                  <p>You are currently signed in as:</p>
                  <p className="font-mono font-bold text-zinc-800 text-sm truncate">{email}</p>
                </div>

                <div className="pt-2">
                  <DeleteAccountButton />
                </div>
              </div>
            )}
          </main>
        </ClerkProvider>
      </body>
    </html>
  );
}

