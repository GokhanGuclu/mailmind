import { Dimensions, StyleSheet } from 'react-native';

const { height, width } = Dimensions.get('window');

/** AuthSplitScreen — kayan panel giriş/kayıt */
export const authSplitStyles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
  loginContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.15,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 10,
    marginBottom: 40,
  },
  formGroup: {
    width: '100%',
  },
  label: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    height: 56,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    paddingHorizontal: 20,
    color: '#fff',
    fontSize: 16,
  },
  primaryButton: {
    height: 58,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#334155',
  },
  primaryButtonAccent: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  slidingPanel: {
    position: 'absolute',
    width: width,
    height: height,
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 40,
  },
  panelHandle: {
    height: height * 0.08,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#4b5563',
    borderRadius: 2,
    position: 'absolute',
    top: 12,
  },
  handleTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  handleText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  handleAction: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  registerBody: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  regTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
  },
  regSubtitle: {
    fontSize: 15,
    color: '#94a3b8',
    marginTop: 5,
    marginBottom: 10,
  },
});

export const authStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b1220',
  },

  frame: {
    flex: 1,
    backgroundColor: '#111827',
    overflow: 'hidden',
  },

  heroWrap: {
    height: 360,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },

  heroShape: {
    width: '100%',
    height: 340,
    backgroundColor: '#1f2937',
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
    paddingTop: 44,
    paddingBottom: 34,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  heroTitle: {
    color: '#f8fafc',
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
  },

  heroSubtitle: {
    color: '#cbd5e1',
    fontSize: 15,
    marginTop: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },

  heroActionButton: {
    marginTop: 22,
    minWidth: 180,
    height: 46,
    borderWidth: 1,
    borderColor: '#64748b',
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },

  heroActionText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },

  switchDot: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#94a3b8',
    opacity: 0.7,
  },

  formArea: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 0,
    overflow: 'hidden',
  },

  formCard: {
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0b1220',
    padding: 18,
  },

  formTitle: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '800',
  },

  formSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 18,
    lineHeight: 20,
  },

  label: {
    color: '#cbd5e1',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 6,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: '#111827',
    color: '#f8fafc',
    paddingHorizontal: 12,
  },

  submitButton: {
    height: 48,
    borderWidth: 1,
    borderColor: '#64748b',
    backgroundColor: '#1e293b',
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },

  formHintWrap: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },

  formHint: {
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },

  formHintText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },

  pressed: {
    opacity: 0.84,
  },
});