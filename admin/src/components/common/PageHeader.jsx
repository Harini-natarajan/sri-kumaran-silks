import React from 'react';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-500 mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-4xl font-black text-white tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1.5 text-sm text-gray-500 font-medium">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
