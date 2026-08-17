import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/store/auth.store";
import { Colors, Spacing, Typography } from "@/theme";

export default function PassengerHomeScreen() {
const { user, role } = useAuth();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Passenger Home
        </Text>

        <Text style={styles.subtitle}>
          Welcome to PickMe
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.label}>
            Phone Number
          </Text>

          <Text style={styles.value}>
            +91 {user?.phoneNumber}
          </Text>

          <Text style={styles.label}>
            Current Role
          </Text>

          <Text style={styles.value}>
            {role}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
  },

  title: {
    ...Typography.headingLarge,
    color: Colors.text.primary,
  },

  subtitle: {
    marginTop: Spacing.xs,
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
  },

  infoCard: {
    marginTop: Spacing.xxl,
    padding: Spacing.lg,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
  },

  label: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },

  value: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
});