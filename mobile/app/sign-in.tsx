import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { useWarmUpBrowser } from '@/hooks/useWarmUpBrowser';

WebBrowser.maybeCompleteAuthSession();
import { palette, spacing, type } from '@/theme';
import { Screen, Button, Input } from '@/components/ui';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  
  useWarmUpBrowser();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!isLoaded) return;
    setBusy(true);
    try {
      const attempt = await signIn.create({ identifier: email.trim(), password });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/(tabs)/home');
      } else {
        Alert.alert('Almost there', 'Additional verification required.');
      }
    } catch (e) {
      Alert.alert('Could not sign in', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  const onPressOAuth = React.useCallback(async () => {
    try {
      const { createdSessionId, setActive: setOAuthActive } = await startOAuthFlow();
      if (createdSessionId) {
        setOAuthActive!({ session: createdSessionId });
        router.replace('/(tabs)/home');
      }
    } catch (err) {
      console.error('OAuth error', err);
    }
  }, []);

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

      <Text style={[type.displayLg, styles.title]}>Sign in to Orbit</Text>
      <Text style={[type.bodyLg, styles.subtitle]}>
        Welcome back — the campus marketplace missed you.
      </Text>

      <View style={styles.form}>
        <Button
          label="Continue with Google"
          onPress={onPressOAuth}
          fullWidth
          size="lg"
          style={{ marginBottom: spacing.base, backgroundColor: '#4285F4' }}
        />
        <Text style={{ textAlign: 'center', marginBottom: spacing.base, color: palette.muted }}>OR</Text>

        <Input
          label="UNIVERSITY EMAIL"
          placeholder="you@uni.edu"
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

      <Pressable
        onPress={() => router.push('/sign-up')}
        style={{ marginTop: spacing.xl, alignItems: 'center' }}
        hitSlop={8}
      >
        <Text style={[type.body, { color: palette.body }]}>
          New here? <Text style={{ color: palette.accent }}>Create your Orbit account</Text>
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
});
