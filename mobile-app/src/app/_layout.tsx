import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/store/auth.store";
import { DriverOnboardingProvider } from "@/context/DriverOnboardingContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <DriverOnboardingProvider>
      <StatusBar style="dark" />

        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
      </DriverOnboardingProvider>
    </AuthProvider>
  );
}