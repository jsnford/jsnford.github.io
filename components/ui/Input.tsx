import { useState } from "react";
import { TextInput, type TextInputProps, View } from "react-native";
import { font, radius, space, useColors } from "../../theme/tokens";
import { Text } from "./Text";

interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, style, ...rest }: InputProps) {
  const c = useColors();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: space.xs }}>
      {label ? <Text variant="label" tone="faint">{label}</Text> : null}
      <TextInput
        placeholderTextColor={c.textFaint}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          {
            height: 48,
            borderWidth: 1,
            borderColor: error ? c.danger : focused ? c.accent : c.line,
            backgroundColor: c.surface,
            borderRadius: radius.md,
            paddingHorizontal: space.md,
            fontSize: font.body,
            color: c.text,
          },
          style,
        ]}
        {...rest}
      />
      {error ? <Text variant="small" tone="danger">{error}</Text>
        : hint ? <Text variant="small" tone="faint">{hint}</Text> : null}
    </View>
  );
}
