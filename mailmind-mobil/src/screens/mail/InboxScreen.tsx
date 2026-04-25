import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { Menu, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '../../shared/api/client';
import { mailboxApi, type MailboxAccount } from '../../shared/api/mailbox';
import { messagesApi, type ApiMessage } from '../../shared/api/messages';
import { useAuth } from '../../shared/auth/auth-context';
import { formatMessageDate, parseFromLine } from './format';
import { FOLDERS, MailDrawer, type FolderKey } from './MailDrawer';
import { mailColors, mailStyles as s } from './styles';

type Props = {
  onOpenMessage: (accountId: string, messageId: string, preview: ApiMessage) => void;
};

export function InboxScreen({ onOpenMessage }: Props) {
  const insets = useSafeAreaInsets();
  const { tokens, user, logout } = useAuth();
  const accessToken = tokens?.accessToken ?? null;

  const [folder, setFolder] = useState<FolderKey>('INBOX');
  const [account, setAccount] = useState<MailboxAccount | null>(null);
  const [items, setItems] = useState<ApiMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchMessages = useCallback(
    async (token: string, accountId: string, f: FolderKey) => {
      if (f === 'STARRED') {
        return messagesApi.listStarred(token, accountId, { limit: 30 });
      }
      return messagesApi.list(token, accountId, { folder: f, limit: 30 });
    },
    [],
  );

  const loadAccountsAndMessages = useCallback(async () => {
    if (!accessToken) return;
    setError(null);
    try {
      const accounts = await mailboxApi.listAccounts(accessToken);
      const active = accounts.find((a) => a.status === 'ACTIVE') ?? accounts[0] ?? null;
      setAccount(active);
      if (!active) {
        setItems([]);
        return;
      }
      const res = await fetchMessages(accessToken, active.id, folder);
      setItems(res.items);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Postalar yüklenemedi.';
      setError(message);
    }
  }, [accessToken, folder, fetchMessages]);

  useEffect(() => {
    setLoading(true);
    void loadAccountsAndMessages().finally(() => setLoading(false));
  }, [loadAccountsAndMessages]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAccountsAndMessages();
    setRefreshing(false);
  }, [loadAccountsAndMessages]);

  const renderItem = useCallback(
    ({ item }: { item: ApiMessage }) => {
      const sender = parseFromLine(item.from);
      return (
        <Pressable
          style={({ pressed }) => [s.row, pressed && s.rowPressed]}
          onPress={() => account && onOpenMessage(account.id, item.id, item)}
        >
          {item.isRead ? <View style={s.unreadDotPlaceholder} /> : <View style={s.unreadDot} />}
          <View style={s.rowBody}>
            <View style={s.rowTopLine}>
              <Text style={[s.rowFrom, !item.isRead && s.rowFromUnread]} numberOfLines={1}>
                {sender.name}
              </Text>
              <Text style={s.rowDate}>{formatMessageDate(item.date)}</Text>
            </View>
            <Text
              style={[s.rowSubject, item.isRead && s.rowSubjectMuted]}
              numberOfLines={1}
            >
              {item.subject ?? '(Konu yok)'}
            </Text>
            {item.snippet ? (
              <Text style={s.rowSnippet} numberOfLines={2}>
                {item.snippet}
              </Text>
            ) : null}
          </View>
          <View style={s.starCell}>
            <Star
              size={18}
              color={item.isStarred ? mailColors.star : mailColors.textMuted}
              fill={item.isStarred ? mailColors.star : 'transparent'}
              strokeWidth={2}
            />
          </View>
        </Pressable>
      );
    },
    [account, onOpenMessage],
  );

  const current = FOLDERS.find((f) => f.key === folder) ?? FOLDERS[0];
  const headerSubtitle = account ? account.email : user?.email ?? '';

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable style={s.menuButton} onPress={() => setDrawerOpen(true)} hitSlop={8}>
          <Menu size={22} color={mailColors.textPrimary} strokeWidth={2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>{current.title}</Text>
          {headerSubtitle ? <Text style={s.headerSubtitle}>{headerSubtitle}</Text> : null}
        </View>
      </View>

      {loading ? (
        <View style={s.centerPad}>
          <ActivityIndicator color={mailColors.accent} />
        </View>
      ) : error ? (
        <View style={s.centerPad}>
          <Text style={s.emptyTitle}>Bir şeyler ters gitti</Text>
          <Text style={s.errorText}>{error}</Text>
          <Pressable
            style={s.retryButton}
            onPress={() => {
              setLoading(true);
              void loadAccountsAndMessages().finally(() => setLoading(false));
            }}
          >
            <Text style={s.retryButtonText}>Tekrar dene</Text>
          </Pressable>
        </View>
      ) : !account ? (
        <View style={s.centerPad}>
          <Text style={s.emptyTitle}>Henüz bağlı bir posta hesabı yok</Text>
          <Text style={s.emptyBody}>
            Web uygulamasından bir Gmail/Outlook hesabı bağladıktan sonra burada görünecek.
          </Text>
        </View>
      ) : items.length === 0 ? (
        <View style={s.centerPad}>
          <Text style={s.emptyTitle}>{current.empty}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 12 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={mailColors.accent}
            />
          }
        />
      )}

      <MailDrawer
        open={drawerOpen}
        activeFolder={folder}
        accountEmail={account?.email ?? null}
        userEmail={user?.email ?? null}
        onSelect={(key) => setFolder(key)}
        onClose={() => setDrawerOpen(false)}
        onLogout={() => {
          setDrawerOpen(false);
          void logout();
        }}
      />
    </View>
  );
}
