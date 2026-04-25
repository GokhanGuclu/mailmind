import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Animated, Easing, Modal, Pressable, Text, View } from 'react-native';
import { Inbox, LogOut, Send, ShieldAlert, Star, Trash2, type LucideProps } from 'lucide-react-native';

import { mailColors, mailStyles as s } from './styles';

export type FolderKey = 'INBOX' | 'STARRED' | 'SENT' | 'SPAM' | 'TRASH';

export type FolderDef = {
  key: FolderKey;
  label: string;
  title: string;
  Icon: ComponentType<LucideProps>;
  empty: string;
};

export const FOLDERS: FolderDef[] = [
  { key: 'INBOX', label: 'Gelen Kutusu', title: 'Gelen Kutusu', Icon: Inbox, empty: 'Gelen kutun boş.' },
  { key: 'STARRED', label: 'Yıldızlı', title: 'Yıldızlı', Icon: Star, empty: 'Henüz yıldızlı mesaj yok.' },
  { key: 'SENT', label: 'Gönderilmiş', title: 'Gönderilmiş', Icon: Send, empty: 'Gönderilmiş mesaj yok.' },
  { key: 'SPAM', label: 'Spam', title: 'Spam', Icon: ShieldAlert, empty: 'Spam klasörü temiz.' },
  { key: 'TRASH', label: 'Çöp Kutusu', title: 'Çöp Kutusu', Icon: Trash2, empty: 'Çöp kutusu boş.' },
];

type Props = {
  open: boolean;
  activeFolder: FolderKey;
  accountEmail: string | null;
  userEmail: string | null;
  onSelect: (key: FolderKey) => void;
  onClose: () => void;
  onLogout: () => void;
};

const PANEL_WIDTH = 280;
const ANIM_MS = 260;

export function MailDrawer({
  open,
  activeFolder,
  accountEmail,
  userEmail,
  onSelect,
  onClose,
  onLogout,
}: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  /** Modal'ı açılma/kapanma animasyonu boyunca mount'ta tut. */
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: ANIM_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.timing(anim, {
      toValue: 0,
      duration: ANIM_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [anim, open]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-PANEL_WIDTH, 0],
  });

  return (
    <Modal transparent visible={mounted} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[s.drawerOverlay, { opacity: anim }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[s.drawerPanel, { transform: [{ translateX }] }]}>
        <View style={s.drawerHeader}>
          <Text style={s.drawerTitle}>MailMind</Text>
          {accountEmail || userEmail ? (
            <Text style={s.drawerSubtitle}>{accountEmail ?? userEmail}</Text>
          ) : null}
        </View>
        {FOLDERS.map((f) => {
          const active = f.key === activeFolder;
          const iconColor = active ? mailColors.accent : mailColors.textSecondary;
          return (
            <Pressable
              key={f.key}
              style={[s.drawerItem, active && s.drawerItemActive]}
              onPress={() => {
                onSelect(f.key);
                onClose();
              }}
            >
              <f.Icon size={18} color={iconColor} strokeWidth={2} />
              <Text style={[s.drawerItemLabel, active && s.drawerItemLabelActive]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
        <View style={s.drawerFooter}>
          <Pressable onPress={onLogout} hitSlop={6} style={s.drawerLogoutRow}>
            <LogOut size={16} color={mailColors.danger} strokeWidth={2} />
            <Text style={s.drawerLogout}>Çıkış yap</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}
