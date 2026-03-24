import { Pressable, Text, StyleSheet, Animated } from 'react-native';
import { colors, space, typography, borderParams } from '../constants/theme';
import { useRef } from 'react';

export default function Button({ title, variant = 'primary', onPress, style, icon }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.97,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isDestructive = variant === 'destructive';

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={[
          styles.base,
          isPrimary && styles.primary,
          isSecondary && styles.secondary,
          isDestructive && styles.destructive,
        ]}
      >
        {icon && icon}
        <Text
          style={[
            styles.text,
            isPrimary && styles.primaryText,
            isSecondary && styles.secondaryText,
            isDestructive && styles.destructiveText,
          ]}
        >
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: borderParams.radiusBase,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: space.md,
  },
  text: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: typography.bodyMedium,
    fontSize: 14,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  primaryText: {
    color: '#000',
    fontWeight: 'bold',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: borderParams.width,
    borderColor: colors.accent,
  },
  secondaryText: {
    color: colors.accent,
  },
  destructive: {
    backgroundColor: 'transparent',
    borderWidth: borderParams.width,
    borderColor: colors.danger,
  },
  destructiveText: {
    color: colors.danger,
  },
});
