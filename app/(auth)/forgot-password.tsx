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
  KeyboardAvoidingView,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Mail, ArrowRight, ArrowLeft, CircleCheck as CheckCircle, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const { resetPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSendReset = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');

    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email. Please try again.');
    }
  };

  const handleBackToSignIn = () => {
    router.replace('/(auth)/signin');
  };

  const handleFocus = () => {
    setFocusedField('email');
    if (error) setError('');
  };

  if (emailSent) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <SafeAreaView style={styles.safeArea}>
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <ArrowLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.successContainer}>
              <View style={styles.successIconContainer}>
                <View style={styles.successIconBackground}>
                  <CheckCircle size={48} color="#4ECDC4" />
                </View>
              </View>
              
              <Text style={styles.successTitle}>Check Your Email</Text>
              <Text style={styles.successMessage}>
                We've sent a password reset link to{'\n'}
                <Text style={styles.emailHighlight}>{email}</Text>
                {'\n\n'}
                Please check your email and follow the instructions to reset your password.
              </Text>

              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleBackToSignIn}
              >
                <Text style={styles.primaryButtonText}>Back to Sign In</Text>
                <ArrowRight size={20} color="#0A0A0A" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => setEmailSent(false)}
              >
                <Text style={styles.secondaryButtonText}>Didn't receive the email? Send again</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <Animated.View 
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              <View style={styles.header}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.mainContent}>
                <View style={styles.iconContainer}>
                  <View style={styles.iconBackground}>
                    <Mail size={32} color="#5ce1e6" />
                  </View>
                </View>

                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.description}>
                  No worries! Enter your email address and we'll send you a link to reset your password.
                </Text>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={[
                      styles.inputContainer,
                      focusedField === 'email' && styles.inputFocused,
                      error && styles.inputError
                    ]}>
                      <Mail size={20} color={focusedField === 'email' ? '#5ce1e6' : '#666666'} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor="#666666"
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (error) setError('');
                        }}
                        onFocus={handleFocus}
                        onBlur={() => setFocusedField(null)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        returnKeyType="done"
                        onSubmitEditing={handleSendReset}
                        textContentType="emailAddress"
                        editable={!isLoading}
                      />
                    </View>
                    {error && <Text style={styles.errorText}>{error}</Text>}
                  </View>

                  <TouchableOpacity 
                    style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
                    onPress={handleSendReset}
                    disabled={isLoading}
                  >
                    <Text style={styles.sendButtonText}>
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </Text>
                    {!isLoading && <ArrowRight size={20} color="#0A0A0A" />}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.backToSignInLink}
                    onPress={handleBackToSignIn}
                    disabled={isLoading}
                  >
                    <Text style={styles.backToSignInLinkText}>Back to Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    minHeight: height - (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0),
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  mainContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    shadowColor: '#6B73FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
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
  inputFocused: {
    borderColor: '#6B73FF',
    backgroundColor: '#1A1A2A',
    shadowColor: '#6B73FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inputError: {
    borderColor: '#FF6B6B',
    backgroundColor: '#2A1A1A',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 16,
    fontWeight: '500',
    paddingVertical: 0,
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  sendButton: {
    backgroundColor: '#FFE66D',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    shadowColor: '#FFE66D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    minHeight: 56,
  },
  sendButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0.1,
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  backToSignInLink: {
    alignSelf: 'center',
    padding: 8,
  },
  backToSignInLinkText: {
    fontSize: 16,
    color: '#5ce1e6',
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successIconContainer: {
    marginBottom: 32,
  },
  successIconBackground: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: '#1A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4ECDC4',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  emailHighlight: {
    color: '#6B73FF',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#FFE66D',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    shadowColor: '#FFE66D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    minHeight: 56,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  secondaryButton: {
    padding: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#5ce1e6',
    fontWeight: '500',
    textAlign: 'center',
  },
});