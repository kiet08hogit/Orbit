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
import { Toaster } from "@/components/ui/sonner";
import { MiniChatWidget } from "@/components/MiniChatWidget";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Orbit | Verified Student Marketplace",
  description:
    "Buy, sell, and swap items safely with verified .edu student profiles.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  const isEdu = email ? email.endsWith(".edu") : true;

  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "font-sans",
        inter.variable,
        jetbrainsMono.variable,
      )}
      suppressHydrationWarning
    >
      <body className="h-full bg-background dark:bg-card text-[17px] text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        <ClerkProvider
          appearance={{
            layout: {
              socialButtonsPlacement: "bottom",
              socialButtonsVariant: "blockButton",
              logoImageUrl:
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="26" font-weight="900" fill="white">Orbit</text></svg>',
            },
            elements: {
              logoImage: "dark:invert-0 invert",
              formButtonPrimary:
                "bg-primary hover:opacity-90 text-primary-foreground transition-all",
              card: "bg-background text-foreground",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton:
                "border-border text-foreground hover:bg-secondary",
              socialButtonsBlockButtonText: "text-foreground font-semibold",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground",
              formFieldLabel: "text-foreground",
              formFieldInput:
                "bg-secondary border-border text-foreground focus:ring-primary",
              footerActionText: "text-muted-foreground",
              footerActionLink: "text-primary hover:text-primary",
            },
          }}
          localization={{
            formFieldInputPlaceholder__emailAddress: "you@uni.edu",
            signIn: {
              start: {
                title: "Sign in to Orbit",
                subtitle: "Welcome back! Please sign in to continue",
              },
            },
            signUp: {
              start: {
                title: "Create your Orbit account",
                subtitle: "Welcome! Please fill in the details to get started.",
              },
            },
          }}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <GlobalNav navActions={<NavActions />} />

            {/* Bottom Row: Categories and Links */}
            <Show when="signed-in">
              <ClientNav />
              <OnboardingCheck />
            </Show>

            {isEdu ? (
              <main className="min-h-[calc(100vh-4rem)] w-full bg-background dark:bg-card text-foreground">
                <div className="w-full min-h-full flex flex-col">
                  {children}
                </div>
              </main>
            ) : (
              <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background dark:bg-card text-foreground w-full">
                <div className="relative w-full max-w-md rounded-2xl border border-border bg-background shadow-xl text-center space-y-8 overflow-hidden mx-4 my-8 p-10">
                  {/* Background glows */}
                  <div className="absolute -top-24 -left-24 -z-10 h-48 w-48 rounded-full bg-primary/10 blur-[80px]" />
                  <div className="absolute -bottom-24 -right-24 -z-10 h-48 w-48 rounded-full bg-primary/10 blur-[80px]" />

                  <div className="flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/5 text-primary border border-[#3252DF]/10 shadow-none">
                      <Shield className="h-10 w-10" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-3xl font-black tracking-tight text-foreground">
                      @uni.edu Required
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed px-2">
                      Orbit is an exclusive marketplace for verified university
                      students. Please sign in with an email address ending in{" "}
                      <strong className="text-primary">.edu</strong> to join the
                      community.
                    </p>
                  </div>

                  <div className="rounded-xl bg-secondary p-4 border border-border text-xs text-muted-foreground space-y-1">
                    <p>You are currently signed in as:</p>
                    <p className="font-mono font-bold text-foreground text-sm truncate">
                      {email}
                    </p>
                  </div>

                  <div className="pt-2">
                    <DeleteAccountButton />
                  </div>
                </div>
              </main>
            )}
          </ThemeProvider>
          <MiniChatWidget />
          <Toaster />
        </ClerkProvider>
      </body>
    </html>
  );
}
