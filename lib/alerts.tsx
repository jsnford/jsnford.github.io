import { useEffect, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { Text } from "../components/ui/Text";
import { VStack } from "../components/ui/Stack";
import { space, useColors } from "../theme/tokens";

// Cross-platform alerts/confirms/action-sheets. react-native-web has no
// Alert.alert, so we render our own modal and expose promise-based helpers that
// work identically on web and native. Call from anywhere (incl. async flows).

interface Btn { label: string; onPress?: () => void; destructive?: boolean; cancel?: boolean }
interface AlertState { title?: string; message?: string; buttons: Btn[] }

let showFn: ((s: AlertState) => void) | null = null;

export function notify(title: string, message?: string): Promise<void> {
  return new Promise((resolve) => {
    if (!showFn) return resolve();
    showFn({ title, message, buttons: [{ label: "OK", onPress: () => resolve() }] });
  });
}

export function confirmAction(title: string, message: string, confirmLabel = "OK", destructive = false): Promise<boolean> {
  return new Promise((resolve) => {
    if (!showFn) return resolve(true);
    showFn({
      title, message,
      buttons: [
        { label: "Cancel", cancel: true, onPress: () => resolve(false) },
        { label: confirmLabel, destructive, onPress: () => resolve(true) },
      ],
    });
  });
}

export function actionSheet(title: string, message: string | undefined, actions: { label: string; onPress: () => void; destructive?: boolean }[]): Promise<void> {
  return new Promise((resolve) => {
    if (!showFn) return resolve();
    showFn({
      title, message,
      buttons: [
        ...actions.map((a) => ({ label: a.label, destructive: a.destructive, onPress: () => { a.onPress(); resolve(); } })),
        { label: "Cancel", cancel: true, onPress: () => resolve() },
      ],
    });
  });
}

export function AlertHost() {
  const c = useColors();
  const [state, setState] = useState<AlertState | null>(null);

  useEffect(() => {
    showFn = (s) => setState(s);
    return () => { showFn = null; };
  }, []);

  const close = (btn?: Btn) => { setState(null); btn?.onPress?.(); };
  if (!state) return null;
  const cancelBtn = state.buttons.find((b) => b.cancel);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => close(cancelBtn)}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", padding: space.xl }}
        onPress={() => close(cancelBtn)}
      >
        <Pressable style={{ backgroundColor: c.surface, borderRadius: 16, width: "100%", maxWidth: 340, overflow: "hidden" }} onPress={() => {}}>
          <VStack style={{ padding: space.lg, gap: space.xs }}>
            {state.title ? <Text variant="h3">{state.title}</Text> : null}
            {state.message ? <Text variant="body" tone="soft">{state.message}</Text> : null}
          </VStack>
          <VStack>
            {state.buttons.map((b, i) => (
              <Pressable
                key={i}
                onPress={() => close(b)}
                style={({ pressed }) => ({ paddingVertical: 14, alignItems: "center", borderTopWidth: 1, borderTopColor: c.line, backgroundColor: pressed ? c.surface2 : "transparent" })}
              >
                <Text variant="body" bold tone={b.destructive ? "danger" : b.cancel ? "faint" : "accent"}>{b.label}</Text>
              </Pressable>
            ))}
          </VStack>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
