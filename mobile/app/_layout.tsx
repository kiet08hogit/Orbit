import 'react-native-gesture-handler';
import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts as useInter, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts as useMono, JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { StripeProvider } from '@stripe/stripe-react-native';
import { palette, spacing, type } from '@/theme';
import { tokenCache, clerkPublishableKey, stripePublishableKey } from '@/lib/auth';
import { registerTokenGetter, usersApi } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Routes that require a signed-in session (mirrors the web app's guards).
const PROTECTED_ROOTS = [
  '(tabs)',
  'add-product',
  'checkout',
  'chat',
  'wishlist',
  'offers',
  'purchase-history',
  'settings',
  'notifications',
  'onboarding',
  'admin',
];

function AuthBridge({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const checkedRef = useRef(false);

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
      } else {
        disconnectSocket();
      }
    })();
  }, [isSignedIn, getToken]);

  // Onboarding gate — same as web's OnboardingCheck.
  useEffect(() => {
    if (!isSignedIn) {
      checkedRef.current = false;
      setOnboarded(null);
      return;
    }
    if (checkedRef.current) return;
    checkedRef.current = true;
    usersApi
      .me()
      .then((me) => setOnboarded(me.onboardingComplete !== false))
      .catch(() => setOnboarded(true)); // don't block the app if backend is unreachable
  }, [isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;
    const root = segments[0] as string | undefined;
    const inAuthGroup = root === 'sign-in' || root === 'sign-up';
    const isLanding = !root;

    if (!isSignedIn) {
      if (root && PROTECTED_ROOTS.includes(root)) {
        router.replace('/sign-in');
      }
      return;
    }

    // Signed in: keep them out of auth screens / marketing landing (web: / → /home).
    if (inAuthGroup || isLanding) {
      router.replace('/(tabs)/home');
      return;
    }

    if (onboarded === false && root !== 'onboarding') {
      router.replace('/onboarding');
    }
  }, [isLoaded, isSignedIn, onboarded, segments, router]);

  return <>{children}</>;
}

function MissingKeyScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
      }}
    >
      <Text style={[type.captionUpper, { color: palette.accent }]}>CONFIGURATION</Text>
      <Text style={[type.displaySm, { color: palette.foreground, marginTop: spacing.sm, textAlign: 'center' }]}>
        Clerk key missing
      </Text>
      <Text style={[type.body, { color: palette.body, marginTop: spacing.xs, textAlign: 'center' }]}>
        Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in mobile/.env and restart the dev server.
      </Text>
    </View>
  );
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

  if (!clerkPublishableKey) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <MissingKeyScreen />
      </SafeAreaProvider>
    );
  }

  let inner = (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.background }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Slot />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );

  if (stripePublishableKey) {
    inner = (
      <StripeProvider publishableKey={stripePublishableKey} merchantIdentifier="merchant.com.orbit.mobile">
        {inner}
      </StripeProvider>
    );
  }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={clerkPublishableKey}>
      <ClerkLoaded>
        <AuthBridge>{inner}</AuthBridge>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
