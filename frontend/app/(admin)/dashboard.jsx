import { View, Text, StyleSheet, FlatList, Animated } from 'react-native';
import { colors, space, typography } from '../../constants/theme';
import LiveDot from '../../components/LiveDot';
import DataRow from '../../components/DataRow';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';
import Badge from '../../components/Badge';

export default function Dashboard() {
  const [usersInfo, setUsersInfo] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeNow: 0, mlCalls: 0 });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();

    // Setup realtime listener for dashboard logic
    const channel = supabase.channel('dashboard_updates');
    
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
      fetchData(); // Simplistic refresh logic on change
    });
    
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'user_data' }, payload => {
      fetchData();
    });

    channel.subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchData = async () => {
    try {
      const { data: profileData } = await supabase.from('profiles').select('*');
      const { data: udData } = await supabase.from('user_data').select('*');
      
      if (profileData) {
        setUsersInfo(profileData);
        setStats(prev => ({ ...prev, totalUsers: profileData.length, activeNow: 1 }));
      }
      if (udData) {
        setStats(prev => ({ ...prev, mlCalls: udData.length }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>DASHBOARD</Text>
        <View style={styles.liveWrapper}>
          <LiveDot />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>TOTAL USERS</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.activeNow}</Text>
          <Text style={styles.statLabel}>ACTIVE NOW</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.mlCalls}</Text>
          <Text style={styles.statLabel}>ML CALLS TODAY</Text>
        </View>
      </View>

      <FlatList
        data={usersInfo}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => {
          const delay = index * 50;
          return (
            <AnimatedRow delay={delay}>
              <DataRow
                title={item.email}
                role={item.role}
                timestamp={new Date(item.created_at).toLocaleTimeString()}
                isNew={false}
              />
            </AnimatedRow>
          );
        }}
        contentContainerStyle={{ paddingBottom: space.xxl }}
      />
    </View>
  );
}

function AnimatedRow({ children, delay }) {
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      delay,
      useNativeDriver: true,
    }).start();
  }, [opacity, delay]);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: space.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
    marginBottom: space.lg,
  },
  headerText: {
    fontFamily: typography.heading,
    color: colors.text,
    fontSize: 13,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  liveWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: space.md,
    gap: space.xs,
  },
  liveText: {
    fontFamily: typography.mono,
    color: colors.textMuted,
    fontSize: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    marginBottom: space.lg,
  },
  statCard: {
    flex: 1,
    padding: space.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: 'flex-start',
  },
  statValue: {
    fontFamily: typography.heading,
    color: colors.text,
    fontSize: 32,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: typography.mono,
    color: colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
});
