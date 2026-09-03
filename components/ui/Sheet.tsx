import { Modal, Pressable, View } from "react-native";
import { space, useColors } from "../../theme/tokens";
import { HStack } from "./Stack";
import { Text } from "./Text";

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// Standard iOS page-sheet: native slide-up, grabber, and swipe-down to close,
// plus a close button top-right. Fixed height (the list inside just scrolls).
export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const c = useColors();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={{ flex: 1, width: "100%", maxWidth: 420, alignSelf: "center" }}>
          <HStack justify="space-between" align="center" style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.sm }}>
            <Text variant="h2">{title}</Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c.surface2, alignItems: "center", justifyContent: "center" }}
            >
              <Text variant="body" tone="soft">✕</Text>
            </Pressable>
          </HStack>
          <View style={{ flex: 1 }}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}
