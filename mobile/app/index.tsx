import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import {
  Banknote,
  Book,
  Glasses,
  MessageCircle,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
  TabletSmartphone,
  Users,
} from 'lucide-react-native';
import { cream, fontFamily, palette, spacing, radius } from '@/theme';
import { Globe } from '@/components/magicui/Globe';
import OrbitingCircles from '@/components/magicui/OrbitingCircles';

/**
 * Marketing landing — mirrors frontend/app/page.tsx section-for-section.
 * The app runs the web's dark theme, so the "What is Orbit?" band and the
 * sections below flip to the editorial cream canvas (DESIGN-cursor.md tokens),
 * exactly like the web's `dark:` variants.
 */
const FEATURES = [
  {
    icon: Users,
    title: 'Verified Students',
    body: 'Trade safely with peers using a verified .edu email.',
  },
  {
    icon: Banknote,
    title: 'Meetup Codes',
    body: 'Funds are held securely until you exchange the code in person.',
  },
  {
    icon: ShoppingBag,
    title: 'Campus Local',
    body: 'No shipping fees. Pick up your items the same day on campus.',
  },
  {
    icon: Sparkles,
    title: 'Swipe to Match',
    body: 'Tinder-style swiping makes discovering new listings fun.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Payment',
    body: 'Orbit Escrow ensures safe transactions & protects your money.',
  },
  {
    icon: MessageCircle,
    title: 'Real-Time Chat',
    body: 'No sketchy DMs. Keep communication safely inside the app.',
  },
];

const OFFERINGS: Array<{
  image: ImageSourcePropType;
  title: string;
  body: string;
  category?: string;
}> = [
  {
    image: require('@/assets/images/landing/goods.jpg'),
    title: 'Goods',
    body: 'Dorm, Clothing, School, and more',
  },
  {
    image: require('@/assets/images/landing/services.png'),
    title: 'Services',
    body: 'CS prep, all kinds of tutoring, resumes, and career larping, we\u2019ve got your back',
    category: 'SERVICES',
  },
  {
    image: require('@/assets/images/landing/sublease.jpg'),
    title: 'Subleases',
    body: 'Need a room or a sublet? Someone\u2019s got a spot',
    category: 'SUBLEASE',
  },
];

const CATEGORIES: Array<{
  image: ImageSourcePropType;
  label: string;
  category: string;
}> = [
  { image: require('@/assets/images/landing/dorm.jpg'), label: 'Dorms', category: 'DORM' },
  { image: require('@/assets/images/landing/school-supplies.jpg'), label: 'School Supplies', category: 'SCHOOL' },
  { image: require('@/assets/images/landing/electronics.jpg'), label: 'Electronics', category: 'OTHER' },
  { image: require('@/assets/images/landing/clothing.jpg'), label: 'Clothing', category: 'CLOTHES' },
  { image: require('@/assets/images/landing/rave.jpg'), label: 'Event Tickets', category: 'LEISURE' },
  { image: require('@/assets/images/landing/accessories.jpg'), label: 'Accessories', category: 'ACCESSORIES' },
];

export default function Landing() {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const browse = (category?: string) =>
    router.push(category ? `/listings?category=${category}` : '/listings');

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── HERO ── */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            Find What You Need On Campus with Orbit
          </Text>
          <Text style={styles.heroSubtitle}>
            Buy. Sell.{'\n'}Swap in your uni community.
          </Text>

          <View style={styles.heroCtas}>
            {isSignedIn ? (
              <Pressable
                onPress={() => router.push('/add-product')}
                accessibilityRole="button"
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              >
                <Text style={styles.primaryBtnLabel}>Sell an Item</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => router.push('/sign-up')}
                accessibilityRole="button"
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              >
                <Text style={styles.primaryBtnLabel}>Join The Community</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => router.push('/faqs')}
              accessibilityRole="button"
              style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
            >
              <Text style={styles.ghostBtnLabel}>FAQs &gt;</Text>
            </Pressable>
          </View>

          {/* Interactive 3D globe centerpiece */}
          <View style={styles.heroGlobe}>
            <Globe size={340} />
          </View>
        </View>

        {/* ── WHAT IS ORBIT? — cream band, mirrors web dark: variant ── */}
        <View style={styles.creamBand}>
          <View style={styles.section}>
            <Text style={styles.bandTitle}>What is Orbit?</Text>
            <Text style={styles.bandLede}>
              Orbit is the student exclusive marketplace to buy, sell, and swap
              anything. Stop making big companies richer, make your friends rich
              instead, all you need to do is to Orbit it.
            </Text>

            <View style={styles.featureList}>
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <View key={title} style={styles.featureRow}>
                  <View style={styles.featureIcon}>
                    <Icon size={16} color={palette.accent} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.featureTitle}>{title}</Text>
                    <Text style={styles.featureBody}>{body}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Find your items — orbiting circles display */}
          <View style={styles.orbitDisplay}>
            <View style={styles.orbitHeading}>
              <Text style={styles.orbitTitle}>Find your items</Text>
              <Text style={styles.orbitSubtitle}>
                Buying and selling in your community has never been this easy
              </Text>
            </View>
            <View style={styles.orbitStage}>
              <OrbitingCircles radius={70} duration={25} delay={20} size={50} pathColor="rgba(0,0,0,0.2)">
                <TabletSmartphone size={34} color={cream.ink} strokeWidth={1.6} />
              </OrbitingCircles>
              <OrbitingCircles radius={70} duration={25} delay={10} size={50} path={false}>
                <Book size={30} color={cream.ink} strokeWidth={1.6} />
              </OrbitingCircles>
              <OrbitingCircles radius={130} duration={35} reverse size={60} pathColor="rgba(0,0,0,0.2)">
                <Shirt size={34} color={cream.ink} strokeWidth={1.6} />
              </OrbitingCircles>
              <OrbitingCircles radius={130} duration={35} delay={17} reverse size={60} path={false}>
                <Glasses size={34} color={cream.ink} strokeWidth={1.6} />
              </OrbitingCircles>
            </View>
          </View>

          {/* ── COMMUNITY OFFERING ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitleCenter}>
              See what&apos;s popping around your uni community
            </Text>
            <View style={{ gap: spacing.xl }}>
              {OFFERINGS.map((o) => (
                <Pressable
                  key={o.title}
                  onPress={() => browse(o.category)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.offeringCard, pressed && styles.pressed]}
                >
                  <View style={styles.offeringImageWrap}>
                    <Image source={o.image} style={styles.cover} resizeMode="cover" />
                  </View>
                  <Text style={styles.offeringTitle}>{o.title}</Text>
                  <Text style={styles.offeringBody}>{o.body}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── SHOP BY CATEGORY ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.label}
                  onPress={() => browse(cat.category)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.categoryCell, pressed && styles.pressed]}
                >
                  <View style={styles.categoryImageWrap}>
                    <Image source={cat.image} style={styles.cover} resizeMode="cover" />
                  </View>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── SHOP BY CAMPUS ── */}
          <View style={[styles.section, { marginBottom: spacing.xl }]}>
            <Text style={styles.sectionTitle}>We are launching at:</Text>
            <View style={{ gap: spacing.xl }}>
              <View>
                <View style={styles.campusImageWrap}>
                  <Image
                    source={require('@/assets/images/landing/uic.webp')}
                    style={styles.cover}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.campusLabel}>University of Illinois Chicago</Text>
              </View>
              <View style={{ opacity: 0.85 }}>
                <View style={styles.campusImageWrap}>
                  <Image
                    source={require('@/assets/images/landing/uiuc.jpg')}
                    style={styles.cover}
                    resizeMode="cover"
                  />
                  <View style={styles.campusOverlay}>
                    <View style={styles.comingSoonPill}>
                      <Text style={styles.comingSoonLabel}>Coming Soon</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.campusLabel}>
                  University of Illinois Urbana-Champaign
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <Image
              source={require('@/assets/images/orbit-logo.png')}
              style={styles.footerLogo}
              resizeMode="contain"
            />
            <Text style={styles.footerWordmark}>Orbit</Text>
          </View>

          <View style={styles.footerCols}>
            <View style={styles.footerCol}>
              <Text style={styles.footerHeading}>ENGINEERS</Text>
              <Text style={styles.footerLink}>Nguyen Tuan Kiet Ho</Text>
              <Text style={styles.footerLink}>Minh Khoa Cao</Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerHeading}>COMPANY</Text>
              <Pressable onPress={() => router.push('/about')} hitSlop={8}>
                <Text style={styles.footerLink}>About Us</Text>
              </Pressable>
              <Text style={styles.footerLink}>Policy &amp; Terms</Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerHeading}>SOCIALS</Text>
              <Text style={styles.footerLink}>Instagram</Text>
              <Text style={styles.footerLink}>LinkedIn</Text>
              <Text style={styles.footerLink}>Email</Text>
            </View>
          </View>

          <View style={styles.footerBottom}>
            <Text style={styles.footerCopy}>
              © {new Date().getFullYear()} Orbit. All rights reserved.
            </Text>
            <Pressable onPress={() => router.push('/sign-in')} hitSlop={8}>
              <Text style={[styles.footerLink, { color: palette.foreground }]}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  cover: { width: '100%', height: '100%' },

  /* Hero */
  hero: {
    paddingTop: 88,
    paddingHorizontal: spacing.base,
    alignItems: 'center',
    backgroundColor: palette.background,
  },
  heroTitle: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -1.6,
    textAlign: 'center',
    color: palette.foreground,
    marginBottom: spacing.base,
  },
  heroSubtitle: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 21,
    lineHeight: 24,
    letterSpacing: -0.4,
    textAlign: 'center',
    color: palette.foreground,
    marginBottom: spacing.xl + spacing.xs,
  },
  heroCtas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
    zIndex: 2,
  },
  primaryBtn: {
    backgroundColor: palette.accent,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnLabel: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 16,
    color: palette.onAccent,
  },
  ghostBtn: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: radius.md,
  },
  ghostBtnLabel: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 16,
    color: palette.foreground,
  },
  heroGlobe: {
    height: 400,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -spacing.sm,
  },

  /* Cream band (web dark: variant) */
  creamBand: {
    backgroundColor: cream.canvas,
    borderTopWidth: 1,
    borderTopColor: cream.hairline,
    paddingTop: spacing.section,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.section,
  },
  bandTitle: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.6,
    color: cream.ink,
    marginBottom: spacing.lg,
  },
  bandLede: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 19,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: cream.body,
  },
  featureList: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: cream.hairline,
    gap: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: cream.card,
    borderWidth: 1,
    borderColor: cream.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
    lineHeight: 18,
    color: cream.ink,
    marginBottom: 2,
  },
  featureBody: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 17,
    color: cream.muted,
  },

  /* Orbiting circles display */
  orbitDisplay: {
    marginBottom: spacing.section,
    alignItems: 'center',
  },
  orbitHeading: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  orbitTitle: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -1,
    color: cream.ink,
    textAlign: 'center',
  },
  orbitSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 22,
    color: cream.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  orbitStage: {
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Community offering */
  sectionTitleCenter: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.8,
    color: cream.ink,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  offeringCard: { alignItems: 'center' },
  offeringImageWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: cream.hairline,
    marginBottom: spacing.base,
  },
  offeringTitle: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 20,
    lineHeight: 26,
    color: cream.ink,
    marginBottom: 2,
  },
  offeringBody: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 19,
    color: cream.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },

  /* Category grid */
  sectionTitle: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.8,
    color: cream.ink,
    marginBottom: spacing.lg,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
  },
  categoryCell: {
    width: '47%',
  },
  categoryImageWrap: {
    aspectRatio: 4 / 3,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: cream.card,
    borderWidth: 1,
    borderColor: cream.hairline,
    marginBottom: spacing.sm,
  },
  categoryLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
    lineHeight: 18,
    color: cream.ink,
    textAlign: 'center',
  },

  /* Campus */
  campusImageWrap: {
    width: '100%',
    height: 192,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: cream.card,
    borderWidth: 1,
    borderColor: cream.hairline,
    marginBottom: spacing.sm,
  },
  campusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  comingSoonPill: {
    backgroundColor: cream.ink,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  comingSoonLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
    color: '#ffffff',
  },
  campusLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 16,
    lineHeight: 22,
    color: cream.ink,
    textAlign: 'center',
  },

  /* Footer */
  footer: {
    backgroundColor: palette.background,
    borderTopWidth: 1,
    borderTopColor: palette.hairline,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  footerLogo: { width: 56, height: 56 },
  footerWordmark: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 22,
    letterSpacing: -0.8,
    color: palette.foreground,
    marginLeft: -4,
  },
  footerCols: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  footerCol: { gap: spacing.sm, minWidth: 140 },
  footerHeading: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
    letterSpacing: 0.8,
    color: palette.foreground,
    marginBottom: 2,
  },
  footerLink: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 18,
    color: palette.muted,
  },
  footerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xxl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.hairline,
  },
  footerCopy: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    color: palette.muted,
  },
});
