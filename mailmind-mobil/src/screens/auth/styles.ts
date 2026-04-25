import { StyleSheet } from 'react-native';

export const authColors = {
  bg: '#0b1220',
  surface: '#111827',
  surfaceSoft: '#1f2937',
  border: '#334155',
  borderSoft: '#1e293b',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  placeholder: '#475569',
  accent: '#3b82f6',
  accentText: '#ffffff',
  link: '#60a5fa',
};

export const authStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: authColors.bg,
  },
  flex1: { flex: 1 },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 32,
    justifyContent: 'center',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 40,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: authColors.accent,
  },
  brandText: {
    color: authColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: authColors.textPrimary,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    color: authColors.textSecondary,
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },

  label: {
    fontSize: 11,
    fontWeight: '700',
    color: authColors.textMuted,
    letterSpacing: 1.1,
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    height: 50,
    backgroundColor: authColors.surface,
    borderWidth: 1,
    borderColor: authColors.borderSoft,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: authColors.textPrimary,
    fontSize: 15,
  },
  inputFocused: {
    borderColor: authColors.accent,
  },

  primaryButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: authColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  primaryButtonGhost: {
    backgroundColor: authColors.surfaceSoft,
    borderWidth: 1,
    borderColor: authColors.border,
  },
  primaryButtonText: {
    color: authColors.accentText,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    marginTop: 14,
    fontWeight: '600',
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: authColors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: authColors.link,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },

  forgotRow: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  forgotText: {
    color: authColors.link,
    fontSize: 13,
    fontWeight: '600',
  },
});
