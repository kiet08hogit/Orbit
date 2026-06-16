import type { Metadata } from "next";
import { ClerkProvider, Show } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { Shield } from "lucide-react";
import { ClientNav } from "./ClientNav";
import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { OnboardingCheck } from "@/components/OnboardingCheck";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { NavActions } from "@/components/NavActions";
import { GlobalNav } from "@/components/GlobalNav";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: "Orbit | Verified UIC Student Marketplace",
  description: "Buy, sell, and swap items safely with verified @uic.edu student profiles.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  const isUic = email ? email.endsWith("@uic.edu") : true;

  return (
    <html lang="en" className={cn("h-full", "font-sans", inter.variable, jetbrainsMono.variable)} suppressHydrationWarning>
      <body className="h-full bg-background text-[17px] text-foreground antialiased selection:bg-primary selection:text-primary-foreground dark:bg-black dark:text-white">
        <ClerkProvider
          appearance={{
            layout: {
              socialButtonsPlacement: "top",
            },
            elements: {
              formButtonPrimary: "bg-[#272343] hover:bg-[#1A182D] text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200",
            }
          }}
        >
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <GlobalNav navActions={<NavActions />} />

            {/* Bottom Row: Categories and Links */}
            <Show when="signed-in">
              <ClientNav />
              <OnboardingCheck />
            </Show>

            <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-white text-zinc-900 w-full dark:bg-black dark:text-white">
              {isUic ? (
                <div className="w-full h-full flex flex-col">{children}</div>
              ) : (
                <div className="relative w-full max-w-md rounded-2xl border border-border bg-background shadow-xl text-center space-y-8 overflow-hidden mx-4 my-8 p-10 dark:bg-zinc-950 dark:border-zinc-800">
                  {/* Background glows */}
                  <div className="absolute -top-24 -left-24 -z-10 h-48 w-48 rounded-full bg-primary/10 blur-[80px]" />
                  <div className="absolute -bottom-24 -right-24 -z-10 h-48 w-48 rounded-full bg-primary/10 blur-[80px]" />

                  <div className="flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/5 text-primary border border-[#3252DF]/10 shadow-none">
                      <Shield className="h-10 w-10" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-3xl font-black tracking-tight text-foreground dark:text-white">UIC Email Required</h2>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed px-2 dark:text-zinc-400">
                      Orbit is an exclusive marketplace for verified UIC students. Please sign in with an email address ending in <strong className="text-primary dark:text-[#3b82f6]">@uic.edu</strong> to join the community.
                    </p>
                  </div>

                  <div className="rounded-xl bg-secondary p-4 border border-border text-xs text-muted-foreground space-y-1 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400">
                    <p>You are currently signed in as:</p>
                    <p className="font-mono font-bold text-foreground text-sm truncate dark:text-white">{email}</p>
                  </div>

                  <div className="pt-2">
                    <DeleteAccountButton />
                  </div>
                </div>
              )}
            </main>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

