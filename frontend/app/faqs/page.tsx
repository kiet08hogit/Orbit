import Link from "next/link";
import { ArrowLeft, ShoppingBag, ShieldCheck, CreditCard, Sparkles } from "lucide-react";

export default function FaqsPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] font-sans flex flex-col items-center">
      
      {/* Main Content */}
      <div className="w-full max-w-5xl px-6 py-24 md:py-32 flex flex-col gap-12">
        
        <Link href="/" className="flex items-center gap-2 text-[#7a7a7a] hover:text-[#1d1d1f] transition-colors w-fit font-normal text-[17px]">
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>

        <h1 className="text-[56px] md:text-[72px] font-semibold text-[#1d1d1f] tracking-tighter leading-[1.07] mb-4">
          Features & FAQs
        </h1>
        
        <p className="text-[21px] md:text-[28px] text-[#1d1d1f] font-normal leading-[1.14] tracking-tight max-w-2xl mb-8">
          Everything you need to know about buying, selling, and swapping on Circlo safely.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Feature 1: University Exclusive */}
          <div className="w-full bg-white rounded-[18px] border border-[#e0e0e0] shadow-sm p-8 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-12 bg-[#f5f5f7] rounded-full flex items-center justify-center mb-2">
              <ShieldCheck className="w-6 h-6 text-[#1d1d1f]" />
            </div>
            <h2 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">Verified Students Only</h2>
            <p className="text-[17px] text-[#7a7a7a] leading-[1.47] font-normal">
              Circlo is exclusively for the university community. Every user is verified using their student email address (like @uic.edu). This ensures you are meeting and trading with real students from your own campus.
            </p>
          </div>

          {/* Feature 2: Secure Payment & Meetup Code */}
          <div className="w-full bg-[#1d1d1f] rounded-[18px] shadow-sm p-8 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-12 bg-[#333333] rounded-full flex items-center justify-center mb-2">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-[28px] font-semibold text-white tracking-tight leading-tight">Secure Payment via Meetup Code</h2>
            <p className="text-[17px] text-[#cccccc] leading-[1.47] font-normal">
              No more sketchy cash handoffs. Pay securely through the app using Stripe. You&apos;ll receive a unique <strong>Meetup Code</strong>. The seller only gets paid after you meet up, verify the item, and hand them your code.
            </p>
          </div>

          {/* Feature 3: Campus Listings */}
          <div className="w-full bg-white rounded-[18px] border border-[#e0e0e0] shadow-sm p-8 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-12 bg-[#f5f5f7] rounded-full flex items-center justify-center mb-2">
              <ShoppingBag className="w-6 h-6 text-[#1d1d1f]" />
            </div>
            <h2 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">Local Campus Listings</h2>
            <p className="text-[17px] text-[#7a7a7a] leading-[1.47] font-normal">
              Explore a massive catalog of dorm essentials, textbooks, clothing, and event tickets. Since everything is local to your university, you can pick up items the exact same day without worrying about shipping fees.
            </p>
          </div>

          {/* Feature 4: Swipe to Match */}
          <div className="w-full bg-white rounded-[18px] border border-[#e0e0e0] shadow-sm p-8 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-12 bg-[#f5f5f7] rounded-full flex items-center justify-center mb-2">
              <Sparkles className="w-6 h-6 text-[#1d1d1f]" />
            </div>
            <h2 className="text-[28px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">Swipe to Match</h2>
            <p className="text-[17px] text-[#7a7a7a] leading-[1.47] font-normal">
              Finding items is actually fun. Use our Tinder-style swipe feature to quickly discover new listings. Swipe right to save an item to your wishlist, or swipe left to pass. Curate your campus aesthetic effortlessly.
            </p>
          </div>

        </div>

        {/* FAQ Section */}
        <div className="w-full flex flex-col gap-6 mt-16">
          <h2 className="text-[40px] font-semibold text-[#1d1d1f] tracking-tighter leading-[1.07] mb-2">
            Frequently Asked Questions
          </h2>

          <div className="flex flex-col gap-4">
            
            <div className="w-full bg-white rounded-[18px] border border-[#e0e0e0] shadow-sm p-6">
              <h3 className="text-[21px] font-semibold text-[#1d1d1f] tracking-tight mb-2">Is the platform free?</h3>
              <p className="text-[17px] text-[#7a7a7a] font-normal leading-[1.47]">
                Yes, it is completely free for all verified students to browse and list items. We want to keep money in the campus community.
              </p>
            </div>

            <div className="w-full bg-white rounded-[18px] border border-[#e0e0e0] shadow-sm p-6">
              <h3 className="text-[21px] font-semibold text-[#1d1d1f] tracking-tight mb-2">How does it work?</h3>
              <p className="text-[17px] text-[#7a7a7a] font-normal leading-[1.47]">
                You sign up with your university email, browse local listings or swipe through matches, and purchase items using our secure payment system. Then, you meet up on campus and exchange the Meetup Code to finalize the transaction.
              </p>
            </div>

            <div className="w-full bg-white rounded-[18px] border border-[#e0e0e0] shadow-sm p-6">
              <h3 className="text-[21px] font-semibold text-[#1d1d1f] tracking-tight mb-2">What if I don&apos;t have a .edu email?</h3>
              <p className="text-[17px] text-[#7a7a7a] font-normal leading-[1.47]">
                To maintain a secure and exclusive student environment, an active university email is strictly required. This ensures every user is a real student from your campus.
              </p>
            </div>

            <div className="w-full bg-white rounded-[18px] border border-[#e0e0e0] shadow-sm p-6">
              <h3 className="text-[21px] font-semibold text-[#1d1d1f] tracking-tight mb-2">How do payments work?</h3>
              <p className="text-[17px] text-[#7a7a7a] font-normal leading-[1.47]">
                We offer two payment methods to fit your needs. <strong>Direct Payment:</strong> You arrange payment entirely on your own (cash, Zelle, Venmo) when you meet the seller. <strong>Secure Payment:</strong> Handled seamlessly inside Circlo via Stripe. Your funds are held securely until you meet up and exchange a unique Meetup Code, protecting both the buyer and seller.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
