import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, shadows } from '../constants/theme';

export default function Card({ children, variant = 'elevated', padding = 'md', style }) {
  return (
    <View style={[styles.base, styles[variant], styles[`padding_${padding}`], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  elevated: {
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  flat: {
    backgroundColor: colors.surfaceContainer,
  },
  outlined: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  glass: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(20px)',
  },
  accent: {
    backgroundColor: colors.accentLight,
  },
  padding_none: { padding: 0 },
  padding_sm: { padding: spacing.sm },
  padding_md: { padding: spacing.md },
  padding_lg: { padding: spacing.lg },
  padding_xl: { padding: spacing.xl },
});
