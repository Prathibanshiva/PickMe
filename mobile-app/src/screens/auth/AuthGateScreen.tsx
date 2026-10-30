import AuthLoadingScreen from "@/screens/auth/AuthLoadingScreen";
import PassengerHomeScreen from "@/screens/passenger/PassengerHomeScreen";
import DriverStatusGate from "@/screens/driver/DriverStatusGate";
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
    return <DriverStatusGate />;
  }

  return <RoleSelectionScreen />;
}