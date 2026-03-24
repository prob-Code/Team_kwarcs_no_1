import { View, StyleSheet } from 'react-native';
import { colors, space, borderParams } from '../constants/theme';

export default function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: borderParams.width,
    borderColor: colors.border,
    borderRadius: borderParams.radiusMax,
    padding: space.md,
    overflow: 'hidden',
  },
});
