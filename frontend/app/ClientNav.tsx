"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const CATEGORIES = [
  { id: 'HOUSING', label: 'Dorm' },
  { id: 'CLOTHES', label: 'Clothes' },
  { id: 'SCHOOL', label: 'School' },
  { id: 'LEISURE', label: 'Leisure' },
  { id: 'ACCESSORIES', label: 'Accessories' },
  { id: 'OTHER', label: 'Other' },
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
    <div className="flex w-full items-center justify-center border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black z-40 relative px-4 py-2 transition-colors duration-300">
      <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const isActive = currentCategory === cat.id;
          return (
            <Link 
              key={cat.id}
              href={cat.id === 'ALL' ? '/home' : `/listings?category=${cat.id}`}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs md:text-sm tracking-wide flex items-center justify-center transition-colors duration-150 ${
                isActive 
                  ? 'bg-[#272343] text-white dark:bg-white dark:text-black font-semibold' 
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900 font-medium'
              }`}
            >
              {cat.label}
            </Link>
          );
        })}
        
        <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 mx-2 hidden sm:block shrink-0 transition-colors duration-300"></div>
        
        <Link 
          href="/community" 
          className={`whitespace-nowrap px-4 py-2 rounded-full text-xs md:text-sm tracking-wide flex items-center justify-center transition-colors duration-150 ${
            currentCategory === 'COMMUNITY' 
              ? 'bg-[#272343] text-white dark:bg-white dark:text-black font-semibold' 
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900 font-medium'
          }`}
        >
          Community
        </Link>
        
        <Link 
          href="/swipe" 
          className={`whitespace-nowrap px-4 py-2 rounded-full text-xs md:text-sm tracking-wide flex items-center justify-center transition-colors duration-150 ${
            currentCategory === 'SWIPE' 
              ? 'bg-[#272343] text-white dark:bg-white dark:text-black font-semibold' 
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900 font-medium'
          }`}
        >
          Match your needs
        </Link>
      </nav>
    </div>
  );
}


