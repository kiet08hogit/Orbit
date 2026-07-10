import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette, spacing, type } from '@/theme';
import { Input, Button, Pill } from '@/components/ui';
import { usersApi } from '@/lib/api';

const CLASS_YEARS = ['2026', '2027', '2028', '2029', '2030', 'Grad'];

export default function Onboarding() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [major, setMajor] = useState('');
  const [classYear, setClassYear] = useState('');
  const [university, setUniversity] = useState('');
  const [bio, setBio] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    usersApi
      .me()
      .then((me) => {
        if (me.onboardingComplete) {
          router.replace('/(tabs)/home');
          return;
        }
        if (me.name) setName(me.name);
        if (me.username) setUsername(me.username);
        if (me.university) setUniversity(me.university);
      })
      .catch(() => {});
  }, [router]);

  const submit = async () => {
    if (!name.trim() || !username.trim()) {
      Alert.alert('Almost there', 'Name and username are required.');
      return;
    }
    setBusy(true);
    try {
      await usersApi.updateMe({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        major: major.trim() || undefined,
        classYear: classYear || undefined,
        university: university.trim() || undefined,
        bio: bio.trim() || undefined,
        onboardingComplete: true,
      });
      router.replace('/(tabs)/home');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Try again.';
      Alert.alert(
        'Could not save profile',
        msg.includes('409') ? 'That username is taken — try another.' : msg,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[type.captionUpper, { color: palette.accent }]}>WELCOME TO ORBIT</Text>
        <Text style={[type.displayLg, styles.title]}>Set up your profile</Text>
        <Text style={[type.bodyLg, styles.subtitle]}>
          A real name and campus details help buyers and sellers trust you.
        </Text>

        <Input label="FULL NAME" placeholder="Jordan Kim" value={name} onChangeText={setName} />
        <Input
          label="USERNAME"
          placeholder="jordan.kim"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          containerStyle={{ marginTop: spacing.base }}
        />
        <Input
          label="UNIVERSITY"
          placeholder="University of Illinois Chicago"
          value={university}
          onChangeText={setUniversity}
          containerStyle={{ marginTop: spacing.base }}
        />
        <Input
          label="MAJOR"
          placeholder="Computer Science"
          value={major}
          onChangeText={setMajor}
          containerStyle={{ marginTop: spacing.base }}
        />

        <Text style={[type.captionUpper, styles.label, { marginTop: spacing.lg }]}>CLASS YEAR</Text>
        <View style={styles.pillRow}>
          {CLASS_YEARS.map((y) => (
            <Pill key={y} label={y} selected={classYear === y} onPress={() => setClassYear(y)} />
          ))}
        </View>

        <Input
          label="BIO"
          placeholder="What are you into? What do you usually sell?"
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={280}
          containerStyle={{ marginTop: spacing.lg }}
        />

        <Button
          label={busy ? 'Saving…' : 'Enter your orbit'}
          loading={busy}
          onPress={submit}
          size="lg"
          fullWidth
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.base, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  title: { color: palette.foreground, marginTop: spacing.xs, letterSpacing: -0.6 },
  subtitle: { color: palette.body, marginTop: spacing.xs, marginBottom: spacing.xl },
  label: { color: palette.muted, marginBottom: spacing.xs },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
