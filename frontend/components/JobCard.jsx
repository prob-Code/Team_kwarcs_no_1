import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Card from './Card';
import { StatusBadge } from './Badge';
import { colors, spacing, borderRadius, typography, SKILLS } from '../constants/theme';

export default function JobCard({ job, onApply, onView, isWorker = false }) {
  const skillInfo = SKILLS.find((s) => s.id === job.skill) || job.skillInfo;
  const timeAgo = getTimeAgo(job.createdAt);

  return (
    <Card variant="elevated" padding="lg" style={styles.card}>
      {/* Urgent Banner */}
      {job.urgent && (
        <View style={styles.urgentBanner}>
          <Text style={styles.urgentText}>⚡ URGENT</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.skillIconContainer}>
          <Text style={styles.skillIcon}>{skillInfo?.icon || '🔨'}</Text>
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={2}>{job.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.posted}>{timeAgo}</Text>
            <StatusBadge status={job.status} />
          </View>
        </View>
      </View>

      {/* Description */}
      {job.description && (
        <Text style={styles.description} numberOfLines={2}>{job.description}</Text>
      )}

      {/* Details */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>💰</Text>
          <View>
            <Text style={styles.detailLabel}>Budget</Text>
            <Text style={styles.detailValue}>₹{job.budget}</Text>
          </View>
        </View>
        {job.distance !== undefined && (
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>📍</Text>
            <View>
              <Text style={styles.detailLabel}>Distance</Text>
              <Text style={styles.detailValue}>{job.distance.toFixed(1)} km</Text>
            </View>
          </View>
        )}
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>🏷️</Text>
          <View>
            <Text style={styles.detailLabel}>Skill</Text>
            <Text style={styles.detailValue}>{skillInfo?.name || job.skill}</Text>
          </View>
        </View>
      </View>

      {/* Price Suggestion */}
      {job.priceRange && (
        <View style={styles.priceHint}>
          <Text style={styles.priceHintText}>
            💡 Fair price for {skillInfo?.name}: ₹{job.priceRange.min}–₹{job.priceRange.max}/day
          </Text>
        </View>
      )}

      {/* Customer Info */}
      {job.customerName && (
        <View style={styles.customerRow}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerInitial}>{job.customerName[0]}</Text>
          </View>
          <Text style={styles.customerName}>{job.customerName}</Text>
          {job.applicants && (
            <Text style={styles.applicantsCount}>
              {job.applicants.length} applied
            </Text>
          )}
        </View>
      )}

      {/* Actions */}
      {job.status === 'open' && (
        <View style={styles.actions}>
          {isWorker ? (
            <>
              <TouchableOpacity style={styles.applyBtn} onPress={() => {
                import('react-native').then(({ Linking }) => {
                  Linking.openURL(`https://wa.me/918262001975?text=Hello, I am interested in the job: ${job.title} (₹${job.budget})`);
                });
                if (onApply) onApply(job);
              }}>
                <Text style={styles.applyBtnText}>Accept & WhatsApp ✅</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.applyBtn} onPress={() => onView && onView(job)}>
              <Text style={styles.applyBtnText}>View Applicants ({job.applicants?.length || 0})</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Card>
  );
}

function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  urgentBanner: {
    backgroundColor: '#FFF3E0',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  urgentText: {
    color: '#E65100',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1,
  },

  header: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  skillIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillIcon: {
    fontSize: 24,
  },
  headerContent: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.titleLg,
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  posted: {
    ...typography.labelMd,
    color: colors.textMuted,
  },

  description: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  detailsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  detailIcon: {
    fontSize: 20,
  },
  detailLabel: {
    ...typography.labelSm,
    color: colors.textMuted,
  },
  detailValue: {
    ...typography.labelLg,
    color: colors.text,
  },

  priceHint: {
    backgroundColor: '#FFF8E1',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  priceHintText: {
    ...typography.bodySm,
    color: '#F57F17',
  },

  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  customerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInitial: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  customerName: {
    ...typography.labelLg,
    color: colors.text,
    flex: 1,
  },
  applicantsCount: {
    ...typography.labelMd,
    color: colors.textMuted,
  },

  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  viewBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.xl,
    height: 44,
  },
  viewBtnText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  applyBtn: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.xl,
    height: 44,
  },
  applyBtnText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 14,
  },
});
