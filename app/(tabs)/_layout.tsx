import { Tabs } from 'expo-router';
import { Grid3x3 as Grid3X3, MessageCircle, Search, Rss, Crown } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#5ce1e6',
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          backgroundColor: '#1A1A1A',
          borderTopWidth: 1,
          borderTopColor: '#2A2A2A',
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarShowLabel: false,
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ size, color }) => (
            <Grid3X3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ size, color }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ size, color }) => (
            <Search size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Feed',
          tabBarIcon: ({ size, color }) => (
            <Rss size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Premium',
          tabBarIcon: ({ size, color }) => (
            <Crown size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null, // This hides the tab from the tab bar
        }}
      />
    </Tabs>
  );
}