import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { badgeUrl, getDonkeyBoard, getMyDonkeyPick, playerPhoto, submitDonkeyPick, type DonkeyBoard, type DonkeyRow } from "../../lib/data";
import { D, donkeyColor, fmtDonkey, MAXW, SERIF } from "./theme";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const koText = (iso: string | null) => (iso ? `${DAYS[new Date(iso).getDay()]} ${new Date(iso).getDate()} — ${hhmm(new Date(iso))}` : "");

export default function DonkeySelect() {
  const router = useRouter();
  const [board, setBoard] = useState<DonkeyBoard | null>(null);
  const [saved, setSaved] = useState<number | null>(null);      // persisted pick
  const [selected, setSelected] = useState<number | null>(null); // staged pick
  const [saving, setSaving] = useState(false);

  useEffect(() => { getDonkeyBoard().then(setBoard).catch(() => {}); }, []);

  useEffect(() => {
    if (!board?.hasGame) return;
    const KEY = `donkey_pick_gw${board.gwNumber}`;
    const set = (v: number) => { setSaved(v); setSelected(v); };
    const local = () => AsyncStorage.getItem(KEY).then((v) => v && set(Number(v)));
    getMyDonkeyPick(board.gwNumber)
      .then((server) => { if (server != null) { set(server); AsyncStorage.setItem(KEY, String(server)); } else local(); })
      .catch(local);
  }, [board?.hasGame, board?.gwNumber]);

  const choose = (c: number) => setSelected(c);
  const onSave = async () => {
    if (!board?.hasGame || selected == null || selected === saved) return;
    setSaving(true);
    try {
      await submitDonkeyPick(board.gwNumber, selected);
      setSaved(selected);
      AsyncStorage.setItem(`donkey_pick_gw${board.gwNumber}`, String(selected));
    } catch { /* keep staged; retry */ } finally { setSaving(false); }
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace("/donkey"));
  const home = board?.rows.filter((r) => r.side === "home") ?? [];
  const away = board?.rows.filter((r) => r.side === "away") ?? [];
  const ko = board?.koISO ? new Date(board.koISO) : null;
  const confirmAt = ko ? hhmm(new Date(ko.getTime() - 60 * 60000)) : "—";
  const selectBy = ko ? hhmm(new Date(ko.getTime() - 60000)) : "—";

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
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 26 }}>
                  <Crest code={board.home.clubCode} label={board.home.club} />
                  <Text style={{ fontFamily: SERIF, fontSize: 15, color: D.ink }}>VS</Text>
                  <Crest code={board.away.clubCode} label={board.away.club} />
                </View>
                <Text style={{ fontFamily: SERIF, fontSize: 15, color: D.ink, marginTop: 10 }}>{koText(board.koISO)}</Text>
              </View>

              <View style={{ height: 1, backgroundColor: D.line, marginTop: 18, marginBottom: 16 }} />

              <StatePill confirmed={board.confirmed} />
              <Text style={{ fontFamily: SERIF, fontSize: 24, color: D.ink, textAlign: "center", marginTop: 8 }}>Player options</Text>
              <Text style={{ fontSize: 10.5, letterSpacing: 0.6, color: D.soft, textAlign: "center", marginTop: 8, lineHeight: 16 }}>
                PLAYER OPTIONS CONFIRMED AT {confirmAt}{"\n"}SELECT YOUR PLAYER BY {selectBy}
              </Text>

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20, marginBottom: 8 }}>
                <Text style={{ fontFamily: SERIF, fontSize: 13, color: D.ink }}>{board.home.name.toUpperCase()}</Text>
                <Text style={{ fontFamily: SERIF, fontSize: 13, color: D.ink }}>{board.away.name.toUpperCase()}</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1, gap: 10 }}>{home.map((r) => <PlayerCard key={r.fplCode} r={r} on={selected === r.fplCode} onPick={() => choose(r.fplCode)} />)}</View>
                <View style={{ flex: 1, gap: 10 }}>{away.map((r) => <PlayerCard key={r.fplCode} r={r} on={selected === r.fplCode} onPick={() => choose(r.fplCode)} />)}</View>
              </View>

              {(() => {
                const isSaved = selected != null && selected === saved;
                const canSave = selected != null && selected !== saved && !saving;
                return (
                  <Pressable disabled={!canSave} onPress={onSave}
                    style={({ pressed }) => ({ borderRadius: 6, paddingVertical: 15, marginTop: 20, alignItems: "center", backgroundColor: canSave ? D.black : "transparent", borderWidth: canSave ? 0 : 1, borderColor: D.line, opacity: pressed ? 0.85 : 1 })}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: canSave ? D.white : D.soft }}>{saving ? "Saving…" : isSaved ? "Selection Saved" : "Save selection"}</Text>
                  </Pressable>
                );
              })()}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function StatePill({ confirmed }: { confirmed: boolean }) {
  return (
    <View style={{ alignSelf: "center", paddingHorizontal: 11, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: confirmed ? D.black : D.line, backgroundColor: confirmed ? D.black : "transparent" }}>
      <Text style={{ fontSize: 9.5, letterSpacing: 1.2, fontWeight: "600", color: confirmed ? D.white : D.soft }}>{confirmed ? "CONFIRMED" : "PREDICTED"}</Text>
    </View>
  );
}

function Crest({ code, label }: { code: number; label: string }) {
  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <Image source={{ uri: badgeUrl(code) }} style={{ width: 52, height: 60 }} resizeMode="contain" />
      <Text style={{ fontFamily: SERIF, fontSize: 13, color: D.ink }}>{label}</Text>
    </View>
  );
}

function PlayerCard({ r, on, onPick }: { r: DonkeyRow; on: boolean; onPick: () => void }) {
  return (
    <Pressable onPress={onPick} style={{ borderWidth: on ? 2 : 1, borderColor: on ? D.black : D.line, borderRadius: 8, padding: 10, backgroundColor: D.bg }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ width: 46, height: 46, borderRadius: 6, backgroundColor: "#DED4C6", overflow: "hidden" }}>
          <Image source={{ uri: playerPhoto(r.fplCode) }} style={{ width: 46, height: 46 }} resizeMode="cover" />
        </View>
        <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: on ? D.black : D.faint, backgroundColor: on ? D.black : "transparent" }} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 5, marginTop: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: D.ink }} numberOfLines={1}>{r.displayName}</Text>
        <Text style={{ fontSize: 9.5, letterSpacing: 0.5, color: D.faint }}>{r.pos}</Text>
      </View>
      <Text style={{ fontSize: 10.5, color: D.soft, marginTop: 5 }}>
        Season avg: <Text style={{ color: donkeyColor(r.avgDonkey), fontWeight: "600" }}>{fmtDonkey(r.avgDonkey)}</Text>   🫏 Donkey: <Text style={{ color: D.ink, fontWeight: "600" }}>{r.donkeyCount}</Text>
      </Text>
      <View style={{ flexDirection: "row", marginTop: 8, borderTopWidth: 1, borderTopColor: D.line, paddingTop: 7 }}>
        {r.perGw.map((g) => (
          <View key={g.gw} style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, letterSpacing: 0.4, color: D.faint }}>GW{g.gw}</Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: donkeyColor(g.donkey), marginTop: 2 }}>{fmtDonkey(g.donkey)}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}
