import { useEffect, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { badgeUrl, type FixtureLite } from "../lib/data";
import { radius, space, useColors } from "../theme/tokens";
import { HStack, Text, VStack } from "./ui";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function koLabel(iso: string | null) {
  if (!iso) return "TBC";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${DAYS[d.getDay()]} ${hh}:${mm}`;
}

// Live match clock from wall-time since kickoff — the only real-time source
// (FPL's minute fields lag by several minutes). Half-time is approximated as a
// ~15-min gap after 45, and the second half counts from there.
function liveClock(koIso: string | null, fplMinutes: number | null): string {
  if (!koIso) return fplMinutes ? `${fplMinutes}'` : "LIVE";
  const mins = (Date.now() - Date.parse(koIso)) / 60000;
  if (mins < 0) return "LIVE";
  if (mins <= 47) return `${Math.max(1, Math.floor(mins))}'`;
  if (mins < 62) return "HT";
  const second = mins - 15; // discount the half-time break
  return second >= 90 ? "90+'" : `${Math.floor(second)}'`;
}

// Horizontal, kickoff-ordered strip of every fixture in the gameweek. Upcoming
// games show their kickoff time; live/finished games show the score.
export function FixtureStrip({ fixtures }: { fixtures: FixtureLite[] }) {
  const c = useColors();
  // Tick the live clock locally so it advances between data refreshes.
  const [, setTick] = useState(0);
  const anyLive = fixtures.some((f) => f.status === "live");
  useEffect(() => {
    if (!anyLive) return;
    const id = setInterval(() => setTick((t) => t + 1), 20000);
    return () => clearInterval(id);
  }, [anyLive]);
  if (!fixtures.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: space.sm, paddingRight: space.lg }}
    >
      {fixtures.map((f) => {
        const live = f.status === "live";
        const done = f.status === "finished";
        const showScore = live || done;
        const header = live ? liveClock(f.ko, f.minutes) : done ? "FT" : koLabel(f.ko);
        return (
          <VStack
            key={f.id}
            gap={6}
            style={{ width: 132, backgroundColor: c.surface, borderWidth: 1, borderColor: live ? c.accent : c.line, borderRadius: radius.md, padding: space.sm }}
          >
            <HStack gap={5} align="center">
              {live ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent }} /> : null}
              <Text variant="small" tone={live ? "accent" : "faint"} bold={live}>{header}</Text>
            </HStack>
            <TeamRow short={f.homeShort} code={f.homeCode} score={showScore ? f.homeScore : null} />
            <TeamRow short={f.awayShort} code={f.awayCode} score={showScore ? f.awayScore : null} />
          </VStack>
        );
      })}
    </ScrollView>
  );
}

function TeamRow({ short, code, score }: { short: string; code: number; score: number | null }) {
  return (
    <HStack gap={7} align="center">
      <Image source={{ uri: badgeUrl(code) }} style={{ width: 20, height: 20 }} resizeMode="contain" />
      <Text variant="small" bold style={{ flex: 1 }} numberOfLines={1}>{short}</Text>
      {score != null ? <Text variant="body" bold>{score}</Text> : null}
    </HStack>
  );
}
