import { useState } from "react";
import { Button, Input, Screen, Text, VStack } from "../../components/ui";
import { notify } from "../../lib/alerts";
import { useAuth } from "../../lib/auth";

export default function Login() {
  const { signInAsGuest, signInWithGoogle, signInWithEmail, googleEnabled } = useAuth();
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
    <Screen>
      <VStack flex={1} gap={28} justify="center" style={{ minHeight: 560 }}>
        <VStack gap={8}>
          <Text variant="label" tone="accent">Fantasy Fives</Text>
          <Text variant="display">Pick five.{"\n"}Beat your mates.</Text>
          <Text variant="body" tone="soft">A new five-a-side team every gameweek. Live points, one Global league, one deadline.</Text>
        </VStack>

        <VStack gap={12}>
          {googleEnabled ? (
            <Button title="Continue with Google" size="lg" full loading={busy === "google"} onPress={() => run("google", signInWithGoogle)} />
          ) : null}

          {sent ? (
            <VStack gap={4} style={{ paddingVertical: 8 }}>
              <Text variant="body" bold tone="accent">Check your email</Text>
              <Text variant="small" tone="soft">We sent a magic link to {email.trim()}. Tap it to sign in.</Text>
            </VStack>
          ) : (
            <VStack gap={8}>
              <Input
                label="Or sign in with email"
                placeholder="you@email.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <Button title="Email me a magic link" variant="secondary" full loading={busy === "email"} onPress={onEmail} />
            </VStack>
          )}

          <Button title="Continue as guest" variant="ghost" full loading={busy === "guest"} onPress={() => run("guest", signInAsGuest)} />
        </VStack>
      </VStack>
    </Screen>
  );
}
