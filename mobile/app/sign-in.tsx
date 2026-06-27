import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { palette, spacing, type } from '@/theme';
import { Screen, Button, Input } from '@/components/ui';
import { clerkPublishableKey } from '@/lib/auth';

const CLERK_ENABLED = !!clerkPublishableKey;

function ClerkSignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!isLoaded) return;
    setBusy(true);
    try {
      const attempt = await signIn.create({ identifier: email, password });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/(tabs)/listings');
      } else {
        Alert.alert('Almost there', 'Additional verification required.');
      }
    } catch (e) {
      Alert.alert('Could not sign in', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.form}>
      <Input
        label="EMAIL"
        placeholder="you@uic.edu"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <Input
        label="PASSWORD"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        containerStyle={{ marginTop: spacing.base }}
      />
      <Button
        label={busy ? 'Signing in…' : 'Sign in'}
        loading={busy}
        onPress={submit}
        fullWidth
        size="lg"
        style={{ marginTop: spacing.lg }}
      />
    </View>
  );
}

function MockSignIn() {
  const router = useRouter();
  return (
    <View style={styles.form}>
      <View style={styles.notice}>
        <Text style={[type.captionUpper, { color: palette.accent }]}>DEMO MODE</Text>
        <Text style={[type.bodySm, { color: palette.body, marginTop: spacing.xs }]}>
          Clerk publishable key not configured. Continue to preview the UI with mock data.
        </Text>
      </View>
      <Button
        label="Continue to app"
        onPress={() => router.replace('/(tabs)/listings')}
        fullWidth
        size="lg"
        style={{ marginTop: spacing.lg }}
      />
    </View>
  );
}

export default function SignInScreen() {
  return (
    <Screen scroll>
      <View style={styles.brand}>
        <Image
          source={require('@/assets/images/orbit-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[type.captionUpper, { color: palette.muted, marginTop: spacing.xs, letterSpacing: 2 }]}>
          ORBIT
        </Text>
      </View>

      <Text style={[type.displayLg, styles.title]}>
        Welcome back.
      </Text>
      <Text style={[type.bodyLg, styles.subtitle]}>
        Sign in to your campus orbit — pick up where you left off.
      </Text>

      {CLERK_ENABLED ? <ClerkSignIn /> : <MockSignIn />}

      <Pressable
        onPress={() => {/* link to sign-up flow */}}
        style={{ marginTop: spacing.xl, alignItems: 'center' }}
        hitSlop={8}
      >
        <Text style={[type.body, { color: palette.body }]}>
          New here? <Text style={{ color: palette.accent }}>Create an account</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  logo: { width: 56, height: 56 },
  title: {
    color: palette.foreground,
    letterSpacing: -0.6,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: palette.body,
    marginBottom: spacing.xl,
  },
  form: { marginTop: spacing.base },
  notice: {
    padding: spacing.base,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${palette.accent}44`,
    backgroundColor: `${palette.accent}11`,
  },
});
