import React from "react";
import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";

import {
  Colors,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from "@/theme";

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;

  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;

  leftIcon?: ReactNode;
  rightIcon?: ReactNode;

  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        Shadows.sm,

        {
          backgroundColor: isDisabled
            ? Colors.button.disabled
            : pressed
            ? Colors.button.primaryPressed
            : Colors.button.primary,

          width: fullWidth ? "100%" : undefined,
        },

        style,
      ]}
    >
      {loading ? (
  <ActivityIndicator color={Colors.text.inverse} />
) : (
  <>
    {leftIcon}

    <Text
      style={[
        Typography.button,
        styles.text,
        {
          marginHorizontal:
            leftIcon || rightIcon ? Spacing.xs : 0,
        },
        textStyle,
      ]}
    >
      {title}
    </Text>

    {rightIcon}
  </>
)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: Radius.md,
    flexDirection: "row",

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: Spacing.lg,
  },

  text: {
    color: Colors.text.inverse,
  },
});