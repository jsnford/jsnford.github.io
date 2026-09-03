import { Image, Pressable, Text as RNText, View } from "react-native";
import { kitUrl, type PoolPlayer } from "../lib/data";

// Starter positions on the pitch (fraction of width/height), a 1-2-2 shape.
const SPOTS = [
  { left: 0.5, top: 0.86 },
  { left: 0.27, top: 0.6 },
  { left: 0.73, top: 0.6 },
  { left: 0.31, top: 0.3 },
  { left: 0.69, top: 0.3 },
];
const LINE = "rgba(255,255,255,0.55)";
const PITCH = "#1f8a4c";

interface PitchProps {
  starters: (PoolPlayer | null)[]; // length 5
  captainId?: string | null;
  points?: Record<string, number>; // playerId -> gw points; shows a badge when set
  subline?: Record<string, string>; // playerId -> small caption under the name (opponent / score)
  onSlotPress?: (index: number) => void; // starter slots tappable when provided
  sub?: PoolPlayer | null; // bench player; pass the prop (even as null) to show the bench
  onSubPress?: () => void; // bench slot tappable when provided
  subActivated?: boolean; // sub came on this gameweek
}

export function Pitch({ starters, captainId, points, subline, onSlotPress, sub, onSubPress, subActivated }: PitchProps) {
  const showBench = sub !== undefined;
  const pts = (id?: string) => (id && points ? points[id] : undefined);
  const cap = (id?: string) => (id && subline ? subline[id] : undefined);
  return (
    <View style={{ width: "100%", backgroundColor: PITCH, borderRadius: 16, overflow: "hidden" }}>
      <View style={{ width: "100%", aspectRatio: 0.9 }}>
        <View style={{ position: "absolute", top: 8, left: 8, right: 8, bottom: 8, borderWidth: 2, borderColor: LINE, borderRadius: 6 }} />
        <View style={{ position: "absolute", left: 8, right: 8, top: "50%", height: 2, backgroundColor: LINE }} />
        <View style={{ position: "absolute", left: "50%", top: "50%", width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: LINE, transform: [{ translateX: -36 }, { translateY: -36 }] }} />
        <View style={{ position: "absolute", left: "27%", right: "27%", top: 8, height: 46, borderWidth: 2, borderTopWidth: 0, borderColor: LINE }} />
        <View style={{ position: "absolute", left: "27%", right: "27%", bottom: 8, height: 46, borderWidth: 2, borderBottomWidth: 0, borderColor: LINE }} />
        {SPOTS.map((s, i) => (
          <View key={i} style={{ position: "absolute", left: `${s.left * 100}%`, top: `${s.top * 100}%`, width: 84, transform: [{ translateX: -42 }, { translateY: -30 }] }}>
            <Slot
              player={starters[i]}
              captain={!!starters[i] && captainId === starters[i]?.id}
              pts={pts(starters[i]?.id)}
              caption={cap(starters[i]?.id)}
              onPress={onSlotPress ? () => onSlotPress(i) : undefined}
            />
          </View>
        ))}
      </View>

      {showBench ? (
        <View style={{ borderTopWidth: 2, borderTopColor: LINE, borderStyle: "dashed", paddingTop: 12, paddingBottom: 14, minHeight: 96, justifyContent: "center" }}>
          <RNText style={{ position: "absolute", top: 10, left: 12, color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "700", letterSpacing: 1 }}>SUB</RNText>
          {subActivated ? (
            <View style={{ position: "absolute", top: 8, right: 12, backgroundColor: "#0b3d24", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
              <RNText style={{ color: "#fff", fontSize: 10, fontWeight: "700", letterSpacing: 1 }}>ON</RNText>
            </View>
          ) : null}
          <View style={{ alignItems: "center" }}>
            <Slot player={sub ?? null} captain={false} pts={pts(sub?.id)} caption={cap(sub?.id)} onPress={onSubPress} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Slot({ player, captain, pts, caption, onPress }: { player: PoolPlayer | null; captain: boolean; pts?: number; caption?: string; onPress?: () => void }) {
  const body = player ? (
    <>
      <View style={{ width: 54, height: 54, alignItems: "center", justifyContent: "center" }}>
        <Image source={{ uri: kitUrl(player.clubCode, player.position === "GK") }} style={{ width: 52, height: 52 }} resizeMode="contain" />
        {captain ? (
          <View style={{ position: "absolute", top: -2, right: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: "#111", alignItems: "center", justifyContent: "center" }}>
            <RNText style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>C</RNText>
          </View>
        ) : null}
      </View>
      <View style={{ backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, marginTop: 2, maxWidth: 84 }}>
        <RNText numberOfLines={1} style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>{player.name}</RNText>
      </View>
      {caption !== undefined ? (
        <RNText numberOfLines={1} style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: "500", marginTop: 2, maxWidth: 84 }}>{caption}</RNText>
      ) : null}
      {pts !== undefined ? (
        <View style={{ backgroundColor: "#0b3d24", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1, marginTop: 2 }}>
          <RNText style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>{Math.round(pts)}</RNText>
        </View>
      ) : null}
    </>
  ) : (
    <View style={{ width: 54, height: 54, borderRadius: 27, borderWidth: 2, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.85)", alignItems: "center", justifyContent: "center" }}>
      <RNText style={{ color: "#fff", fontSize: 26, fontWeight: "400" }}>+</RNText>
    </View>
  );
  if (!onPress) return <View style={{ alignItems: "center" }}>{body}</View>;
  return <Pressable onPress={onPress} style={{ alignItems: "center" }}>{body}</Pressable>;
}
