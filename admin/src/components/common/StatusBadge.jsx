import React from 'react';

const classes = {
  Pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  Confirmed: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  Shipped: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  Delivered: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)]',
  Cancelled: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  Successful: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)]',
  Refunded: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
};

export default function StatusBadge({ status }) {
  const cls = classes[status] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  return (
    <span className={`silk-badge ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse" />
      {status}
    </span>
  );
}
