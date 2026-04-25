import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { DraftMockRow } from '../../pages/mail/page.mock-data';
import { draftsApi, type ApiDraft, type SaveDraftPayload } from '../api/drafts';
import { useAuth } from './auth-context';

type DraftsContextValue = {
  drafts: DraftMockRow[];
  rawDrafts: ApiDraft[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveDraft: (payload: SaveDraftPayload) => Promise<ApiDraft | null>;
  updateDraft: (id: string, payload: SaveDraftPayload) => Promise<ApiDraft | null>;
  removeDraft: (id: string) => Promise<void>;
};

const DraftsContext = createContext<DraftsContextValue | null>(null);

/** API taslağını UI listesi için satır modeline çevirir. */
function toRow(d: ApiDraft): DraftMockRow {
  const firstTo = d.to[0] ?? null;
  const subject = d.subject?.trim() || '(Konusuz)';
  const plain = (d.bodyText ?? '').replace(/<[^>]+>/g, ' ').trim();
  const preview = plain.slice(0, 120) || 'Boş taslak';
  const savedAt = new Date(d.updatedAt);
  const time = isNaN(savedAt.getTime())
    ? 'Kaydedildi'
    : savedAt.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });

  return {
    id: d.id,
    toEmail: firstTo,
    subject,
    preview,
    time,
    bodyText: d.bodyHtml || d.bodyText || undefined,
    attachmentNames: d.attachments.map((a) => a.filename),
  };
}

export function DraftsProvider({ children }: { children: ReactNode }) {
  const { accessToken, mailboxAccounts, status } = useAuth();

  const activeAccount = useMemo(
    () => mailboxAccounts.find((a) => a.status === 'ACTIVE') ?? null,
    [mailboxAccounts],
  );

  const [rawDrafts, setRawDrafts] = useState<ApiDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken || !activeAccount) {
      setRawDrafts([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const items = await draftsApi.list(accessToken, activeAccount.id);
      setRawDrafts(items);
    } catch (err: any) {
      setError(err?.message ?? 'Taslaklar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, activeAccount]);

  useEffect(() => {
    if (status === 'authenticated' && activeAccount) {
      void refresh();
    } else if (status === 'unauthenticated') {
      setRawDrafts([]);
    }
  }, [status, activeAccount, refresh]);

  const saveDraft = useCallback(
    async (payload: SaveDraftPayload): Promise<ApiDraft | null> => {
      if (!accessToken || !activeAccount) {
        setError('Aktif mail hesabı yok.');
        return null;
      }
      try {
        const created = await draftsApi.create(accessToken, activeAccount.id, payload);
        setRawDrafts((prev) => [created, ...prev]);
        return created;
      } catch (err: any) {
        setError(err?.message ?? 'Taslak kaydedilemedi.');
        return null;
      }
    },
    [accessToken, activeAccount],
  );

  const updateDraft = useCallback(
    async (id: string, payload: SaveDraftPayload): Promise<ApiDraft | null> => {
      if (!accessToken || !activeAccount) {
        setError('Aktif mail hesabı yok.');
        return null;
      }
      try {
        const updated = await draftsApi.update(accessToken, activeAccount.id, id, payload);
        setRawDrafts((prev) => {
          const filtered = prev.filter((d) => d.id !== id);
          return [updated, ...filtered];
        });
        return updated;
      } catch (err: any) {
        setError(err?.message ?? 'Taslak güncellenemedi.');
        return null;
      }
    },
    [accessToken, activeAccount],
  );

  const removeDraft = useCallback(
    async (id: string) => {
      if (!accessToken || !activeAccount) return;
      try {
        await draftsApi.remove(accessToken, activeAccount.id, id);
        setRawDrafts((prev) => prev.filter((d) => d.id !== id));
      } catch (err: any) {
        setError(err?.message ?? 'Taslak silinemedi.');
      }
    },
    [accessToken, activeAccount],
  );

  const drafts = useMemo(() => rawDrafts.map(toRow), [rawDrafts]);

  const value = useMemo(
    () => ({ drafts, rawDrafts, loading, error, refresh, saveDraft, updateDraft, removeDraft }),
    [drafts, rawDrafts, loading, error, refresh, saveDraft, updateDraft, removeDraft],
  );

  return <DraftsContext.Provider value={value}>{children}</DraftsContext.Provider>;
}

export function useDrafts() {
  const ctx = useContext(DraftsContext);
  if (!ctx) throw new Error('useDrafts must be used within DraftsProvider');
  return ctx;
}
