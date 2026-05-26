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
  { id: 'ALL', label: 'HOME' },
];

export function ClientNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Hide the nav bar on individual listing detail pages
  if (pathname.match(/^\/listings\/.+$/)) {
    return null;
  }
  
  // Try to get category from URL if we're on listings, else default to none
  let currentCategory = '';
  if (pathname === '/listings') {
    currentCategory = searchParams.get('category') || '';
  } else if (pathname === '/home') {
    currentCategory = 'ALL';
  }

  // Only show the full navigation row if we are signed in and presumably on marketplace routes
  // But actually, we can show it globally since the layout dictates it.
  
  return (
    <div className="flex w-full items-center justify-center gap-8 border-b border-zinc-200 bg-white px-4 py-3 z-40 relative">
      
      {/* Links */}
      <nav className="flex items-center gap-6 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const isActive = currentCategory === cat.id;
          return (
            <Link
              key={cat.id}
              href={cat.id === 'ALL' ? '/home' : `/listings?category=${cat.id}`}
              className={`whitespace-nowrap font-semibold text-xs md:text-sm tracking-wide transition-colors ${
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
          className="whitespace-nowrap font-semibold text-xs md:text-sm tracking-wide text-zinc-500 hover:text-black transition-colors"
        >
          COMMUNITY
        </Link>
        
        <Link 
          href="/swipe" 
          className="whitespace-nowrap font-semibold text-xs md:text-sm tracking-wide text-zinc-500 hover:text-black transition-colors"
        >
          MATCH YOUR NEEDS
        </Link>
      </nav>

    </div>
  );
}
