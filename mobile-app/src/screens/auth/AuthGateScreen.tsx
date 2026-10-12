import AuthLoadingScreen from "@/screens/auth/AuthLoadingScreen";
import PassengerHomeScreen from "@/screens/passenger/PassengerHomeScreen";
import DriverHomeScreen from "@/screens/driver/DriverHomeScreen";
import RoleSelectionScreen from "@/screens/auth/RoleSelectionScreen";

import { useAuth } from "@/store/auth.store";

export default function AuthGateScreen() {
  const {
    isLoading,
    isAuthenticated,
    role,
  } = useAuth();

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <RoleSelectionScreen />;
  }

  if (role === "passenger") {
    return <PassengerHomeScreen />;
  }

  if (role === "driver") {
    return <DriverHomeScreen />;
  }

  return <RoleSelectionScreen />;
}