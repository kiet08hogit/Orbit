import Link from "next/link";
import { ArrowLeft, ShoppingBag, ShieldCheck, CreditCard, Sparkles } from "lucide-react";

export default function FaqsPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-card font-sans flex flex-col items-center">
      
      {/* Main Content */}
      <div className="w-full max-w-5xl px-6 py-24 md:py-32 flex flex-col gap-12">
        
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit font-normal text-[17px]">
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>

        <h1 className="text-[56px] md:text-[72px] font-semibold text-foreground tracking-tighter leading-[1.07] mb-4">
          Features & FAQs
        </h1>
        
        <p className="text-[21px] md:text-[28px] text-foreground font-normal leading-[1.14] tracking-tight max-w-2xl mb-8">
          Everything you need to know about buying, selling, and swapping on Orbit safely.
        </p>

        {/* FAQ Section */}
        <div className="w-full flex flex-col gap-6">
          <h2 className="text-[40px] font-semibold text-foreground tracking-tighter leading-[1.07] mb-2">
            Frequently Asked Questions
          </h2>

          <div className="flex flex-col gap-4">
            
            <div className="w-full bg-card rounded-[18px] border border-border shadow-sm p-6">
              <h3 className="text-[21px] font-semibold text-foreground tracking-tight mb-2">Is the platform free?</h3>
              <p className="text-[17px] text-muted-foreground font-normal leading-[1.47]">
                Yes, it is completely free for all verified students to browse and list items. We want to keep money in the campus community.
              </p>
            </div>

            <div className="w-full bg-card rounded-[18px] border border-border shadow-sm p-6">
              <h3 className="text-[21px] font-semibold text-foreground tracking-tight mb-2">How does it work?</h3>
              <p className="text-[17px] text-muted-foreground font-normal leading-[1.47]">
                You sign up with your university email, browse local listings or swipe through matches, and purchase items using our secure payment system. Then, you meet up on campus and exchange the Meetup Code to finalize the transaction.
              </p>
            </div>

            <div className="w-full bg-card rounded-[18px] border border-border shadow-sm p-6">
              <h3 className="text-[21px] font-semibold text-foreground tracking-tight mb-2">What if I don&apos;t have a .edu email?</h3>
              <p className="text-[17px] text-muted-foreground font-normal leading-[1.47]">
                To maintain a secure and exclusive student environment, an active university email is strictly required. This ensures every user is a real student from your campus.
              </p>
            </div>

            <div className="w-full bg-card rounded-[18px] border border-border shadow-sm p-6">
              <h3 className="text-[21px] font-semibold text-foreground tracking-tight mb-2">How do payments work?</h3>
              <p className="text-[17px] text-muted-foreground font-normal leading-[1.47]">
                We offer two payment methods to fit your needs. <strong>Direct Payment:</strong> You arrange payment entirely on your own (cash, Zelle, Venmo) when you meet the seller. <strong>Secure Payment:</strong> Handled seamlessly inside Orbit via Stripe. Your funds are held securely until you meet up and exchange a unique Meetup Code, protecting both the buyer and seller.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
