import type { Metadata } from "next";
import { ClerkProvider, Show } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { Shield } from "lucide-react";
import { ClientNav } from "./ClientNav";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { OnboardingCheck } from "@/components/OnboardingCheck";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { NavActions } from "@/components/NavActions";
import { GlobalNav } from "@/components/GlobalNav";

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
          <GlobalNav navActions={<NavActions />} />

          {/* Bottom Row: Categories and Links */}
          <Show when="signed-in">
            <ClientNav />
            <OnboardingCheck />
          </Show>

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

