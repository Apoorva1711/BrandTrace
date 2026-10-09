import React from 'react';

export function RiskBadge({ category, score, showScore = true }) {
  const cat = (category || 'low').toLowerCase();

  const styles = {
    critical: 'bg-red-50 text-red-700 border-red-200 ring-red-600/10',
    high: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-600/10',
    medium: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/10',
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/10'
  };

  const dots = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-amber-500',
    low: 'bg-emerald-500'
  };

  const style = styles[cat] || styles.low;
  const dot = dots[cat] || dots.low;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
      <span>{category || 'Low'}</span>
      {showScore && score !== undefined && (
        <span className="font-mono opacity-80">({score})</span>
      )}
    </span>
  );
}

export function StatusBadge({ status }) {
  const s = (status || 'new').toLowerCase();

  const styles = {
    'new': 'bg-blue-50 text-blue-700 border-blue-200',
    'under review': 'bg-amber-50 text-amber-700 border-amber-200',
    'suspected impersonation': 'bg-red-50 text-red-700 border-red-200',
    'false positive': 'bg-slate-100 text-slate-700 border-slate-200',
    'resolved': 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };

  const style = styles[s] || styles['new'];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {status || 'New'}
    </span>
  );
}
