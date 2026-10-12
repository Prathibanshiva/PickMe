import React, { useRef } from "react";
import {
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import {
  Colors,
  Radius,
  Spacing,
  Typography,
} from "@/theme";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}

export default function OTPInput({
  value,
  onChange,
  length = 6,
}: OTPInputProps) {
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const otp = value.split("");

    otp[index] = text;

    const newOTP = otp.join("").slice(0, length);

    onChange(newOTP);

    if (text && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    key: string,
    index: number
  ) => {
    if (
      key === "Backspace" &&
      !value[index] &&
      index > 0
    ) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputs.current[index] = ref;
          }}
          value={value[index] ?? ""}
          onChangeText={(text) =>
            handleChange(text.slice(-1), index)
          }
          onKeyPress={({ nativeEvent }) =>
            handleKeyPress(nativeEvent.key, index)
          }
          keyboardType="number-pad"
          maxLength={1}
          textAlign="center"
          style={styles.input}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },

  input: {
    width: 48,
    height: 56,

    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: Radius.md,

    backgroundColor: Colors.surface,

    ...Typography.headingSmall,

    color: Colors.text.primary,
  },
});