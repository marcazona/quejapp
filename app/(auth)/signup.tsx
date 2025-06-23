import React, { useState, useRef } from 'react';
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
import { Eye, EyeOff, User, Mail, Lock, Phone, Calendar, ArrowRight, ArrowLeft, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  password?: string;
  confirmPassword?: string;
}

export default function SignUpScreen() {
  const { signUp, isLoading } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
  }, [fadeAnim, slideAnim]);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return text;
  };

  const formatBirthDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 8) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    } else if (cleaned.length >= 4) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
    } else if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters long';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters long';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.replace(/\D/g, '').length !== 10) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.birthDate.trim()) {
      newErrors.birthDate = 'Birth date is required';
    } else {
      const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
      if (!dateRegex.test(formData.birthDate)) {
        newErrors.birthDate = 'Please enter a valid date (MM/DD/YYYY)';
      } else {
        const [month, day, year] = formData.birthDate.split('/').map(Number);
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 13) {
          newErrors.birthDate = 'You must be at least 13 years old';
        }
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleSignUp = async () => {
    if (!validateStep2()) return;

    try {
      await signUp({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        birthDate: formData.birthDate,
        password: formData.password,
      });
      
      Alert.alert(
        'Account Created!',
        'Your account has been created successfully. Please check your email to verify your account.',
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create account. Please try again.');
    }
  };

  const handleFocus = (field: string) => {
    setFocusedField(field);
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Let's get started</Text>
        <Text style={styles.stepSubtitle}>Tell us about yourself</Text>
      </View>

      <View style={styles.nameRow}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>First Name</Text>
          <View style={[
            styles.inputContainer,
            focusedField === 'firstName' && styles.inputFocused,
            errors.firstName && styles.inputError
          ]}>
            <User size={20} color={focusedField === 'firstName' ? '#5ce1e6' : '#666666'} />
            <TextInput
              style={styles.input}
              placeholder="First name"
              placeholderTextColor="#666666"
              value={formData.firstName}
              onChangeText={(text) => updateField('firstName', text)}
              onFocus={() => handleFocus('firstName')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="words"
              returnKeyType="next"
              textContentType="givenName"
              editable={!isLoading}
            />
          </View>
          {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Last Name</Text>
          <View style={[
            styles.inputContainer,
            focusedField === 'lastName' && styles.inputFocused,
            errors.lastName && styles.inputError
          ]}>
            <User size={20} color={focusedField === 'lastName' ? '#5ce1e6' : '#666666'} />
            <TextInput
              style={styles.input}
              placeholder="Last name"
              placeholderTextColor="#666666"
              value={formData.lastName}
              onChangeText={(text) => updateField('lastName', text)}
              onFocus={() => handleFocus('lastName')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="words"
              returnKeyType="next"
              textContentType="familyName"
              editable={!isLoading}
            />
          </View>
          {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address</Text>
        <View style={[
          styles.inputContainer,
          focusedField === 'email' && styles.inputFocused,
          errors.email && styles.inputError
        ]}>
          <Mail size={20} color={focusedField === 'email' ? '#5ce1e6' : '#666666'} />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#666666"
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            onFocus={() => handleFocus('email')}
            onBlur={() => setFocusedField(null)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="next"
            textContentType="emailAddress"
            editable={!isLoading}
          />
        </View>
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <TouchableOpacity 
        style={[styles.nextButton, isLoading && styles.nextButtonDisabled]} 
        onPress={handleNext}
        disabled={isLoading}
      >
        <Text style={styles.nextButtonText}>Continue</Text>
        <ArrowRight size={20} color="#0A0A0A" />
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Almost there!</Text>
        <Text style={styles.stepSubtitle}>Complete your profile</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <View style={[
          styles.inputContainer,
          focusedField === 'phone' && styles.inputFocused,
          errors.phone && styles.inputError
        ]}>
          <Phone size={20} color={focusedField === 'phone' ? '#5ce1e6' : '#666666'} />
          <TextInput
            style={styles.input}
            placeholder="(555) 123-4567"
            placeholderTextColor="#666666"
            value={formData.phone}
            onChangeText={(text) => updateField('phone', formatPhoneNumber(text))}
            onFocus={() => handleFocus('phone')}
            onBlur={() => setFocusedField(null)}
            keyboardType="phone-pad"
            maxLength={14}
            returnKeyType="next"
            textContentType="telephoneNumber"
            editable={!isLoading}
          />
        </View>
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Birth Date</Text>
        <View style={[
          styles.inputContainer,
          focusedField === 'birthDate' && styles.inputFocused,
          errors.birthDate && styles.inputError
        ]}>
          <Calendar size={20} color={focusedField === 'birthDate' ? '#5ce1e6' : '#666666'} />
          <TextInput
            style={styles.input}
            placeholder="MM/DD/YYYY"
            placeholderTextColor="#666666"
            value={formData.birthDate}
            onChangeText={(text) => updateField('birthDate', formatBirthDate(text))}
            onFocus={() => handleFocus('birthDate')}
            onBlur={() => setFocusedField(null)}
            keyboardType="numeric"
            maxLength={10}
            returnKeyType="next"
            editable={!isLoading}
          />
        </View>
        {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <View style={[
          styles.inputContainer,
          focusedField === 'password' && styles.inputFocused,
          errors.password && styles.inputError
        ]}>
          <Lock size={20} color={focusedField === 'password' ? '#5ce1e6' : '#666666'} />
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            placeholderTextColor="#666666"
            value={formData.password}
            onChangeText={(text) => updateField('password', text)}
            onFocus={() => handleFocus('password')}
            onBlur={() => setFocusedField(null)}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            returnKeyType="next"
            textContentType="newPassword"
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
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirm Password</Text>
        <View style={[
          styles.inputContainer,
          focusedField === 'confirmPassword' && styles.inputFocused,
          errors.confirmPassword && styles.inputError
        ]}>
          <Lock size={20} color={focusedField === 'confirmPassword' ? '#5ce1e6' : '#666666'} />
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            placeholderTextColor="#666666"
            value={formData.confirmPassword}
            onChangeText={(text) => updateField('confirmPassword', text)}
            onFocus={() => handleFocus('confirmPassword')}
            onBlur={() => setFocusedField(null)}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
            textContentType="newPassword"
            editable={!isLoading}
          />
          <TouchableOpacity 
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeButton}
            disabled={isLoading}
          >
            {showConfirmPassword ? (
              <EyeOff size={20} color="#666666" />
            ) : (
              <Eye size={20} color="#666666" />
            )}
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.backButton, isLoading && styles.backButtonDisabled]} 
          onPress={() => setCurrentStep(1)}
          disabled={isLoading}
        >
          <ArrowLeft size={20} color="#5ce1e6" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          <Text style={styles.signUpButtonText}>
            {isLoading ? 'Creating...' : 'Create Account'}
          </Text>
          {!isLoading && <CheckCircle size={20} color="#0A0A0A" />}
        </TouchableOpacity>
      </View>
    </View>
  );

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
              {/* Header Section */}
              <View style={styles.header}>
                <View style={styles.appNameContainer}>
                  <Text style={styles.appNameNormal}>quej</Text>
                  <Text style={styles.appNameBold}>app</Text>
                </View>

                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${(currentStep / 2) * 100}%` }]} />
                  </View>
                  <Text style={styles.progressText}>Step {currentStep} of 2</Text>
                </View>
              </View>

              {/* Form Section */}
              <View style={styles.form}>
                {currentStep === 1 ? renderStep1() : renderStep2()}

                <View style={styles.signInPrompt}>
                  <Text style={styles.signInPromptText}>Already have an account? </Text>
                  <TouchableOpacity 
                    onPress={() => router.push('/(auth)/signin')}
                    disabled={isLoading}
                  >
                    <Text style={styles.signInLink}>Sign in</Text>
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
    alignItems: 'center',
    marginBottom: 40,
  },
  appNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  appNameNormal: {
    fontSize: 36,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -1.5,
  },
  appNameBold: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6B73FF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  stepContainer: {
    width: '100%',
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  halfWidth: {
    flex: 1,
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
  eyeButton: {
    padding: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#FFE66D',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
    minHeight: 56,
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#5ce1e6',
    minHeight: 56,
  },
  backButtonDisabled: {
    opacity: 0.7,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5ce1e6',
  },
  signUpButton: {
    flex: 2,
    backgroundColor: '#FFE66D',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
  },
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  signInPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  signInPromptText: {
    fontSize: 16,
    color: '#888888',
    fontWeight: '500',
  },
  signInLink: {
    fontSize: 16,
    color: '#5ce1e6',
    fontWeight: '700',
  },
});