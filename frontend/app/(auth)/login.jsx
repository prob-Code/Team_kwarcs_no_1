import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../hooks/useApp';
import Button from '../../components/Button';
import api from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useApp();

  const [step, setStep] = useState('welcome'); // welcome, phone, otp, role, name
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [role, setRole] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const otpRefs = useRef([]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [step]);

  const animateStep = (nextStep) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.sendOtp(phone);
      animateStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    // Auto submit when all filled
    if (newOtp.every((d) => d !== '') && index === 5) {
      animateStep('role');
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    animateStep('name');
  };

  const handleComplete = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await login(phone, otp.join(''), role, name);
      if (role === 'worker') {
        router.replace('/(worker)/home');
      } else {
        router.replace('/(customer)/home');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick login for demo
  const handleDemoLogin = async (demoRole) => {
    setLoading(true);
    try {
      const demoPhone = demoRole === 'worker' ? '9876543210' : '9800000001';
      const demoName = demoRole === 'worker' ? 'Ramesh Kumar' : 'Priya Mehta';
      
      // For demo, we skip supabase entirely as we can't send real SMS 
      // safely without eating SMS credits during demo clicks.
      await login(demoPhone, '123456', demoRole, demoName);
      
      router.replace(demoRole === 'worker' ? '/(worker)/home' : '/(customer)/home');
    } catch (err) {
      setError(err.message || 'Demo login failed. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>🤝</Text>
            </View>
            <Text style={styles.brandName}>RozgarSaathi</Text>
            <Text style={styles.tagline}>रोज़गार साथी</Text>
            <Text style={styles.subtitle}>
              {step === 'welcome'
                ? 'India\'s Hyperlocal Daily Gig Platform'
                : step === 'phone'
                ? 'Enter your mobile number'
                : step === 'otp'
                ? 'Enter OTP sent to your phone'
                : step === 'role'
                ? 'How do you want to use the app?'
                : 'Almost done! Tell us your name'}
            </Text>
          </View>

          <Animated.View
            style={[styles.formSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            {/* Welcome */}
            {step === 'welcome' && (
              <View style={styles.welcomeContent}>
                <View style={styles.featureList}>
                  <FeatureItem icon="📍" text="Find jobs & workers near you" />
                  <FeatureItem icon="⚡" text="Instant matching & hiring" />
                  <FeatureItem icon="🛡️" text="Verified & trusted workers" />
                  <FeatureItem icon="💰" text="Fair pricing, no middleman" />
                </View>
                <Button title="Get Started" onPress={() => animateStep('phone')} size="lg" variant="accent" />
                <View style={styles.demoSection}>
                  <Text style={styles.demoLabel}>Quick Demo Access</Text>
                  <View style={styles.demoButtons}>
                    <TouchableOpacity
                      style={styles.demoBtn}
                      onPress={() => handleDemoLogin('worker')}
                      disabled={loading}
                    >
                      <Text style={styles.demoBtnIcon}>👷</Text>
                      <Text style={styles.demoBtnText}>Demo Worker</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.demoBtn}
                      onPress={() => handleDemoLogin('customer')}
                      disabled={loading}
                    >
                      <Text style={styles.demoBtnIcon}>🏠</Text>
                      <Text style={styles.demoBtnText}>Demo Customer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Phone */}
            {step === 'phone' && (
              <View style={styles.phoneSection}>
                <View style={styles.phoneInputContainer}>
                  <View style={styles.countryCode}>
                    <Text style={styles.flag}>🇮🇳</Text>
                    <Text style={styles.codeText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter mobile number"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                    autoFocus
                  />
                </View>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <Button
                  title="Send OTP"
                  onPress={handleSendOtp}
                  loading={loading}
                  size="lg"
                  variant="accent"
                  disabled={phone.length < 10}
                />
                <TouchableOpacity onPress={() => animateStep('welcome')}>
                  <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* OTP */}
            {step === 'otp' && (
              <View style={styles.otpSection}>
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (otpRefs.current[index] = ref)}
                      style={[styles.otpInput, digit && styles.otpInputFilled]}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={(e) => handleOtpKeyPress(e, index)}
                      autoFocus={index === 0}
                    />
                  ))}
                </View>
                <Text style={styles.otpHint}>Demo OTP: 123456</Text>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <Button
                  title="Verify"
                  onPress={() => animateStep('role')}
                  size="lg"
                  variant="accent"
                  disabled={otp.some((d) => !d)}
                />
                <TouchableOpacity onPress={() => animateStep('phone')}>
                  <Text style={styles.backText}>← Change Number</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Role Selection */}
            {step === 'role' && (
              <View style={styles.roleSection}>
                <TouchableOpacity
                  style={[styles.roleCard, role === 'worker' && styles.roleCardActive]}
                  onPress={() => handleRoleSelect('worker')}
                >
                  <Text style={styles.roleIcon}>👷</Text>
                  <Text style={styles.roleTitle}>I'm a Worker</Text>
                  <Text style={styles.roleDesc}>मैं काम ढूंढ रहा हूँ</Text>
                  <Text style={styles.roleDescEn}>Find jobs near me</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleCard, role === 'customer' && styles.roleCardActive]}
                  onPress={() => handleRoleSelect('customer')}
                >
                  <Text style={styles.roleIcon}>🏠</Text>
                  <Text style={styles.roleTitle}>I Need a Worker</Text>
                  <Text style={styles.roleDesc}>मुझे कारीगर चाहिए</Text>
                  <Text style={styles.roleDescEn}>Hire workers instantly</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => animateStep('otp')}>
                  <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Name */}
            {step === 'name' && (
              <View style={styles.nameSection}>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Your full name / आपका नाम"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <Button
                  title="Start Using RozgarSaathi →"
                  onPress={handleComplete}
                  loading={loading}
                  size="lg"
                  variant="accent"
                  disabled={!name.trim()}
                />
                <TouchableOpacity onPress={() => animateStep('role')}>
                  <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {/* Footer */}
          <Text style={styles.footer}>No middleman • No commission • 100% Free</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, text }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  logoIcon: {
    fontSize: 40,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 18,
    color: colors.primaryContainer,
    fontWeight: '600',
    marginTop: 2,
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },

  formSection: {
    flex: 1,
  },

  // Welcome
  welcomeContent: {
    gap: spacing.lg,
  },
  featureList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIcon: {
    fontSize: 24,
    width: 40,
    textAlign: 'center',
  },
  featureText: {
    ...typography.bodyLg,
    color: colors.text,
    flex: 1,
  },

  demoSection: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  demoLabel: {
    ...typography.labelMd,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  demoButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  demoBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.sm,
  },
  demoBtnIcon: {
    fontSize: 28,
  },
  demoBtnText: {
    ...typography.labelMd,
    color: colors.text,
  },

  // Phone
  phoneSection: {
    gap: spacing.lg,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceContainer,
    gap: spacing.xs,
  },
  flag: {
    fontSize: 20,
  },
  codeText: {
    ...typography.titleMd,
    color: colors.text,
  },
  phoneInput: {
    flex: 1,
    height: 56,
    paddingHorizontal: spacing.md,
    ...typography.titleLg,
    color: colors.text,
    letterSpacing: 2,
  },

  // OTP
  otpSection: {
    gap: spacing.lg,
    alignItems: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    textAlign: 'center',
    ...typography.headlineLg,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.border,
  },
  otpInputFilled: {
    borderColor: colors.primaryContainer,
    backgroundColor: colors.accentLight,
  },
  otpHint: {
    ...typography.bodySm,
    color: colors.primaryContainer,
    fontWeight: '600',
  },

  // Role
  roleSection: {
    gap: spacing.md,
  },
  roleCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.sm,
  },
  roleCardActive: {
    borderColor: colors.primaryContainer,
    backgroundColor: colors.accentLight,
  },
  roleIcon: {
    fontSize: 48,
  },
  roleTitle: {
    ...typography.headlineMd,
    color: colors.text,
  },
  roleDesc: {
    ...typography.bodyMd,
    color: colors.primaryContainer,
    fontWeight: '600',
  },
  roleDescEn: {
    ...typography.bodySm,
    color: colors.textMuted,
  },

  // Name
  nameSection: {
    gap: spacing.lg,
  },
  nameInput: {
    height: 56,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    ...typography.titleMd,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.sm,
  },

  // Common
  errorText: {
    ...typography.bodySm,
    color: colors.danger,
    textAlign: 'center',
  },
  backText: {
    ...typography.bodyMd,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  footer: {
    ...typography.bodySm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
