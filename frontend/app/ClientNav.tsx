"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const CATEGORIES = [
  { id: 'HOUSING', label: 'Dorm/Sublease' },
  { id: 'CLOTHES', label: 'Clothing' },
  { id: 'SCHOOL', label: 'School' },
  { id: 'LEISURE', label: 'Leisure' },
  { id: 'ACCESSORIES', label: 'Accessories' },
  { id: 'OTHER', label: 'Other' },
  { id: 'SERVICES', label: 'Services' },
  { id: 'ALL', label: 'Home' },
];

export function ClientNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Hide the nav bar on individual listing detail pages and chat
  if (pathname.match(/^\/listings\/.+$/) || pathname.startsWith('/chat')) {
    return null;
  }
  
  let currentCategory = '';
  if (pathname === '/listings') {
    currentCategory = searchParams.get('category') || '';
  } else if (pathname === '/home') {
    currentCategory = 'ALL';
  } else if (pathname === '/community') {
    currentCategory = 'COMMUNITY';
  } else if (pathname === '/swipe') {
    currentCategory = 'SWIPE';
  }

  return (
    <div className="flex w-full items-center justify-center border-b border-border bg-background z-40 relative px-4 py-2 transition-colors duration-300">
      <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const isActive = currentCategory === cat.id;
          return (
            <Link 
              key={cat.id}
              href={cat.id === 'ALL' ? '/home' : `/listings?category=${cat.id}`}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs md:text-sm tracking-wide flex items-center justify-center transition-colors duration-150 ${
                isActive 
                  ? 'bg-primary text-primary-foreground font-semibold' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary font-medium'
              }`}
            >
              {cat.label}
            </Link>
          );
        })}
        
        <div className="w-px h-6 bg-border mx-2 hidden sm:block shrink-0 transition-colors duration-300"></div>
        
        <Link 
          href="/swipe" 
          className={`whitespace-nowrap px-4 py-2 rounded-full text-xs md:text-sm tracking-wide flex items-center justify-center transition-colors duration-150 ${
            currentCategory === 'SWIPE' 
              ? 'bg-primary text-primary-foreground font-semibold' 
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary font-medium'
          }`}
        >
          Match your needs
        </Link>
      </nav>
    </div>
  );
}


