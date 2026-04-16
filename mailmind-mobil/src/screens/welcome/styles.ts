import { StyleSheet } from 'react-native';

export const welcomeStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#111827',
    padding: 20,
    gap: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    marginTop: 8,
    gap: 10,
  },
});
