import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { confirmAction, notify } from "../../lib/alerts";
import { identity, useAuth } from "../../lib/auth";
import { D, MAXW, SERIF } from "./theme";

export default function DonkeyAccount() {
  const router = useRouter();
  const { profile, session, signOut, updateTeamName } = useAuth();
  const isGuest = !session?.user.email;
  const { lead, handle, showHandle } = identity(profile);

  const [name, setName] = useState(profile?.display_name ?? "");
  const [saving, setSaving] = useState(false);
  const dirty = name.trim().length >= 3 && name.trim() !== (profile?.display_name ?? "");

  const onSaveName = async () => {
    setSaving(true);
    try { await updateTeamName(name.trim()); notify("Saved", "Your team name is updated."); }
    catch (e) { notify("Couldn't save", (e as Error).message); }
    finally { setSaving(false); }
  };
  const onSignOut = async () => {
    const msg = isGuest
      ? "This is a guest account — signing out starts a fresh one and you won't get back into this one."
      : "Sign out of DONKEY?";
    if (await confirmAction("Sign out", msg, "Sign out", true)) await signOut();
  };
  const back = () => (router.canGoBack() ? router.back() : router.replace("/donkey"));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: D.bg }} contentContainerStyle={{ paddingBottom: 48 }}>
      <View style={{ width: "100%", maxWidth: MAXW, alignSelf: "center", paddingHorizontal: 18 }}>
        <Pressable onPress={back} hitSlop={12} style={{ paddingTop: 16, paddingBottom: 4 }}>
          <Text style={{ fontSize: 22, color: D.ink }}>←</Text>
        </Pressable>

        <Text style={{ fontFamily: SERIF, fontSize: 12, letterSpacing: 1, color: D.soft, marginTop: 8 }}>YOUR ACCOUNT</Text>
        <Text style={{ fontFamily: SERIF, fontSize: 30, color: D.ink, marginTop: 4 }}>{lead}</Text>
        <Text style={{ fontSize: 12, color: D.soft, marginTop: 4 }}>{showHandle ? `@${handle} · ` : ""}{isGuest ? "Guest account" : session?.user.email}</Text>

        {/* team name */}
        <View style={{ borderWidth: 1, borderColor: D.line, borderRadius: 10, padding: 16, marginTop: 24, gap: 8 }}>
          <Text style={{ fontSize: 10.5, letterSpacing: 0.8, color: D.soft, fontWeight: "600" }}>TEAM NAME</Text>
          <Text style={{ fontSize: 12, color: D.soft }}>This is what everyone sees on the league table.</Text>
          <TextInput
            placeholder="Your team name" placeholderTextColor={D.faint}
            value={name} onChangeText={setName}
            style={{ borderWidth: 1, borderColor: D.line, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: D.ink, marginTop: 2 }}
          />
          <Pressable disabled={!dirty || saving} onPress={onSaveName}
            style={({ pressed }) => ({ borderRadius: 6, paddingVertical: 13, alignItems: "center", marginTop: 4, backgroundColor: dirty ? D.black : "transparent", borderWidth: dirty ? 0 : 1, borderColor: D.line, opacity: pressed ? 0.85 : 1 })}>
            {saving ? <ActivityIndicator color={dirty ? D.white : D.ink} /> : <Text style={{ fontSize: 14, fontWeight: "600", color: dirty ? D.white : D.soft }}>Save team name</Text>}
          </Pressable>
        </View>

        <Text style={{ fontSize: 11.5, color: D.soft, marginTop: 20, lineHeight: 17 }}>
          One account across both games — your Fantasy Fives team and DONKEY share this login.
        </Text>

        <Pressable onPress={onSignOut}
          style={({ pressed }) => ({ borderWidth: 1, borderColor: D.red, borderRadius: 6, paddingVertical: 14, alignItems: "center", marginTop: 24, opacity: pressed ? 0.85 : 1 })}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: D.red }}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
