import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ChevronLeft, Send, Sparkles, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { aiApi } from '../../shared/api/ai';
import { ApiError } from '../../shared/api/client';
import { mailboxApi, type MailboxAccount } from '../../shared/api/mailbox';
import { messagesApi } from '../../shared/api/messages';
import { useAuth } from '../../shared/auth/auth-context';
import { composeStyles as c } from './compose-styles';
import { mailColors, mailStyles as s } from './styles';

type Props = {
  onClose: () => void;
  onSent: () => void;
};

type Tone = 'formal' | 'neutral' | 'friendly';
type Length = 'short' | 'normal' | 'long';

function parseEmails(input: string): string[] {
  return input
    .split(/[,;]\s*|\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function ComposeScreen({ onClose, onSent }: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useAuth();
  const accessToken = tokens?.accessToken ?? null;

  const [account, setAccount] = useState<MailboxAccount | null>(null);

  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI modal
  const [showAi, setShowAi] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState<Tone>('neutral');
  const [aiLength, setAiLength] = useState<Length>('normal');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const streamRef = useRef<boolean>(false);

  useEffect(() => {
    if (!accessToken) return;
    void mailboxApi
      .listAccounts(accessToken)
      .then((accounts) => {
        const active = accounts.find((a) => a.status === 'ACTIVE') ?? accounts[0] ?? null;
        setAccount(active);
      })
      .catch(() => {});
  }, [accessToken]);

  const handleSend = useCallback(async () => {
    if (!accessToken || !account || sending) return;
    const toList = parseEmails(to);
    if (toList.length === 0) {
      setError('En az bir alıcı girmelisin.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      await messagesApi.send(accessToken, account.id, {
        to: toList,
        cc: cc ? parseEmails(cc) : undefined,
        bcc: bcc ? parseEmails(bcc) : undefined,
        subject: subject.trim() || undefined,
        text: body.trim() || undefined,
      });
      onSent();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Gönderim başarısız.';
      setError(msg);
    } finally {
      setSending(false);
    }
  }, [accessToken, account, to, cc, bcc, subject, body, sending, onSent]);

  const streamText = useCallback(
    async (targetSubject: string, targetBody: string) => {
      streamRef.current = true;
      const SUBJECT_MS = 22;
      const BODY_MS = 10;
      setSubject('');
      for (let i = 1; i <= targetSubject.length; i += 1) {
        if (!streamRef.current) return;
        setSubject(targetSubject.slice(0, i));
        // eslint-disable-next-line no-await-in-loop
        await sleep(SUBJECT_MS);
      }
      setBody('');
      for (let i = 1; i <= targetBody.length; i += 1) {
        if (!streamRef.current) return;
        setBody(targetBody.slice(0, i));
        // eslint-disable-next-line no-await-in-loop
        await sleep(BODY_MS);
      }
    },
    [],
  );

  const handleAiGenerate = useCallback(async () => {
    if (!accessToken) {
      setAiError('Önce giriş yapmalısın.');
      return;
    }
    const prompt = aiPrompt.trim();
    if (prompt.length < 3) {
      setAiError('Lütfen ne yazmak istediğini kısaca açıkla.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await aiApi.compose(accessToken, {
        prompt,
        language: 'tr',
        tone: aiTone,
        length: aiLength,
      });
      setShowAi(false);
      setAiLoading(false);
      setAiBusy(true);
      setSubject('AI Yükleniyor…');
      setBody('');
      await streamText(result.subject, result.bodyText);
      setAiPrompt('');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'AI hazırlayamadı.';
      setAiError(msg);
      setAiLoading(false);
    } finally {
      setAiBusy(false);
    }
  }, [accessToken, aiPrompt, aiTone, aiLength, streamText]);

  const confirmClose = useCallback(() => {
    const hasContent = to.trim() || subject.trim() || body.trim();
    if (!hasContent) {
      onClose();
      return;
    }
    Alert.alert('Vazgeç', 'Yazdıkların kaybolacak. Emin misin?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Vazgeç', style: 'destructive', onPress: onClose },
    ]);
  }, [to, subject, body, onClose]);

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable style={s.backButton} onPress={confirmClose} hitSlop={10}>
          <ChevronLeft size={22} color={mailColors.accent} strokeWidth={2.5} />
          <Text style={s.backButtonText}>Kapat</Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.headerTitle}>Yeni Mail</Text>
        </View>
        <View style={{ width: 70 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={c.form} keyboardShouldPersistTaps="handled">
          <View style={c.row}>
            <Text style={c.rowLabel}>Kime</Text>
            <TextInput
              style={c.rowInput}
              value={to}
              onChangeText={setTo}
              placeholder="ornek@alan.com, ornek2@alan.com"
              placeholderTextColor={mailColors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              editable={!aiBusy}
            />
            <View style={c.chipRow}>
              {!showCc ? (
                <Pressable style={c.chipBtn} onPress={() => setShowCc(true)}>
                  <Text style={c.chipBtnText}>Cc</Text>
                </Pressable>
              ) : null}
              {!showBcc ? (
                <Pressable style={c.chipBtn} onPress={() => setShowBcc(true)}>
                  <Text style={c.chipBtnText}>Bcc</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {showCc ? (
            <View style={c.row}>
              <Text style={c.rowLabel}>Cc</Text>
              <TextInput
                style={c.rowInput}
                value={cc}
                onChangeText={setCc}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                editable={!aiBusy}
              />
              <Pressable
                style={c.rowRemove}
                onPress={() => {
                  setCc('');
                  setShowCc(false);
                }}
                hitSlop={6}
              >
                <X size={16} color={mailColors.textMuted} />
              </Pressable>
            </View>
          ) : null}

          {showBcc ? (
            <View style={c.row}>
              <Text style={c.rowLabel}>Bcc</Text>
              <TextInput
                style={c.rowInput}
                value={bcc}
                onChangeText={setBcc}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                editable={!aiBusy}
              />
              <Pressable
                style={c.rowRemove}
                onPress={() => {
                  setBcc('');
                  setShowBcc(false);
                }}
                hitSlop={6}
              >
                <X size={16} color={mailColors.textMuted} />
              </Pressable>
            </View>
          ) : null}

          <View style={c.row}>
            <Text style={c.rowLabel}>Konu</Text>
            <TextInput
              style={[c.rowInput, aiBusy && c.rowInputReadonly]}
              value={subject}
              onChangeText={setSubject}
              editable={!aiBusy}
              placeholder="Konu"
              placeholderTextColor={mailColors.textMuted}
            />
          </View>

          <View style={[c.bodyWrap, { minHeight: 300 }]}>
            <TextInput
              style={[c.bodyInput, aiBusy && c.bodyInputBusy]}
              value={body}
              onChangeText={setBody}
              multiline
              editable={!aiBusy}
              placeholder="Mesajınızı yazın…"
              placeholderTextColor={mailColors.textMuted}
            />
          </View>
        </ScrollView>

        {error ? (
          <Text style={[s.errorText, { paddingHorizontal: 20, textAlign: 'left' }]}>{error}</Text>
        ) : null}

        <View style={[c.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) + 8 }]}>
          <Pressable
            style={c.aiBtn}
            onPress={() => {
              setAiError(null);
              setShowAi(true);
            }}
            disabled={sending || aiBusy}
          >
            <Sparkles size={16} color={mailColors.accent} strokeWidth={2.25} />
            <Text style={c.aiBtnText}>AI ile hazırla</Text>
          </Pressable>

          <Pressable
            style={[c.sendBtn, (sending || aiBusy) && c.sendBtnDisabled]}
            onPress={handleSend}
            disabled={sending || aiBusy}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Send size={16} color="#fff" strokeWidth={2.25} />
                <Text style={c.sendBtnText}>Gönder</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* --- AI Modal --- */}
      <Modal visible={showAi} transparent animationType="fade" onRequestClose={() => setShowAi(false)}>
        <View style={c.modalOverlay}>
          <View style={c.modalCard}>
            <Text style={c.modalTitle}>AI ile hazırla</Text>
            <Text style={c.modalBody}>
              Ne yazmak istediğini birkaç cümleyle anlat. AI bunu düzgün, nazik bir e-postaya
              dönüştürecek.
            </Text>
            <TextInput
              style={c.modalTextarea}
              value={aiPrompt}
              onChangeText={setAiPrompt}
              placeholder={'Örn: Ayşe Hanım\'a yarınki toplantının 14:00\'e ertelendiğini bildir.'}
              placeholderTextColor={mailColors.textMuted}
              multiline
              editable={!aiLoading}
              autoFocus
            />

            <View style={c.optGroup}>
              <Text style={c.optLabel}>Ton</Text>
              <View style={c.optRow}>
                {(['formal', 'neutral', 'friendly'] as Tone[]).map((t) => {
                  const active = aiTone === t;
                  return (
                    <Pressable
                      key={t}
                      style={[c.optBtn, active && c.optBtnActive]}
                      onPress={() => setAiTone(t)}
                      disabled={aiLoading}
                    >
                      <Text style={[c.optBtnText, active && c.optBtnTextActive]}>
                        {t === 'formal' ? 'Resmi' : t === 'friendly' ? 'Samimi' : 'Nötr'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={c.optGroup}>
              <Text style={c.optLabel}>Uzunluk</Text>
              <View style={c.optRow}>
                {(['short', 'normal', 'long'] as Length[]).map((l) => {
                  const active = aiLength === l;
                  return (
                    <Pressable
                      key={l}
                      style={[c.optBtn, active && c.optBtnActive]}
                      onPress={() => setAiLength(l)}
                      disabled={aiLoading}
                    >
                      <Text style={[c.optBtnText, active && c.optBtnTextActive]}>
                        {l === 'short' ? 'Kısa' : l === 'long' ? 'Uzun' : 'Normal'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {aiError ? <Text style={c.modalError}>{aiError}</Text> : null}

            <View style={c.modalActions}>
              <Pressable
                style={[c.modalBtn, c.modalBtnGhost]}
                onPress={() => setShowAi(false)}
                disabled={aiLoading}
              >
                <Text style={c.modalBtnGhostText}>Vazgeç</Text>
              </Pressable>
              <Pressable
                style={[c.modalBtn, c.modalBtnPrimary, aiLoading && c.sendBtnDisabled]}
                onPress={handleAiGenerate}
                disabled={aiLoading || aiPrompt.trim().length < 3}
              >
                {aiLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Sparkles size={14} color="#fff" strokeWidth={2.25} />
                )}
                <Text style={c.modalBtnPrimaryText}>
                  {aiLoading ? 'Hazırlanıyor…' : 'Hazırla'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
