import React from 'react';

const legendItems = [
  { label: 'Root (1)', classes: 'bg-red-500' },
  { label: '2nd / 9', classes: 'bg-yellow-500' },
  { label: '3rd', classes: 'bg-green-500' },
  { label: '4th / 11', classes: 'bg-teal-500' },
  { label: '5th', classes: 'bg-blue-500' },
  { label: '6th / 13', classes: 'bg-indigo-500' },
  { label: '7th', classes: 'bg-purple-500' }
];

export const LegendPanel: React.FC = () => {
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
