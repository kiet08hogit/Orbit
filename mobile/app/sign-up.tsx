import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { palette, spacing, type } from '@/theme';
import { Screen, Button, Input } from '@/components/ui';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [busy, setBusy] = useState(false);

  const eduError =
    email.length > 3 && !email.trim().toLowerCase().endsWith('.edu')
      ? 'Orbit is for students — use your .edu email.'
      : undefined;

  const submit = async () => {
    if (!isLoaded) return;
    if (eduError) {
      Alert.alert('University email required', eduError);
      return;
    }
    setBusy(true);
    try {
      await signUp.create({ emailAddress: email.trim(), password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (e) {
      Alert.alert('Could not sign up', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!isLoaded) return;
    setBusy(true);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/onboarding');
      } else {
        Alert.alert('Almost there', 'Verification incomplete — check the code and try again.');
      }
    } catch (e) {
      Alert.alert('Invalid code', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

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

      {pendingVerification ? (
        <>
          <Text style={[type.displayLg, styles.title]}>Check your inbox</Text>
          <Text style={[type.bodyLg, styles.subtitle]}>
            We sent a 6-digit code to {email.trim()}.
          </Text>
          <Input
            label="VERIFICATION CODE"
            placeholder="123456"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
          />
          <Button
            label={busy ? 'Verifying…' : 'Verify and continue'}
            loading={busy}
            onPress={verify}
            fullWidth
            size="lg"
            style={{ marginTop: spacing.lg }}
          />
        </>
      ) : (
        <>
          <Text style={[type.displayLg, styles.title]}>Create your Orbit account</Text>
          <Text style={[type.bodyLg, styles.subtitle]}>
            Join your campus marketplace — .edu email required.
          </Text>
          <Input
            label="UNIVERSITY EMAIL"
            placeholder="you@uni.edu"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            error={eduError}
          />
          <Input
            label="PASSWORD"
            placeholder="At least 8 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
            textContentType="newPassword"
            containerStyle={{ marginTop: spacing.base }}
          />
          <Button
            label={busy ? 'Creating account…' : 'Create account'}
            loading={busy}
            onPress={submit}
            fullWidth
            size="lg"
            style={{ marginTop: spacing.lg }}
          />
        </>
      )}

      <Pressable
        onPress={() => router.replace('/sign-in')}
        style={{ marginTop: spacing.xl, alignItems: 'center' }}
        hitSlop={8}
      >
        <Text style={[type.body, { color: palette.body }]}>
          Already have an account? <Text style={{ color: palette.accent }}>Sign in</Text>
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
});
