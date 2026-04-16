import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Layout } from 'react-grid-layout/legacy';

import { DEFAULT_LAYOUT, widgetsFromLayout } from './default-state';
import { addKindToLayout, removeItemFromLayout } from './layout-utils';
import { loadDashboard, saveDashboard } from './persistence';
import type { WidgetKind } from './types';
import { DASHBOARD_STORAGE_VERSION } from './types';

export type MailDashboardContextValue = {
  layout: Layout;
  widgets: ReturnType<typeof widgetsFromLayout>;
  activeKinds: Set<WidgetKind>;
  /** Açıkken widget sürüklenip yeniden boyutlandırılabilir. */
  layoutEditMode: boolean;
  toggleLayoutEditMode: () => void;
  toggleWidgetKind: (kind: WidgetKind) => void;
  setLayoutFromGrid: (next: Layout) => void;
  resetToDefaultLayout: () => void;
};

const MailDashboardContext = createContext<MailDashboardContextValue | null>(null);

export function MailDashboardProvider({ userKey, children }: { userKey: string; children: ReactNode }) {
  const [layout, setLayout] = useState<Layout>(() => loadDashboard(userKey)?.layout ?? DEFAULT_LAYOUT);
  const [layoutEditMode, setLayoutEditMode] = useState(false);

  useEffect(() => {
    saveDashboard({
      version: DASHBOARD_STORAGE_VERSION,
      userKey,
      layout,
    });
  }, [userKey, layout]);

  const widgets = useMemo(() => widgetsFromLayout(layout), [layout]);

  const activeKinds = useMemo(() => new Set(layout.map((l) => l.i as WidgetKind)), [layout]);

  const toggleWidgetKind = useCallback((kind: WidgetKind) => {
    setLayout((prev) => {
      const on = prev.some((l) => l.i === kind);
      if (on) return removeItemFromLayout(prev, kind);
      return addKindToLayout(prev, kind);
    });
  }, []);

  const setLayoutFromGrid = useCallback((next: Layout) => {
    setLayout(next);
  }, []);

  const resetToDefaultLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
  }, []);

  const toggleLayoutEditMode = useCallback(() => {
    setLayoutEditMode((v) => !v);
  }, []);

  const value = useMemo<MailDashboardContextValue>(
    () => ({
      layout,
      widgets,
      activeKinds,
      layoutEditMode,
      toggleLayoutEditMode,
      toggleWidgetKind,
      setLayoutFromGrid,
      resetToDefaultLayout,
    }),
    [
      layout,
      widgets,
      activeKinds,
      layoutEditMode,
      toggleLayoutEditMode,
      toggleWidgetKind,
      setLayoutFromGrid,
      resetToDefaultLayout,
    ],
  );

  return <MailDashboardContext.Provider value={value}>{children}</MailDashboardContext.Provider>;
}

export function useMailDashboard(): MailDashboardContextValue {
  const ctx = useContext(MailDashboardContext);
  if (!ctx) {
    throw new Error('useMailDashboard yalnızca MailDashboardProvider içinde kullanılmalıdır.');
  }
  return ctx;
}
