import { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { radius, space, useColors } from "../../theme/tokens";
import { Text } from "./Text";

interface Option { value: string; label: string }

// Simple dropdown filter — a button that opens a modal list of options.
export function Dropdown({ value, options, onChange }: { value: string; options: Option[]; onChange: (v: string) => void }) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 40, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, backgroundColor: c.surface, paddingHorizontal: space.md }}
      >
        <Text variant="small" numberOfLines={1}>{current?.label ?? ""}</Text>
        <Text variant="small" tone="faint">▾</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: space.xl }} onPress={() => setOpen(false)}>
          <View style={{ backgroundColor: c.surface, borderRadius: radius.lg, maxHeight: "70%", overflow: "hidden" }}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {options.map((o) => (
                <Pressable key={o.value} onPress={() => { onChange(o.value); setOpen(false); }} style={{ paddingVertical: space.md, paddingHorizontal: space.lg, borderBottomWidth: 1, borderBottomColor: c.line }}>
                  <Text variant="body" tone={o.value === value ? "accent" : "default"} bold={o.value === value}>{o.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
