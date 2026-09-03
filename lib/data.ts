import { supabase } from "./supabase";

export type Position = "GK" | "DEF" | "MID" | "FWD";

export interface PoolPlayer {
  id: string;
  name: string;
  position: Position;
  club: string;      // short name e.g. CHE
  clubCode: number;  // fpl_code, for kit image
  points?: number;   // score in the reference gameweek (e.g. last GW)
  uses?: number;     // times this user has selected them this season
  search?: string;   // lowercased "web_name first_name last_name club" for filtering
}

export interface Gameweek {
  id: string;
  number: number;
  deadline_at: string | null;
  deadline_confirmed: boolean;
  status: string;
}

// Lowercase + strip accents so "savio" matches "Sávio", "sangare" ↔ "Sangaré".
export function normalizeText(s: string): string {
  try {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  } catch {
    return s.toLowerCase();
  }
}

// Display-name overrides for players FPL lists by first name/nickname where the
// surname reads better. Keyed by FPL web_name. Applied at read time, so it
// survives the daily sync. Add entries as needed.
const DISPLAY_OVERRIDES: Record<string, string> = {
  "Virgil": "Van Dijk",
};
export const displayName = (webName: string) => DISPLAY_OVERRIDES[webName] ?? webName;

// FPL kit shirt (remote). GK kits use the _1 variant.
export const kitUrl = (clubCode: number, gk = false) =>
  `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${clubCode}${gk ? "_1" : ""}-110.png`;

// Premier League club badge (PNG — renders on native, unlike the SVG crest).
export const badgeUrl = (clubCode: number) =>
  `https://resources.premierleague.com/premierleague/badges/50/t${clubCode}.png`;

export async function getCurrentGameweek(): Promise<Gameweek | null> {
  const { data } = await supabase
    .from("gameweeks")
    .select("id, number, deadline_at, deadline_confirmed, status")
    .in("status", ["upcoming", "live"])
    .order("number", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as Gameweek) ?? null;
}

export async function getPlayerPool(opts?: { userId?: string }): Promise<PoolPlayer[]> {
  const { data, error } = await supabase
    .from("players")
    .select("id, web_name, first_name, last_name, position, pl_teams!inner(short_name, fpl_code)");
  if (error) throw error;
  const pool: PoolPlayer[] = (data ?? []).map((p: any) => ({
    id: p.id, name: displayName(p.web_name), position: p.position,
    club: p.pl_teams.short_name, clubCode: p.pl_teams.fpl_code,
    search: normalizeText(`${p.web_name} ${p.first_name ?? ""} ${p.last_name ?? ""} ${p.pl_teams.short_name}`),
  }));

  // Season total = sum of each player's base points across all gameweeks.
  const { data: sc } = await supabase.from("player_gw_scores").select("player_id, base_points");
  const totals = new Map<string, number>();
  for (const s of (sc ?? []) as any[]) totals.set(s.player_id, (totals.get(s.player_id) ?? 0) + Number(s.base_points));
  for (const p of pool) p.points = Math.round((totals.get(p.id) ?? 0) * 100) / 100;

  // How many gameweeks this user has selected each player this season.
  if (opts?.userId) {
    const { data: picks } = await supabase
      .from("team_picks")
      .select("player_id, gameweek_teams!inner(user_id)")
      .eq("gameweek_teams.user_id", opts.userId);
    const counts = new Map<string, number>();
    for (const pk of (picks ?? []) as any[]) counts.set(pk.player_id, (counts.get(pk.player_id) ?? 0) + 1);
    for (const p of pool) p.uses = counts.get(p.id) ?? 0;
  }

  // Order by season total (highest first), then name.
  pool.sort((a, b) => (b.points! - a.points!) || a.name.localeCompare(b.name));
  return pool;
}

export interface HistoryRow { gw: number; points: number }

export async function getMyHistory(userId: string): Promise<HistoryRow[]> {
  const { data } = await supabase
    .from("gameweek_teams")
    .select("base_points, gameweeks!inner(number, status)")
    .eq("user_id", userId);
  return ((data ?? []) as any[])
    .filter((r) => r.gameweeks.status === "finished")
    .map((r) => ({ gw: r.gameweeks.number as number, points: Number(r.base_points) }))
    .sort((a, b) => b.gw - a.gw);
}

export interface StandingRow { userId: string; name: string; handle: string; total: number; rank: number }

export async function getGlobalStandings(): Promise<StandingRow[]> {
  const { data: league } = await supabase.from("leagues").select("id").eq("type", "global").maybeSingle();
  if (!league) return [];
  const { data } = await supabase
    .from("league_standings")
    .select("user_id, total_points, profiles!inner(username, display_name)")
    .eq("league_id", league.id);
  // Each user has one row per gameweek; the max cumulative total is their latest.
  const byUser = new Map<string, { name: string; handle: string; total: number }>();
  for (const r of (data ?? []) as any[]) {
    const cur = byUser.get(r.user_id);
    const total = Number(r.total_points);
    if (!cur || total > cur.total) {
      byUser.set(r.user_id, { name: (r.profiles.display_name?.trim() || r.profiles.username), handle: r.profiles.username, total });
    }
  }
  return [...byUser.entries()]
    .map(([userId, u]) => ({ userId, name: u.name, handle: u.handle, total: u.total }))
    .sort((a, b) => b.total - a.total)
    .map((u, i) => ({ ...u, rank: i + 1 }));
}

export interface FixtureLite {
  id: string;
  ko: string | null;              // scheduled kickoff, ISO
  status: string;                 // upcoming | live | finished
  minutes: number | null;
  homeShort: string; homeCode: number;
  awayShort: string; awayCode: number;
  homeScore: number | null; awayScore: number | null;
}

// All fixtures for a gameweek, ordered by kickoff. Powers the home-page strip.
export async function getGameweekFixtures(gameweekId: string): Promise<FixtureLite[]> {
  const { data } = await supabase
    .from("fixtures")
    .select("id, scheduled_ko, status, minutes, home_score, away_score, home:pl_teams!fixtures_home_team_id_fkey(short_name, fpl_code), away:pl_teams!fixtures_away_team_id_fkey(short_name, fpl_code)")
    .eq("gameweek_id", gameweekId)
    .order("scheduled_ko", { ascending: true });
  return ((data ?? []) as any[])
    .filter((f) => f.home && f.away)
    .map((f) => ({
      id: f.id, ko: f.scheduled_ko, status: f.status, minutes: f.minutes,
      homeShort: f.home.short_name, homeCode: f.home.fpl_code,
      awayShort: f.away.short_name, awayCode: f.away.fpl_code,
      homeScore: f.home_score, awayScore: f.away_score,
    }));
}

// Per-club opponent for a gameweek, keyed by club short_name, e.g.
// { TOT: "CHE (A)", CHE: "TOT (H)" }. Shown under a player before kickoff.
export async function getGameweekOpponents(gameweekId: string): Promise<Record<string, string>> {
  const { data } = await supabase
    .from("fixtures")
    .select("home:pl_teams!fixtures_home_team_id_fkey(short_name), away:pl_teams!fixtures_away_team_id_fkey(short_name)")
    .eq("gameweek_id", gameweekId);
  const map: Record<string, string> = {};
  for (const f of (data ?? []) as any[]) {
    const h = f.home?.short_name, a = f.away?.short_name;
    if (h && a) { map[h] = `${a} (H)`; map[a] = `${h} (A)`; }
  }
  return map;
}

// Each player's base points for a gameweek, keyed by player_id. Used to show a
// live/final score under each player once the gameweek has locked.
export async function getGameweekPlayerPoints(gameweekId: string, ids: string[]): Promise<Record<string, number>> {
  if (!ids.length) return {};
  const { data } = await supabase
    .from("player_gw_scores")
    .select("player_id, base_points")
    .eq("gameweek_id", gameweekId)
    .in("player_id", ids);
  const m: Record<string, number> = {};
  for (const s of (data ?? []) as any[]) m[s.player_id] = Number(s.base_points);
  return m;
}

// The most recent gameweek team any user has submitted, as a pitch view with
// per-player points. Powers "tap a rival on the Standings page".
export async function getUserLatestTeamView(userId: string): Promise<GwTeamView | null> {
  const { data } = await supabase
    .from("gameweek_teams")
    .select("gameweeks!inner(number)")
    .eq("user_id", userId);
  const nums = (data ?? []).map((r: any) => r.gameweeks.number as number);
  if (!nums.length) return null;
  return getMyTeamForGameweek(Math.max(...nums), userId);
}

export interface MyPick { player: PoolPlayer; isCaptain: boolean; isSub: boolean }
export interface MyTeam { basePoints: number; subActivated: boolean; picks: MyPick[] }

export async function getMyTeam(gameweekId: string, userId: string): Promise<MyTeam | null> {
  const { data: gt } = await supabase
    .from("gameweek_teams")
    .select("id, base_points, sub_activated")
    .eq("gameweek_id", gameweekId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!gt) return null;
  const { data: picks } = await supabase
    .from("team_picks")
    .select("player_id, is_captain, is_sub, players!inner(web_name, position, pl_teams!inner(short_name, fpl_code))")
    .eq("gameweek_team_id", gt.id);
  return {
    basePoints: Number(gt.base_points),
    subActivated: gt.sub_activated,
    picks: (picks ?? []).map((p: any) => ({
      player: { id: p.player_id, name: displayName(p.players.web_name), position: p.players.position, club: p.players.pl_teams.short_name, clubCode: p.players.pl_teams.fpl_code },
      isCaptain: p.is_captain,
      isSub: p.is_sub,
    })),
  };
}

export interface MyStanding { rank: number | null; total: number }

export async function getMyStanding(userId: string): Promise<MyStanding | null> {
  const { data: league } = await supabase.from("leagues").select("id").eq("type", "global").maybeSingle();
  if (!league) return null;
  const { data } = await supabase
    .from("league_standings")
    .select("total_points, rank")
    .eq("league_id", league.id)
    .eq("user_id", userId)
    .order("total_points", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { rank: data.rank, total: Number(data.total_points) };
}

export interface GwTeamView {
  gwNumber: number;
  total: number;
  subActivated: boolean;
  starters: { player: PoolPlayer; isCaptain: boolean; points: number }[];
  sub: { player: PoolPlayer; points: number } | null;
}

export async function getMyTeamForGameweek(gwNumber: number, userId: string): Promise<GwTeamView | null> {
  const { data: gw } = await supabase.from("gameweeks").select("id, number").eq("number", gwNumber).maybeSingle();
  if (!gw) return null;
  const { data: gt } = await supabase.from("gameweek_teams").select("id, base_points, sub_activated").eq("gameweek_id", gw.id).eq("user_id", userId).maybeSingle();
  if (!gt) return null;
  const { data: picks } = await supabase
    .from("team_picks")
    .select("player_id, is_captain, is_sub, players!inner(web_name, position, pl_teams!inner(short_name, fpl_code))")
    .eq("gameweek_team_id", gt.id);
  const ids = (picks ?? []).map((p: any) => p.player_id);
  const { data: sc } = await supabase.from("player_gw_scores").select("player_id, base_points").eq("gameweek_id", gw.id).in("player_id", ids);
  const pts = new Map((sc ?? []).map((s: any) => [s.player_id, Number(s.base_points)]));
  const mk = (p: any): PoolPlayer => ({ id: p.player_id, name: displayName(p.players.web_name), position: p.players.position, club: p.players.pl_teams.short_name, clubCode: p.players.pl_teams.fpl_code });
  const starters = (picks ?? []).filter((p: any) => !p.is_sub).map((p: any) => ({ player: mk(p), isCaptain: p.is_captain, points: pts.get(p.player_id) ?? 0 }));
  const subPick = (picks ?? []).find((p: any) => p.is_sub);
  const sub = subPick ? { player: mk(subPick), points: pts.get(subPick.player_id) ?? 0 } : null;
  return { gwNumber: gw.number, total: Number(gt.base_points), subActivated: gt.sub_activated, starters, sub };
}

// ---- DONKEY (experimental side-game) ---------------------------------------
// One featured game per gameweek; pick 1 of 6 attackers (3 per team). Whoever
// underperforms their xG most (biggest xG − goals) is the DONKEY. Provisional
// squad below is each team's top-3 by last-GW xG until real teamsheets drop.

// Player headshots served from our Supabase Storage (uploaded from the local
// "Player Images" set), keyed by FPL code. Missing ones 404 → the card's grey
// placeholder shows through.
export const playerPhoto = (fplCode: number) =>
  `https://bjluhfbsggbvbjmverhl.supabase.co/storage/v1/object/public/player-photos/${fplCode}.png`;

export interface DonkeyTeam { name: string; club: string; clubCode: number }
const EMPTY_TEAM: DonkeyTeam = { name: "", club: "", clubCode: 0 };

export interface DonkeyGame {
  gwNumber: number; confirmed: boolean;
  home: DonkeyTeam; away: DonkeyTeam;
  koISO: string | null; status: string;
  candidates: { fplCode: number; side: "home" | "away" }[];
}

// The active featured DONKEY game = the earliest one not yet settled (else the
// latest). One row per gameweek, from the DB — decoupled from Fives' gameweek.
export async function getDonkeyGame(): Promise<DonkeyGame | null> {
  const { data: games } = await supabase.from("donkey_games").select("*").order("gameweek", { ascending: true });
  if (!games || !games.length) return null;
  const { data: settled } = await supabase.from("donkey_results").select("gameweek");
  const settledSet = new Set((settled ?? []).map((r: any) => r.gameweek));
  const g: any = games.find((x: any) => !settledSet.has(x.gameweek)) ?? games[games.length - 1];

  const { data: cands } = await supabase.from("donkey_candidates").select("fpl_code, side, sort_order").eq("gameweek", g.gameweek).order("side").order("sort_order");
  const { data: gw } = await supabase.from("gameweeks").select("id").eq("number", g.gameweek).maybeSingle();
  const { data: fx } = gw ? await supabase.from("fixtures")
    .select("scheduled_ko, status, home:pl_teams!fixtures_home_team_id_fkey(short_name), away:pl_teams!fixtures_away_team_id_fkey(short_name)")
    .eq("gameweek_id", gw.id) : { data: [] as any[] };
  const match = (fx ?? []).find((f: any) => f.home?.short_name === g.home_club && f.away?.short_name === g.away_club);
  return {
    gwNumber: g.gameweek, confirmed: g.confirmed,
    home: { name: g.home_name, club: g.home_club, clubCode: g.home_code },
    away: { name: g.away_name, club: g.away_club, clubCode: g.away_code },
    koISO: match?.scheduled_ko ?? null, status: match?.status ?? "upcoming",
    candidates: (cands ?? []).map((c: any) => ({ fplCode: c.fpl_code, side: c.side as "home" | "away" })),
  };
}

export interface DonkeyRow {
  fplCode: number; displayName: string; pos: string; side: "home" | "away"; clubCode: number;
  avgDonkey: number | null;                  // season avg xG − goals per game played
  donkeyCount: number;                       // times this player has been THE donkey
  perGw: { gw: number; donkey: number | null }[]; // xG − goals in each recent GW
  liveXg: number; liveGoals: number; liveMinutes: number; liveDonkey: number;
}
export interface DonkeyBoard {
  hasGame: boolean; gwNumber: number; confirmed: boolean;
  home: DonkeyTeam; away: DonkeyTeam;
  koISO: string | null; status: string;
  rows: DonkeyRow[];
}

const POS_SHORT: Record<string, string> = { FWD: "FW", MID: "MF", DEF: "DF", GK: "GK" };

export async function getDonkeyBoard(): Promise<DonkeyBoard> {
  const game = await getDonkeyGame();
  if (!game) return { hasGame: false, gwNumber: 0, confirmed: false, home: EMPTY_TEAM, away: EMPTY_TEAM, koISO: null, status: "none", rows: [] };
  const gwN = game.gwNumber;
  const codeSide = new Map(game.candidates.map((c) => [c.fplCode, c.side]));
  const codes = game.candidates.map((c) => c.fplCode);
  const { data: pl } = await supabase.from("players").select("id, fpl_code, position, first_name, last_name, web_name").in("fpl_code", codes);
  const byCode = new Map((pl ?? []).map((p: any) => [p.fpl_code, p]));
  const idByCode = new Map((pl ?? []).map((p: any) => [p.fpl_code, p.id]));
  const ids = (pl ?? []).map((p: any) => p.id);

  // Last 3 gameweeks up to and including the featured one.
  const wanted = [gwN - 2, gwN - 1, gwN].filter((n) => n >= 1);
  const { data: gws } = await supabase.from("gameweeks").select("id, number").in("number", wanted);
  const gwIdToNum = new Map((gws ?? []).map((g: any) => [g.id, g.number]));
  const gwIds = (gws ?? []).map((g: any) => g.id);

  const stats = gwIds.length ? (await supabase.from("player_gw_stats").select("player_id, gameweek_id, xg, goals, minutes").in("gameweek_id", gwIds).in("player_id", ids)).data : [];
  const byPlayer = new Map<string, Map<number, { xg: number; goals: number; minutes: number }>>();
  for (const s of (stats ?? []) as any[]) {
    const gw = gwIdToNum.get(s.gameweek_id); if (!gw) continue;
    const m = byPlayer.get(s.player_id) ?? new Map();
    m.set(gw, { xg: Number(s.xg), goals: Number(s.goals), minutes: Number(s.minutes) });
    byPlayer.set(s.player_id, m);
  }
  const r2 = (n: number) => Math.round(n * 100) / 100;

  const rows: DonkeyRow[] = codes.map((code) => {
    const id = idByCode.get(code);
    const meta: any = byCode.get(code);
    const side = (codeSide.get(code) ?? "home") as "home" | "away";
    const gwMap = id ? byPlayer.get(id) : undefined;
    const live = gwMap?.get(gwN);
    const donk = (g?: { xg: number; goals: number; minutes: number }) => (g && g.minutes > 0 ? r2(g.xg - g.goals) : null);
    const perGw = wanted.map((gw) => ({ gw, donkey: donk(gwMap?.get(gw)) }));
    const priorVals = wanted.filter((gw) => gw < gwN).map((gw) => donk(gwMap?.get(gw))).filter((v): v is number => v != null);
    const avg = priorVals.length ? priorVals.reduce((t, v) => t + v, 0) / priorVals.length : null;
    // "K. Havertz" for simple surnames; fall back to web_name for compound ones.
    const displayName = meta?.first_name && meta?.last_name && !String(meta.last_name).includes(" ")
      ? `${meta.first_name[0]}. ${meta.last_name}`
      : (meta?.web_name ?? "—");
    return {
      fplCode: code, displayName, pos: POS_SHORT[meta?.position] ?? "FW", side, clubCode: side === "home" ? game.home.clubCode : game.away.clubCode,
      avgDonkey: avg != null ? r2(avg) : null,
      donkeyCount: 0,
      perGw,
      liveXg: live ? r2(live.xg) : 0,
      liveGoals: live ? live.goals : 0,
      liveMinutes: live?.minutes ?? 0,
      liveDonkey: donk(live) ?? 0,
    };
  });
  return { hasGame: true, gwNumber: gwN, confirmed: game.confirmed, home: game.home, away: game.away, koISO: game.koISO, status: game.status, rows };
}

// ---- DONKEY persistence (shared account) -----------------------------------

export async function submitDonkeyPick(gameweek: number, fplCode: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not signed in");
  const { error } = await supabase.from("donkey_picks").upsert({ user_id: user.id, gameweek, fpl_code: fplCode }, { onConflict: "user_id,gameweek" });
  if (error) throw error;
}

export async function getMyDonkeyPick(gameweek: number): Promise<number | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("donkey_picks").select("fpl_code").eq("user_id", user.id).eq("gameweek", gameweek).maybeSingle();
  return data ? (data.fpl_code as number) : null;
}

export interface DonkeyLeagueRow { userId: string; team: string; handle: string; letters: number }

export async function getDonkeyLeague(): Promise<DonkeyLeagueRow[]> {
  const { data: results } = await supabase.from("donkey_results").select("gameweek, donkey_fpl_code");
  const { data: picks } = await supabase.from("donkey_picks").select("user_id, gameweek, fpl_code");
  const donkeyByGw = new Map((results ?? []).map((r: any) => [r.gameweek, r.donkey_fpl_code]));
  const userIds = [...new Set((picks ?? []).map((p: any) => p.user_id))];
  if (!userIds.length) return [];
  const { data: profs } = await supabase.from("profiles").select("id, username, display_name").in("id", userIds);
  const profById = new Map((profs ?? []).map((p: any) => [p.id, p]));
  const byUser = new Map<string, { team: string; handle: string; letters: number }>();
  for (const p of (picks ?? []) as any[]) {
    const pr: any = profById.get(p.user_id);
    const cur = byUser.get(p.user_id) ?? { team: pr?.display_name?.trim() || pr?.username || "Manager", handle: pr?.username ?? "", letters: 0 };
    if (donkeyByGw.get(p.gameweek) === p.fpl_code) cur.letters += 1;
    byUser.set(p.user_id, cur);
  }
  return [...byUser.entries()].map(([userId, v]) => ({ userId, ...v })).sort((a, b) => a.letters - b.letters || a.team.localeCompare(b.team));
}

export interface DonkeyResultRow { gw: number; name: string; code: number; match: string }

export async function getDonkeyResults(): Promise<DonkeyResultRow[]> {
  const { data: results } = await supabase.from("donkey_results").select("gameweek, home_club, away_club, donkey_fpl_code").order("gameweek");
  const codes = (results ?? []).map((r: any) => r.donkey_fpl_code);
  const { data: pl } = codes.length ? await supabase.from("players").select("fpl_code, web_name").in("fpl_code", codes) : { data: [] as any[] };
  const nameByCode = new Map((pl ?? []).map((p: any) => [p.fpl_code, p.web_name]));
  return (results ?? []).map((r: any) => ({ gw: r.gameweek, name: nameByCode.get(r.donkey_fpl_code) ?? "—", code: r.donkey_fpl_code, match: `${r.home_club} v ${r.away_club}` }));
}

// ---- DONKEY completed (finalised rankings for a past gameweek) --------------

export interface DonkeyCompletedRow {
  fplCode: number; displayName: string; pos: string; side: "home" | "away"; clubCode: number;
  xg: number; goals: number; minutes: number; donkey: number | null; played: boolean; isDonkey: boolean;
}
export interface DonkeyCompletedManager {
  team: string; handle: string; pickCode: number | null; pickName: string; gotLetter: boolean;
}
export interface DonkeyCompleted {
  gw: number; home: DonkeyTeam; away: DonkeyTeam;
  donkeyCode: number; donkeyName: string; donkeyScore: number; settledAt: string | null;
  rows: DonkeyCompletedRow[];
  managers: DonkeyCompletedManager[];
}

const donkeyName = (meta: any): string =>
  meta?.first_name && meta?.last_name && !String(meta.last_name).includes(" ")
    ? `${meta.first_name[0]}. ${meta.last_name}`
    : (meta?.web_name ?? "—");

// The finalised board for a settled gameweek: the featured six ranked by final
// xG − goals, the donkey flagged, plus how each manager's pick fared.
export async function getDonkeyCompleted(gw: number): Promise<DonkeyCompleted | null> {
  const { data: result } = await supabase.from("donkey_results")
    .select("gameweek, home_club, away_club, donkey_fpl_code, donkey_score, settled_at").eq("gameweek", gw).maybeSingle();
  if (!result) return null;

  const { data: gameRow } = await supabase.from("donkey_games")
    .select("home_name, home_club, home_code, away_name, away_club, away_code").eq("gameweek", gw).maybeSingle();
  const { data: teams } = await supabase.from("pl_teams").select("short_name, fpl_code")
    .in("short_name", [result.home_club, result.away_club]);
  const codeByClub = new Map((teams ?? []).map((t: any) => [t.short_name, t.fpl_code]));
  const home: DonkeyTeam = gameRow
    ? { name: gameRow.home_name, club: gameRow.home_club, clubCode: gameRow.home_code }
    : { name: result.home_club, club: result.home_club, clubCode: codeByClub.get(result.home_club) ?? 0 };
  const away: DonkeyTeam = gameRow
    ? { name: gameRow.away_name, club: gameRow.away_club, clubCode: gameRow.away_code }
    : { name: result.away_club, club: result.away_club, clubCode: codeByClub.get(result.away_club) ?? 0 };

  const { data: cands } = await supabase.from("donkey_candidates")
    .select("fpl_code, side, sort_order").eq("gameweek", gw).order("side").order("sort_order");
  const codes = (cands ?? []).map((c: any) => c.fpl_code);
  const sideByCode = new Map((cands ?? []).map((c: any) => [c.fpl_code, c.side as "home" | "away"]));

  const { data: pl } = codes.length
    ? await supabase.from("players").select("id, fpl_code, position, first_name, last_name, web_name").in("fpl_code", codes)
    : { data: [] as any[] };
  const byCode = new Map((pl ?? []).map((p: any) => [p.fpl_code, p]));
  const idByCode = new Map((pl ?? []).map((p: any) => [p.fpl_code, p.id]));
  const ids = (pl ?? []).map((p: any) => p.id);

  const { data: gwRow } = await supabase.from("gameweeks").select("id").eq("number", gw).maybeSingle();
  const stats = gwRow && ids.length
    ? (await supabase.from("player_gw_stats").select("player_id, xg, goals, minutes").eq("gameweek_id", gwRow.id).in("player_id", ids)).data
    : [];
  const statByPlayer = new Map((stats ?? []).map((s: any) => [s.player_id, s]));
  const r2 = (n: number) => Math.round(n * 100) / 100;

  const rows: DonkeyCompletedRow[] = codes.map((code: number) => {
    const meta: any = byCode.get(code);
    const id = idByCode.get(code);
    const s: any = id ? statByPlayer.get(id) : undefined;
    const minutes = s ? Number(s.minutes) : 0;
    const played = minutes > 0;
    const xg = s ? Number(s.xg) : 0;
    const goals = s ? Number(s.goals) : 0;
    const side = (sideByCode.get(code) ?? "home") as "home" | "away";
    return {
      fplCode: code, displayName: donkeyName(meta), pos: POS_SHORT[meta?.position] ?? "FW", side,
      clubCode: side === "home" ? home.clubCode : away.clubCode,
      xg: r2(xg), goals, minutes, donkey: played ? r2(xg - goals) : null, played,
      isDonkey: code === result.donkey_fpl_code,
    };
  }).sort((a, b) => {
    if (a.donkey == null && b.donkey == null) return 0;
    if (a.donkey == null) return 1;          // players who didn't feature sink to the bottom
    if (b.donkey == null) return -1;
    return b.donkey - a.donkey;
  });

  // How each manager's pick for this gameweek fared.
  const { data: picks } = await supabase.from("donkey_picks").select("user_id, fpl_code").eq("gameweek", gw);
  const userIds = [...new Set((picks ?? []).map((p: any) => p.user_id))];
  const { data: profs } = userIds.length
    ? await supabase.from("profiles").select("id, username, display_name").in("id", userIds)
    : { data: [] as any[] };
  const profById = new Map((profs ?? []).map((p: any) => [p.id, p]));
  const pickCodes = [...new Set((picks ?? []).map((p: any) => p.fpl_code))];
  const { data: pickPl } = pickCodes.length
    ? await supabase.from("players").select("fpl_code, first_name, last_name, web_name").in("fpl_code", pickCodes)
    : { data: [] as any[] };
  const nameByPickCode = new Map((pickPl ?? []).map((p: any) => [p.fpl_code, donkeyName(p)]));
  const managers: DonkeyCompletedManager[] = (picks ?? []).map((p: any) => {
    const pr: any = profById.get(p.user_id);
    return {
      team: pr?.display_name?.trim() || pr?.username || "Manager",
      handle: pr?.username ?? "",
      pickCode: p.fpl_code, pickName: nameByPickCode.get(p.fpl_code) ?? "—",
      gotLetter: p.fpl_code === result.donkey_fpl_code,
    };
  }).sort((a, b) => Number(a.gotLetter) - Number(b.gotLetter) || a.team.localeCompare(b.team));

  return {
    gw, home, away,
    donkeyCode: result.donkey_fpl_code, donkeyName: donkeyName(byCode.get(result.donkey_fpl_code)),
    donkeyScore: Number(result.donkey_score), settledAt: result.settled_at,
    rows, managers,
  };
}

export async function submitTeam(input: {
  gameweekId: string; starterIds: string[]; subId: string; captainId: string | null;
}) {
  const { data, error } = await supabase.rpc("submit_gameweek_team", {
    p_gameweek: input.gameweekId,
    p_starters: input.starterIds,
    p_sub: input.subId,
    p_captain: input.captainId,
  });
  if (error) throw error;
  return data;
}
