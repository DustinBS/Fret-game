import React from 'react';

const legendItems = [
  { label: 'Root (1)', classes: 'bg-red-600' },
  { label: '2nd / 9', classes: 'bg-orange-500' },
  { label: '3rd', classes: 'bg-yellow-400' },
  { label: '4th / 11', classes: 'bg-green-500' },
  { label: '5th', classes: 'bg-cyan-500' },
  { label: '6th / 13', classes: 'bg-blue-600' },
  { label: '7th', classes: 'bg-purple-600' }
];

export const LegendPanel: React.FC<{ variant?: 'normal' | 'large' }> = ({ variant = 'normal' }) => {
  if (variant === 'large') {
    return (
      <div className="flex flex-col gap-4 w-full max-w-sm mx-auto my-auto p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
        <h2 className="text-sm font-black uppercase text-slate-800 tracking-wider text-center border-b border-slate-100 pb-3">Interval Legend</h2>
        <div className="flex flex-col gap-3 mt-2">
          {legendItems.map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`w-6 h-6 rounded shadow-sm ${item.classes}`}></div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 mt-auto pt-6">
      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Interval Legend</span>
      <div className="grid grid-cols-2 gap-2 p-3 bg-white border border-slate-200 rounded-md">
        {legendItems.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded shadow-sm ${item.classes}`}></div>
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
