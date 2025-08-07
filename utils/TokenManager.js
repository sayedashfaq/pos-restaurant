// utils/TokenManager.js

import jwt_decode from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';

let logoutTimer = null;

export const startTokenExpiryWatcher = async (onLogout) => {
  const token = await AsyncStorage.getItem('access_token');
  if (!token) return;

  try {
    const decoded = jwt_decode(token);
    const now = Date.now();
    const expiryTime = decoded.exp * 1000;

    const timeUntilExpiry = expiryTime - now;

    console.log(`⏰ Token expires in ${Math.round(timeUntilExpiry / 1000)} seconds`);

    if (logoutTimer) clearTimeout(logoutTimer);

    logoutTimer = setTimeout(async () => {
      console.log('🔒 Token expired. Auto logging out.');
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      if (onLogout) onLogout();
    }, timeUntilExpiry);

  } catch (err) {
    console.warn('Failed to decode token:', err);
  }
};

export const clearTokenWatcher = () => {
  if (logoutTimer) {
    clearTimeout(logoutTimer);
    logoutTimer = null;
  }
};
