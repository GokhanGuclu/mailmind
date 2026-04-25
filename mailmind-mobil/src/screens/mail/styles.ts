import { StyleSheet } from 'react-native';

export const mailColors = {
  bg: '#0b1220',
  surface: '#111827',
  surfaceSoft: '#1f2937',
  border: '#1e293b',
  borderSoft: '#0f172a',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  accent: '#3b82f6',
  star: '#fbbf24',
  danger: '#f87171',
  unreadDot: '#60a5fa',
};

export const mailStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: mailColors.bg },
  flex1: { flex: 1 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: mailColors.border,
  },
  headerTitle: {
    color: mailColors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: mailColors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  headerButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerButtonText: {
    color: mailColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: -6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: mailColors.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  backChevron: {
    color: mailColors.accent,
    fontSize: 22,
    marginRight: 2,
    marginTop: -2,
  },

  /* Menu button */
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
    marginRight: 6,
  },
  menuIconLine: {
    width: 18,
    height: 2,
    backgroundColor: mailColors.textPrimary,
    borderRadius: 2,
    marginVertical: 2,
  },

  /* Drawer */
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
  },
  drawerPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 280,
    backgroundColor: '#0f172a',
    borderRightWidth: 1,
    borderRightColor: mailColors.border,
    paddingTop: 24,
    paddingBottom: 24,
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: mailColors.border,
    marginBottom: 8,
  },
  drawerTitle: {
    color: mailColors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  drawerSubtitle: {
    color: mailColors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 10,
    borderRadius: 10,
    gap: 12,
  },
  drawerItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  drawerItemIcon: {
    width: 24,
    fontSize: 16,
    color: mailColors.textSecondary,
    textAlign: 'center',
  },
  drawerItemIconActive: {
    color: mailColors.accent,
  },
  drawerItemLabel: {
    color: mailColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  drawerItemLabelActive: {
    color: mailColors.textPrimary,
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: mailColors.border,
    paddingHorizontal: 20,
    paddingTop: 16,
    marginTop: 'auto',
  },
  drawerLogout: {
    color: mailColors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  drawerLogoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  /* List */
  listContent: {
    paddingVertical: 4,
  },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: mailColors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rowPressed: {
    backgroundColor: mailColors.surface,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: mailColors.unreadDot,
    marginTop: 7,
  },
  unreadDotPlaceholder: {
    width: 8,
  },
  rowBody: {
    flex: 1,
  },
  rowTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  rowFrom: {
    color: mailColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  rowFromUnread: {
    fontWeight: '800',
  },
  rowDate: {
    color: mailColors.textMuted,
    fontSize: 12,
  },
  rowSubject: {
    color: mailColors.textPrimary,
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  rowSubjectMuted: {
    color: mailColors.textSecondary,
    fontWeight: '500',
  },
  rowSnippet: {
    color: mailColors.textMuted,
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  starCell: {
    paddingTop: 2,
    paddingLeft: 4,
  },
  starIcon: {
    fontSize: 18,
    color: mailColors.textMuted,
  },
  starIconActive: {
    color: mailColors.star,
  },

  /* States */
  centerPad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    color: mailColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyBody: {
    color: mailColors.textSecondary,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    color: mailColors.danger,
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: mailColors.border,
    backgroundColor: mailColors.surfaceSoft,
  },
  retryButtonText: {
    color: mailColors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },

  /* Reader */
  readerScroll: {
    padding: 20,
  },
  readerSubject: {
    color: mailColors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  readerMetaRow: {
    marginTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: mailColors.border,
  },
  readerFrom: {
    color: mailColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  readerTo: {
    color: mailColors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  readerDate: {
    color: mailColors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  readerBody: {
    color: mailColors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 18,
  },
  bodyLoading: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bodyLoadingText: {
    color: mailColors.textMuted,
    fontSize: 13,
  },

  /* AI özet kartı */
  aiCard: {
    marginTop: 18,
    marginBottom: 6,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.35)',
  },
  aiHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  aiLabel: {
    color: mailColors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  aiText: {
    color: mailColors.textPrimary,
    fontSize: 14,
    lineHeight: 21,
  },
  aiCursor: {
    color: mailColors.accent,
    fontWeight: '800',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: mailColors.accent,
  },
  aiButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  aiLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiLoadingText: {
    color: mailColors.textSecondary,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.85,
  },
  aiError: {
    color: mailColors.danger,
    fontSize: 12,
    marginTop: 8,
  },
});
