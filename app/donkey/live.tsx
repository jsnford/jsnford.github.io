import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { badgeUrl, getDonkeyBoard, getDonkeyPicks, getMyDonkeyPick, playerPhoto, type DonkeyBoard, type DonkeyPicksInfo } from "../../lib/data";
import { D, donkeyColor, fmtDonkey, MAXW, SERIF } from "./theme";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const koText = (iso: string | null) => (iso ? `${DAYS[new Date(iso).getDay()]} ${new Date(iso).getDate()} — ${String(new Date(iso).getHours()).padStart(2, "0")}:${String(new Date(iso).getMinutes()).padStart(2, "0")}` : "");

export default function DonkeyLive() {
  const router = useRouter();
  const [board, setBoard] = useState<DonkeyBoard | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const [picks, setPicks] = useState<DonkeyPicksInfo | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => getDonkeyBoard().then((b) => alive && setBoard(b)).catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  useEffect(() => { if (board?.hasGame) getMyDonkeyPick(board.gwNumber).then(setPick).catch(() => {}); }, [board?.hasGame, board?.gwNumber]);

  const back = () => (router.canGoBack() ? router.back() : router.replace("/donkey"));
  const status = board?.status;
  const started = status === "live" || status === "finished";   // reveal picks once KO has passed
  const state = status === "live" ? "LIVE" : status === "finished" ? "FULL TIME" : koText(board?.koISO ?? null);
  const rows = board ? [...board.rows].sort((a, b) => b.liveDonkey - a.liveDonkey) : [];

  useEffect(() => {
    if (!board?.hasGame || !started) { setPicks(null); return; }
    let alive = true;
    getDonkeyPicks(board.gwNumber).then((p) => alive && setPicks(p)).catch(() => {});
    return () => { alive = false; };
  }, [board?.hasGame, board?.gwNumber, started]);

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ width: "100%", maxWidth: MAXW, alignSelf: "center", paddingHorizontal: 18 }}>
          <Pressable onPress={back} hitSlop={12} style={{ paddingTop: 16, paddingBottom: 4 }}>
            <Text style={{ fontSize: 22, color: D.ink }}>←</Text>
          </Pressable>

          {!board ? (
            <View style={{ paddingTop: 60, alignItems: "center" }}><ActivityIndicator color={D.ink} /></View>
          ) : !board.hasGame ? (
            <Text style={{ fontFamily: SERIF, fontSize: 18, color: D.soft, textAlign: "center", paddingTop: 60 }}>No featured game this week.</Text>
          ) : (
            <>
              <View style={{ alignItems: "center", paddingTop: 6 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24 }}>
                  <Crest code={board.home.clubCode} label={board.home.club} />
                  <Text style={{ fontFamily: SERIF, fontSize: 15, color: D.ink }}>VS</Text>
                  <Crest code={board.away.clubCode} label={board.away.club} />
                </View>
                <Text style={{ fontFamily: SERIF, fontSize: 14, color: status === "live" ? D.red : D.ink, marginTop: 10, letterSpacing: 0.5 }}>{state}</Text>
              </View>

              <View style={{ height: 1, backgroundColor: D.line, marginTop: 18, marginBottom: 14 }} />
              <Text style={{ fontFamily: SERIF, fontSize: 24, color: D.ink, textAlign: "center" }}>Live donkey board</Text>
              <Text style={{ fontSize: 10.5, letterSpacing: 0.5, color: D.soft, textAlign: "center", marginTop: 6 }}>BIGGEST xG UNDER-PERFORMER IS THE 🫏</Text>

              <View style={{ marginTop: 18, gap: 8 }}>
                {rows.map((r, i) => {
                  const mine = pick === r.fplCode;
                  const donkey = i === 0;
                  return (
                    <View key={r.fplCode} style={{ flexDirection: "row", alignItems: "center", gap: 12, borderWidth: mine ? 2 : 1, borderColor: mine ? D.black : D.line, borderRadius: 8, padding: 10 }}>
                      <Text style={{ width: 24, textAlign: "center", fontSize: 16 }}>{donkey ? "🫏" : <Text style={{ fontFamily: SERIF, color: D.soft }}>{i + 1}</Text>}</Text>
                      <View style={{ width: 38, height: 38, borderRadius: 6, backgroundColor: "#DED4C6", overflow: "hidden" }}>
                        <Image source={{ uri: playerPhoto(r.fplCode) }} style={{ width: 38, height: 38 }} resizeMode="cover" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: D.ink }} numberOfLines={1}>{r.displayName}{mine ? "  · you" : ""}</Text>
                        <Text style={{ fontSize: 10.5, color: D.soft, marginTop: 2 }}>{r.liveXg.toFixed(2)} xG · {r.liveGoals} {r.liveGoals === 1 ? "goal" : "goals"} · {r.liveMinutes}′</Text>
                        {started && picks ? (
                          <Text style={{ fontSize: 10, color: D.faint, marginTop: 3 }} numberOfLines={2}>
                            {picks.byCode[r.fplCode]?.length
                              ? `Chosen by ${picks.byCode[r.fplCode].map((m) => m.team).join(", ")}`
                              : "Chosen by no one"}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={{ fontFamily: SERIF, fontSize: 20, color: donkeyColor(r.liveDonkey) }}>{fmtDonkey(r.liveDonkey)}</Text>
                    </View>
                  );
                })}
              </View>

              {/* auto-donkey: league members who didn't pick this week */}
              {started && picks && picks.noPick.length ? (
                <View style={{ borderWidth: 1, borderColor: D.line, borderRadius: 8, padding: 12, marginTop: 14, backgroundColor: "#E4D9CB" }}>
                  <Text style={{ fontSize: 10.5, letterSpacing: 0.5, color: D.soft, fontWeight: "600" }}>NO PICK — AUTO 🫏</Text>
                  <Text style={{ fontSize: 12, color: D.ink, marginTop: 4, lineHeight: 17 }}>
                    {picks.noPick.map((m) => m.team).join(", ")} didn't pick this week and take a letter automatically.
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Crest({ code, label }: { code: number; label: string }) {
  return (
    <View style={{ alignItems: "center", gap: 5 }}>
      <Image source={{ uri: badgeUrl(code) }} style={{ width: 44, height: 50 }} resizeMode="contain" />
      <Text style={{ fontFamily: SERIF, fontSize: 13, color: D.ink }}>{label}</Text>
    </View>
  );
}
