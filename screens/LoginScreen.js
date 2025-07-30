import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { AuthAPI } from '../api/api';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const buttonScale = useRef(new Animated.Value(1)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoTranslateY = useRef(new Animated.Value(-20)).current;

  
  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        tension: 30,
        useNativeDriver: true,
        delay: 100
      }),
      Animated.spring(logoTranslateY, {
        toValue: 0,
        friction: 4,
        tension: 30,
        useNativeDriver: true,
        delay: 100
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
        delay: 300
      }),
      Animated.timing(formTranslateY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
        delay: 300
      })
    ]).start();
  }, []);

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

  const handleInputFocus = (inputName) => {
    setFocusedInput(inputName);
  };

  return (
<LinearGradient
  colors={['#0f2027', '#203a43', '#2c5364']}
  style={styles.container}
  start={{ x: 0.5, y: 0 }}
  end={{ x: 0.5, y: 1 }}
>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Animated.View style={[
            styles.logoContainer,
            { 
              transform: [
                { scale: logoScale },
                { translateY: logoTranslateY }
              ] 
            }
          ]}>
            <LinearGradient
              colors={['#ffffff', '#f8f9fa']}
              style={styles.logoCircle}
              start={{ x: 0.2, y: 0.2 }}
              end={{ x: 1, y: 1 }}
            >
              <Feather name="coffee" size={48} color="#6d4c41" />
            </LinearGradient>
            <Text style={styles.logoText}>Rithu Cafe</Text>
            <Text style={styles.tagline}>Artisan Coffee & Delights</Text>
          </Animated.View>

          <Animated.View style={[
            styles.formContainer,
            {
              opacity: formOpacity,
              transform: [{ translateY: formTranslateY }]
            }
          ]}>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.subText}>Sign in to your account</Text>

            <View style={[
              styles.inputContainer,
              focusedInput === 'email' && styles.inputFocused
            ]}>
              {/* <MaterialIcons
                name="email"
                size={24}
                color={focusedInput === 'email' ? '#fdbb2d' : 'rgba(255,255,255,0.7)'}
                style={styles.inputIcon}
              /> */}
              <TextInput
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={email}
                onChangeText={setEmail}
                // onFocus={() => handleInputFocus('email')}
                // onBlur={() => setFocusedInput(null)}
                style={styles.input}
                editable={!isLoading}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={[
              styles.inputContainer,
              focusedInput === 'password' && styles.inputFocused
            ]}>
              {/* <MaterialIcons
                name="lock"
                size={24}
                color={focusedInput === 'password' ? '#fdbb2d' : 'rgba(255,255,255,0.7)'}
                style={styles.inputIcon}
              /> */}
              <TextInput
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.7)"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                // onFocus={() => handleInputFocus('password')}
                // onBlur={() => setFocusedInput(null)}
                style={styles.input}
                editable={!isLoading}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Feather
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  color="rgba(255,255,255,0.7)"
                />
              </TouchableOpacity>
            </View>

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                onPress={handleLogin}
                style={styles.loginButton}
                activeOpacity={0.9}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#f46b45', '#eea849']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>SIGN IN</Text>
                      <Feather name="arrow-right" size={24} color="white" />
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
            
            
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  tagline: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
    letterSpacing: 1,
  },
  formContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 25,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '700',
    color: 'white',
    marginBottom: 5,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 15,
    paddingHorizontal: 20,
    marginBottom: 20,
    height: 60,
  },
  inputFocused: {
    borderColor: '#fdbb2d',
    backgroundColor: 'rgba(253, 187, 45, 0.1)',
  },
  inputIcon: {
    marginRight: 15,
  },
  eyeIcon: {
    padding: 5,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  loginButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
    marginRight: 10,
    letterSpacing: 1,
  },
  forgotButton: {
    alignSelf: 'center',
    marginTop: 20,
  },
  forgotText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  footerLink: {
    fontWeight: '700',
    color: 'white',
    textDecorationLine: 'underline',
  },
});