import type { CSSProperties } from 'react';
import { useCallback } from 'react';
import { LuChevronRight, LuPencil, LuRotateCcw } from 'react-icons/lu';

import type { MailDashboardCopy } from '../page.mock-data';
import { useMailDashboard } from './mail-dashboard-context';
import { ALL_WIDGET_KINDS } from './widget-registry';
import { WIDGET_ICONS } from './widget-icon-map';

type Props = {
  copy: MailDashboardCopy;
  onCollapse?: () => void;
};

export function WidgetIconPanel(props: Props) {
  const { activeKinds, toggleWidgetKind, layoutEditMode, toggleLayoutEditMode, resetToDefaultLayout } =
    useMailDashboard();

  const handleReset = useCallback(() => {
    if (!window.confirm(props.copy.resetConfirm)) return;
    resetToDefaultLayout();
  }, [props.copy.resetConfirm, resetToDefaultLayout]);

  return (
    <div className="mail-dash-widget-picker">
      <div className="mail-dash-widget-picker__edit-row">
        <button
          type="button"
          className={`mail-dash-widget-edit-btn ${layoutEditMode ? 'mail-dash-widget-edit-btn--on' : ''}`}
          aria-pressed={layoutEditMode}
          title={layoutEditMode ? props.copy.editModeExitHint : props.copy.editModeEnterHint}
          aria-label={
            layoutEditMode
              ? `${props.copy.editModeLabel}: ${props.copy.editModeExitHint}`
              : `${props.copy.editModeLabel}: ${props.copy.editModeEnterHint}`
          }
          onClick={toggleLayoutEditMode}
        >
          <LuPencil className="mail-dash-widget-edit-btn__icon" size={18} aria-hidden />
        </button>
      </div>
      <div className="mail-dash-widget-picker__reset-row">
        <button
          type="button"
          className="mail-dash-widget-reset-btn"
          onClick={handleReset}
          title={props.copy.resetLayout}
          aria-label={props.copy.resetLayout}
        >
          <LuRotateCcw className="mail-dash-widget-reset-btn__icon" size={18} aria-hidden />
        </button>
      </div>
      <div className="mail-dash-widget-picker__divider" role="separator" aria-hidden />
      <div
        className="mail-dash-widget-picker__grid"
        role="toolbar"
        aria-label={props.copy.activePanelTitle}
        style={
          {
            gridTemplateRows: `repeat(${ALL_WIDGET_KINDS.length}, minmax(0, 1fr))`,
          } as CSSProperties
        }
      >
        {ALL_WIDGET_KINDS.map((kind) => {
          const Icon = WIDGET_ICONS[kind];
          const on = activeKinds.has(kind);
          return (
            <button
              key={kind}
              type="button"
              aria-pressed={on}
              title={props.copy.widgetTitles[kind]}
              aria-label={`${props.copy.widgetTitles[kind]} — ${on ? props.copy.toggleStateOn : props.copy.toggleStateOff}`}
              className={`mail-dash-widget-tile ${on ? 'mail-dash-widget-tile--on' : 'mail-dash-widget-tile--off'}`}
              onClick={() => toggleWidgetKind(kind)}
            >
              <span className="mail-dash-widget-tile__icon-wrap" aria-hidden>
                <Icon className="mail-dash-widget-tile__icon" size={17} />
              </span>
            </button>
          );
        })}
      </div>
      {props.onCollapse ? (
        <div className="mail-dash-widget-picker__collapse-row">
          <button
            type="button"
            className="mail-dash-widget-picker__collapse mail-dash-widget__n_drag"
            onClick={props.onCollapse}
            title={props.copy.widgetPanelCollapse}
            aria-label={props.copy.widgetPanelCollapse}
          >
            <LuChevronRight size={16} aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
