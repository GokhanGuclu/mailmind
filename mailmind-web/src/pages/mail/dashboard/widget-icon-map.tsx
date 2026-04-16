import type { IconType } from 'react-icons';
import {
  LuCalendar,
  LuChartBar,
  LuInbox,
  LuListChecks,
  LuMail,
  LuStar,
  LuUsers,
  LuZap,
} from 'react-icons/lu';

import type { WidgetKind } from './types';

/** react-icons/lu — Lucide seti (prompt ile uyumlu). */
export const WIDGET_ICONS: Record<WidgetKind, IconType> = {
  inbox: LuInbox,
  unread: LuMail,
  starred: LuStar,
  calendar: LuCalendar,
  tasks: LuListChecks,
  'important-contacts': LuUsers,
  stats: LuChartBar,
  'quick-actions': LuZap,
};
