import type { ReactNode } from 'react';

export interface DataListColumn {
  key: string;
  /** Column title. Pass an already-translated string. */
  title: string;
  /** Right-aligned, tabular-nums (times, values, counts). */
  numeric?: boolean;
  /** CSS grid track; defaults to minmax(0, 1fr). */
  width?: string;
}

export interface DataListRow {
  key: string;
  cells: Record<string, ReactNode>;
}

interface DataListProps {
  /** Accessible table name. */
  label: string;
  columns: DataListColumn[];
  rows: DataListRow[];
  className?: string;
}

/** Aligned record list: header row and data rows share one grid template. */
export default function DataList({ label, columns, rows, className = '' }: DataListProps) {
  const gridTemplateColumns = columns.map((c) => c.width ?? 'minmax(0, 1fr)').join(' ');
  const align = (c: DataListColumn) => (c.numeric ? 'text-right tabular-nums' : 'text-left');

  return (
    <div role="table" aria-label={label} className={className}>
      <div role="rowgroup">
        <div role="row" className="grid gap-3 border-b border-default pb-2" style={{ gridTemplateColumns }}>
          {columns.map((c) => (
            <span key={c.key} role="columnheader" className={`text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary ${align(c)}`}>
              {c.title}
            </span>
          ))}
        </div>
      </div>
      <div role="rowgroup">
        {rows.map((row) => (
          <div key={row.key} role="row" className="grid gap-3 border-b border-default py-3 last:border-b-0" style={{ gridTemplateColumns }}>
            {columns.map((c) => (
              <span key={c.key} role="cell" className={`min-w-0 text-sm text-primary [overflow-wrap:anywhere] ${align(c)}`}>
                {row.cells[c.key]}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
