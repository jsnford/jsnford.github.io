# Fantasy Fives — mobile app

Expo (SDK 57) + Expo Router, TypeScript. Deliberately bare — text, buttons and
spacing only, no imagery — built **component-first** so the whole look can be
designed by restyling the primitives in `components/ui` and the tokens in
`theme/tokens.ts`.

## Structure

```
theme/tokens.ts          colours (light/dark), spacing, radius, type — the design source of truth
components/ui/           10 primitives: Text, Button, Input, Card, ListRow, Segmented, Pill,
                         Divider, Screen, Stack. Every screen composes from these.
lib/supabase.ts          Supabase client (anon key, AsyncStorage session)
lib/auth.tsx             AuthProvider — Google OAuth, session, profile
app/                     Expo Router (file = screen)
  _layout.tsx            providers + auth gate (redirects by session/profile)
  (auth)/login.tsx       splash + Continue with Google
  (auth)/create-profile  choose a username
  (tabs)/index.tsx       Home — deadline, team snapshot, top league
  (tabs)/team.tsx        Team — squad summary / empty state
  (tabs)/standings.tsx   Standings — Leagues | Players (segmented)
  (tabs)/profile.tsx     Profile + sign out
  pick.tsx               Team builder (5 starters + sub) — modal
  player/[id].tsx        Player detail
```

Navigation: 4 bottom tabs — **Home · Team · Standings · Profile**. Leagues and
Players live together under Standings, toggled by a segmented control.

Screens use placeholder data for now; the real Supabase queries plug in per the
screen map. Auth is real.

## Run it

```bash
cd mobile
npm install
cp .env.example .env      # then paste your PUBLISHABLE/anon key into it
npx expo start            # press i (iOS sim) / a (Android), or scan with a dev build
```

> Google sign-in is most reliable in a **dev build** (`npx expo run:ios`), not
> Expo Go, because the OAuth redirect uses the `fantasyfives://` scheme.

## Google auth — one-time config (needed before sign-in works)

The code is done; these are dashboard steps only:

1. **Google Cloud Console** → create an OAuth **Web application** client. Set the
   authorised redirect URI to your Supabase callback:
   `https://bjluhfbsggbvbjmverhl.supabase.co/auth/v1/callback`
2. **Supabase → Authentication → Providers → Google** → enable, paste the Google
   client ID + secret.
3. **Supabase → Authentication → URL Configuration → Redirect URLs** → add
   `fantasyfives://auth-callback` (and your Expo dev URL while testing).
4. **`.env`** → set `EXPO_PUBLIC_SUPABASE_ANON_KEY` to the project's
   **publishable/anon** key (never the service_role/secret key).

## Real data

`lib/data.ts` reads from Supabase with the **publishable/anon key** (public
tables opened to the `anon` role via RLS). Wired:

- **Home** — current gameweek + deadline (real).
- **Standings** — Global league leaderboard (real; empty until scores land).
- **Pick** (`app/pick.tsx`) — a **5-a-side pitch**: tap an empty slot → a bottom
  `Sheet` of the real player pool (searchable, kit thumbnails) → tap a player to
  fill the slot (sheet closes). Kit images come from FPL by club code (`kitUrl`),
  GK variant for keepers. Long-press-style tap on a filled slot sets captain or
  removes. Validates the squad live and calls `submit_gameweek_team`.

`submit_gameweek_team` needs a real signed-in user (auth.uid()). Under
`PRETEND_AUTH` there's no real session, so submit shows a "valid, unlocks with
sign-in" message. It goes live the moment real auth is on (Google, or enable
Anonymous sign-ins in Supabase) — no code change.
