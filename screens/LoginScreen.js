import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthAPI } from '../api/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const [buttonScale] = useState(new Animated.Value(1));
  const [isLoading, setIsLoading] = useState(false);


  
const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Error', 'Please enter both email and password');
    return;
  }

  setIsLoading(true);
  
  try {
 
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true
      })
    ]).start();

  
    const response = await AuthAPI.login(email, password);
    

    if (response) {
      navigation.replace('Menu');
    } else {
      throw new Error('No response received from server');
    }
    
  } catch (error) {
    console.error('Login error:', error);
    let errorMessage = "Login failed. Please try again.";
    

    if (error.response?.data) {
      const apiError = error.response.data;
      errorMessage = 
        apiError.non_field_errors?.[0] ||
        apiError.detail ||
        apiError.message ||
        (typeof apiError === 'string' ? apiError : 'Invalid credentials');
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    Alert.alert('Login Error', errorMessage);
    setPassword('');
  } finally {
    setIsLoading(false);
  }
};
    return (
      <ImageBackground
        source={require('../assets/auth-bg.jpg')}
        style={styles.container}
        blurRadius={2}
      >
        <LinearGradient
          colors={['rgba(0,123,255,0.85)', 'rgba(0,86,179,0.9)']}
          style={styles.gradientOverlay}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.logoContainer}>
              <MaterialIcons name="restaurant" size={60} color="white" />
              <Text style={styles.logoText}>POS PRO</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.welcomeText}>Welcome Back!</Text>
              <Text style={styles.subText}>Sign in to continue</Text>

              <View style={[
                styles.inputContainer,
                focusedInput === 'email' && styles.inputFocused
              ]}>
                <MaterialIcons
                  name="person"
                  size={24}
                  color={focusedInput === 'email' ? '#007bff' : '#aaa'}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#aaa"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  style={styles.input}
                  editable={!isLoading}
                  autoCapitalize="none"
                />
              </View>

              <View style={[
                styles.inputContainer,
                focusedInput === 'password' && styles.inputFocused
              ]}>
                <MaterialIcons
                  name="lock"
                  size={24}
                  color={focusedInput === 'password' ? '#007bff' : '#aaa'}
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#aaa"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  style={styles.input}
                  editable={!isLoading}
                />
              </View>

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  onPress={handleLogin}
                  style={styles.loginButton}
                  activeOpacity={0.9}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={['#007bff', '#0062cc']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>LOGIN</Text>
                        <MaterialIcons name="arrow-forward" size={24} color="white" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity 
                style={styles.forgotButton}
                disabled={isLoading}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    gradientOverlay: {
      flex: 1,
      padding: 20,
    },
    keyboardView: {
      flex: 1,
      justifyContent: 'center',
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logoText: {
      color: 'white',
      fontSize: 28,
      fontWeight: '700',
      marginTop: 10,
      letterSpacing: 1.5,
    },
    formContainer: {
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 25,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 10,
    },
    welcomeText: {
      fontSize: 24,
      fontWeight: '700',
      color: '#333',
      marginBottom: 5,
      textAlign: 'center',
    },
    subText: {
      fontSize: 16,
      color: '#666',
      marginBottom: 30,
      textAlign: 'center',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 12,
      paddingHorizontal: 15,
      marginBottom: 20,
      height: 55,
    },
    inputFocused: {
      borderColor: '#007bff',
      shadowColor: '#007bff',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 5,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      height: '100%',
      fontSize: 16,
      color: '#333',
    },
    loginButton: {
      borderRadius: 12,
      overflow: 'hidden',
      marginTop: 10,
    },
    buttonGradient: {
      padding: 18,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: {
      color: 'white',
      fontWeight: '700',
      fontSize: 16,
      marginRight: 10,
      letterSpacing: 1,
    },
    forgotButton: {
      alignSelf: 'center',
      marginTop: 20,
    },
    forgotText: {
      color: '#007bff',
      fontWeight: '600',
    },
  });