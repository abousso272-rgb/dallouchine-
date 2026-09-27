import React from 'react';
import { Link } from './Link';
import { useApp } from '../../context/AppContext';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
}

/**
 * Tableau sur ordinateur, liste de cartes sur mobile (pas de défilement horizontal).
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  rowHref,
  mobile
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string;
  mobile: (row: T) => React.ReactNode;
}) {
  const { navigate } = useApp();
  return (
    <div className="card overflow-hidden p-0">
      <table className="hidden w-full text-[13.5px] md:table">
        <thead>
          <tr className="border-b border-line bg-paper/60 text-left text-[11.5px] uppercase tracking-wide text-muted">
            {columns.map(c => (
              <th key={c.key} className={`px-4 py-3 font-semibold ${c.align === 'right' ? 'text-right' : ''} ${c.className || ''}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map(row => {
            const href = rowHref?.(row);
            return (
              <tr
                key={rowKey(row)}
                className={href ? 'cursor-pointer hover:bg-paper/60' : ''}
                onClick={e => {
                  if (!href || (e.target as HTMLElement).closest('a,button,input,select,textarea')) return;
                  navigate(href);
                }}
              >
                {columns.map((c, i) => (
                  <td key={c.key} className={`px-4 py-3 align-middle ${c.align === 'right' ? 'text-right' : ''} ${c.className || ''}`}>
                    {href && i === 0 ? (
                      <Link to={href} className="block">
                        {c.cell(row)}
                      </Link>
                    ) : (
                      c.cell(row)
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <ul className="divide-y divide-line md:hidden">
        {rows.map(row => {
          const href = rowHref?.(row);
          return (
            <li key={rowKey(row)}>
              {href ? (
                <Link to={href} className="block px-4 py-3.5 active:bg-paper">
                  {mobile(row)}
                </Link>
              ) : (
                <div className="px-4 py-3.5">{mobile(row)}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
