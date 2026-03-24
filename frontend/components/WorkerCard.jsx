import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import Card from './Card';
import { TrustBadge, VerifiedBadge, SkillBadge } from './Badge';
import { colors, spacing, borderRadius, typography, shadows, SKILLS } from '../constants/theme';

export default function WorkerCard({ worker, onHire, onCall, onWhatsApp, showActions = true, compact = false }) {
  const skills = (worker.skills || []).map(
    (s) => SKILLS.find((sk) => sk.id === s) || { id: s, name: s, icon: '🔨', color: '#666' }
  );

  const handleCall = () => {
    if (onCall) onCall(worker);
    else Linking.openURL(`tel:${worker.phone}`);
  };

  const handleWhatsApp = () => {
    if (onWhatsApp) onWhatsApp(worker);
    else Linking.openURL(`https://wa.me/91${worker.phone}?text=Hi, I found you on RozgarSaathi.`);
  };

  if (compact) {
    return (
      <Card variant="elevated" padding="md" style={styles.compactCard}>
        <View style={styles.compactRow}>
          <Image source={{ uri: worker.avatar }} style={styles.compactAvatar} />
          <View style={styles.compactInfo}>
            <Text style={styles.compactName}>{worker.name}</Text>
            <View style={styles.compactMeta}>
              <Text style={styles.ratingText}>⭐ {worker.rating}</Text>
              <Text style={styles.distanceText}>
                {worker.distance ? `${worker.distance.toFixed(1)}km` : ''}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.callBtnSmall} onPress={handleCall}>
            <Text style={styles.callBtnText}>📞</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="lg" style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: worker.avatar }} style={styles.avatar} />
          {worker.available && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{worker.name}</Text>
            <TrustBadge level={worker.trustLevel} size="sm" />
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.rating}>⭐ {worker.rating}</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.jobs}>{worker.jobsCompleted} jobs</Text>
            {worker.distance !== undefined && (
              <>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.distance}>{worker.distance.toFixed(1)} km</Text>
              </>
            )}
          </View>
          <VerifiedBadge verified={worker.aadhaarVerified} />
        </View>
      </View>

      {/* Skills */}
      <View style={styles.skillsRow}>
        {skills.map((skill) => (
          <SkillBadge key={skill.id} skill={skill} />
        ))}
      </View>

      {/* Price & Response */}
      <View style={styles.priceRow}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>Daily Rate</Text>
          <Text style={styles.priceValue}>₹{worker.dailyRate}</Text>
        </View>
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>Response</Text>
          <Text style={styles.priceValue}>{worker.responseTime}m</Text>
        </View>
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>Status</Text>
          <Text style={[styles.statusValue, { color: worker.available ? colors.success : colors.danger }]}>
            {worker.available ? '● Available' : '● Busy'}
          </Text>
        </View>
      </View>

      {/* Actions */}
      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.callBtnLabel}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsApp}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.whatsappBtnLabel}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.hireBtn}
            onPress={() => onHire && onHire(worker)}
          >
            <Text style={styles.hireBtnLabel}>Hire Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  compactCard: {
    marginBottom: spacing.sm,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  compactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    ...typography.titleMd,
    color: colors.text,
  },
  compactMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  // Header
  header: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceContainer,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    ...typography.titleLg,
    color: colors.text,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rating: {
    ...typography.labelMd,
    color: colors.textSecondary,
  },
  separator: {
    color: colors.textMuted,
    fontSize: 8,
  },
  jobs: {
    ...typography.labelMd,
    color: colors.textMuted,
  },
  distance: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '700',
  },

  // Skills
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  // Price
  priceRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  priceBlock: {
    flex: 1,
    alignItems: 'center',
  },
  priceLabel: {
    ...typography.labelSm,
    color: colors.textMuted,
    marginBottom: 2,
  },
  priceValue: {
    ...typography.titleMd,
    color: colors.text,
  },
  statusValue: {
    ...typography.labelMd,
    fontWeight: '700',
  },

  ratingText: {
    ...typography.labelMd,
    color: colors.textSecondary,
  },
  distanceText: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '600',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: borderRadius.xl,
    height: 44,
    gap: 6,
  },
  callBtnSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtnText: {
    fontSize: 18,
  },
  callBtnLabel: {
    color: '#1565C0',
    fontWeight: '700',
    fontSize: 13,
  },
  actionIcon: {
    fontSize: 16,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: borderRadius.xl,
    height: 44,
    gap: 6,
  },
  whatsappBtnLabel: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 13,
  },
  hireBtn: {
    flex: 1.3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.xl,
    height: 44,
    ...shadows.sm,
  },
  hireBtnLabel: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
