import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import PrimaryButton from "@/components/Button";
import OutlinedButton from "@/components/OutlinedButton";

import {
  Colors,
  Spacing,
  Typography,
} from "@/theme";

export default function RoleSelectionScreen() {
  const handlePassenger = () => {
    router.push({
      pathname: "/auth/login",
      params: {
        role: "passenger",
      },
    });
  };

  const handleDriver = () => {
    router.push({
      pathname: "/auth/login",
      params: {
        role: "driver",
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>
            Smarter Rides.
          </Text>

          <Text style={styles.subtitle}>
            Shared Better.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Continue as Passenger"
            onPress={handlePassenger}
          />

          <View style={styles.buttonSpacing} />

          <OutlinedButton
            title="Continue as Driver"
            onPress={handleDriver}
          />
        </View>

        <Text style={styles.footer}>
          You can switch anytime from Profile.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  logo: {
    width: 630,
    height: 320,
  },

  title: {
    marginTop: Spacing.lg,
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text.primary,
    textAlign: "center",
  },

  subtitle: {
    marginTop: Spacing.xs,
    fontSize: 28,
    fontWeight: "700",
    color: Colors.primary,
    textAlign: "center",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },

  header: {
    alignItems: "center",
  },

  buttonContainer: {
    marginTop: Spacing.xxl,
  },

  buttonSpacing: {
    height: Spacing.md,
  },

  footer: {
    marginTop: Spacing.lg,
    textAlign: "center",
    color: Colors.text.secondary,
    ...Typography.caption,
  },
});