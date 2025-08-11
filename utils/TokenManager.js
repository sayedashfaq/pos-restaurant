import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer"; // Expo includes this by default

let logoutTimer = null;

// Custom JWT decoder for Expo
const expoJwtDecode = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("JWT decode error:", error);
    throw new Error("Invalid token format");
  }
};

export const startTokenExpiryWatcher = async (onLogout) => {
  try {
    const token = await AsyncStorage.getItem("access_token");
    console.log("🔑 Current token:", token);

    if (!token) return;

    const decoded = expoJwtDecode(token);
    console.log("🔍 Decoded token:", decoded);

    const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

    console.log(
      `⏰ Session will expire in ${SESSION_TIMEOUT / 1000} seconds (5 minutes)`
    );

    if (logoutTimer) clearTimeout(logoutTimer);

    logoutTimer = setTimeout(async () => {
      console.log("🔒 Session expired (5-minute timeout). Auto logging out.");
      await AsyncStorage.removeItem("access_token");
      await AsyncStorage.removeItem("refresh_token");
      if (onLogout) onLogout();
    }, SESSION_TIMEOUT);
  } catch (err) {
    console.warn("Token processing failed:", err);
  }
};

export const clearTokenWatcher = () => {
  if (logoutTimer) {
    clearTimeout(logoutTimer);
    logoutTimer = null;
  }
};
