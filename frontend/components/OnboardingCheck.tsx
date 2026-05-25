'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';

export function OnboardingCheck() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // If not signed in or still loading, do nothing
    if (!isLoaded || !isSignedIn) return;

    // Do not redirect if we are already on the onboarding page
    if (pathname === '/onboarding') return;

    const checkOnboarding = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch('http://localhost:3000/users/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const dbUser = await res.json();
          // If the user exists but hasn't completed onboarding, redirect
          if (dbUser && dbUser.onboardingComplete === false) {
            router.push('/onboarding');
          }
        }
      } catch (e) {
        console.error("Failed to check onboarding status", e);
      }
    };

    checkOnboarding();
  }, [isLoaded, isSignedIn, pathname, getToken, router]);

  return null; // This component doesn't render anything
}
