import type { Metadata } from "next";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton, SignOutButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { Search, MessageSquare, ShoppingCart, AlertTriangle } from "lucide-react";
import { ClientNav } from "./ClientNav";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "FlamesPorium | Verified UIC Student Marketplace",
  description: "Buy, sell, and swap items safely with verified @uic.edu student profiles.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  const isUic = email ? email.endsWith("@uic.edu") : true;

  return (
    <html lang="en" className={cn("h-full", "font-sans", geist.variable)}>
      <body className="h-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 antialiased">
        <ClerkProvider>
          {/* Clean White Header */}
          <header className="sticky top-0 z-50 w-full bg-white border-b border-zinc-200 shadow-sm">
            <div className="flex h-16 w-full items-center justify-between px-4 sm:px-8 lg:px-10 gap-4">
              {/* Logo */}
              <div className="flex items-center shrink-0">
                <Link href="/listings" className="text-xl sm:text-2xl font-black tracking-tighter text-[#3252DF]">
                  FlamesPorium
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
              <nav className="flex items-center gap-4 shrink-0">
                <Show when="signed-out">
                  <SignUpButton mode="modal">
                    <Button className="rounded-full bg-[#3252DF] hover:bg-[#2842B3] text-white font-bold">
                      Sign Up
                    </Button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <Button className="rounded-full bg-[#3252DF] hover:bg-[#2842B3] text-white font-bold">
                      Log In
                    </Button>
                  </SignInButton>
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
                    <Link href="/chat" className="text-zinc-500 hover:text-black transition-colors">
                      <MessageSquare className="h-5 w-5" />
                    </Link>
                    <Link href="/cart" className="text-zinc-500 hover:text-black transition-colors">
                      <ShoppingCart className="h-5 w-5" />
                    </Link>
                    <UserButton />
                  </div>
                </Show>
              </nav>
            </div>

            {/* Bottom Row: Categories and Links */}
            <Show when="signed-in">
              <ClientNav />
            </Show>
          </header>

          <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
            {isUic ? (
              <div className="w-full">{children}</div>
            ) : (
              <div className="relative w-full max-w-md rounded-3xl border border-red-500/20 bg-white/80 dark:bg-zinc-900/80 p-8 shadow-2xl backdrop-blur-xl text-center space-y-6 overflow-hidden mx-4 my-8">
                {/* Background red glows */}
                <div className="absolute -top-24 -left-24 -z-10 h-48 w-48 rounded-full bg-red-600/10 blur-2xl" />
                <div className="absolute -bottom-24 -right-24 -z-10 h-48 w-48 rounded-full bg-rose-600/10 blur-2xl" />

                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 animate-pulse">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold tracking-tight">Access Restricted</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    FlamesPorium is a verified marketplace exclusively for UIC students. Only email addresses ending with <strong className="text-red-600 dark:text-red-400">@uic.edu</strong> are permitted to enter.
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-200/60 dark:border-zinc-800/65 text-xs text-zinc-500 space-y-1">
                  <p>You are signed in as:</p>
                  <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200 text-sm truncate">{email}</p>
                </div>

                <SignOutButton redirectUrl="/">
                  <Button variant="destructive" className="w-full rounded-full font-semibold shadow-lg shadow-destructive/25">
                    Sign Out & Try Again
                  </Button>
                </SignOutButton>
              </div>
            )}
          </main>
        </ClerkProvider>
      </body>
    </html>
  );
}

