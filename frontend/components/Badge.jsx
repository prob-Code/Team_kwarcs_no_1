import { View, Text, StyleSheet } from 'react-native';
import { colors, borderParams, typography, space } from '../constants/theme';

export default function Badge({ label, type = 'neutral' }) {
  let containerStyle = styles.neutralContainer;
  let textStyle = styles.neutralText;

  if (type === 'admin') {
    containerStyle = styles.adminContainer;
    textStyle = styles.adminText;
  } else if (type === 'user') {
    containerStyle = styles.userContainer;
    textStyle = styles.userText;
  } else if (type === 'positive' || type === 'success') {
    containerStyle = styles.successContainer;
    textStyle = styles.successText;
  } else if (type === 'negative' || type === 'danger') {
    containerStyle = styles.dangerContainer;
    textStyle = styles.dangerText;
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.text, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: borderParams.radiusBase,
    borderWidth: borderParams.width,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: typography.mono,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  adminContainer: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  adminText: {
    color: '#000',
    fontWeight: 'bold',
  },
  userContainer: {
    backgroundColor: 'transparent',
    borderColor: colors.accent,
  },
  userText: {
    color: colors.accent,
  },
  successContainer: {
    backgroundColor: 'transparent',
    borderColor: colors.success,
  },
  successText: {
    color: colors.success,
  },
  dangerContainer: {
    backgroundColor: 'transparent',
    borderColor: colors.danger,
  },
  dangerText: {
    color: colors.danger,
  },
  neutralContainer: {
    backgroundColor: 'transparent',
    borderColor: colors.textMuted,
  },
  neutralText: {
    color: colors.textMuted,
  },
});
