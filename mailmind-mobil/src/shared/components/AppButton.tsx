import { Pressable, StyleSheet, Text } from 'react-native';

type AppButtonProps = {
  label: string;
  variant?: 'primary' | 'secondary';
  onPress?: () => void;
};

export function AppButton({ label, variant = 'primary', onPress }: AppButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        pressed && styles.pressed,
      ]}
    >
      <Text style={variant === 'primary' ? styles.primaryText : styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 46,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primary: {
    borderColor: '#475569',
    backgroundColor: '#1e293b',
  },
  secondary: {
    borderColor: '#334155',
    backgroundColor: 'transparent',
  },
  primaryText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryText: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.86,
  },
});
