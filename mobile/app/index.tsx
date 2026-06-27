import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, Sparkles } from 'lucide-react-native';
import { palette, spacing, type } from '@/theme';
import { Button } from '@/components/ui';
import { OrbitHero } from '@/components/OrbitHero';
import { Meteors } from '@/components/Meteors';
import { ShinyText } from '@/components/ShinyText';

const HOW_IT_WORKS = [
  {
    eyebrow: 'Step one',
    title: 'List in a minute',
    body: 'Snap a photo. Add a price. We handle the rest of the form so you don’t have to.',
  },
  {
    eyebrow: 'Step two',
    title: 'Find your circle',
    body: 'Only people on your campus can see what you list. No bots, no out-of-town flakes.',
  },
  {
    eyebrow: 'Step three',
    title: 'Trade or ship safely',
    body: 'Protected payments let you transact with someone you’ve never met — or pay direct.',
  },
];

const STATS = [
  { value: '4.2k', label: 'STUDENTS' },
  { value: '11k', label: 'LISTED' },
  { value: '$92', label: 'AVG. SAVED' },
];

export default function Landing() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO ── */}
        <View style={styles.hero}>
          <Meteors count={4} />
          <View style={styles.heroNav}>
            <View style={styles.brand}>
              <Image
                source={require('@/assets/images/orbit-logo.png')}
                style={styles.brandLogo}
              />
              <Text style={[type.captionUpper, { color: palette.foreground, letterSpacing: 2 }]}>
                ORBIT
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/sign-in')}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.signInLink,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text style={[type.button, { color: palette.foreground }]}>Sign in</Text>
              <ArrowUpRight size={14} color={palette.foreground} strokeWidth={1.8} />
            </Pressable>
          </View>

          <View style={styles.heroBody}>
            <View style={styles.eyebrowPill}>
              <Sparkles size={12} color={palette.accent} strokeWidth={2} />
              <Text style={[type.captionUpper, { color: palette.accent, marginLeft: spacing.xxs }]}>
                NEW · BETA AT UIC
              </Text>
            </View>

            <Text style={[type.displayMega, styles.heroH1]}>
              Your campus,{'\n'}
              <ShinyText style={[type.displayMega, styles.heroH1Shine]}>in one orbit.</ShinyText>
            </Text>

            <Text style={[type.bodyLg, styles.heroSub]}>
              Buy, sell, and swap with the people you already share a campus with.
              No strangers, no spam — just the textbook, kayak, or desk chair you’re looking for.
            </Text>

            <View style={styles.heroOrbit}>
              <OrbitHero size={320} />
            </View>

            <View style={styles.heroCtas}>
              <Button
                label="Open the app"
                onPress={() => router.push('/listings')}
                fullWidth
                size="lg"
              />
              <Button
                label="See how it works"
                onPress={() => router.push('/about')}
                variant="ghost"
                size="lg"
                fullWidth
                iconRight={<ArrowUpRight size={16} color={palette.foreground} strokeWidth={1.5} />}
              />
            </View>

            {/* Stats strip */}
            <View style={styles.stats}>
              {STATS.map((s, i) => (
                <View key={s.label} style={[styles.statCell, i < STATS.length - 1 && styles.statBorder]}>
                  <Text style={[type.displayMd, { color: palette.foreground }]}>{s.value}</Text>
                  <Text style={[type.captionUpper, { color: palette.muted, marginTop: 2 }]}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Soft fade into the dark tile beneath */}
          <LinearGradient
            colors={[`${palette.background}00`, palette.background]}
            style={styles.heroFade}
            pointerEvents="none"
          />
        </View>

        {/* ── HOW IT WORKS ── */}
        <View style={styles.tile}>
          <Text style={[type.captionUpper, styles.tileEyebrow]}>HOW IT WORKS</Text>
          <Text style={[type.displayLg, styles.tileHeadline]}>
            Three quiet steps. Nothing clever.
          </Text>
          <View style={{ gap: spacing.lg, marginTop: spacing.xl }}>
            {HOW_IT_WORKS.map((s, i) => (
              <View key={s.title} style={styles.stepRow}>
                <Text style={[type.mono, { color: palette.accent }]}>
                  {String(i + 1).padStart(2, '0')}
                </Text>
                <View style={{ flex: 1, marginLeft: spacing.base }}>
                  <Text style={[type.captionUpper, { color: palette.muted, marginBottom: 4 }]}>
                    {s.eyebrow}
                  </Text>
                  <Text style={[type.displaySm, { color: palette.foreground }]}>
                    {s.title}
                  </Text>
                  <Text style={[type.body, { color: palette.body, marginTop: spacing.xs }]}>
                    {s.body}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── CTA BAND ── */}
        <View style={styles.ctaTile}>
          <Text style={[type.captionUpper, { color: palette.accent }]}>READY?</Text>
          <Text style={[type.displayLg, styles.ctaHeadline]}>
            Move your dorm. Find a TI-84. Hand off the kayak.
          </Text>
          <Button
            label="Get started"
            onPress={() => router.push('/sign-in')}
            fullWidth
            size="lg"
            style={{ marginTop: spacing.lg }}
          />
        </View>

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <Text style={[type.captionUpper, { color: palette.muted }]}>
            ORBIT · BUY · SELL · SWAP · 2026
          </Text>
          <View style={styles.footerLinks}>
            <Pressable onPress={() => router.push('/about')} hitSlop={8}>
              <Text style={[type.bodySm, { color: palette.body }]}>About</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/faqs')} hitSlop={8}>
              <Text style={[type.bodySm, { color: palette.body }]}>FAQs</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/sign-in')} hitSlop={8}>
              <Text style={[type.bodySm, { color: palette.body }]}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  hero: {
    paddingTop: 60,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xxl,
    position: 'relative',
    overflow: 'hidden',
  },
  heroNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  brandLogo: { width: 28, height: 28 },
  signInLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  heroBody: { gap: spacing.md },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${palette.accent}55`,
    backgroundColor: `${palette.accent}11`,
    marginBottom: spacing.xs,
  },
  heroH1: {
    color: palette.foreground,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -1.4,
  },
  heroH1Shine: {
    color: palette.foreground,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -1.4,
  },
  heroSub: {
    color: palette.body,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  heroOrbit: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  heroCtas: { gap: spacing.sm, marginTop: spacing.sm },
  stats: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: palette.hairline,
    paddingTop: spacing.lg,
  },
  statCell: { flex: 1 },
  statBorder: {
    borderRightWidth: 1,
    borderRightColor: palette.hairline,
  },
  heroFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  tile: {
    backgroundColor: palette.ink,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.section,
  },
  tileEyebrow: { color: palette.catThinking, marginBottom: spacing.sm },
  tileHeadline: { color: palette.foreground, letterSpacing: -0.5 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ctaTile: {
    backgroundColor: palette.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sectionLg,
    borderTopWidth: 1,
    borderTopColor: palette.hairline,
  },
  ctaHeadline: { color: palette.foreground, marginTop: spacing.sm, letterSpacing: -0.5 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: palette.hairline,
    gap: spacing.base,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
});
