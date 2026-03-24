import { Stack } from 'expo-router';
import { colors } from '../../constants/theme';

export default function WorkerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'fade',
      }}
    />
  );
}
