import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl p-2.5 shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex flex-col items-center justify-center text-center ${className}`}>
      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{title}</span>
      <span className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">{value}</span>
    </div>
  );
};
