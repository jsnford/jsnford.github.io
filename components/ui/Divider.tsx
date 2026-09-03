import { View } from "react-native";
import { useColors } from "../../theme/tokens";

export function Divider() {
  const c = useColors();
  return <View style={{ height: 1, backgroundColor: c.line, alignSelf: "stretch" }} />;
}
