import React, { useState } from 'react';
import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Building2, Shield, Zap, MessageCircle } from 'lucide-react-native';
import { useCompanyAuth, CompanyAuthProvider } from '@/contexts/CompanyAuthContext';

const LoginForm = () => {
  const { signIn, isLoading, error, clearError, isAuthenticated } = useCompanyAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Redirect to chats if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dash/starship/chats');
    }
  }, [isAuthenticated]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    try {
      await signIn(email, password);
      router.replace('/dash/starship/chats');
    } catch (error: any) {
      // Error is handled by context
    }
  };

  const clearFormError = (field: string) => {
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (error) {
      clearError();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <View style={styles.logoIcon}>
                    <Building2 size={32} color="#5ce1e6" />
                  </View>
                  <Text style={styles.logoText}>Starship</Text>
                </View>
                <Text style={styles.subtitle}>
                  Company Dashboard - Manage your customer interactions
                </Text>
              </View>

              {/* Demo Credentials */}
              <View style={styles.demoSection}>
                <Text style={styles.demoTitle}>Demo Credentials</Text>
                <View style={styles.demoCredentials}>
                  <Text style={styles.demoLabel}>Email:</Text>
                  <Text style={styles.demoValue}>techcorp@company.com</Text>
                  <Text style={styles.demoLabel}>Password:</Text>
                  <Text style={styles.demoValue}>company123</Text>
                </View>
                <Text style={styles.demoNote}>
                  Other demo companies: greenearth@company.com, urbanfashion@company.com
                </Text>
              </View>

              {/* Error Display */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Form */}
              <View style={styles.form}>
                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Company Email</Text>
                  <View style={[
                    styles.inputContainer,
                    errors.email && styles.inputError
                  ]}>
                    <Mail size={20} color="#666666" />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your company email"
                      placeholderTextColor="#666666"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        clearFormError('email');
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
                        clearFormError('password');
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

                {/* Sign In Button */}
                <TouchableOpacity 
                  style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
                  onPress={handleSignIn}
                  disabled={isLoading}
                >
                  <Text style={styles.signInButtonText}>
                    {isLoading ? 'Signing in...' : 'Access Dashboard'}
                  </Text>
                  {!isLoading && <ArrowRight size={20} color="#FFFFFF" />}
                </TouchableOpacity>
              </View>

              {/* Features */}
              <View style={styles.features}>
                <Text style={styles.featuresTitle}>Dashboard Features</Text>
                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Shield size={20} color="#27AE60" />
                    <Text style={styles.featureText}>Manage Claims & Tickets</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <MessageCircle size={20} color="#E67E22" />
                    <Text style={styles.featureText}>Live Chat Support</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Zap size={20} color="#3498DB" />
                    <Text style={styles.featureText}>Company Analytics</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default function StarshipLoginScreen() {
  return (
    <CompanyAuthProvider>
      <LoginForm />
    </CompanyAuthProvider>
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
  keyboardAvoid: {
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
    marginBottom: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  demoSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5ce1e6',
    marginBottom: 12,
  },
  demoCredentials: {
    marginBottom: 12,
  },
  demoLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '600',
  },
  demoValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  demoNote: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: '#2A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  form: {
    width: '100%',
    marginBottom: 32,
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
  signInButton: {
    backgroundColor: '#5ce1e6',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#5ce1e6',
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
  features: {
    alignItems: 'center',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  featureText: {
    fontSize: 16,
    color: '#CCCCCC',
    fontWeight: '500',
  },
});