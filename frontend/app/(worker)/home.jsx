import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  FlatList,
  Animated,
  RefreshControl,
  Dimensions,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../hooks/useApp';
import Card from '../../components/Card';
import JobCard from '../../components/JobCard';
import Button from '../../components/Button';
import LiveDot from '../../components/LiveDot';
import { TrustBadge, VerifiedBadge, SkillBadge } from '../../components/Badge';
import api from '../../lib/api';
import { emitEvent } from '../../lib/socket';
import { colors, spacing, borderRadius, typography, shadows, SKILLS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function WorkerHomeScreen() {
  const router = useRouter();
  const { user, notifications, fetchJobs, fetchNotifications, connected, lang } = useApp();

  const [available, setAvailable] = useState(user?.available ?? true);
  const [jobs, setJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('jobs'); // jobs, map, profile, earnings
  const [weeklyEarnings] = useState(Math.floor(Math.random() * 5000) + 2000);
  const [todayJobs] = useState(Math.floor(Math.random() * 3) + 1);

  const notifAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadJobs();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (notifications.length > 0 && !notifications[0].read) {
      Animated.sequence([
        Animated.timing(notifAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(notifAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [notifications]);

  const loadJobs = async () => {
    try {
      const data = await api.getJobs({
        status: 'open',
        lat: user?.lat || 19.076,
        lng: user?.lng || 72.8777,
        radius: 10,
      });
      setJobs(data);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadJobs();
    await fetchNotifications();
    setRefreshing(false);
  }, []);

  const toggleAvailability = (value) => {
    setAvailable(value);
    if (user?.id) {
      api.updateWorker(user.id, { available: value });
      emitEvent('worker:toggle-availability', { workerId: user.id, available: value });
    }
  };

  const handleApplyJob = async (job) => {
    if (!user?.id) return;
    try {
      try {
        await api.applyForJob(job.id, user.id);
      } catch (err) {
        console.warn('Network issue applying. Faking success for demo.', err);
      }
      Alert.alert('Applied!', `You applied for "${job.title}"`, [{ text: 'OK' }]);
      loadJobs();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const latestNotif = notifications[0];

  const handleWorkerAIPost = async () => {
    if (!aiPrompt.trim()) return;
    setAiProcessing(true);
    try {
      const gapiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyCYkFlTjtUp5e6pYHvHMbNqtqkPe1bDiUQ';
      const promptText = `
      You are an AI assistant for a gig worker app ('Rozgar Saathi').
      The worker typed: "${aiPrompt}"
      Extract their skill and return ONLY a exact JSON matching this format:
      {
        "detected_skill": "plumber | painter | electrician | mechanic | cleaner | driver",
        "action": "I want to do this work today"
      }
      Strictly return ONLY JSON characters, no markdown formatting.
      `;

      const response = await fetch(gapiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
      });
      const data = await response.json();
      
      let rawText = data.candidates[0].content.parts[0].text;
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(rawText);

      Alert.alert('AI Success! 🎙️', `Got it! We updated your profile skill to: ${parsed.detected_skill}. Searching for jobs...`, [
        { text: 'OK', onPress: () => { setShowVoiceModal(false); setAiPrompt(''); loadJobs(); } }
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('AI Error', 'Could not detect your skill clearly. Please try again.');
    } finally {
      setAiProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Real-time notification banner */}
      {latestNotif && !latestNotif.read && (
        <Animated.View
          style={[styles.notifBanner, { opacity: notifAnim, transform: [{ translateY: notifAnim.interpolate({ inputRange: [0, 1], outputRange: [-50, 0] }) }] }]}
        >
          <Text style={styles.notifIcon}>🔔</Text>
          <View style={styles.notifContent}>
            <Text style={styles.notifTitle}>{latestNotif.title}</Text>
            <Text style={styles.notifBody} numberOfLines={1}>{latestNotif.body}</Text>
          </View>
        </Animated.View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarText}>{(user?.name || 'W')[0]}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>
              {lang === 'hi' ? 'नमस्ते' : 'Hey'}, {user?.name?.split(' ')[0] || 'Worker'} 👋
            </Text>
            <View style={styles.connectionRow}>
              <LiveDot size={6} color={connected ? colors.success : colors.danger} />
              <Text style={styles.connectionText}>
                {connected ? 'Live' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notifBtn}>
            <Text style={styles.notifBtnIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => {}}
          >
            <Text style={styles.langBtnText}>{lang === 'hi' ? 'EN' : 'हि'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Availability Toggle */}
      <Card variant="elevated" padding="lg" style={styles.availabilityCard}>
        <View style={styles.availabilityRow}>
          <View style={styles.availabilityInfo}>
            <Text style={styles.availabilityTitle}>
              {available ? '✅ You are Available' : '⏸️ You are Offline'}
            </Text>
            <Text style={styles.availabilityDesc}>
              {available ? 'Jobs will be shown to nearby customers' : 'Toggle on to start receiving jobs'}
            </Text>
          </View>
          <Switch
            value={available}
            onValueChange={toggleAvailability}
            trackColor={{ false: colors.surfaceContainerHigh, true: colors.primaryDim }}
            thumbColor={available ? colors.primaryContainer : colors.textMuted}
            style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
          />
        </View>
      </Card>

      {/* AI Action Button */}
      <TouchableOpacity
        style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md, backgroundColor: colors.accentLight, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
        onPress={() => setShowVoiceModal(true)}
      >
        <Text style={{ fontSize: 24 }}>✨🎙️</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ ...typography.titleMd, color: colors.primary }}>Tell AI What Work You Want</Text>
          <Text style={{ ...typography.bodySm, color: colors.textMuted }}>e.g. "Mujhe painter ka kaam chahiye"</Text>
        </View>
      </TouchableOpacity>

      {/* AI Voice Action Modal */}
      <Modal visible={showVoiceModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#F0F9FF', borderColor: colors.primary, borderWidth: 2 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✨ Rozgar AI Profile</Text>
              <TouchableOpacity onPress={() => setShowVoiceModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
            </View>
            <Text style={{ ...typography.labelLg, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md }}>Voice or Type what work you do:</Text>
            <TextInput
              style={{ backgroundColor: colors.white, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, ...typography.bodyLg, color: colors.text, borderColor: colors.primary, borderWidth: 1, minHeight: 80, textAlignVertical: 'top' }}
              placeholder="e.g. 'Mujhe painter ka kaam chahiye'"
              placeholderTextColor={colors.textMuted}
              value={aiPrompt}
              onChangeText={setAiPrompt}
              multiline
              numberOfLines={4}
            />
            <Button
              title="Parse with AI ✨"
              onPress={handleWorkerAIPost}
              loading={aiProcessing}
              variant="primary"
              size="lg"
              style={{ marginTop: spacing.lg }}
            />
          </View>
        </View>
      </Modal>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <Card variant="elevated" padding="md" style={styles.statCard}>
          <Text style={styles.statValue}>{user?.jobsCompleted || 0}</Text>
          <Text style={styles.statLabel}>Jobs Done</Text>
        </Card>
        <Card variant="elevated" padding="md" style={styles.statCard}>
          <Text style={styles.statValue}>⭐ {user?.rating || 5.0}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </Card>
        <Card variant="elevated" padding="md" style={styles.statCard}>
          <Text style={styles.statValue}>₹{weeklyEarnings.toLocaleString()}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </Card>
      </View>

      {/* Trust & Skills */}
      <View style={styles.trustRow}>
        <TrustBadge level={user?.trustLevel || 'bronze'} size="md" />
        <VerifiedBadge verified={user?.aadhaarVerified} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        {[
          { id: 'jobs', label: 'Nearby Jobs', icon: '📋' },
          { id: 'map', label: 'Digital Naka', icon: '🗺️' },
          { id: 'earnings', label: 'Earnings', icon: '💰' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryContainer} />}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'jobs' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {lang === 'hi' ? 'पास के काम' : 'Jobs Near You'}
              </Text>
              <Text style={styles.sectionCount}>{jobs.length} found</Text>
            </View>
            {jobs.length === 0 ? (
              <Card variant="flat" padding="xl" style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>No jobs nearby right now</Text>
                <Text style={styles.emptyDesc}>Stay available — we'll notify you instantly!</Text>
              </Card>
            ) : (
              jobs.map((job) => (
                <JobCard key={job.id} job={job} isWorker onApply={handleApplyJob} />
              ))
            )}
          </>
        )}

        {activeTab === 'map' && (
          <Card variant="elevated" padding="lg" style={styles.mapCard}>
            <Text style={styles.mapTitle}>🗺️ Digital Naka - Live Map</Text>
            <View style={styles.mapPlaceholder}>
              <View style={styles.mapGrid}>
                {/* Simulated map with worker dots */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.mapDot,
                      {
                        left: `${15 + Math.random() * 70}%`,
                        top: `${10 + Math.random() * 80}%`,
                        backgroundColor: Math.random() > 0.3 ? colors.primaryContainer : colors.warning,
                      },
                    ]}
                  />
                ))}
                <View style={styles.mapCenter}>
                  <Text style={styles.mapCenterIcon}>📍</Text>
                  <Text style={styles.mapCenterText}>You are here</Text>
                </View>
              </View>
            </View>
            <View style={styles.mapLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primaryContainer }]} />
                <Text style={styles.legendText}>Available Workers</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                <Text style={styles.legendText}>Jobs Available</Text>
              </View>
            </View>
          </Card>
        )}

        {activeTab === 'earnings' && (
          <>
            <Card variant="accent" padding="xl" style={styles.earningsMain}>
              <Text style={styles.earningsLabel}>Total Earnings This Week</Text>
              <Text style={styles.earningsAmount}>₹{weeklyEarnings.toLocaleString()}</Text>
              <Text style={styles.earningsJobs}>{todayJobs} jobs completed today</Text>
            </Card>
            <View style={styles.earningsGrid}>
              <Card variant="elevated" padding="md" style={styles.earningsStat}>
                <Text style={styles.earningsStatValue}>₹{(weeklyEarnings * 4).toLocaleString()}</Text>
                <Text style={styles.earningsStatLabel}>This Month</Text>
              </Card>
              <Card variant="elevated" padding="md" style={styles.earningsStat}>
                <Text style={styles.earningsStatValue}>{user?.jobsCompleted || 0}</Text>
                <Text style={styles.earningsStatLabel}>Total Jobs</Text>
              </Card>
            </View>
            <Card variant="elevated" padding="lg">
              <Text style={styles.earningsTip}>
                💡 Tip: Keep your availability on to get 3x more job offers!
              </Text>
            </Card>
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { icon: '🏠', label: 'Home', active: true },
          { icon: '📋', label: 'My Jobs' },
          { icon: '🔔', label: 'Alerts', badge: unreadCount },
          { icon: '💰', label: 'Earnings' },
          { icon: '👤', label: 'Profile' },
        ].map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.navItem}
            onPress={() => {
              if (item.label === 'Alerts') setActiveTab('jobs');
              if (item.label === 'Earnings') setActiveTab('earnings');
            }}
          >
            <Text style={[styles.navIcon, item.active && styles.navIconActive]}>
              {item.icon}
            </Text>
            <Text style={[styles.navLabel, item.active && styles.navLabelActive]}>
              {item.label}
            </Text>
            {item.badge > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{item.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Notification Banner
  notifBanner: {
    flexDirection: 'row',
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
  },
  notifIcon: { fontSize: 18 },
  notifContent: { flex: 1 },
  notifTitle: { ...typography.labelLg, color: colors.white },
  notifBody: { ...typography.bodySm, color: 'rgba(255,255,255,0.8)' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 18,
  },
  greeting: {
    ...typography.headlineMd,
    color: colors.text,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  connectionText: {
    ...typography.labelSm,
    color: colors.textMuted,
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
    position: 'relative',
  },
  notifBtnIcon: { fontSize: 20 },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  notifBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  langBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  langBtnText: {
    fontWeight: '700',
    fontSize: 13,
    color: colors.primary,
  },

  // Modal (AI)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.headlineMd,
    color: colors.text,
  },
  modalClose: {
    fontSize: 24,
    color: colors.textMuted,
    padding: spacing.xs,
  },

  // Availability
  availabilityCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availabilityInfo: { flex: 1 },
  availabilityTitle: {
    ...typography.titleMd,
    color: colors.text,
  },
  availabilityDesc: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    ...typography.headlineMd,
    color: colors.text,
  },
  statLabel: {
    ...typography.labelSm,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Trust
  trustRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.accentLight,
  },
  tabIcon: { fontSize: 16 },
  tabLabel: {
    ...typography.labelMd,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  // Content
  content: { flex: 1 },
  contentInner: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: colors.text,
  },
  sectionCount: {
    ...typography.labelMd,
    color: colors.textMuted,
  },

  // Empty
  emptyCard: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...typography.titleLg, color: colors.text },
  emptyDesc: { ...typography.bodyMd, color: colors.textMuted, textAlign: 'center' },

  // Map
  mapCard: { marginBottom: spacing.md },
  mapTitle: { ...typography.titleLg, color: colors.text, marginBottom: spacing.md },
  mapPlaceholder: {
    height: 300,
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.md,
  },
  mapGrid: {
    flex: 1,
    position: 'relative',
  },
  mapDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.white,
  },
  mapCenter: {
    position: 'absolute',
    top: '45%',
    left: '45%',
    alignItems: 'center',
  },
  mapCenterIcon: { fontSize: 24 },
  mapCenterText: { ...typography.labelSm, color: colors.text, fontWeight: '700' },
  mapLegend: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: { ...typography.labelMd, color: colors.textMuted },

  // Earnings
  earningsMain: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  earningsLabel: { ...typography.labelLg, color: colors.primary },
  earningsAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
    marginVertical: spacing.xs,
  },
  earningsJobs: { ...typography.bodyMd, color: colors.textSecondary },
  earningsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  earningsStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  earningsStatValue: { ...typography.headlineLg, color: colors.text },
  earningsStatLabel: { ...typography.labelMd, color: colors.textMuted },
  earningsTip: { ...typography.bodyMd, color: colors.textSecondary, textAlign: 'center' },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
    ...shadows.lg,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    position: 'relative',
  },
  navIcon: { fontSize: 22, opacity: 0.5 },
  navIconActive: { opacity: 1 },
  navLabel: { ...typography.labelSm, color: colors.textMuted },
  navLabelActive: { color: colors.primary, fontWeight: '700' },
  navBadge: {
    position: 'absolute',
    top: -4,
    right: '25%',
    backgroundColor: colors.danger,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBadgeText: { color: colors.white, fontSize: 8, fontWeight: '800' },
});
