import { useUIContext } from '../../shared/context/ui-context';
import { MailCalendarFullView } from './mail-calendar-full';
import { mailDashboardContent } from './page.mock-data';
import './mail-calendar-full.css';

export function MailCalendarPage() {
  const { language } = useUIContext();
  const copy = mailDashboardContent[language];

  return (
    <main className="mail-dash-main mail-dash-main--calendar-page">
      <div className="mail-calendar-page">
        <MailCalendarFullView copy={copy} />
      </div>
    </main>
  );
}
