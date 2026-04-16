import { useMemo, useState } from 'react';
import { LuChevronLeft } from 'react-icons/lu';

import { useUIContext } from '../../shared/context/ui-context';
import { MailDashboardGrid } from './dashboard/MailDashboardGrid';
import { MailDashboardProvider, useMailDashboard } from './dashboard/mail-dashboard-context';
import { WidgetIconPanel } from './dashboard/WidgetIconPanel';
import { getCurrentUserKey } from './dashboard/persistence';
import { mailDashboardContent } from './page.mock-data';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

function MailDashboardPanoContent() {
  const { language } = useUIContext();
  const copy = mailDashboardContent[language];
  const { layoutEditMode } = useMailDashboard();
  const [widgetPanelOpen, setWidgetPanelOpen] = useState(true);

  return (
    <>
      <main className={`mail-dash-main ${layoutEditMode ? 'mail-dash-main--edit-mode' : ''}`}>
        <MailDashboardGrid copy={copy} emptyMessage={copy.emptyDashboard} />
      </main>

      <aside
        className={`mail-dash-right-panel ${widgetPanelOpen ? '' : 'mail-dash-right-panel--collapsed'}`}
        aria-hidden={!widgetPanelOpen}
        aria-label={copy.activePanelTitle}
      >
        <WidgetIconPanel copy={copy} onCollapse={() => setWidgetPanelOpen(false)} />
      </aside>

      <button
        type="button"
        className={`mail-dash-widget-panel__fab ${widgetPanelOpen ? 'mail-dash-widget-panel__fab--hidden' : ''}`}
        onClick={() => setWidgetPanelOpen(true)}
        title={copy.widgetPanelExpand}
        aria-label={copy.widgetPanelExpand}
        aria-hidden={widgetPanelOpen}
        tabIndex={widgetPanelOpen ? -1 : 0}
      >
        <LuChevronLeft size={18} aria-hidden />
      </button>
    </>
  );
}

/** Sadece `/mail/pano` — özelleştirilebilir widget panosu (layout sağlayıcı burada). */
export function MailDashboardPage() {
  const userKey = useMemo(() => getCurrentUserKey(), []);

  return (
    <MailDashboardProvider userKey={userKey}>
      <MailDashboardPanoContent />
    </MailDashboardProvider>
  );
}
