import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors, borderRadius, typography, shadows } from '../constants/theme';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
}) {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    disabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'accent' ? colors.white : colors.primary}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon && <Text style={[styles.icon, textStyles]}>{icon}</Text>}
          <Text style={textStyles}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  fullWidth: {
    width: '100%',
  },

  // Variants
  primary: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  accent: {
    backgroundColor: colors.primaryContainer,
    ...shadows.sm,
  },
  secondary: {
    backgroundColor: colors.surfaceContainer,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primaryContainer,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.danger,
    ...shadows.sm,
  },
  success: {
    backgroundColor: colors.success,
    ...shadows.sm,
  },
  white: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },

  // Sizes
  size_sm: {
    height: 36,
    paddingHorizontal: 16,
  },
  size_md: {
    height: 48,
    paddingHorizontal: 24,
  },
  size_lg: {
    height: 56,
    paddingHorizontal: 32,
  },
  size_xl: {
    height: 64,
    paddingHorizontal: 40,
  },

  // Text
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  text_primary: {
    color: colors.white,
  },
  text_accent: {
    color: colors.white,
  },
  text_secondary: {
    color: colors.text,
  },
  text_outline: {
    color: colors.primaryContainer,
  },
  text_ghost: {
    color: colors.primary,
  },
  text_danger: {
    color: colors.white,
  },
  text_success: {
    color: colors.white,
  },
  text_white: {
    color: colors.text,
  },

  textSize_sm: {
    fontSize: 13,
  },
  textSize_md: {
    fontSize: 15,
  },
  textSize_lg: {
    fontSize: 17,
  },
  textSize_xl: {
    fontSize: 19,
  },

  disabled: {
    opacity: 0.5,
  },
  textDisabled: {
    opacity: 0.7,
  },
});
