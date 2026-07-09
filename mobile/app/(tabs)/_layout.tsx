import React from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, MessageCircle, Sparkles, User, Users } from 'lucide-react-native';
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
        name="home"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color, focused }) => (
            <Home color={focused ? palette.foreground : color} size={20} strokeWidth={1.6} />
          ),
          tabBarLabel: ({ focused }) => <TabBarLabel label="HOME" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'COMMUNITY',
          tabBarIcon: ({ color, focused }) => (
            <Users color={focused ? palette.foreground : color} size={20} strokeWidth={1.6} />
          ),
          tabBarLabel: ({ focused }) => <TabBarLabel label="COMMUNITY" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="swipe"
        options={{
          title: 'MATCH',
          tabBarIcon: ({ color, focused }) => (
            <Sparkles color={focused ? palette.foreground : color} size={20} strokeWidth={1.6} />
          ),
          tabBarLabel: ({ focused }) => <TabBarLabel label="MATCH" focused={focused} />,
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
