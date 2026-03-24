import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { connectSocket, disconnectSocket, onEvent, offEvent } from '../lib/socket';
import api from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../constants/translations';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'worker' | 'customer'
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lang, setLang] = useState('en');

  // Load language preference on launch
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('app_lang');
      if (saved) setLang(saved);
    })();
  }, []);

  const changeLang = async (newLang) => {
    setLang(newLang);
    await AsyncStorage.setItem('app_lang', newLang);
  };

  const t = (key) => translations[lang]?.[key] || translations['en']?.[key] || key;

  // Login mock without OTP networking
  const login = useCallback(async (phone, otp, userRole, name) => {
    setLoading(true);
    let result;
    try {
      result = await api.verifyOtp(phone, otp, userRole, name);
    } catch (error) {
      console.warn('Network auth failed, falling back to local demo user:', error);
      result = { 
        user: { 
          id: `demo-${Date.now()}`, 
          name: name || (userRole === 'worker' ? 'Ramesh Kumar' : 'Priya Mehta'), 
          phone: phone || '9876543210', 
          role: userRole, 
          available: true, 
          trustLevel: 'gold', 
          rating: 4.8, 
          jobsCompleted: 127 
        }, 
        token: 'demo-token' 
      };
    }
    
    try {
      setUser(result.user);
      setRole(userRole);
      api.setToken(result.token);

      // Connect socket
      const socket = connectSocket(result.user.id);
      socket.on('connect', () => setConnected(true));
      socket.on('disconnect', () => setConnected(false));

      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setRole(null);
    setNotifications([]);
    disconnectSocket();
    setConnected(false);
  }, []);

  // Fetch workers
  const fetchWorkers = useCallback(async (params = {}) => {
    try {
      const data = await api.getWorkers(params);
      setWorkers(data);
      return data;
    } catch (error) {
      console.warn('Network issue detected, using Dummy Workers data:', error);
      const dummyWorkers = [
        { id: '1', name: 'Ramesh Kumar', phone: '9876543210', skills: ['plumber'], lat: 19.076, lng: 72.8777, rating: 4.8, jobsCompleted: 127, dailyRate: 500, aadhaarVerified: true, available: true, trustLevel: 'gold', avatar: `https://api.dicebear.com/9.x/initials/svg?seed=Ramesh` },
        { id: '2', name: 'Suresh Yadav', phone: '9876543211', skills: ['electrician'], lat: 19.08, lng: 72.88, rating: 4.6, jobsCompleted: 89, dailyRate: 600, aadhaarVerified: true, available: true, trustLevel: 'silver', avatar: `https://api.dicebear.com/9.x/initials/svg?seed=Suresh` },
      ];
      setWorkers(dummyWorkers);
      return dummyWorkers;
    }
  }, []);

  // Fetch jobs
  const fetchJobs = useCallback(async (params = {}) => {
    try {
      const data = await api.getJobs(params);
      setJobs(data);
      return data;
    } catch (error) {
      console.warn('Network issue detected, using Dummy Jobs data:', error);
      const dummyJobs = [
        { id: '101', title: 'Fix Kitchen Sink Leak', skill: 'plumber', description: 'Kitchen sink leaking from pipe joint', budget: 500, lat: 19.077, lng: 72.879, customerName: 'Priya Mehta', urgent: true, status: 'open' },
        { id: '102', title: 'Install Ceiling Fan', skill: 'electrician', description: 'New ceiling fan installation in bedroom', budget: 600, lat: 19.075, lng: 72.881, customerName: 'Rahul Verma', urgent: false, status: 'open' },
      ];
      setJobs(dummyJobs);
      return dummyJobs;
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.warn('Network issue detected, using Dummy Notifications');
      setNotifications([
        { id: 'n1', title: 'Welcome to RozgarSaathi! 🎉', body: 'Complete your profile to get more jobs.', read: false, createdAt: new Date().toISOString() }
      ]);
    }
  }, [user]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (error) {
      console.warn('Network issue detected, using Dummy Stats');
      setStats({
        totalWorkers: 154,
        availableWorkers: 42,
        totalJobs: 89,
        openJobs: 12,
        completedJobs: 984,
        connectedClients: 5,
      });
    }
  }, []);

  // Real-time event listeners
  useEffect(() => {
    if (!user) return;

    const handleNotification = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    };

    const handleNewJob = (job) => {
      setJobs((prev) => [job, ...prev]);
    };

    const handleWorkerAvailability = ({ workerId, available }) => {
      setWorkers((prev) =>
        prev.map((w) => (w.id === workerId ? { ...w, available } : w))
      );
    };

    const handleWorkerMoved = ({ workerId, lat, lng }) => {
      setWorkers((prev) =>
        prev.map((w) => (w.id === workerId ? { ...w, lat, lng } : w))
      );
    };

    onEvent('notification', handleNotification);
    onEvent('job:new', handleNewJob);
    onEvent('worker:availability', handleWorkerAvailability);
    onEvent('worker:moved', handleWorkerMoved);

    return () => {
      offEvent('notification', handleNotification);
      offEvent('job:new', handleNewJob);
      offEvent('worker:availability', handleWorkerAvailability);
      offEvent('worker:moved', handleWorkerMoved);
    };
  }, [user]);

  const value = {
    user,
    setUser,
    role,
    setRole,
    loading,
    setLoading,
    notifications,
    setNotifications,
    workers,
    setWorkers,
    jobs,
    setJobs,
    stats,
    connected,
    lang,
    setLang: changeLang,
    t,
    login,
    logout,
    fetchWorkers,
    fetchJobs,
    fetchNotifications,
    fetchStats,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

export default AppContext;
