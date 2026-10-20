import React from 'react';
import { formatDateDMY } from '../../utils/date.js';

interface DateRangeDisplayProps {
  startDate?: string | null;
  endDate?: string | null;
  className?: string;
  badgeStyle?: boolean;
}

export const DateRangeDisplay: React.FC<DateRangeDisplayProps> = ({
  startDate,
  endDate,
  className = '',
  badgeStyle = false,
}) => {
  const start = formatDateDMY(startDate);
  const end = formatDateDMY(endDate);

  if (!startDate && !endDate) {
    return <span className="text-slate-400 font-mono text-xs">-</span>;
  }

  // If no end date or only start date is provided
  if (!endDate) {
    return (
      <span className={`font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 ${className}`}>
        {start}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex flex-col items-start font-mono text-xs leading-tight ${
        badgeStyle
          ? 'px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60'
          : ''
      } ${className}`}
    >
      <span className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{start}</span>
      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans tracking-wide my-0.5 select-none lowercase">
        to
      </span>
      <span className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{end}</span>
    </div>
  );
};
