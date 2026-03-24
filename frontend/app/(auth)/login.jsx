import { View, Text, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useOAuth } from '@supabase/supabase-js'; // We usually handle OAuth differently, standard redirect for expo here
import { colors, space, typography } from '../../constants/theme';
import Button from '../../components/Button';
import { supabase } from '../../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'exp://', // Update this based on your expo setup
      },
    });
    if (error) console.error('OAuth error', error);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRegion}>
        <Text style={styles.title}>ROJGARSATHI</Text>
        <Text style={styles.subtitle}>Surgical precision intelligence.</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRegion}>
        <Button 
          title="Sign in with Google" 
          onPress={handleGoogleLogin} 
          style={styles.loginBtn}
          variant="primary" // Re-styled natively later
        />
        <Text style={styles.legal}>
          By continuing, you accept our extremely dense and unreadable Terms of Service.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topRegion: {
    flex: 0.4,
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  title: {
    fontFamily: typography.heading,
    fontSize: 48,
    color: colors.text,
    textAlign: 'left',
    marginBottom: space.sm,
  },
  subtitle: {
    fontFamily: typography.bodyRegular,
    fontSize: 13,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: space.md,
  },
  bottomRegion: {
    flex: 0.6,
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  loginBtn: {
    backgroundColor: '#ffffff', // overrides primary color to force white button
    width: '100%',
    height: 52, // Specific requirement
    marginBottom: space.lg,
  },
  legal: {
    fontFamily: typography.bodyRegular,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
