import React from "react";
import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";

import {
  Colors,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from "@/theme";

interface OutlinedButtonProps {
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

export default function OutlinedButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}: OutlinedButtonProps) {
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
          width: fullWidth ? "100%" : undefined,
          backgroundColor: Colors.background,

          borderWidth: 1.5,
          borderColor: isDisabled
            ? Colors.border.light
            : Colors.primary,

          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.primary} />
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
              isDisabled && styles.disabledText,
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
    color: Colors.primary,
  },

  disabledText: {
    color: Colors.text.secondary,
  },
});