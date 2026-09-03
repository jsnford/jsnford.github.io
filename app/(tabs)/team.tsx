import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, View } from "react-native";
import { Pitch } from "../../components/Pitch";
import { Button, Card, Dropdown, HStack, Input, ListRow, Pill, Screen, Sheet, Text, VStack } from "../../components/ui";
import { actionSheet, notify } from "../../lib/alerts";
import { identity, useAuth } from "../../lib/auth";
import { getCurrentGameweek, getGameweekOpponents, getGameweekPlayerPoints, getMyHistory, getMyTeam, getPlayerPool, kitUrl, normalizeText, submitTeam, type Gameweek, type HistoryRow, type PoolPlayer } from "../../lib/data";
import { space, useColors } from "../../theme/tokens";

const fmtPts = (n: number) => String(+n.toFixed(2));

const POS_OPTIONS = [
  { value: "ALL", label: "All positions" },
  { value: "GK", label: "Goalkeepers" },
  { value: "DEF", label: "Defenders" },
  { value: "MID", label: "Midfielders" },
  { value: "FWD", label: "Forwards" },
];
const PAGE = 100;

export default function Team() {
  const c = useColors();
  const router = useRouter();
  const { session, profile } = useAuth();

  const [gw, setGw] = useState<Gameweek | null>(null);
  const [pool, setPool] = useState<PoolPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [starters, setStarters] = useState<(PoolPlayer | null)[]>([null, null, null, null, null]);
  const [sub, setSub] = useState<PoolPlayer | null>(null);
  const [captainId, setCaptainId] = useState<string | null>(null);
  const [target, setTarget] = useState<{ kind: "starter" | "sub"; index: number } | null>(null);
  const [q, setQ] = useState("");
  const [posFilter, setPosFilter] = useState("ALL");
  const [clubFilter, setClubFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState<{ points: number; subActivated: boolean } | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [opponents, setOpponents] = useState<Record<string, string>>({});
  const [livePoints, setLivePoints] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      try {
        const g = await getCurrentGameweek();
        setGw(g);
        const uid = session?.user.id;
        const p = await getPlayerPool({ userId: uid });
        setPool(p);
        if (g) getGameweekOpponents(g.id).then(setOpponents).catch(() => {});
        if (g && uid) {
          getMyHistory(uid).then(setHistory).catch(() => {});
          const mine = await getMyTeam(g.id, uid);
          if (mine) {
            const st: (PoolPlayer | null)[] = [null, null, null, null, null];
            let si = 0;
            for (const pick of mine.picks) {
              if (pick.isSub) setSub(pick.player);
              else if (si < 5) st[si++] = pick.player;
              if (pick.isCaptain) setCaptainId(pick.player.id);
            }
            setStarters(st);
            setSubmitted({ points: mine.basePoints, subActivated: mine.subActivated });
            getGameweekPlayerPoints(g.id, mine.picks.map((pk) => pk.player.id)).then(setLivePoints).catch(() => {});
          }
        }
      } catch (e) {
        notify("Couldn't load players", (e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [session?.user.id]);

  useEffect(() => setPage(1), [q, posFilter, clubFilter]);

  // While the gameweek is locked, poll for live points so scores tick up without
  // a reload. Only touches points (never the pick state), so no edits are lost.
  useEffect(() => {
    const uid = session?.user.id;
    if (!gw || !uid) return;
    const isLocked = gw.status !== "upcoming" || (gw.deadline_at != null && Date.parse(gw.deadline_at) <= Date.now());
    if (!isLocked) return;
    const refresh = async () => {
      const mine = await getMyTeam(gw.id, uid).catch(() => null);
      if (!mine) return;
      setSubmitted({ points: mine.basePoints, subActivated: mine.subActivated });
      getGameweekPlayerPoints(gw.id, mine.picks.map((p) => p.player.id)).then(setLivePoints).catch(() => {});
    };
    const id = setInterval(refresh, 45000);
    return () => clearInterval(id);
  }, [gw?.id, gw?.status, gw?.deadline_at, session?.user.id]);

  const chosen = [...(starters.filter(Boolean) as PoolPlayer[]), ...(sub ? [sub] : [])];
  const chosenIds = new Set(chosen.map((p) => p.id));
  const clubOptions = useMemo(() => {
    const clubs = [...new Set(pool.map((p) => p.club))].sort();
    return [{ value: "ALL", label: "All clubs" }, ...clubs.map((cl) => ({ value: cl, label: cl }))];
  }, [pool]);

  const filtered = useMemo(() => {
    const s = normalizeText(q.trim());
    return pool.filter((p) =>
      !chosenIds.has(p.id) &&
      (posFilter === "ALL" || p.position === posFilter) &&
      (clubFilter === "ALL" || p.club === clubFilter) &&
      (!s || (p.search ?? `${p.name} ${p.club}`.toLowerCase()).includes(s)));
  }, [pool, q, posFilter, clubFilter, chosen.length]);
  const visible = filtered.slice(0, page * PAGE);

  function closeSheet() { setTarget(null); setQ(""); setPosFilter("ALL"); setClubFilter("ALL"); setPage(1); }
  function assign(p: PoolPlayer) {
    if (!target) return;
    if (target.kind === "sub") setSub(p);
    else { const next = [...starters]; next[target.index] = p; setStarters(next); }
    closeSheet();
  }
  function onSlotPress(kind: "starter" | "sub", index: number) {
    const current = kind === "sub" ? sub : starters[index];
    if (!current) { setTarget({ kind, index }); return; }
    const actions: { label: string; onPress: () => void; destructive?: boolean }[] = [];
    if (kind === "starter") {
      actions.push({ label: captainId === current.id ? "Remove captain" : "Make captain", onPress: () => setCaptainId(captainId === current.id ? null : current.id) });
    }
    actions.push({ label: "Remove", destructive: true, onPress: () => {
      if (captainId === current.id) setCaptainId(null);
      if (kind === "sub") setSub(null); else { const n = [...starters]; n[index] = null; setStarters(n); }
    } });
    actionSheet(current.name, `${current.position} · ${current.club}`, actions);
  }

  const st = starters.filter(Boolean) as PoolPlayer[];
  const errors: string[] = [];
  if (st.length < 5) errors.push(`Pick ${5 - st.length} more starter${5 - st.length > 1 ? "s" : ""}`);
  if (!sub) errors.push("Pick a substitute");
  if (st.length === 5) {
    const cnt = (pos: string) => st.filter((p) => p.position === pos).length;
    if (cnt("GK") > 1) errors.push("Max 1 goalkeeper");
    if (cnt("DEF") + cnt("GK") < 1) errors.push("Need a defender or keeper");
    if (cnt("MID") < 1) errors.push("Need a midfielder");
    if (cnt("FWD") < 1) errors.push("Need a forward");
    const clubs = new Map<string, number>();
    for (const p of chosen) clubs.set(p.club, (clubs.get(p.club) ?? 0) + 1);
    if ([...clubs.values()].some((n) => n > 2)) errors.push("Max 2 players from one club");
  }
  const valid = errors.length === 0 && !!sub && st.length === 5;

  async function onSubmit() {
    if (!gw || !valid || !sub) return;
    setBusy(true);
    try {
      await submitTeam({ gameweekId: gw.id, starterIds: st.map((p) => p.id), subId: sub.id, captainId });
      setSubmitted((s) => ({ points: s?.points ?? 0, subActivated: s?.subActivated ?? false }));
      notify("Team submitted", "You're in for this gameweek. Points appear once matches kick off.");
    } catch (e) {
      const msg = (e as Error).message;
      if (/not authenticated|jwt|auth/i.test(msg)) notify("Not signed in", "Please sign in again to submit your team.");
      else notify("Couldn't submit", msg);
    } finally {
      setBusy(false);
    }
  }

  // Season stats
  const total = history.reduce((t, h) => t + h.points, 0);
  const thisGw = submitted?.points ?? 0;
  const lastGw = history[0]?.points ?? 0;
  const avg = history.length ? total / history.length : 0;

  // Once the deadline passes the gameweek is locked: no more edits. Before that
  // each player's caption shows their opponent; after, the shared points chip
  // shows their score (identical to the rival / past-gameweek pitch views).
  const locked = !!gw && (gw.status !== "upcoming" || (gw.deadline_at != null && Date.parse(gw.deadline_at) <= Date.now()));
  const opponentFor = (p: PoolPlayer): string | undefined => {
    const opp = opponents[p.club];
    return opp ? `v ${opp}` : undefined;
  };
  const starterPoints: Record<string, number> = {};
  const opponentSubline: Record<string, string> = {};
  for (const p of [...st, ...(sub ? [sub] : [])]) {
    if (locked) starterPoints[p.id] = Math.round(livePoints[p.id] ?? 0);
    else { const o = opponentFor(p); if (o) opponentSubline[p.id] = o; }
  }

  if (loading) {
    return <Screen><VStack style={{ paddingTop: 100 }} align="center"><ActivityIndicator color={c.accent} /></VStack></Screen>;
  }

  return (
    <Screen>
      <Card>
        <HStack justify="space-between" align="flex-start">
          <Text variant="label" tone="faint">Your season</Text>
          <VStack align="flex-end" gap={0}>
            <Text variant="body" bold>{profile ? identity(profile).lead : "Team"}</Text>
            {profile && identity(profile).showHandle ? <Text variant="small" tone="faint">@{identity(profile).handle}</Text> : null}
          </VStack>
        </HStack>
        <HStack justify="space-between" align="flex-start">
          <Stat label="Total" value={fmtPts(total)} accent />
          <Stat label="This GW" value={fmtPts(thisGw)} />
          <Stat label="Last GW" value={fmtPts(lastGw)} />
          <Stat label="Avg / GW" value={history.length ? fmtPts(Math.round(avg * 10) / 10) : "—"} />
        </HStack>
      </Card>

      <VStack gap={4}>
        <Text variant="label" tone="faint">{gw ? `Gameweek ${gw.number} · ${locked ? "locked — matches under way" : "tap a spot to add a player"}` : "Your squad"}</Text>
        <HStack justify="space-between" align="flex-end">
          <Text variant="h1">Team</Text>
          {submitted ? <Pill label={locked ? `${Math.round(submitted.points)} pts this week` : "Editable"} tone="accent" /> : null}
        </HStack>
      </VStack>

      <Pitch
        starters={starters}
        captainId={captainId}
        points={locked ? starterPoints : undefined}
        subline={locked ? undefined : opponentSubline}
        onSlotPress={locked ? undefined : (i) => onSlotPress("starter", i)}
        sub={sub}
        onSubPress={locked ? undefined : () => onSlotPress("sub", 0)}
        subActivated={locked ? submitted?.subActivated : false}
      />
      <Text variant="small" tone="faint">The substitute (below the line) comes on only if a starter plays zero minutes.</Text>

      {locked ? (
        <Text variant="small" tone="faint">This gameweek is locked — your team is set. Points update as matches play out. You can pick again for the next gameweek.</Text>
      ) : (
        <>
          {errors.length ? <Text variant="small" tone="faint">{errors[0]}</Text> : null}
          <Button title={!valid ? "Complete your squad" : submitted ? "Update team" : "Submit team"} full disabled={!valid} loading={busy} onPress={onSubmit} />
        </>
      )}

      {history.length ? (
        <VStack gap={8} style={{ marginTop: space.sm }}>
          <Text variant="label" tone="faint">Previous gameweeks</Text>
          {history.map((h) => (
            <ListRow key={h.gw} title={`Gameweek ${h.gw}`} subtitle="View team" right={fmtPts(h.points)} rightSub="pts" onPress={() => router.push(`/gw/${h.gw}`)} />
          ))}
        </VStack>
      ) : null}

      <Sheet visible={!!target} onClose={closeSheet} title={target?.kind === "sub" ? "Choose a substitute" : "Choose a player"}>
        <View style={{ paddingHorizontal: space.lg, gap: space.sm, paddingBottom: space.sm }}>
          <Input placeholder="Search player or club" autoCapitalize="none" autoCorrect={false} value={q} onChangeText={setQ} />
          <HStack gap={8}>
            <Dropdown value={posFilter} onChange={setPosFilter} options={POS_OPTIONS} />
            <Dropdown value={clubFilter} onChange={setClubFilter} options={clubOptions} />
          </HStack>
        </View>
        <FlatList
          data={visible}
          keyExtractor={(p) => p.id}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: space.lg }}
          renderItem={({ item }) => <PlayerRow player={item} onPress={() => assign(item)} />}
          ListEmptyComponent={<Text variant="small" tone="faint" style={{ padding: space.lg }}>No players match.</Text>}
          ListFooterComponent={
            visible.length < filtered.length ? (
              <Pressable onPress={() => setPage((p) => p + 1)} style={{ paddingVertical: space.lg, alignItems: "center" }}>
                <Text variant="body" tone="accent" bold>Show more ({filtered.length - visible.length} more)</Text>
              </Pressable>
            ) : <View style={{ height: space.xl }} />
          }
        />
      </Sheet>
    </Screen>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <VStack gap={2} align="center">
      <Text variant="h2" tone={accent ? "accent" : "default"}>{value}</Text>
      <Text variant="small" tone="faint">{label}</Text>
    </VStack>
  );
}

function PlayerRow({ player, onPress }: { player: PoolPlayer; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      <HStack gap={12} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.line }}>
        <Image source={{ uri: kitUrl(player.clubCode, player.position === "GK") }} style={{ width: 30, height: 30 }} resizeMode="contain" />
        <VStack flex={1} gap={1}>
          <Text variant="body" bold>{player.name}</Text>
          <Text variant="small" tone="faint">{player.position} · {player.club}</Text>
        </VStack>
        <VStack align="flex-end" gap={1}>
          <Text variant="body" bold>{fmtPts(player.points ?? 0)}</Text>
          <Text variant="small" tone="faint">{player.uses ? `picked ${player.uses}×` : "pts"}</Text>
        </VStack>
      </HStack>
    </Pressable>
  );
}
