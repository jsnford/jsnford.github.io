import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { notify } from "../../lib/alerts";
import { useAuth } from "../../lib/auth";
import { D, MAXW, SERIF } from "./theme";

export default function DonkeyLogin() {
  const { signInAsGuest, signInWithGoogle, signInWithEmail } = useAuth();
  const [busy, setBusy] = useState<null | "google" | "guest" | "email">(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const run = async (kind: "google" | "guest", fn: () => Promise<void>) => {
    setBusy(kind);
    try { await fn(); } catch (e) { notify("Sign-in failed", (e as Error).message); } finally { setBusy(null); }
  };
  const onEmail = async () => {
    const e = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(e)) { notify("Check your email", "Enter a valid email address."); return; }
    setBusy("email");
    try { await signInWithEmail(e); setSent(true); }
    catch (err) { notify("Couldn't send link", (err as Error).message); }
    finally { setBusy(null); }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: D.bg }} contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
      <View style={{ width: "100%", maxWidth: MAXW, alignSelf: "center", paddingHorizontal: 26, paddingVertical: 40 }}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 46 }}>🫏</Text>
          <Text style={{ fontFamily: SERIF, fontSize: 26, letterSpacing: 4, color: D.ink, marginTop: 4 }}>DONKEY</Text>
        </View>
        <Text style={{ fontFamily: SERIF, fontSize: 20, color: D.ink, textAlign: "center", marginTop: 28, lineHeight: 28 }}>
          Back a player each week.{"\n"}Miss your chances — you're the donkey.
        </Text>
        <Text style={{ fontSize: 12, color: D.soft, textAlign: "center", marginTop: 12, lineHeight: 18 }}>
          Pick one player from the featured game. Whoever wastes the most chances gets a letter. Spell D-O-N-K-E-Y and you're out.
        </Text>

        <View style={{ marginTop: 34, gap: 12 }}>
          <Pressable onPress={() => run("google", signInWithGoogle)}
            style={({ pressed }) => ({ backgroundColor: D.black, borderRadius: 6, paddingVertical: 15, alignItems: "center", opacity: pressed ? 0.85 : 1 })}>
            {busy === "google" ? <ActivityIndicator color={D.white} /> : <Text style={{ color: D.white, fontSize: 14, fontWeight: "600" }}>Continue with Google</Text>}
          </Pressable>

          {sent ? (
            <View style={{ paddingVertical: 6 }}>
              <Text style={{ fontFamily: SERIF, fontSize: 15, color: D.ink, textAlign: "center" }}>Check your email</Text>
              <Text style={{ fontSize: 12, color: D.soft, textAlign: "center", marginTop: 4 }}>We sent a magic link to {email.trim()}.</Text>
            </View>
          ) : (
            <>
              <TextInput
                placeholder="you@email.com" placeholderTextColor={D.faint}
                autoCapitalize="none" autoCorrect={false} keyboardType="email-address"
                value={email} onChangeText={setEmail}
                style={{ borderWidth: 1, borderColor: D.line, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: D.ink }}
              />
              <Pressable onPress={onEmail}
                style={({ pressed }) => ({ borderWidth: 1, borderColor: D.line, borderRadius: 6, paddingVertical: 14, alignItems: "center", opacity: pressed ? 0.85 : 1 })}>
                {busy === "email" ? <ActivityIndicator color={D.ink} /> : <Text style={{ color: D.ink, fontSize: 14, fontWeight: "600" }}>Email me a magic link</Text>}
              </Pressable>
            </>
          )}

          <Pressable onPress={() => run("guest", signInAsGuest)} style={{ paddingVertical: 8, alignItems: "center" }}>
            <Text style={{ color: D.soft, fontSize: 13, fontWeight: "600" }}>{busy === "guest" ? "…" : "Continue as guest"}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
