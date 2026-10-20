import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  colorScheme?: 'indigo' | 'emerald' | 'amber' | 'purple' | 'rose' | 'sky';
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, colorScheme = 'indigo' }: StatCardProps) {
  const schemeStyles = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
  }[colorScheme];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <div className={`p-2.5 rounded-xl ${schemeStyles}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend.isPositive !== false
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
          }`}>
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
      )}
    </div>
  );
}
