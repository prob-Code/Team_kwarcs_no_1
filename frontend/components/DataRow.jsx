import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, space, typography, borderParams } from '../constants/theme';
import Badge from './Badge';

export default function DataRow({ title, type, role, timestamp, isNew, subtitle }) {
  const bgOpacity = useRef(new Animated.Value(isNew ? 1 : 0)).current;

  useEffect(() => {
    if (isNew) {
      Animated.timing(bgOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isNew]);

  const backgroundColor = bgOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', colors.accentDim]
  });

  return (
    <Animated.View style={[styles.row, { backgroundColor }]}>
      <View style={styles.left}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        <View style={styles.badges}>
          {role && <Badge label={role} type={role} />}
          {type && <Badge label={type} type={type} />}
        </View>
      </View>
      <Text style={styles.timestamp}>{timestamp}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.md,
    paddingRight: space.md,
    marginLeft: space.md, // indent separator from left
    borderBottomWidth: borderParams.width,
    borderBottomColor: colors.border,
  },
  left: {
    flex: 1,
    marginRight: space.md,
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontFamily: typography.bodyMedium,
    fontSize: 14,
    marginBottom: space.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.bodyRegular,
    fontSize: 13,
    marginBottom: space.xs,
  },
  badges: {
    flexDirection: 'row',
    gap: space.sm,
  },
  timestamp: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: 10,
    alignSelf: 'flex-start',
    marginTop: space.xs,
  },
});
