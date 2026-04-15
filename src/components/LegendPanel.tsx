import React from 'react';

const legendItems = [
  { label: '1', classes: 'bg-[#a6cee3]' },
  { label: 'b2', classes: 'bg-[#1f78b4]' },
  { label: '2 / 9', classes: 'bg-[#b2df8a]' },
  { label: 'b3', classes: 'bg-[#33a02c]' },
  { label: '3', classes: 'bg-[#fb9a99]' },
  { label: '4 / 11', classes: 'bg-[#e31a1c]' },
  { label: 'b5 / #4', classes: 'bg-[#fdbf6f]' },
  { label: '5', classes: 'bg-[#ff7f00]' },
  { label: 'b6 / #5', classes: 'bg-[#cab2d6]' },
  { label: '6 / 13', classes: 'bg-[#6a3d9a]' },
  { label: 'b7', classes: 'bg-[#facc15]' },
  { label: '7', classes: 'bg-[#b15928]' }
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
              <span className="text-xs font-bold text-slate-600 tracking-widest">{item.label}</span>
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
            <span className="text-[9px] font-bold text-slate-600 tracking-widest">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
