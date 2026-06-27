import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Compass, Heart, MessageCircle, Sparkles, User } from 'lucide-react-native';
import { palette, spacing, type } from '@/theme';

function TabBarLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={[
        type.monoSm,
        { color: focused ? palette.foreground : palette.muted, marginTop: 2 },
      ]}
    >
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.foreground,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: styles.bar,
        tabBarItemStyle: styles.item,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="listings"
        options={{
          title: 'BROWSE',
          tabBarIcon: ({ color, focused }) => (
            <Compass color={focused ? palette.foreground : color} size={20} strokeWidth={1.6} />
          ),
          tabBarLabel: ({ focused }) => <TabBarLabel label="BROWSE" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="swipe"
        options={{
          title: 'DISCOVER',
          tabBarIcon: ({ color, focused }) => (
            <Sparkles color={focused ? palette.foreground : color} size={20} strokeWidth={1.6} />
          ),
          tabBarLabel: ({ focused }) => <TabBarLabel label="DISCOVER" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'CHAT',
          tabBarIcon: ({ color, focused }) => (
            <MessageCircle color={focused ? palette.foreground : color} size={20} strokeWidth={1.6} />
          ),
          tabBarLabel: ({ focused }) => <TabBarLabel label="CHAT" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'SAVED',
          tabBarIcon: ({ color, focused }) => (
            <Heart color={focused ? palette.foreground : color} size={20} strokeWidth={1.6} />
          ),
          tabBarLabel: ({ focused }) => <TabBarLabel label="SAVED" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'YOU',
          tabBarIcon: ({ color, focused }) => (
            <User color={focused ? palette.foreground : color} size={20} strokeWidth={1.6} />
          ),
          tabBarLabel: ({ focused }) => <TabBarLabel label="YOU" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: palette.background,
    borderTopWidth: 1,
    borderTopColor: palette.hairline,
    height: Platform.select({ ios: 84, default: 68 }),
    paddingTop: spacing.xs,
    paddingBottom: Platform.select({ ios: 24, default: 8 }),
  },
  item: { gap: 2 },
});
