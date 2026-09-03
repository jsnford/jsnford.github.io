import { ScrollView, View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { space, useColors } from "../../theme/tokens";

// Constrain content to a phone-width column so the web/desktop view feels like
// the mobile app (centered).
const MAX_W = 420;

interface ScreenProps extends ViewProps {
  scroll?: boolean;
  padded?: boolean;
}

// Standard page container: fills the screen, applies the page background and
// safe-area top padding. `scroll` wraps content in a ScrollView.
export function Screen({ scroll = true, padded = true, children, style, ...rest }: ScreenProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const pad = padded ? space.lg : 0;
  const inner = (
    <View style={[{ flex: scroll ? undefined : 1, width: "100%", maxWidth: MAX_W, alignSelf: "center", padding: pad, gap: space.lg }, style]} {...rest}>
      {children}
    </View>
  );
  if (scroll) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: c.bg }}
        contentContainerStyle={{ paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        {inner}
      </ScrollView>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + space.sm }}>{inner}</View>
  );
}
