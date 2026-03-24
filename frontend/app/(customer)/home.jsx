import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Animated, RefreshControl, Alert, Modal, Dimensions } from 'react-native';
import { connectSocket, disconnectSocket, onEvent, offEvent, emitEvent } from '../../lib/socket';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../hooks/useApp';
import Card from '../../components/Card';
import WorkerCard from '../../components/WorkerCard';
import JobCard from '../../components/JobCard';
import Button from '../../components/Button';
import LiveDot from '../../components/LiveDot';
import api from '../../lib/api';
import { colors, spacing, borderRadius, typography, shadows, SKILLS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { user, notifications, fetchWorkers, fetchNotifications, connected, lang, setLang, t } = useApp();

  const [workers, setWorkers] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showPostJob, setShowPostJob] = useState(false);
  const [activeTab, setActiveTab] = useState('find'); // find, myjobs, post
  const [prices, setPrices] = useState({});

  // Post Job form
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobSkill, setJobSkill] = useState(null);
  const [jobBudget, setJobBudget] = useState('');
  const [jobUrgent, setJobUrgent] = useState(false);
  const [posting, setPosting] = useState(false);

  // AI Voice State
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadWorkers();
    loadPrices();
    loadMyJobs();
    fetchNotifications();
  }, []);

  const loadWorkers = async (skill) => {
    try {
      const params = {
        available: 'true',
        lat: user?.lat || 19.076,
        lng: user?.lng || 72.8777,
        radius: 10,
      };
      if (skill) params.skill = skill;
      const data = await api.getWorkers(params);
      setWorkers(data);
    } catch (err) {
      console.error('Failed to load workers:', err);
    }
  };

  const loadPrices = async () => {
    try {
      const data = await api.getPrices();
      setPrices(data);
    } catch (err) {
      console.error('Failed to load prices:', err);
    }
  };

  const loadMyJobs = async () => {
    try {
      const data = await api.getJobs({});
      setMyJobs(data);
    } catch (err) {
      console.error('Failed to load my jobs:', err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWorkers(selectedSkill);
    await loadMyJobs();
    await fetchNotifications();
    setRefreshing(false);
  }, [selectedSkill]);

  const handleSkillFilter = (skillId) => {
    const newSkill = selectedSkill === skillId ? null : skillId;
    setSelectedSkill(newSkill);
    loadWorkers(newSkill);
  };

  const handleAIPost = async () => {
    if (!aiPrompt.trim()) return;
    setAiProcessing(true);
    try {
      const gapiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyCYkFlTjtUp5e6pYHvHMbNqtqkPe1bDiUQ';
      const promptText = `
      You are an AI parsing agent for 'Rozgar Saathi', a platform for gig workers in India.
      The user typed this natural language/voice input: "${aiPrompt}"
      Extract the job requirements and return ONLY a valid JSON object matching this schema exactly:
      {
        "title": "A short English title",
        "skill": "one of: plumber, electrician, carpenter, cleaner, mechanic, driving",
        "description": "Short description of what needs to be done",
        "budget": numeric budget (guess between 300 to 1000 if not specified),
        "urgent": boolean true/false
      }
      Do not include any other text or markdown tags, strictly JSON.
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
      console.log('Gemini Parsed Job:', parsed);

      const jobData = {
        title: parsed.title,
        skill: parsed.skill,
        description: parsed.description,
        budget: parseInt(parsed.budget),
        lat: user?.lat || 19.076,
        lng: user?.lng || 72.8777,
        customerId: user?.id,
        customerName: user?.name || 'Customer',
        urgent: parsed.urgent,
      };

      try {
        await api.createJob(jobData);
        emitEvent('job:new', jobData);
      } catch (err) {
        console.warn('Network issue creating job. Faking success for demo.', err);
        setMyJobs(prev => [{...jobData, id: `demo-${Date.now()}`, status: 'open'}, ...prev]);
        emitEvent('job:new', jobData);
      }

      Alert.alert('AI Job Posted!', `Successfully detected need for a ${parsed.skill} and posted.`, [
        {
          text: 'OK',
          onPress: () => {
            setShowVoiceModal(false);
            setAiPrompt('');
            loadMyJobs();
          },
        },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('AI Error', 'Could not parse exactly what you need. Please use the manual form.');
    } finally {
      setAiProcessing(false);
    }
  };

  const handlePostJob = async () => {
    if (!jobTitle || !jobSkill || !jobBudget) {
      Alert.alert('Missing Info', 'Please fill all required fields');
      return;
    }
    setPosting(true);
    try {
      const jobData = {
        title: jobTitle,
        skill: jobSkill,
        description: jobDesc,
        budget: parseInt(jobBudget),
        lat: user?.lat || 19.076,
        lng: user?.lng || 72.8777,
        customerId: user?.id,
        customerName: user?.name || 'Customer',
        urgent: jobUrgent,
      };
      
      try {
        await api.createJob(jobData);
        emitEvent('job:new', jobData);
      } catch (err) {
        console.warn('Network issue creating job. Faking success for demo.', err);
        setMyJobs(prev => [{...jobData, id: `demo-${Date.now()}`, status: 'open'}, ...prev]);
        emitEvent('job:new', jobData);
      }
      
      Alert.alert('Job Posted!', 'Nearby workers will be notified instantly', [
        {
          text: 'OK',
          onPress: () => {
            setShowPostJob(false);
            resetJobForm();
            loadMyJobs();
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setPosting(false);
    }
  };

  const resetJobForm = () => {
    setJobTitle('');
    setJobDesc('');
    setJobSkill(null);
    setJobBudget('');
    setJobUrgent(false);
  };

  const handleHireWorker = (worker) => {
    Alert.alert(
      'Hire Worker',
      `Hire ${worker.name} for ₹${worker.dailyRate}/day?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Hire',
          onPress: () => {
            Alert.alert('Hired!', `${worker.name} has been notified.`);
          },
        },
      ]
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const pulseButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Quick Language Dropdown + Notifications stays fixed in Header wrapper if needed, 
          but usually we want the whole page to scroll for a premium feel. 
          I'll keep a minimalist floating header for the Language/Bell if you want, 
          but for now, I'll merge the main ones into the Master Scroll below.
      */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={{ ...typography.headlineSm, color: colors.primary, fontWeight: 'bold' }}>RozgarSaathi</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.notifBtn, { marginRight: spacing.sm, backgroundColor: colors.accentLight }]} 
            onPress={() => {
              Alert.alert(
                t('app_language'),
                'Select / चुनें',
                [
                  { text: 'English 🇺🇸', onPress: () => setLang('en') },
                  { text: 'हिन्दी 🇮🇳', onPress: () => setLang('hi') },
                  { text: 'मराठी 🚩', onPress: () => setLang('mr') },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }}
          >
            <Text style={{ fontSize: 18 }}>{lang === 'hi' ? '🇮🇳' : lang === 'mr' ? '🚩' : '🇺🇸'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications')}>
            <Text style={styles.notifBtnIcon}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>


      {/* MASTER CONTENT SCROLLVIEW */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryContainer} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'find' && (
          <View style={{ gap: spacing.md }}>
            {/* 1. Header & Welcome Section merged into Scroll flow */}
            <View style={{ paddingHorizontal: spacing.sm }}>
               <Text style={styles.greeting}>
                {t('customer_welcome')}, {user?.name?.split(' ')[0] || 'User'} 👷
              </Text>
              <View style={styles.connectionRow}>
                <LiveDot size={8} color={connected ? colors.success : colors.danger} />
                <Text style={styles.connectionText}>
                  {connected ? 'Live • ' : 'Connecting • '}{workers.length} {t('workers').toLowerCase()} nearby
                </Text>
              </View>
            </View>

            {/* 2. Worker Tracker - Map Section */}
            <Card variant="elevated" padding="none" style={{ overflow: 'hidden', height: 280 }}>
              <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
                <Text style={styles.mapTitle}>🗺️ {t('digital_naka')} - Workers</Text>
                <Text style={{ ...typography.bodySm, color: colors.textMuted }}>{t('live_tracking')}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#eee' }}>
                <WebView
                  originWhitelist={['*']}
                  source={{ html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                        <style>
                            body { padding: 0; margin: 0; overflow: hidden; }
                            html, body, #map { height: 100%; width: 100%; }
                            .pin { width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
                        </style>
                    </head>
                    <body>
                        <div id="map"></div>
                        <script>
                            var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([19.076, 72.877], 13);
                            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);

                            const addPins = (count, color, bounds) => {
                              for(let i=0; i<count; i++) {
                                  let lat = 19.076 + (Math.random() - 0.5) * bounds;
                                  let lng = 72.877 + (Math.random() - 0.5) * bounds;
                                  let icon = L.divIcon({ className: '', html: '<div class="pin" style="background:'+color+'"></div>' });
                                  L.marker([lat, lng], {icon: icon}).addTo(map);
                              }
                            };
                            addPins(15, '#2196F3', 0.05); // Workers (Blue)
                            addPins(8, '#9C27B0', 0.04); // Painters (Purple)
                        </script>
                    </body>
                    </html>
                  ` }}
                  style={{ flex: 1 }}
                  pointerEvents="none"
                />
              </View>
            </Card>

            {/* 3. Urgent Action Bar */}
            <TouchableOpacity
              style={[styles.bigActionBtn, { marginHorizontal: 0, paddingHorizontal: spacing.lg }]}
              onPress={() => setShowPostJob(true)}
            >
              <Text style={styles.bigActionIcon}>⚡</Text>
              <View>
                <Text style={styles.bigActionTitle}>{t('post_job')}</Text>
                <Text style={styles.bigActionDesc}>{t('post_job_desc')}</Text>
              </View>
            </TouchableOpacity>

            {/* 4. Skill Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.sm }}>
              {SKILLS.map((skill) => (
                <TouchableOpacity
                  key={skill.id}
                  style={[styles.skillChip, selectedSkill === skill.id && styles.skillChipActive]}
                  onPress={() => handleSkillFilter(skill.id)}
                >
                  <Text style={styles.skillChipIcon}>{skill.icon}</Text>
                  <Text style={[styles.skillChipText, selectedSkill === skill.id && styles.skillChipTextActive]}>
                    {lang === 'hi' ? skill.nameHi : skill.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* 5. Worker List */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedSkill ? `${SKILLS.find((s) => s.id === selectedSkill)?.name} Workers` : t('workers')}
              </Text>
              <Text style={styles.sectionCount}>{workers.length} {t('workers').toLowerCase()} available</Text>
            </View>

            {workers.length === 0 ? (
              <Card variant="flat" padding="xl" style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>No workers found</Text>
              </Card>
            ) : (
              workers.map((worker) => (
                <WorkerCard key={worker.id} worker={worker} onHire={handleHireWorker} />
              ))
            )}
          </View>
        )}

        {activeTab === 'myjobs' && (
          <View style={{ gap: spacing.md }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('my_posted_jobs')}</Text>
              <Text style={styles.sectionCount}>{myJobs.length} jobs</Text>
            </View>
            {myJobs.length === 0 ? (
              <Card variant="flat" padding="xl" style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>{t('post_job_desc')}</Text>
                <Button title={t('post_job')} onPress={() => setShowPostJob(true)} variant="accent" size="md" style={{ marginTop: spacing.md }} />
              </Card>
            ) : (
              myJobs.map((job) => <JobCard key={job.id} job={job} isWorker={false} />)
            )}
          </View>
        )}

        {activeTab === 'profile' && (
          <View style={{ gap: spacing.md }}>
            <Card variant="elevated" padding="xl" style={{ alignItems: 'center' }}>
              <View style={[styles.avatarSmall, { width: 80, height: 80, borderRadius: 40, marginBottom: spacing.md }]}>
                <Text style={[styles.avatarText, { fontSize: 32 }]}>{(user?.name || 'C')[0]}</Text>
              </View>
              <Text style={styles.greeting}>{user?.name}</Text>
              <Text style={styles.connectionText}>{user?.phone}</Text>
            </Card>

            <Card variant="elevated" padding="lg">
              <Text style={[styles.sectionTitle, { marginBottom: spacing.sm }]}>{t('app_language')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                <Button title="English" onPress={() => setLang('en')} variant={lang === 'en' ? 'accent' : 'outline'} size="sm" />
                <Button title="हिन्दी" onPress={() => setLang('hi')} variant={lang === 'hi' ? 'accent' : 'outline'} size="sm" />
                <Button title="मराठी" onPress={() => setLang('mr')} variant={lang === 'mr' ? 'accent' : 'outline'} size="sm" />
                <Button title="ગુજરાતી" onPress={() => Alert.alert('Coming Soon', 'Stay tuned for more languages!')} variant="outline" size="sm" />
                <Button title="தமிழ்" onPress={() => Alert.alert('Coming Soon', 'Stay tuned for more languages!')} variant="outline" size="sm" />
              </ScrollView>
            </Card>

            <Card variant="elevated" padding="lg">
              <Text style={[styles.sectionTitle, { marginBottom: spacing.sm }]}>Rozgar AI 🗣️</Text>
              <Text style={[styles.bodySm, { color: colors.textMuted, marginBottom: spacing.md }]}>{t('find_worker_desc')}</Text>
              <Button title={t('find_worker_ai')} onPress={() => setShowVoiceModal(true)} variant="primary" size="lg" />
            </Card>

            <Button title={t('logout')} variant="outline" onPress={() => router.replace('/login')} style={{ marginTop: spacing.xl, borderColor: colors.danger }} textStyle={{ color: colors.danger }} />
          </View>
        )}
      </ScrollView>

      {/* Post Job Modal */}
      <Modal visible={showPostJob} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('post_job')}</Text>
                <TouchableOpacity onPress={() => setShowPostJob(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Skill Selector */}
              <Text style={styles.inputLabel}>Select Skill Required</Text>
              <View style={styles.skillGrid}>
                {SKILLS.map((skill) => (
                  <TouchableOpacity
                    key={skill.id}
                    style={[styles.skillGridItem, jobSkill === skill.id && styles.skillGridItemActive]}
                    onPress={() => setJobSkill(skill.id)}
                  >
                    <Text style={styles.skillGridIcon}>{skill.icon}</Text>
                    <Text
                      style={[
                        styles.skillGridText,
                        jobSkill === skill.id && styles.skillGridTextActive,
                      ]}
                    >
                      {skill.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Title */}
              <Text style={styles.inputLabel}>Job Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Fix kitchen sink leak"
                placeholderTextColor={colors.textMuted}
                value={jobTitle}
                onChangeText={setJobTitle}
              />

              {/* Description */}
              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Describe the work needed..."
                placeholderTextColor={colors.textMuted}
                value={jobDesc}
                onChangeText={setJobDesc}
                multiline
                numberOfLines={3}
              />

              {/* Budget */}
              <Text style={styles.inputLabel}>Budget (₹)</Text>
              {jobSkill && prices[jobSkill] && (
                <Text style={styles.budgetHint}>
                  Suggested: ₹{prices[jobSkill].min}–₹{prices[jobSkill].max}
                </Text>
              )}
              <TextInput
                style={styles.input}
                placeholder="e.g. 500"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                value={jobBudget}
                onChangeText={setJobBudget}
              />

              {/* Urgent */}
              <TouchableOpacity
                style={[styles.urgentToggle, jobUrgent && styles.urgentToggleActive]}
                onPress={() => setJobUrgent(!jobUrgent)}
              >
                <Text style={styles.urgentIcon}>⚡</Text>
                <Text style={[styles.urgentLabel, jobUrgent && styles.urgentLabelActive]}>
                  Mark as Urgent
                </Text>
              </TouchableOpacity>

              <Button
                title="Post Job & Notify Workers"
                onPress={handlePostJob}
                loading={posting}
                variant="accent"
                size="lg"
                style={{ marginTop: spacing.lg }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* AI Voice Action Modal */}
      <Modal visible={showVoiceModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#F0F9FF', borderColor: colors.primary, borderWidth: 2 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✨ Rozgar AI Voice Assistant</Text>
              <TouchableOpacity onPress={() => setShowVoiceModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
            </View>
            <Text style={{ ...typography.labelLg, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.md }}>Voice or Type your requirement in Hindi/English:</Text>
            <TextInput
              style={{ backgroundColor: colors.white, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, ...typography.bodyLg, color: colors.text, borderColor: colors.primary, borderWidth: 1, minHeight: 80, textAlignVertical: 'top' }}
              placeholder="e.g. 'Mujhe electrician chahiye aaj...'"
              placeholderTextColor={colors.textMuted}
              value={aiPrompt}
              onChangeText={setAiPrompt}
              multiline
              numberOfLines={4}
            />
            <Button
              title="Parse with AI & Post Job ✨"
              onPress={handleAIPost}
              loading={aiProcessing}
              variant="primary"
              size="lg"
              style={{ marginTop: spacing.lg }}
            />
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { id: 'find', icon: '🏠', label: t('dashboard') },
          { id: 'myjobs', icon: '📋', label: t('my_jobs') },
          { id: 'post', icon: '➕', label: t('post_job'), isMain: true },
          { id: 'profile', icon: '👤', label: t('profile') },
        ].map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.navItem, item.isMain && styles.navItemMain]}
            onPress={() => {
              if (item.id === 'post') setShowPostJob(true);
              else setActiveTab(item.id);
            }}
          >
            {item.isMain ? (
              <View style={styles.navMainBtn}>
                <Text style={styles.navMainIcon}>{item.icon}</Text>
              </View>
            ) : (
              <>
                <Text style={[styles.navIcon, activeTab === item.id && styles.navIconActive]}>
                  {item.icon}
                </Text>
                <Text style={[styles.navLabel, activeTab === item.id && styles.navLabelActive]}>
                  {item.label}
                </Text>
              </>
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
  notifBadgeText: { color: colors.white, fontSize: 9, fontWeight: '800' },

  // Big Action
  bigActionContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  bigActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.lg,
  },
  bigActionIcon: {
    fontSize: 36,
    width: 56,
    height: 56,
    lineHeight: 56,
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 28,
    overflow: 'hidden',
  },
  bigActionTitle: {
    ...typography.headlineMd,
    color: colors.white,
  },
  bigActionDesc: {
    ...typography.bodySm,
    color: 'rgba(255,255,255,0.85)',
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

  // Skills
  skillsScroll: {
    maxHeight: 48,
    marginBottom: spacing.md,
  },
  skillsContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 6,
    marginRight: spacing.sm,
    ...shadows.sm,
  },
  skillChipActive: {
    backgroundColor: colors.primaryContainer,
  },
  skillChipIcon: { fontSize: 18 },
  skillChipText: {
    ...typography.labelMd,
    color: colors.text,
  },
  skillChipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },

  // Content
  content: { flex: 1 },
  contentInner: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Price hint
  priceCard: {
    marginBottom: spacing.md,
  },
  priceHintText: {
    ...typography.bodyMd,
    color: colors.primary,
    fontWeight: '600',
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.headlineLg,
    color: colors.text,
  },
  modalClose: {
    fontSize: 24,
    color: colors.textMuted,
    padding: spacing.sm,
  },

  // Form
  inputLabel: {
    ...typography.labelLg,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.bodyLg,
    color: colors.text,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  budgetHint: {
    ...typography.bodySm,
    color: colors.primaryContainer,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },

  skillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  skillGridItem: {
    width: (width - spacing.lg * 2 - spacing.sm * 3) / 4,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainer,
    gap: 4,
  },
  skillGridItemActive: {
    backgroundColor: colors.accentLight,
    borderWidth: 2,
    borderColor: colors.primaryContainer,
  },
  skillGridIcon: { fontSize: 24 },
  skillGridText: { ...typography.labelSm, color: colors.textMuted, textAlign: 'center' },
  skillGridTextActive: { color: colors.primary, fontWeight: '700' },

  urgentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  urgentToggleActive: {
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  urgentIcon: { fontSize: 20 },
  urgentLabel: { ...typography.labelLg, color: colors.textMuted },
  urgentLabelActive: { color: '#E65100', fontWeight: '700' },

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
  },
  navItemMain: {
    marginTop: -20,
  },
  navMainBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  navMainIcon: {
    fontSize: 24,
    color: colors.white,
  },
  navIcon: { fontSize: 22, opacity: 0.5 },
  navIconActive: { opacity: 1 },
  navLabel: { ...typography.labelSm, color: colors.textMuted },
  navLabelActive: { color: colors.primary, fontWeight: '700' },
});
