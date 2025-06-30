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
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, Users, Building2, ChartBar as BarChart3, TriangleAlert as AlertTriangle, Key, MessageCircle, DollarSign } from 'lucide-react-native';
import { useCosmosAuth, CosmosAuthProvider } from '@/contexts/CosmosAuthContext';

const TokenVerificationForm = () => {
  const { verifyToken, isLoading, error, clearError, admin } = useCosmosAuth();
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const handleVerifyToken = async () => {
    if (!token.trim()) {
      setTokenError('Authentication token is required');
      return;
    }

    try {
      await verifyToken(token);
      router.replace('/dash/cosmos/dashboard');
    } catch (error: any) {
      // Error is handled by context
    }
  };

  const clearTokenError = () => {
    if (tokenError) {
      setTokenError('');
    }
    if (error) {
      clearError();
    }
  };

  return (
    <View style={styles.tokenContainer}>
      <View style={styles.tokenHeader}>
        <View style={styles.tokenIconContainer}>
          <Key size={32} color="#FF6B6B" />
        </View>
        <Text style={styles.tokenTitle}>Authentication Required</Text>
        <Text style={styles.tokenSubtitle}>
          Welcome, {admin?.name}. Please enter your authentication token to access the Cosmos dashboard.
        </Text>
      </View>

      {/* Error Display */}
      {(error || tokenError) && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || tokenError}</Text>
        </View>
      )}

      {/* Token Input */}
      <View style={styles.tokenInputGroup}>
        <Text style={styles.label}>Authentication Token</Text>
        <View style={[
          styles.inputContainer,
          (error || tokenError) && styles.inputError
        ]}>
          <Key size={20} color="#666666" />
          <TextInput
            style={styles.input}
            placeholder="Enter your authentication token"
            placeholderTextColor="#666666"
            value={token}
            onChangeText={(text) => {
              setToken(text);
              clearTokenError();
            }}
            secureTextEntry={!showToken}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
            returnKeyType="done"
            onSubmitEditing={handleVerifyToken}
          />
          <TouchableOpacity 
            onPress={() => setShowToken(!showToken)}
            style={styles.eyeButton}
            disabled={isLoading}
          >
            {showToken ? (
              <EyeOff size={20} color="#666666" />
            ) : (
              <Eye size={20} color="#666666" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Verify Button */}
      <TouchableOpacity 
        style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
        onPress={handleVerifyToken}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.verifyButtonText}>Verify & Access</Text>
            <ArrowRight size={20} color="#FFFFFF" />
          </>
        )}
      </TouchableOpacity>

      {/* Security Notice */}
      <View style={styles.tokenSecurityNotice}>
        <Shield size={14} color="#FF6B6B" />
        <Text style={styles.tokenSecurityText}>
          Your authentication token provides full superadmin access to the platform
        </Text>
      </View>
    </View>
  );
};

const LoginForm = () => {
  const { signIn, isLoading, error, clearError, isAuthenticated, needsToken } = useCosmosAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dash/cosmos/dashboard');
    }
  }, [isAuthenticated]);

  // Show token verification form if needed
  if (needsToken) {
    return <TokenVerificationForm />;
  }

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
      // After successful sign in, the component will re-render and show token form
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
    <View style={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Shield size={48} color="#FF6B6B" />
          </View>
          <Text style={styles.logoText}>Cosmos</Text>
          <Text style={styles.logoSubtext}>SuperAdmin Dashboard</Text>
        </View>
        <Text style={styles.subtitle}>
          Comprehensive system administration and analytics
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
          <Text style={styles.label}>Admin Email</Text>
          <View style={[
            styles.inputContainer,
            errors.email && styles.inputError
          ]}>
            <Mail size={20} color="#666666" />
            <TextInput
              style={styles.input}
              placeholder="Enter your admin email"
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
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.signInButtonText}>Continue to Authentication</Text>
              <ArrowRight size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <Text style={styles.featuresTitle}>Dashboard Features</Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Building2 size={20} color="#4ECDC4" />
            <Text style={styles.featureText}>Company Management</Text>
          </View>
          <View style={styles.featureItem}>
            <Users size={20} color="#45B7D1" />
            <Text style={styles.featureText}>User Administration</Text>
          </View>
          <View style={styles.featureItem}>
            <BarChart3 size={20} color="#96CEB4" />
            <Text style={styles.featureText}>Analytics & Reports</Text>
          </View>
          <View style={styles.featureItem}>
            <MessageCircle size={20} color="#A8E6CF" />
            <Text style={styles.featureText}>Content Moderation</Text>
          </View>
          <View style={styles.featureItem}>
            <DollarSign size={20} color="#FFD93D" />
            <Text style={styles.featureText}>Billing Management</Text>
          </View>
          <View style={styles.featureItem}>
            <AlertTriangle size={20} color="#FFEAA7" />
            <Text style={styles.featureText}>System Monitoring</Text>
          </View>
        </View>
      </View>

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Shield size={16} color="#FF6B6B" />
        <Text style={styles.securityText}>
          Two-factor authentication with secure token verification
        </Text>
      </View>
    </View>
  );
};

export default function CosmosLoginScreen() {
  return (
    <CosmosAuthProvider>
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
              <LoginForm />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </CosmosAuthProvider>
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
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 4,
  },
  logoSubtext: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
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
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#FF6B6B',
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
    marginBottom: 24,
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
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  securityText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  // Token verification styles
  tokenContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  tokenHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  tokenIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  tokenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  tokenSubtitle: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  tokenInputGroup: {
    marginBottom: 32,
  },
  verifyButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    minHeight: 56,
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0.1,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tokenSecurityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  tokenSecurityText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
});