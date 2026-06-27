import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts as useInter, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts as useMono, JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { palette } from '@/theme';
import { tokenCache, clerkPublishableKey } from '@/lib/auth';
import { registerTokenGetter } from '@/lib/api';
import { connectSocket } from '@/lib/socket';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AuthBridge({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    registerTokenGetter(async () => {
      try {
        return await getToken();
      } catch {
        return null;
      }
    });
  }, [getToken]);

  useEffect(() => {
    (async () => {
      if (isSignedIn) {
        const token = await getToken();
        connectSocket(token);
      }
    })();
  }, [isSignedIn, getToken]);

  useEffect(() => {
    const inAuthGroup = segments[0] === 'sign-in' || segments[0] === 'onboarding';
    const isLanding = segments.length === 0 || segments[0] === undefined;
    if (!isSignedIn && !inAuthGroup && !isLanding) {
      // Only protect logged-in surfaces — landing/about/faqs stay public
      const protectedRoots = ['(tabs)', 'add-product', 'checkout', 'chat', 'wishlist'];
      if (protectedRoots.includes(segments[0] as string)) {
        router.replace('/sign-in');
      }
    }
  }, [isSignedIn, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [interReady] = useInter({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  const [monoReady] = useMono({
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (interReady && monoReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [interReady, monoReady]);

  if (!interReady || !monoReady) return null;

  // If Clerk key is missing, render without auth so devs can preview the UI.
  const inner = (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.background }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Slot />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );

  if (!clerkPublishableKey) {
    return inner;
  }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={clerkPublishableKey}>
      <ClerkLoaded>
        <AuthBridge>{inner}</AuthBridge>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
