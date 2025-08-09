import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './screens/LoginScreen';
import MenuScreen from './screens/MenuScreen';
import OrderScreen from './screens/OrderScreen';
import DeliveryBoyScreen from './screens/DeliveryBoyScreen';
import { AuthAPI } from './api/api';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialScreen, setInitialScreen] = useState('Login');

  useEffect(() => {
  const forceLogoutForTesting = async () => {
    console.log('Clearing tokens for testing...');
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    // Add any other storage items you use for auth
  };
  
  // Call this when you need to reset auth state
  // forceLogoutForTesting(); // Uncomment when needed
}, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await AuthAPI.setupAuthHeader();
        const token = await AsyncStorage.getItem('access_token');
        
        if (!token) {
          setIsLoading(false);
          return;
        }

        const user = await AuthAPI.getAccountInfo();
        console.log(user)
       
        switch (user.role.toLowerCase()) {
          case 'waiter':
            case 'admin':

            setInitialScreen('Menu');
            break;
          case 'delivery':
            setInitialScreen('Delivery');
            break;
          default:
            console.warn(`Unsupported role: ${user.role}. Redirecting to login.`);
            await AuthAPI.logout();
            setInitialScreen('Login');
        }
      } catch (error) {
        console.log('Auth initialization error:', error);
        if (error.response?.status === 401) {
          await AuthAPI.logout();
        }
        setInitialScreen('Login');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (


    // <NavigationContainer>
    //   <Stack.Navigator>
    //   <Stack.Screen name="Delivery" component={DeliveryBoyScreen} />
      
    //   </Stack.Navigator>
    // </NavigationContainer>
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={initialScreen}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="Orders" component={OrderScreen} />
        <Stack.Screen name="Delivery" component={DeliveryBoyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}