import * as SecureStore from 'expo-secure-store';

/**
 * Clerk-Expo token cache backed by expo-secure-store.
 * Pass to <ClerkProvider tokenCache={tokenCache} /> in app/_layout.tsx.
 */
export const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // ignore — Secure Store may be unavailable on web
    }
  },
};

export const clerkPublishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
