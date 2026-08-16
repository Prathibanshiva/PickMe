import React from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Colors,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from "@/theme";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export default function LoadingOverlay({
  visible,
  message = "Please wait...",
}: LoadingOverlayProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator
            size="large"
            color={Colors.primary}
          />

          <Text style={styles.message}>
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,

    justifyContent: "center",
    alignItems: "center",

    backgroundColor: Colors.overlay,
  },

  card: {
    width: 220,

    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,

    borderRadius: Radius.lg,

    backgroundColor: Colors.surface,

    alignItems: "center",

    ...Shadows.lg,
  },

  message: {
    marginTop: Spacing.md,

    ...Typography.bodyMedium,

    color: Colors.text.primary,

    textAlign: "center",
  },
});