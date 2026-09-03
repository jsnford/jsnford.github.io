import { Tabs } from "expo-router";
import { View, type ColorValue } from "react-native";
import { useColors } from "../../theme/tokens";

// Minimal tab bar — a small dot indicator instead of icons (no imagery yet).
function Dot({ color }: { color: ColorValue }) {
  return <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />;
}

export default function TabsLayout() {
  const c = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textFaint,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.line, maxWidth: 420, width: "100%", alignSelf: "center" },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "500" },
        tabBarIcon: ({ color }) => <Dot color={color} />,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="team" options={{ title: "Team" }} />
      <Tabs.Screen name="standings" options={{ title: "Standings" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
