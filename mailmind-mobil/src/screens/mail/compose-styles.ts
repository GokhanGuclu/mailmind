import { StyleSheet } from 'react-native';

import { mailColors } from './styles';

export const composeStyles = StyleSheet.create({
  /* FAB */
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: mailColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },

  /* Form */
  form: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: mailColors.border,
    gap: 12,
  },
  rowLabel: {
    color: mailColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    width: 48,
  },
  rowInput: {
    flex: 1,
    color: mailColors.textPrimary,
    fontSize: 15,
    paddingVertical: 4,
  },
  rowInputReadonly: {
    color: mailColors.textSecondary,
  },
  rowRemove: {
    padding: 4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: mailColors.border,
  },
  chipBtnText: {
    color: mailColors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },

  /* Body */
  bodyWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  bodyInput: {
    flex: 1,
    color: mailColors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  bodyInputBusy: {
    color: mailColors.textSecondary,
  },

  /* Send / AI bar */
  bottomBar: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: mailColors.border,
  },
  sendBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: mailColors.accent,
    borderRadius: 12,
    paddingVertical: 12,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.5)',
    backgroundColor: 'rgba(59,130,246,0.1)',
  },
  aiBtnText: {
    color: mailColors.accent,
    fontSize: 13,
    fontWeight: '800',
  },

  /* AI modal */
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,6,23,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: mailColors.border,
    padding: 20,
  },
  modalTitle: {
    color: mailColors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  modalBody: {
    color: mailColors.textSecondary,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
  modalTextarea: {
    marginTop: 14,
    minHeight: 120,
    padding: 12,
    borderRadius: 12,
    backgroundColor: mailColors.surface,
    borderWidth: 1,
    borderColor: mailColors.borderSoft,
    color: mailColors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  optGroup: {
    marginTop: 14,
  },
  optLabel: {
    color: mailColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  optRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: mailColors.border,
    backgroundColor: mailColors.surface,
    alignItems: 'center',
  },
  optBtnActive: {
    borderColor: mailColors.accent,
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  optBtnText: {
    color: mailColors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  optBtnTextActive: {
    color: mailColors.accent,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  modalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalBtnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: mailColors.border,
  },
  modalBtnPrimary: {
    backgroundColor: mailColors.accent,
  },
  modalBtnGhostText: {
    color: mailColors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  modalBtnPrimaryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  modalError: {
    marginTop: 10,
    color: mailColors.danger,
    fontSize: 12,
  },
});
