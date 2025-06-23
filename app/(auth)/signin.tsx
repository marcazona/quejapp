import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function SignInScreen() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in. Please try again.');
    }
  };

  const clearError = (field: string) => {
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.appNameContainer}>
                <Text style={styles.appNameNormal}>quej</Text>
                <Text style={styles.appNameBold}>app</Text>
              </View>
              <Text style={styles.subtitle}>
                Interact, claim or review with companies and win coins
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[
                  styles.inputContainer,
                  errors.email && styles.inputError
                ]}>
                  <Mail size={20} color="#666666" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#666666"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      clearError('email');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    editable={!isLoading}
                  />
                </View>
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[
                  styles.inputContainer,
                  errors.password && styles.inputError
                ]}>
                  <Lock size={20} color="#666666" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#666666"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      clearError('password');
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    editable={!isLoading}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#666666" />
                    ) : (
                      <Eye size={20} color="#666666" />
                    )}
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {/* Forgot Password */}
              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={() => router.push('/(auth)/forgot-password')}
                disabled={isLoading}
              >
                <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <TouchableOpacity 
                style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
                onPress={handleSignIn}
                disabled={isLoading}
              >
                <Text style={styles.signInButtonText}>
                  {isLoading ? 'Signing you in...' : 'Sign In'}
                </Text>
                {!isLoading && <ArrowRight size={20} color="#FFFFFF" />}
              </TouchableOpacity>

              {/* Create Account Section */}
              <View style={styles.createAccountSection}>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>New here?</Text>
                  <View style={styles.dividerLine} />
                </View>
                <TouchableOpacity 
                  style={styles.createAccountButton}
                  onPress={() => router.push('/(auth)/signup')}
                  disabled={isLoading}
                >
                  <Text style={styles.createAccountButtonText}>Create an Account</Text>
                  <ArrowRight size={18} color="#5ce1e6" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    minHeight: '100%',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  appNameNormal: {
    fontSize: 42,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  appNameBold: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 2,
    borderColor: '#2A2A2A',
    minHeight: 56,
  },
  inputError: {
    borderColor: '#E74C3C',
    backgroundColor: '#2A1A1A',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 16,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
    padding: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#8E44AD',
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: '#5ce1e6',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 40,
    shadowColor: '#8E44AD',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    minHeight: 56,
  },
  signInButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0.1,
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  createAccountSection: {
    alignItems: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2A2A2A',
  },
  dividerText: {
    fontSize: 14,
    color: '#666666',
    marginHorizontal: 20,
    fontWeight: '500',
  },
  createAccountButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#5ce1e6',
    width: '100%',
    justifyContent: 'center',
    minHeight: 56,
  },
  createAccountButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5ce1e6',
  },
});