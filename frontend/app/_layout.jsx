import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '../constants/theme';

export default function RootLayout() {
  const { user, role, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user) {
      if (role === 'admin' && segments[0] !== '(admin)') {
        router.replace('/(admin)/dashboard');
      } else if (role === 'user' && segments[0] !== '(user)') {
        router.replace('/(user)/home');
      }
    }
  }, [user, role, loading, segments]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={[styles.pulse, { opacity: 0.3 }]} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'fade',
        animationDuration: 200,
      }}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    height: 16,
    width: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
});
