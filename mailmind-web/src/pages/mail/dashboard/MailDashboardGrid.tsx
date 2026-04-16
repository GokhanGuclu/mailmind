import { useLayoutEffect, useRef, useState } from 'react';
import ReactGridLayout from 'react-grid-layout/legacy';

import type { MailDashboardCopy } from '../page.mock-data';
import { useMailDashboard } from './mail-dashboard-context';
import { MailDashboardWidget } from './MailDashboardWidget';
import { GRID_COLS, GRID_MAX_ROWS } from './types';

type Props = {
  copy: MailDashboardCopy;
  emptyMessage: string;
};

const GRID_MARGIN: [number, number] = [8, 8];

export function MailDashboardGrid(props: Props) {
  const { layout, widgets, setLayoutFromGrid, layoutEditMode } = useMailDashboard();
  const hostRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 0, rowHeight: 40 });

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const marginY = GRID_MARGIN[1];
      const rows = GRID_MAX_ROWS;
      const rh = Math.floor((h - marginY * (rows - 1)) / rows);
      setDims({ width: w, rowHeight: Math.max(28, rh) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (widgets.length === 0) {
    return (
      <div className="mail-dash-grid-host mail-dash-grid-host--empty">
        <p className="mail-dash-empty">{props.emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className={`mail-dash-grid-host ${layoutEditMode ? 'mail-dash-grid-host--edit-mode' : ''}`}
    >
      {dims.width > 0 ? (
        <ReactGridLayout
          className="mail-dash-rgl"
          width={dims.width}
          layout={layout}
          cols={GRID_COLS}
          maxRows={GRID_MAX_ROWS}
          rowHeight={dims.rowHeight}
          margin={GRID_MARGIN}
          containerPadding={[0, 0]}
          compactType={null}
          preventCollision
          isBounded
          isDraggable={layoutEditMode}
          isResizable={layoutEditMode}
          draggableHandle=".mail-dash-widget__drag"
          draggableCancel=".mail-dash-widget__n_drag"
          onLayoutChange={setLayoutFromGrid}
        >
          {widgets.map((w) => (
            <div key={w.id} className="mail-dash-grid-cell">
              <MailDashboardWidget instance={w} copy={props.copy} />
            </div>
          ))}
        </ReactGridLayout>
      ) : null}
    </div>
  );
}
