import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TextInputProps,
} from "react-native";

import {
  Colors,
  Radius,
  Spacing,
  Typography,
} from "@/theme";

interface PhoneInputProps extends TextInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
}

export default function PhoneInput({
  label = "Mobile Number",
  value,
  onChangeText,
  ...props
}: PhoneInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputContainer}>
        <View style={styles.countryCodeContainer}>
          <Text style={styles.countryCode}>+91</Text>
        </View>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="phone-pad"
          maxLength={10}
          placeholder="Enter mobile number"
          placeholderTextColor={Colors.text.disabled}
          style={styles.input}
          {...props}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  label: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",

    height: 56,

    borderWidth: 1,
    borderColor: Colors.border.medium,

    borderRadius: Radius.md,

    backgroundColor: Colors.surface,
  },

  countryCodeContainer: {
    paddingHorizontal: Spacing.lg,
    borderRightWidth: 1,
    borderRightColor: Colors.border.light,
  },

  countryCode: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    fontWeight: "600",
  },

  input: {
    flex: 1,
    height: "100%",

    paddingHorizontal: Spacing.md,

    ...Typography.bodyMedium,
    color: Colors.text.primary,
  },
});