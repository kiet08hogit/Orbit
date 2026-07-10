import React from 'react';
import { Tabs } from 'expo-router';
import { CategoryRail } from '@/components/CategoryRail';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={() => <CategoryRail />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'HOME' }} />
      <Tabs.Screen name="community" options={{ title: 'COMMUNITY' }} />
      <Tabs.Screen name="swipe" options={{ title: 'MATCH' }} />
      <Tabs.Screen name="chat" options={{ title: 'CHAT' }} />
      <Tabs.Screen name="profile" options={{ title: 'YOU' }} />
    </Tabs>
  );
}
