// mobile-app/src/services/api.ts

import { Platform } from "react-native";

/**
 * Backend URL used by the mobile application.
 *
 * Android Emulator:
 * 10.0.2.2 points to the host computer's localhost.
 *
 * Physical Android device:
 * Replace this with your computer's LAN IP address when testing
 * on a physical device.
 */
const API_BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:5000"
    : "http://localhost:5000";

export default API_BASE_URL;