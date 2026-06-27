import React, { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { palette, spacing, type } from '@/theme';
import { Screen, AppHeader, Divider } from '@/components/ui';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ = [
  {
    q: 'Who can see my listings?',
    a: 'Only verified students on your campus. We use your school email through Clerk to gate access — outside accounts never see what you post.',
  },
  {
    q: 'How does the protected payment work?',
    a: 'Orbit holds the payment via Stripe Connect until the buyer confirms pickup. If something’s wrong, they have 24 hours to flag — funds release otherwise.',
  },
  {
    q: 'Can I sell digital things or services?',
    a: 'Right now Orbit is for physical, campus-pickup items. We’re testing services (tutoring, rides) on a few campuses.',
  },
  {
    q: 'What happens to listings that don’t sell?',
    a: 'They stay live for 30 days, then archive automatically. You can re-list with one tap from your profile.',
  },
  {
    q: 'Is Orbit free?',
    a: 'Free to list and free to message. We take a 3% cut only on protected payments — direct trades never cost anything.',
  },
];

export default function FAQs() {
  const [open, setOpen] = useState<number | null>(0);
  const toggle = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((cur) => (cur === i ? null : i));
  };

  return (
    <Screen scroll padded={false}>
      <AppHeader back title="FAQs" />
      <View style={styles.body}>
        <Text style={[type.displayLg, { color: palette.foreground, marginBottom: spacing.xs }]}>
          Questions, answered briefly.
        </Text>
        <Text style={[type.bodyLg, { color: palette.body, marginBottom: spacing.xl }]}>
          Still stuck? Open a chat from your profile and we’ll respond same-day.
        </Text>

        {FAQ.map((item, i) => (
          <React.Fragment key={item.q}>
            <Pressable
              onPress={() => toggle(i)}
              style={styles.row}
              accessibilityRole="button"
              accessibilityLabel={item.q}
              accessibilityState={{ expanded: open === i }}
            >
              <Text style={[type.titleMd, { color: palette.foreground, flex: 1 }]}>{item.q}</Text>
              <ChevronDown
                color={palette.muted}
                size={18}
                strokeWidth={1.6}
                style={{ transform: [{ rotate: open === i ? '180deg' : '0deg' }] }}
              />
            </Pressable>
            {open === i ? (
              <Text style={[type.body, { color: palette.body, marginBottom: spacing.lg }]}>
                {item.a}
              </Text>
            ) : null}
            <Divider strength="soft" />
          </React.Fragment>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
  },
});
