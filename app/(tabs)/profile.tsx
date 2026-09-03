import { useState } from "react";
import { Button, Card, Divider, HStack, Input, Screen, Text, VStack } from "../../components/ui";
import { confirmAction, notify } from "../../lib/alerts";
import { identity, useAuth } from "../../lib/auth";

export default function Profile() {
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
      ? "This is a guest account — signing out will start a fresh account and you won't be able to get back into this one."
      : "Are you sure you want to sign out?";
    if (await confirmAction("Sign out", msg, "Sign out", true)) await signOut();
  };

  return (
    <Screen>
      <VStack gap={4}>
        <Text variant="label" tone="faint">Your account</Text>
        <Text variant="h1">{lead}</Text>
        <Text variant="small" tone="faint">{showHandle ? `@${handle} · ` : ""}{isGuest ? "Guest account" : session?.user.email}</Text>
      </VStack>

      <Card>
        <VStack gap={8}>
          <Text variant="label" tone="faint">Team name</Text>
          <Text variant="small" tone="soft">This is what everyone sees on the leaderboards.</Text>
          <Input placeholder="Your team name" value={name} onChangeText={setName} />
          <Button title="Save team name" full disabled={!dirty} loading={saving} onPress={onSaveName} />
        </VStack>
      </Card>

      <Card title="Season so far">
        <HStack justify="space-between">
          <VStack gap={2}><Text variant="h2" tone="accent">—</Text><Text variant="small" tone="faint">total points</Text></VStack>
          <VStack gap={2} align="center"><Text variant="h2">—</Text><Text variant="small" tone="faint">best GW</Text></VStack>
          <VStack gap={2} align="flex-end"><Text variant="h2">—</Text><Text variant="small" tone="faint">leagues</Text></VStack>
        </HStack>
      </Card>

      <Card padded={false}>
        <VStack>
          {["How points work", "Notifications", "Settings"].map((label, i, arr) => (
            <VStack key={label}>
              <HStack justify="space-between" style={{ padding: 16 }}>
                <Text variant="body">{label}</Text>
                <Text variant="body" tone="faint">›</Text>
              </HStack>
              {i < arr.length - 1 ? <Divider /> : null}
            </VStack>
          ))}
        </VStack>
      </Card>

      <Button title="Sign out" variant="danger" full onPress={onSignOut} />
    </Screen>
  );
}
