import { Stack } from "expo-router";
import { D } from "./theme";

export default function DonkeyLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: D.bg } }} />;
}
