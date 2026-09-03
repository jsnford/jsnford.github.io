import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { badgeUrl, getDonkeyBoard, getDonkeyLeague, getDonkeyResults, playerPhoto, type DonkeyBoard, type DonkeyLeagueRow, type DonkeyResultRow } from "../../lib/data";
import { D, MAXW, SERIF } from "./theme";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

// Placeholder game-state data — the season reel and league letters need the
// persisted picks/results model (donkey_picks / donkey_results). Layout is real.
const PAST = [
  { gw: 1, name: "Richarlison", match: "BRE 3 — 0 TOT", code: 200641 },
  { gw: 2, name: "Tielemans", match: "MUN 5 — 2 IPS", code: 174800 },
  { gw: 3, name: null, match: "ARS v CHE", code: null },
  { gw: 4, name: null, match: "TBD", code: null },
  { gw: 5, name: null, match: "TBD", code: null },
];
const LEAGUE = [
  { team: "Fordinky", letters: 0 },
  { team: "Tinkerman", letters: 1 },
  { team: "Mart H", letters: 0 },
  { team: "RIGGINS", letters: 1 },
  { team: "Big D", letters: 0 },
  { team: "Alan The Medaless", letters: 2 },
];
const WORD = ["D", "O", "N", "K", "E", "Y"];

export default function DonkeyHome() {
  const router = useRouter();
  const [board, setBoard] = useState<DonkeyBoard | null>(null);
  const [league, setLeague] = useState<DonkeyLeagueRow[] | null>(null);
  const [reel, setReel] = useState<DonkeyResultRow[] | null>(null);
  useEffect(() => {
    getDonkeyBoard().then(setBoard).catch(() => {});
    getDonkeyLeague().then(setLeague).catch(() => {});
    getDonkeyResults().then(setReel).catch(() => {});
  }, []);

  // Real settled results drive the reel + league; until GW3 settles they're
  // empty, so we fall back to the mock layout.
  const reelRows = reel && reel.length
    ? [...reel.map((r) => ({ gw: r.gw, name: r.name as string | null, match: r.match, code: r.code as number | null })),
       { gw: board?.gwNumber ?? 0, name: null as string | null, match: board?.hasGame ? `${board.home.club} v ${board.away.club}` : "TBD", code: null as number | null }]
    : PAST;
  // Settled gameweeks are tappable → finalised rankings for that game.
  const settledGws = new Set((reel ?? []).map((r) => r.gw));
  const leagueRows = league && league.length ? league.map((r) => ({ team: r.team, letters: r.letters })) : LEAGUE;

  const live = board ? (board.status === "live" || board.status === "finished") : false;
  const ko = board?.koISO ? new Date(board.koISO) : null;
  const finalised = ko ? hhmm(new Date(ko.getTime() - 60 * 60000)) : "—";
  const closes = ko ? hhmm(new Date(ko.getTime() - 60000)) : "—";
  const koLabel = ko ? `${DAYS[ko.getDay()]} ${ko.getDate()} — ${hhmm(ko)}` : "";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: D.bg }} contentContainerStyle={{ paddingBottom: 48 }}>
      <View style={{ width: "100%", maxWidth: MAXW, alignSelf: "center", paddingHorizontal: 18 }}>
        {/* account pill */}
        <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingTop: 14 }}>
          <Pressable onPress={() => router.push("/donkey/account")} style={({ pressed }) => ({ borderWidth: 1, borderColor: D.line, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 6, opacity: pressed ? 0.7 : 1 })}>
            <Text style={{ fontSize: 11, letterSpacing: 0.5, color: D.ink, fontWeight: "600" }}>Account</Text>
          </Pressable>
        </View>
        {/* wordmark */}
        <View style={{ alignItems: "center", paddingTop: 12 }}>
          <Text style={{ fontSize: 40 }}>🫏</Text>
          <Text style={{ fontFamily: SERIF, fontSize: 22, letterSpacing: 3, color: D.ink, marginTop: 4 }}>DONKEY</Text>
        </View>

        {/* next fixture */}
        <Text style={{ fontFamily: SERIF, fontSize: 22, color: D.ink, marginTop: 34 }}>Next fixture</Text>
        <View style={{ borderWidth: 1, borderColor: D.line, borderRadius: 10, padding: 16, marginTop: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 9.5, color: D.faint }}>Player options finalised: {finalised}</Text>
            <Text style={{ fontSize: 9.5, color: D.faint }}>Selection window closes: {closes}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24, marginTop: 14 }}>
            <FixtureCrest code={board?.home.clubCode ?? 0} label={board?.home.club ?? ""} />
            <Text style={{ fontFamily: SERIF, fontSize: 14, color: D.soft }}>vs</Text>
            <FixtureCrest code={board?.away.clubCode ?? 0} label={board?.away.club ?? ""} />
          </View>
          <Text style={{ fontFamily: SERIF, fontSize: 15, color: D.ink, textAlign: "center", marginTop: 12 }}>{koLabel}</Text>
        </View>
        <Pressable onPress={() => router.push(live ? "/donkey/live" : "/donkey/select")} style={({ pressed }) => ({ backgroundColor: D.black, borderRadius: 6, paddingVertical: 15, marginTop: 14, alignItems: "center", opacity: pressed ? 0.85 : 1 })}>
          <Text style={{ color: D.white, fontSize: 14, fontWeight: "600" }}>{live ? "View the live board →" : "Choose your player →"}</Text>
        </Pressable>

        {/* season donkeys reel */}
        <Text style={{ fontFamily: SERIF, fontSize: 20, color: D.ink, marginTop: 36 }}>🫏 26/27 Donkeys</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, marginHorizontal: -18 }} contentContainerStyle={{ paddingHorizontal: 18, gap: 10 }}>
          {reelRows.map((p) => {
            const settled = settledGws.has(p.gw);
            const inner = (
              <>
                <View style={{ width: 92, height: 96, borderRadius: 8, backgroundColor: p.code ? "#DED4C6" : "transparent", borderWidth: p.code ? 0 : 1, borderColor: D.line, overflow: "hidden", justifyContent: "flex-end" }}>
                  {p.code ? <Image source={{ uri: playerPhoto(p.code) }} style={{ position: "absolute", top: 0, left: 0, width: 92, height: 96 }} resizeMode="cover" /> : null}
                  <View style={{ backgroundColor: D.black, paddingVertical: 3, paddingHorizontal: 6 }}>
                    <Text style={{ color: D.white, fontSize: 11, fontWeight: "600" }} numberOfLines={1}>{p.name ?? "—"}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 9, color: D.soft, marginTop: 5 }} numberOfLines={1}>{p.match}</Text>
                <Text style={{ fontSize: 9, color: D.faint }}>GW{p.gw}{settled ? "  ·  view →" : ""}</Text>
              </>
            );
            return settled ? (
              <Pressable key={p.gw} onPress={() => router.push(`/donkey/results/${p.gw}`)} style={({ pressed }) => ({ width: 92, opacity: pressed ? 0.6 : 1 })}>{inner}</Pressable>
            ) : (
              <View key={p.gw} style={{ width: 92 }}>{inner}</View>
            );
          })}
        </ScrollView>

        {/* league — DONKEY letters */}
        <Text style={{ fontFamily: SERIF, fontSize: 22, color: D.ink, marginTop: 34 }}>League</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, marginBottom: 4 }}>
          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: "row", width: 6 * 26 }}>
            {WORD.map((l, i) => <Text key={i} style={{ width: 26, textAlign: "center", fontFamily: SERIF, fontSize: 13, color: D.ink }}>{l}</Text>)}
          </View>
        </View>
        {leagueRows.map((m) => (
          <View key={m.team} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 7 }}>
            <Text style={{ flex: 1, fontFamily: SERIF, fontSize: 15, color: D.ink }} numberOfLines={1}>{m.team}</Text>
            <View style={{ flexDirection: "row", width: 6 * 26 }}>
              {WORD.map((_, i) => (
                <View key={i} style={{ width: 26, alignItems: "center", justifyContent: "center" }}>
                  {i < m.letters
                    ? <Text style={{ fontSize: 13 }}>🫏</Text>
                    : <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: D.faint }} />}
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function FixtureCrest({ code, label }: { code: number; label: string }) {
  return (
    <View style={{ alignItems: "center", gap: 5 }}>
      <Image source={{ uri: badgeUrl(code) }} style={{ width: 44, height: 50 }} resizeMode="contain" />
      <Text style={{ fontFamily: SERIF, fontSize: 13, color: D.ink }}>{label}</Text>
    </View>
  );
}
