"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

const CATEGORIES = [
  { id: 'HOUSING', label: 'DORM' },
  { id: 'CLOTHES', label: 'CLOTHES' },
  { id: 'SCHOOL', label: 'SCHOOL' },
  { id: 'LEISURE', label: 'LEISURE' },
  { id: 'ACCESSORIES', label: 'ACCESSORIES' },
  { id: 'OTHER', label: 'OTHER' },
  { id: 'ALL', label: 'ALL PRODUCTS' },
];

export function ClientNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Try to get category from URL if we're on listings, else default to none
  const currentCategory = pathname === '/listings' 
    ? (searchParams.get('category') || 'ALL') 
    : '';

  // Only show the full navigation row if we are signed in and presumably on marketplace routes
  // But actually, we can show it globally since the layout dictates it.
  
  return (
    <div className="flex w-full items-center justify-center gap-8 border-t border-zinc-100 bg-white/50 px-4 py-2 backdrop-blur-sm">
      
      {/* Links */}
      <nav className="flex items-center gap-6 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const isActive = currentCategory === cat.id;
          return (
            <Link
              key={cat.id}
              href={`/listings?category=${cat.id}`}
              className={`whitespace-nowrap font-bold text-xs tracking-widest transition-colors ${
                isActive 
                  ? 'text-[#DC2626]' 
                  : 'text-zinc-500 hover:text-black'
              }`}
            >
              {cat.label}
            </Link>
          );
        })}
        
        <div className="w-px h-4 bg-zinc-300 mx-2 hidden sm:block"></div>
        
        <Link 
          href="/community" 
          className="whitespace-nowrap font-bold text-xs tracking-widest text-zinc-500 hover:text-[#3252DF] transition-colors"
        >
          COMMUNITY
        </Link>
        
        <Link 
          href="/swipe" 
          className="whitespace-nowrap font-bold text-xs tracking-widest text-zinc-500 hover:text-[#3252DF] transition-colors"
        >
          MATCH YOUR NEEDS
        </Link>
      </nav>

    </div>
  );
}
