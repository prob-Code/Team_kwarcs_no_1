// RozgarSaathi 2.0 — Green & White Light UI Design System
export const colors = {
  // Primary
  primary: '#006e2f',
  primaryContainer: '#22C55E',
  primaryLight: '#4ae176',
  primaryDim: '#b2f2b7',
  primarySurface: '#e8f8ec',

  // Backgrounds
  bg: '#f7f9fb',
  surface: '#ffffff',
  surfaceContainer: '#f2f4f6',
  surfaceContainerHigh: '#e6e8ea',
  surfaceDim: '#eceef0',

  // Text
  text: '#191c1e',
  textSecondary: '#3d4a3d',
  textMuted: '#6d7b6c',
  textOnPrimary: '#ffffff',

  // Semantic
  success: '#22C55E',
  warning: '#FF9800',
  danger: '#ba1a1a',
  dangerLight: '#ffdad6',
  info: '#2196F3',

  // Trust levels
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',

  // Misc
  border: '#e0e3e5',
  borderLight: '#f0f0f0',
  overlay: 'rgba(0,0,0,0.5)',
  white: '#ffffff',
  black: '#000000',

  // Accent
  accent: '#22C55E',
  accentDark: '#006e2f',
  accentLight: '#dcfce7',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  displayLg: { fontFamily: 'System', fontWeight: '800', fontSize: 40, lineHeight: 48 },
  displayMd: { fontFamily: 'System', fontWeight: '800', fontSize: 32, lineHeight: 40 },
  headlineLg: { fontFamily: 'System', fontWeight: '700', fontSize: 24, lineHeight: 32 },
  headlineMd: { fontFamily: 'System', fontWeight: '700', fontSize: 20, lineHeight: 28 },
  titleLg: { fontFamily: 'System', fontWeight: '600', fontSize: 18, lineHeight: 24 },
  titleMd: { fontFamily: 'System', fontWeight: '600', fontSize: 16, lineHeight: 24 },
  bodyLg: { fontFamily: 'System', fontWeight: '400', fontSize: 16, lineHeight: 24 },
  bodyMd: { fontFamily: 'System', fontWeight: '400', fontSize: 14, lineHeight: 20 },
  bodySm: { fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 16 },
  labelLg: { fontFamily: 'System', fontWeight: '600', fontSize: 14, lineHeight: 20 },
  labelMd: { fontFamily: 'System', fontWeight: '600', fontSize: 12, lineHeight: 16 },
  labelSm: { fontFamily: 'System', fontWeight: '600', fontSize: 11, lineHeight: 14 },
};

export const shadows = {
  sm: {
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#191c1e',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
  },
};

export const SKILLS = [
  { id: 'plumber', name: 'Plumber', nameHi: 'प्लंबर', icon: '🔧', color: '#2196F3' },
  { id: 'electrician', name: 'Electrician', nameHi: 'इलेक्ट्रीशियन', icon: '⚡', color: '#FF9800' },
  { id: 'painter', name: 'Painter', nameHi: 'पेंटर', icon: '🎨', color: '#9C27B0' },
  { id: 'carpenter', name: 'Carpenter', nameHi: 'बढ़ई', icon: '🪚', color: '#795548' },
  { id: 'mason', name: 'Mason', nameHi: 'मिस्त्री', icon: '🧱', color: '#F44336' },
  { id: 'cleaner', name: 'Cleaner', nameHi: 'सफाईकर्मी', icon: '🧹', color: '#4CAF50' },
  { id: 'driver', name: 'Driver', nameHi: 'ड्राइवर', icon: '🚗', color: '#607D8B' },
  { id: 'helper', name: 'Helper', nameHi: 'हेल्पर', icon: '💪', color: '#FF5722' },
  { id: 'gardener', name: 'Gardener', nameHi: 'माली', icon: '🌱', color: '#8BC34A' },
  { id: 'cook', name: 'Cook', nameHi: 'रसोइया', icon: '👨‍🍳', color: '#E91E63' },
  { id: 'welder', name: 'Welder', nameHi: 'वेल्डर', icon: '🔥', color: '#FF6F00' },
  { id: 'tailor', name: 'Tailor', nameHi: 'दर्जी', icon: '🧵', color: '#AB47BC' },
];

export const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.19.161.96:3001';
export const WS_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.19.161.96:3001';
