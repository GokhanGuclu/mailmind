import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronLeft, Sparkles, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '../../shared/api/client';
import { messagesApi, type ApiMessage } from '../../shared/api/messages';
import { useAuth } from '../../shared/auth/auth-context';
import { formatMessageDate, messageBodyText, parseFromLine } from './format';
import { mailColors, mailStyles as s } from './styles';
import { useTypewriter } from './useTypewriter';

type Props = {
  accountId: string;
  messageId: string;
  preview: ApiMessage | null;
  onBack: () => void;
};

export function MessageScreen({ accountId, messageId, preview, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useAuth();
  const accessToken = tokens?.accessToken ?? null;

  const [message, setMessage] = useState<ApiMessage | null>(preview);
  const [bodyLoading, setBodyLoading] = useState(!preview || (!preview.bodyText && !preview.bodyHtml));
  const [error, setError] = useState<string | null>(null);
  const [starBusy, setStarBusy] = useState(false);

  // AI özet state — web ile aynı mantık
  const [localSummary, setLocalSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summarizeError, setSummarizeError] = useState<string | null>(null);

  const existingSummary = message?.aiSummary?.trim() ?? '';
  const effectiveSummary = localSummary ?? existingSummary;
  const hasSummary = Boolean(effectiveSummary);

  // Özet typewriter — sadece yeni özetlendiyse yaz; önceden varsa direkt göster.
  const typedSummary = useTypewriter(effectiveSummary, Boolean(localSummary));
  const summaryDone = typedSummary.length >= effectiveSummary.length;

  // Body typewriter — yalnızca yeni özet sonrası başlasın.
  const body = message ? messageBodyText(message) : '';
  const bodyTypeActive = Boolean(localSummary) && summaryDone;
  const typedBody = useTypewriter(body, bodyTypeActive);
  const displayedBody = bodyTypeActive ? typedBody : body;
  const bodyTyping = bodyTypeActive && typedBody.length < body.length;

  const load = useCallback(async () => {
    if (!accessToken) return;
    setError(null);
    setBodyLoading(true);
    try {
      const full = await messagesApi.getOne(accessToken, accountId, messageId);
      setMessage(full);
      if (!full.isRead) {
        void messagesApi
          .markAsRead(accessToken, accountId, messageId)
          .then((updated) => setMessage(updated))
          .catch(() => {});
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Mesaj yüklenemedi.';
      setError(msg);
    } finally {
      setBodyLoading(false);
    }
  }, [accessToken, accountId, messageId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleStar = useCallback(async () => {
    if (!accessToken || !message || starBusy) return;
    setStarBusy(true);
    try {
      const res = await messagesApi.toggleStar(accessToken, accountId, message.id);
      setMessage((prev) => (prev ? { ...prev, isStarred: res.isStarred } : prev));
    } catch {
      /* sessiz geç */
    } finally {
      setStarBusy(false);
    }
  }, [accessToken, accountId, message, starBusy]);

  const handleSummarize = useCallback(async () => {
    if (!accessToken || !message || summarizing) return;
    setSummarizing(true);
    setSummarizeError(null);
    try {
      const res = await messagesApi.summarize(accessToken, accountId, message.id);
      if (res.summary?.trim()) {
        setLocalSummary(res.summary.trim());
      } else {
        setSummarizeError('Özetleme başarısız oldu.');
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Özetleme başarısız oldu.';
      setSummarizeError(msg);
    } finally {
      setSummarizing(false);
    }
  }, [accessToken, accountId, message, summarizing]);

  const sender = parseFromLine(message?.from ?? null);
  const hasBody = Boolean(message && (message.bodyText || message.bodyHtml));
  const showAiCard = useMemo(() => hasSummary || summarizing || Boolean(message), [hasSummary, summarizing, message]);

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable style={s.backButton} onPress={onBack} hitSlop={10}>
          <ChevronLeft size={22} color={mailColors.accent} strokeWidth={2.5} />
          <Text style={s.backButtonText}>Geri</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        {message ? (
          <Pressable style={s.headerButton} onPress={toggleStar} hitSlop={8}>
            <Star
              size={20}
              color={message.isStarred ? mailColors.star : mailColors.textMuted}
              fill={message.isStarred ? mailColors.star : 'transparent'}
              strokeWidth={2}
            />
          </Pressable>
        ) : null}
      </View>

      {error && !message ? (
        <View style={s.centerPad}>
          <Text style={s.emptyTitle}>Mesaj açılamadı</Text>
          <Text style={s.errorText}>{error}</Text>
          <Pressable style={s.retryButton} onPress={load}>
            <Text style={s.retryButtonText}>Tekrar dene</Text>
          </Pressable>
        </View>
      ) : !message ? (
        <View style={s.centerPad}>
          <ActivityIndicator color={mailColors.accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[s.readerScroll, { paddingBottom: insets.bottom + 24 }]}
        >
          <Text style={s.readerSubject}>{message.subject ?? '(Konu yok)'}</Text>
          <View style={s.readerMetaRow}>
            <Text style={s.readerFrom}>
              {sender.name}
              {sender.email && sender.name !== sender.email ? ` <${sender.email}>` : ''}
            </Text>
            <Text style={s.readerTo}>Kime: {message.to}</Text>
            <Text style={s.readerDate}>{formatMessageDate(message.date)}</Text>
          </View>

          {showAiCard ? (
            <View style={s.aiCard}>
              <View style={s.aiHead}>
                <Sparkles size={16} color={mailColors.accent} strokeWidth={2} />
                <Text style={s.aiLabel}>AI Özeti</Text>
              </View>

              {hasSummary ? (
                <Text style={s.aiText}>
                  {typedSummary}
                  {localSummary && !summaryDone ? <Text style={s.aiCursor}>▋</Text> : null}
                </Text>
              ) : summarizing ? (
                <View style={s.aiLoadingRow}>
                  <ActivityIndicator size="small" color={mailColors.accent} />
                  <Text style={s.aiLoadingText}>Özetleniyor…</Text>
                </View>
              ) : (
                <View>
                  <Pressable
                    style={({ pressed }) => [s.aiButton, pressed && s.pressed]}
                    onPress={handleSummarize}
                  >
                    <Sparkles size={14} color="#ffffff" strokeWidth={2} />
                    <Text style={s.aiButtonText}>AI Özetle</Text>
                  </Pressable>
                  {summarizeError ? <Text style={s.aiError}>{summarizeError}</Text> : null}
                </View>
              )}
            </View>
          ) : null}

          {hasBody ? (
            <Text style={s.readerBody} selectable>
              {displayedBody}
              {bodyTyping ? <Text style={s.aiCursor}>▋</Text> : null}
            </Text>
          ) : bodyLoading ? (
            <View style={s.bodyLoading}>
              <ActivityIndicator color={mailColors.accent} />
              <Text style={s.bodyLoadingText}>Mesaj içeriği yükleniyor…</Text>
            </View>
          ) : error ? (
            <Text style={s.errorText}>{error}</Text>
          ) : (
            <Text style={s.readerBody} selectable>
              (İçerik yok)
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}
