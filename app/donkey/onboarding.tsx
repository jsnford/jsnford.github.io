import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useAuth } from "../../lib/auth";
import { D, MAXW, SERIF } from "./theme";

export default function DonkeyOnboarding() {
  const { saveProfile } = useAuth();
  const [teamName, setTeamName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const onContinue = async () => {
    const t = teamName.trim(), u = username.trim();
    if (t.length < 3) { setError("Give your team a name (at least 3 characters)."); return; }
    if (u.length < 3) { setError("Pick a username of at least 3 characters."); return; }
    setError(undefined); setBusy(true);
    try { await saveProfile({ username: u, teamName: t }); }
    catch (e) { const m = (e as Error).message; setError(m.includes("duplicate") ? "That username is taken." : m); }
    finally { setBusy(false); }
  };

  const field = (label: string, value: string, onChange: (s: string) => void, placeholder: string, lower?: boolean) => (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 10.5, letterSpacing: 0.8, color: D.soft, fontWeight: "600" }}>{label}</Text>
      <TextInput
        placeholder={placeholder} placeholderTextColor={D.faint}
        autoCapitalize={lower ? "none" : "words"} autoCorrect={false}
        value={value} onChangeText={onChange}
        style={{ borderWidth: 1, borderColor: D.line, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: D.ink }}
      />
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: D.bg }} contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
      <View style={{ width: "100%", maxWidth: MAXW, alignSelf: "center", paddingHorizontal: 26, paddingVertical: 40 }}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 40 }}>🫏</Text>
        </View>
        <Text style={{ fontFamily: SERIF, fontSize: 26, color: D.ink, textAlign: "center", marginTop: 12 }}>Name your team</Text>
        <Text style={{ fontSize: 12.5, color: D.soft, textAlign: "center", marginTop: 8, lineHeight: 18 }}>
          Your team name leads the league table. Your username is your handle underneath.
        </Text>

        <View style={{ marginTop: 30, gap: 16 }}>
          {field("TEAM NAME", teamName, setTeamName, "e.g. Donkey Kong FC")}
          {field("USERNAME", username, setUsername, "e.g. gaffer_jay", true)}
          {error ? <Text style={{ fontSize: 12, color: D.red }}>{error}</Text> : null}
          <Pressable onPress={onContinue}
            style={({ pressed }) => ({ backgroundColor: D.black, borderRadius: 6, paddingVertical: 15, alignItems: "center", marginTop: 4, opacity: pressed ? 0.85 : 1 })}>
            {busy ? <ActivityIndicator color={D.white} /> : <Text style={{ color: D.white, fontSize: 14, fontWeight: "600" }}>Enter the game →</Text>}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
