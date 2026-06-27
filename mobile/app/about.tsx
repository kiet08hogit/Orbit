import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette, spacing, type } from '@/theme';
import { Screen, AppHeader, Divider } from '@/components/ui';
import { OrbitHero } from '@/components/OrbitHero';

const SECTIONS = [
  {
    eyebrow: 'WHY ORBIT',
    title: 'Campus is a closed loop. We treat it that way.',
    body: 'Every listing only reaches people on your campus. No bots, no out-of-town strangers, no shipping logistics — just an orbit of people you’ll see in class.',
  },
  {
    eyebrow: 'HOW WE STARTED',
    title: 'Built in a UIC dorm. Designed to leave it.',
    body: 'We needed a way to hand off a kayak, a desk chair, and three textbooks before the semester ended. Facebook Marketplace was full of strangers. Orbit was the smaller version we wished existed.',
  },
  {
    eyebrow: 'WHAT’S NEXT',
    title: 'More campuses. Same orbit logic.',
    body: 'We’re slowly opening to more universities. If yours isn’t live yet, tell us — we add new campuses based on which inboxes get the most loud requests.',
  },
];

export default function About() {
  return (
    <Screen scroll padded={false}>
      <AppHeader back title="About" />
      <View style={styles.hero}>
        <OrbitHero size={220} />
      </View>
      <View style={styles.body}>
        {SECTIONS.map((s, i) => (
          <React.Fragment key={s.title}>
            <Text style={[type.captionUpper, { color: palette.accent, marginBottom: spacing.xs }]}>
              {s.eyebrow}
            </Text>
            <Text style={[type.displayMd, { color: palette.foreground }]}>{s.title}</Text>
            <Text style={[type.bodyLg, { color: palette.body, marginTop: spacing.sm }]}>
              {s.body}
            </Text>
            {i < SECTIONS.length - 1 ? (
              <View style={{ marginVertical: spacing.xl }}>
                <Divider />
              </View>
            ) : null}
          </React.Fragment>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  body: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
