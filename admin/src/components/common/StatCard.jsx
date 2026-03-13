import React from 'react';

const colorMap = {
  indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400',
  purple: 'from-purple-500/20 to-purple-500/5 text-purple-400',
  emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400',
  amber: 'from-amber-500/20 to-amber-500/5 text-amber-400',
};

export default function StatCard({ title, value, hint, color = 'indigo' }) {
  return (
    <div className={`silk-card p-6 bg-gradient-to-br ${colorMap[color] || colorMap.indigo}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{title}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-xs opacity-50 font-medium">{hint}</p>
    </div>
  );
}
