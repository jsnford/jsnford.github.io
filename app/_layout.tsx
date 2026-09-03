import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AlertHost } from "../lib/alerts";
import { AuthProvider, useAuth } from "../lib/auth";
import { useColors } from "../theme/tokens";

// Build target: "fives" (default) or "donkey". The DONKEY build shares the same
// Supabase account backend but boots straight into the DONKEY experience.
const APP = process.env.EXPO_PUBLIC_APP === "donkey" ? "donkey" : "fives";

function Gate() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const c = useColors();

  useEffect(() => {
    if (loading) return;
    const seg = segments as string[];
    const inAuth = seg[0] === "(auth)";
    const inDonkey = seg[0] === "donkey";                       // DONKEY is its own entry
    const donkeyAuth = inDonkey && (seg[1] === "login" || seg[1] === "onboarding");
    const onCreateProfile = seg[1] === "create-profile";

    // Standalone DONKEY build: force the DONKEY experience (own URL, shared login).
    if (APP === "donkey") {
      if (!session) { if (!donkeyAuth) router.replace("/donkey/login"); }
      else if (!profile) { if (seg[1] !== "onboarding") router.replace("/donkey/onboarding"); }
      else if (!inDonkey || donkeyAuth) router.replace("/donkey");
      return;
    }

    if (!session) {
      // Unauthenticated: DONKEY routes get DONKEY's login; everything else, Fives'.
      if (inDonkey && !donkeyAuth) router.replace("/donkey/login");
      else if (!inAuth && !inDonkey) router.replace("/(auth)/login");
    } else if (!profile) {
      // Signed in, no team name yet — brand the onboarding to where they are.
      if (inDonkey && seg[1] !== "onboarding") router.replace("/donkey/onboarding");
      else if (!inDonkey && !onCreateProfile) router.replace("/(auth)/create-profile");
    } else {
      if (inAuth) router.replace("/(tabs)");
      else if (donkeyAuth) router.replace("/donkey");           // already in — skip DONKEY auth
    }
  }, [session, profile, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="player/[id]" options={{ headerShown: true, title: "Player" }} />
      <Stack.Screen name="gw/[gw]" options={{ headerShown: true, title: "Gameweek", headerBackTitle: "Back" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <Gate />
        <AlertHost />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
