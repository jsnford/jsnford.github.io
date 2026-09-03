import type { Session } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

// Flip to true once Google OAuth is configured (Google Cloud client + Supabase
// provider + redirect URL). Until then we use anonymous "guest" accounts, which
// are real Supabase sessions — teams submit and score for real.
const GOOGLE_ENABLED = true;

const redirectTo = makeRedirectUri({ scheme: "fantasyfives", path: "auth-callback" });

export interface Profile {
  id: string;
  username: string;
  display_name: string | null; // used as the manager's TEAM NAME (lead identity)
  country: string | null;
}

// The lead display name is the team name (display_name); username is the @handle
// shown beneath it. Falls back to username for accounts with no team name yet.
export function identity(p: Pick<Profile, "username" | "display_name"> | null | undefined) {
  const lead = p?.display_name?.trim() || p?.username || "Player";
  const handle = p?.username ?? "";
  return { lead, handle, showHandle: !!handle && lead !== handle };
}

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  googleEnabled: boolean;
  signInAsGuest: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  saveProfile: (input: { username: string; teamName: string; country?: string }) => Promise<void>;
  updateTeamName: (teamName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

async function sessionFromRedirect(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);
  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return;
  }
  const { access_token, refresh_token } = params;
  if (!access_token) return;
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) throw error;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, country")
      .eq("id", userId)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      if (s) await loadProfile(s.user.id);
      else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInAsGuest = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    if (Platform.OS === "web") {
      // Full-page redirect to Google and back; supabase-js reads the tokens from
      // the return URL (detectSessionInUrl) and fires onAuthStateChange.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        // Return to the exact app path (handles hosting under a sub-path like
        // GitHub Pages, where origin alone would drop the /fantasy-fives base).
        options: { redirectTo: window.location.origin + window.location.pathname },
      });
      if (error) throw error;
      return;
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (res.type === "success") await sessionFromRedirect(res.url);
  };

  const signInWithEmail = async (email: string) => {
    const emailRedirectTo = Platform.OS === "web" ? window.location.origin + window.location.pathname : redirectTo;
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo } });
    if (error) throw error;
  };

  const saveProfile = async (input: { username: string; teamName: string; country?: string }) => {
    if (!session) throw new Error("not signed in");
    const { error } = await supabase.from("profiles").insert({
      id: session.user.id,
      username: input.username.trim(),
      display_name: input.teamName.trim(), // team name is the lead identity
      country: input.country ?? null,
    });
    if (error) throw error;
    await loadProfile(session.user.id);
  };

  const updateTeamName = async (teamName: string) => {
    if (!session) throw new Error("not signed in");
    const { error } = await supabase.from("profiles").update({ display_name: teamName.trim() }).eq("id", session.user.id);
    if (error) throw error;
    await loadProfile(session.user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, googleEnabled: GOOGLE_ENABLED, signInAsGuest, signInWithGoogle, signInWithEmail, saveProfile, updateTeamName, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
