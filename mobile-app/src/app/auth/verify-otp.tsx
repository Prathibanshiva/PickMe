import { useLocalSearchParams } from "expo-router";

import OTPScreen from "@/screens/auth/OTPScreen";

export default function VerifyOtpScreen() {
  const {
    phoneNumber,
    role,
  } = useLocalSearchParams<{
    phoneNumber?: string;
    role?: string;
  }>();

  const selectedRole =
    role === "driver" ? "driver" : "passenger";

  return (
    <OTPScreen
      phoneNumber={phoneNumber || ""}
      role={selectedRole}
    />
  );
}