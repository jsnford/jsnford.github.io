import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { badgeUrl, getDonkeyCompleted, playerPhoto, type DonkeyCompleted } from "../../../lib/data";
import { D, donkeyColor, fmtDonkey, MAXW, SERIF } from "../theme";

export default function DonkeyResults() {
  const router = useRouter();
  const { gw } = useLocalSearchParams<{ gw: string }>();
  const gwNum = Number(gw);
  const [data, setData] = useState<DonkeyCompleted | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getDonkeyCompleted(gwNum)
      .then((d) => alive && setData(d))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [gwNum]);

  const back = () => (router.canGoBack() ? router.back() : router.replace("/donkey"));

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 44 }}>
        <View style={{ width: "100%", maxWidth: MAXW, alignSelf: "center", paddingHorizontal: 18 }}>
          <Pressable onPress={back} hitSlop={12} style={{ paddingTop: 16, paddingBottom: 4 }}>
            <Text style={{ fontSize: 22, color: D.ink }}>←</Text>
          </Pressable>

          {loading ? (
            <View style={{ paddingTop: 60, alignItems: "center" }}><ActivityIndicator color={D.ink} /></View>
          ) : !data ? (
            <Text style={{ fontFamily: SERIF, fontSize: 18, color: D.soft, textAlign: "center", paddingTop: 60 }}>
              That gameweek hasn't been settled yet.
            </Text>
          ) : (
            <>
              {/* header */}
              <View style={{ alignItems: "center", paddingTop: 6 }}>
                <Text style={{ fontSize: 10.5, letterSpacing: 1, color: D.faint }}>GAMEWEEK {data.gw}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24, marginTop: 10 }}>
                  <Crest code={data.home.clubCode} label={data.home.club} />
                  <Text style={{ fontFamily: SERIF, fontSize: 15, color: D.ink }}>VS</Text>
                  <Crest code={data.away.clubCode} label={data.away.club} />
                </View>
                <Text style={{ fontFamily: SERIF, fontSize: 13, color: D.soft, marginTop: 10, letterSpacing: 0.5 }}>FULL TIME</Text>
              </View>

              {/* the donkey */}
              <View style={{ borderWidth: 1, borderColor: D.line, borderRadius: 10, padding: 16, marginTop: 20, flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: "#DED4C6", overflow: "hidden" }}>
                  <Image source={{ uri: playerPhoto(data.donkeyCode) }} style={{ width: 54, height: 54 }} resizeMode="cover" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10.5, letterSpacing: 0.8, color: D.soft }}>THE DONKEY 🫏</Text>
                  <Text style={{ fontFamily: SERIF, fontSize: 22, color: D.ink, marginTop: 2 }}>{data.donkeyName}</Text>
                </View>
                <Text style={{ fontFamily: SERIF, fontSize: 22, color: donkeyColor(data.donkeyScore) }}>{fmtDonkey(data.donkeyScore)}</Text>
              </View>

              {/* final board */}
              <View style={{ height: 1, backgroundColor: D.line, marginTop: 22, marginBottom: 14 }} />
              <Text style={{ fontFamily: SERIF, fontSize: 22, color: D.ink, textAlign: "center" }}>Final rankings</Text>
              <Text style={{ fontSize: 10.5, letterSpacing: 0.5, color: D.soft, textAlign: "center", marginTop: 6 }}>BIGGEST xG UNDER-PERFORMER WAS THE 🫏</Text>

              <View style={{ marginTop: 16, gap: 8 }}>
                {data.rows.map((r, i) => (
                  <View key={r.fplCode} style={{ flexDirection: "row", alignItems: "center", gap: 12, borderWidth: r.isDonkey ? 2 : 1, borderColor: r.isDonkey ? D.black : D.line, borderRadius: 8, padding: 10 }}>
                    <Text style={{ width: 24, textAlign: "center", fontSize: 16 }}>
                      {r.isDonkey ? "🫏" : <Text style={{ fontFamily: SERIF, color: D.soft }}>{i + 1}</Text>}
                    </Text>
                    <View style={{ width: 38, height: 38, borderRadius: 6, backgroundColor: "#DED4C6", overflow: "hidden" }}>
                      <Image source={{ uri: playerPhoto(r.fplCode) }} style={{ width: 38, height: 38 }} resizeMode="cover" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: D.ink }} numberOfLines={1}>{r.displayName}</Text>
                      <Text style={{ fontSize: 10.5, color: D.soft, marginTop: 2 }}>
                        {r.played ? `${r.xg.toFixed(2)} xG · ${r.goals} ${r.goals === 1 ? "goal" : "goals"} · ${r.minutes}′` : "Did not feature"}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: SERIF, fontSize: 20, color: r.donkey == null ? D.faint : donkeyColor(r.donkey) }}>
                      {r.donkey == null ? "—" : fmtDonkey(r.donkey)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* managers */}
              {data.managers.length ? (
                <>
                  <View style={{ height: 1, backgroundColor: D.line, marginTop: 26, marginBottom: 14 }} />
                  <Text style={{ fontFamily: SERIF, fontSize: 22, color: D.ink, textAlign: "center" }}>Who picked what</Text>
                  <View style={{ marginTop: 14, gap: 2 }}>
                    {data.managers.map((m, idx) => (
                      <View key={idx} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 9, borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: D.line }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: SERIF, fontSize: 15, color: D.ink }} numberOfLines={1}>{m.team}</Text>
                          <Text style={{ fontSize: 10.5, color: D.soft, marginTop: 1 }}>picked {m.pickName}</Text>
                        </View>
                        {m.gotLetter ? (
                          <Text style={{ fontSize: 16 }}>🫏</Text>
                        ) : (
                          <Text style={{ fontSize: 10.5, letterSpacing: 0.5, color: D.green, fontWeight: "600" }}>SAFE</Text>
                        )}
                      </View>
                    ))}
                  </View>
                </>
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
