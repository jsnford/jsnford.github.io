import { useState } from "react";
import { Button, Input, Screen, Text, VStack } from "../../components/ui";
import { useAuth } from "../../lib/auth";

export default function CreateProfile() {
  const { saveProfile } = useAuth();
  const [teamName, setTeamName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const onContinue = async () => {
    const t = teamName.trim();
    const u = username.trim();
    if (t.length < 3) { setError("Give your team a name (at least 3 characters)."); return; }
    if (u.length < 3) { setError("Pick a username of at least 3 characters."); return; }
    setError(undefined);
    setBusy(true);
    try {
      await saveProfile({ username: u, teamName: t });
      // Gate redirects to the tabs once the profile loads.
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg.includes("duplicate") ? "That username is taken." : msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <VStack gap={28} style={{ paddingTop: 24 }}>
        <VStack gap={8}>
          <Text variant="label" tone="accent">One quick step</Text>
          <Text variant="h1">Name your team</Text>
          <Text variant="body" tone="soft">Your team name is what everyone sees on the leaderboards. Your username is your handle underneath.</Text>
        </VStack>

        <VStack gap={16}>
          <Input
            label="Team name"
            placeholder="e.g. Real Ale Madrid"
            value={teamName}
            onChangeText={setTeamName}
          />
          <Input
            label="Username"
            placeholder="e.g. gaffer_jay"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
            error={error}
          />
        </VStack>

        <Button title="Continue" size="lg" full loading={busy} onPress={onContinue} />
      </VStack>
    </Screen>
  );
}
