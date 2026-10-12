import { useLocalSearchParams } from "expo-router";

import PhoneNumberScreen from "@/screens/auth/PhoneNumberScreen";

export default function LoginScreen() {
  const { role } = useLocalSearchParams<{
    role?: string;
  }>();

  const selectedRole =
    role === "driver" ? "driver" : "passenger";

  return (
    <PhoneNumberScreen
      role={selectedRole}
    />
  );
}