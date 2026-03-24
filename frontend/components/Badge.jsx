import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, typography } from '../constants/theme';

export default function Badge({ label, variant = 'primary', size = 'md', icon, style }) {
  return (
    <View style={[styles.base, styles[variant], styles[`size_${size}`], style]}>
      {icon && <Text style={[styles.icon, styles[`text_${variant}`]]}>{icon}</Text>}
      <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`]]}>{label}</Text>
    </View>
  );
}

export function TrustBadge({ level = 'bronze', size = 'md' }) {
  const config = {
    bronze: { label: 'Bronze', icon: '🥉', bg: '#FFF3E0', textColor: '#E65100' },
    silver: { label: 'Silver', icon: '🥈', bg: '#F5F5F5', textColor: '#616161' },
    gold: { label: 'Gold', icon: '🥇', bg: '#FFF8E1', textColor: '#F57F17' },
  };
  const c = config[level] || config.bronze;

  return (
    <View style={[styles.trustBadge, { backgroundColor: c.bg }, styles[`size_${size}`]]}>
      <Text style={styles.trustIcon}>{c.icon}</Text>
      <Text style={[styles.trustText, { color: c.textColor }]}>{c.label}</Text>
    </View>
  );
}

export function VerifiedBadge({ verified = false }) {
  if (!verified) return null;
  return (
    <View style={styles.verifiedBadge}>
      <Text style={styles.verifiedIcon}>✓</Text>
      <Text style={styles.verifiedText}>Aadhaar Verified</Text>
    </View>
  );
}

export function SkillBadge({ skill }) {
  return (
    <View style={[styles.skillBadge, { backgroundColor: skill.color + '15' }]}>
      <Text style={styles.skillIcon}>{skill.icon}</Text>
      <Text style={[styles.skillText, { color: skill.color }]}>{skill.name}</Text>
    </View>
  );
}

export function StatusBadge({ status }) {
  const config = {
    open: { bg: colors.accentLight, color: colors.primary, label: 'Open' },
    hired: { bg: '#E3F2FD', color: '#1565C0', label: 'Hired' },
    completed: { bg: '#E8F5E9', color: '#2E7D32', label: 'Completed' },
    cancelled: { bg: colors.dangerLight, color: colors.danger, label: 'Cancelled' },
  };
  const c = config[status] || config.open;

  return (
    <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: c.color }]} />
      <Text style={[styles.statusText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    gap: 4,
  },
  icon: { fontSize: 12 },

  // Variants
  primary: { backgroundColor: colors.accentLight },
  secondary: { backgroundColor: colors.surfaceContainer },
  success: { backgroundColor: '#E8F5E9' },
  warning: { backgroundColor: '#FFF3E0' },
  danger: { backgroundColor: colors.dangerLight },
  info: { backgroundColor: '#E3F2FD' },
  urgent: { backgroundColor: '#FFF3E0' },

  // Text colors
  text: { fontWeight: '600' },
  text_primary: { color: colors.primary },
  text_secondary: { color: colors.textSecondary },
  text_success: { color: '#2E7D32' },
  text_warning: { color: '#E65100' },
  text_danger: { color: colors.danger },
  text_info: { color: '#1565C0' },
  text_urgent: { color: '#E65100' },

  // Sizes
  size_sm: { paddingHorizontal: 8, paddingVertical: 2 },
  size_md: { paddingHorizontal: 12, paddingVertical: 4 },
  size_lg: { paddingHorizontal: 16, paddingVertical: 6 },

  textSize_sm: { fontSize: 10 },
  textSize_md: { fontSize: 12 },
  textSize_lg: { fontSize: 14 },

  // Trust Badge
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    gap: 4,
  },
  trustIcon: { fontSize: 14 },
  trustText: { fontWeight: '700', fontSize: 11, letterSpacing: 0.5 },

  // Verified
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    gap: 4,
  },
  verifiedIcon: { color: colors.success, fontSize: 12, fontWeight: '800' },
  verifiedText: { color: '#2E7D32', fontSize: 10, fontWeight: '600' },

  // Skill
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  skillIcon: { fontSize: 16 },
  skillText: { fontWeight: '600', fontSize: 13 },

  // Status
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: { fontWeight: '600', fontSize: 11 },
});
