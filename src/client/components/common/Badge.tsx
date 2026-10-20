import React from 'react';

interface BadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function Badge({ status, size = 'sm' }: BadgeProps) {
  const s = status.toLowerCase();
  let colorStyle = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  if (s === 'present' || s === 'approved' || s === 'active' || s === 'low') {
    colorStyle = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60';
  } else if (s === 'absent' || s === 'rejected' || s === 'terminated' || s === 'high') {
    colorStyle = 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/60';
  } else if (s === 'leave' || s === 'pending' || s === 'probation' || s === 'medium' || s === 'half day') {
    colorStyle = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/60';
  } else if (s === 'hr') {
    colorStyle = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60';
  } else if (s === 'manager') {
    colorStyle = 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800/60';
  } else if (s === 'employee') {
    colorStyle = 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-800/60';
  }

  const sizeStyle = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${colorStyle} ${sizeStyle}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 fill-current opacity-70 bg-current"></span>
      {status}
    </span>
  );
}
