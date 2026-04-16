import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical.js';

import type { WidgetInstance } from './types';
import type { MailDashboardCopy } from '../page.mock-data';
import { CalendarWidgetBody } from './calendar-widget-body';

type Props = {
  instance: WidgetInstance;
  copy: MailDashboardCopy;
};

function MockRows({
  copy,
  n,
  unreadFirst = 0,
}: {
  copy: MailDashboardCopy;
  n: number;
  unreadFirst?: number;
}) {
  return (
    <ul className="mail-dash-widget__list">
      {Array.from({ length: n }, (_, i) => (
        <li
          key={i}
          className={`mail-dash-widget__list-item ${i < unreadFirst ? 'mail-dash-widget__list-item--unread' : ''}`}
        >
          <span className="mail-dash-widget__list-subj">{copy.mock.sampleSubject}</span>
          <span className="mail-dash-widget__list-prev">{copy.mock.samplePreview}</span>
        </li>
      ))}
    </ul>
  );
}

function WidgetBody({ instance, copy }: Props) {
  switch (instance.kind) {
    case 'inbox':
      return (
        <div className="mail-dash-widget__body mail-dash-widget__body--inbox">
          <MockRows copy={copy} n={8} unreadFirst={3} />
        </div>
      );
    case 'unread':
      return (
        <div className="mail-dash-widget__pane">
          <p className="mail-dash-widget__badge-count">7</p>
          <MockRows copy={copy} n={4} unreadFirst={4} />
        </div>
      );
    case 'starred':
    case 'important-contacts':
      return (
        <div className="mail-dash-widget__pane">
          <MockRows copy={copy} n={5} unreadFirst={0} />
        </div>
      );
    case 'calendar':
      return <CalendarWidgetBody copy={copy} />;
    case 'tasks':
      return (
        <ul className="mail-dash-widget__tasks">
          <li>
            <input type="checkbox" readOnly /> {copy.mock.taskLine1}
            <span className="mail-dash-widget__task-due">{copy.mock.taskDeadline}</span>
          </li>
          <li>
            <input type="checkbox" readOnly /> {copy.mock.taskLine2}
          </li>
        </ul>
      );
    case 'stats':
      return (
        <div className="mail-dash-widget__stats mail-dash-widget__stats--stack">
          <p className="mail-dash-widget__stats-line">{copy.mock.statDaily}</p>
          <p className="mail-dash-widget__stats-line mail-dash-widget__stats-line--muted">{copy.mock.statRatio}</p>
        </div>
      );
    case 'quick-actions':
      return (
        <div className="mail-dash-widget__quick">
          <button type="button" className="mail-dash-widget__quick-btn">
            {copy.mock.quickNewMail}
          </button>
          <button type="button" className="mail-dash-widget__quick-btn">
            {copy.mock.quickFilter}
          </button>
          <button type="button" className="mail-dash-widget__quick-btn">
            {copy.mock.quickSearch}
          </button>
        </div>
      );
    default:
      return null;
  }
}

export function MailDashboardWidget(props: Props) {
  const title = props.copy.widgetTitles[props.instance.kind];

  return (
    <div className="mail-dash-widget">
      <header className="mail-dash-widget__head">
        <button type="button" className="mail-dash-widget__drag" aria-label="Sürükle">
          <GripVertical size={18} strokeWidth={2} aria-hidden />
        </button>
        <h2 className="mail-dash-widget__title">{title}</h2>
      </header>
      <div className="mail-dash-widget__scroll">
        <WidgetBody {...props} />
      </div>
    </div>
  );
}
