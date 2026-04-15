import React, { useState } from 'react';
import { useSandbox } from '../hooks/useSandbox';
import { Fretboard, type FretMarker } from './Fretboard';
import SheetMusic from './SheetMusic';
import { CHORD_DICTIONARY } from '../utils/chordLibrary';
import { getIntervalColor, getIntervalHexColor } from '../utils/musicTheory';
import { useHistory, HistoryPanel } from './History';
import { LegendPanel } from './LegendPanel';

const SandboxMode: React.FC = () => {
  const {
    clickedFrets,
    handleFretClick,
    setChordShape,
    clearSelection,
    analyzedChords,
    selectedChordIndex,
    setSelectedChordIndex,
    activePitches,
    setClickedFrets
  } = useSandbox();

  const { history, addHistory, clearHistory } = useHistory<any>('sandboxHistory');

  const [search, setSearch] = useState('');

  const STRING_NAMES: Record<number, string> = {
    5: "Str 6E",
    4: "Str 5A",
    3: "Str 4D",
    2: "Str 3G",
    1: "Str 2B",
    0: "Str 1e"
  };

  const filteredChords = CHORD_DICTIONARY.filter(c => 
    c.quality.toLowerCase().includes(search.toLowerCase())
  );

  const markers: FretMarker[] = clickedFrets.map(p => ({
    stringIndex: p.stringIndex,
    fret: p.fret,
    markerClass: `scale-100 ${p.interval ? getIntervalColor(p.interval) : 'bg-blue-500'} ${p.interval === '1' ? 'border-2 border-slate-900' : ''} text-white shadow-sm`,
    label: p.interval || undefined
  }));

  const getGhostClass = (_sIdx: number, _fret: number) => {
    return "scale-0 group-hover:scale-75 group-hover:bg-blue-300/50 transition-all";
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-white text-slate-900 font-sans select-none">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-72 h-full overflow-y-auto bg-slate-50 border-r border-slate-200 flex flex-col p-6 gap-8 shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">
            Fret<span className="text-slate-400">Sandbox</span>
          </h1>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Explorer Mode
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
             <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Search Chord Shape</span>
             <input 
               type="text" 
               className="w-full mt-2 p-2 border border-slate-300 rounded focus:border-blue-500 outline-none" 
               value={search} 
               onChange={e => setSearch(e.target.value)} 
               placeholder="e.g. maj7" 
             />
          </div>
          <div className="h-[300px] overflow-y-auto border border-slate-200 bg-white rounded flex flex-col">
            {filteredChords.map(def => (
               <div key={def.quality} className="border-b border-slate-100 last:border-0 p-2">
                 <div className="font-bold text-sm mb-1">{def.quality}</div>
                 <div className="flex gap-2">
                   {def.shapes.map((shape, i) => (
                     <button
                       key={i}
                       onClick={() => {
                           setChordShape(def, shape);
                           const newPositions = shape.offsets.map((so: any) => ({
                               stringIndex: so.string, fret: so.offset, interval: so.interval
                           }));
                           addHistory(`${def.quality} (Str ${shape.rootString})`, newPositions);
                       }}
                       className="text-[10px] bg-slate-100 hover:bg-blue-100 text-slate-700 px-2 py-1 rounded"
                     >
                       {STRING_NAMES[shape.rootString] || `Str ${shape.rootString}`}
                     </button>
                   ))}
                 </div>
               </div>
            ))}
          </div>

          <button
              onClick={clearSelection}
              className="text-left text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 py-2 px-3 -mx-3 rounded transition-colors uppercase tracking-wider flex items-center justify-between group"
          >
              <span>Clear Selection</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">×</span>
          </button>
        </div>

      </aside>

      <main className="flex-1 h-full overflow-y-auto flex flex-col items-center justify-center py-1 p-4 lg:p-10 lg:py-1 gap-1 min-w-0">
         
         <div className="flex flex-row items-center justify-center min-h-40 w-full gap-8">
            <div className="flex justify-center scale-110 lg:scale-125 origin-center min-w-[200px]">
               <SheetMusic 
                  notes={activePitches} 
                  colors={clickedFrets.map(p => p.interval ? getIntervalHexColor(p.interval) : '#2563eb')} 
                  gameMode="SANDBOX" 
                  useFlats={true} 
               />
            </div>

            <div className="flex flex-col items-center min-h-[96px] max-h-[140px] px-2 w-[340px]">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 shrink-0">Detected Chords</h2>
              {analyzedChords.length > 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 w-full h-full overflow-hidden">
                  <div className="flex flex-col flex-wrap content-center gap-1 overflow-x-auto w-full max-h-[85px] custom-scrollbar pb-1">
                    {analyzedChords.map((chord, i) => (
                      <button 
                        key={i} 
                        onClick={() => setSelectedChordIndex(i)}
                        className={`text-sm font-bold px-2 py-1 rounded transition-colors break-words whitespace-nowrap max-w-[150px] ${selectedChordIndex === i ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-100 text-slate-800 hover:bg-blue-200'}`}
                      >
                        {chord.name}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => addHistory(analyzedChords[selectedChordIndex].name, clickedFrets)}
                    className="text-[10px] mt-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded uppercase tracking-widest transition"
                  >
                     Save Chord
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 opacity-50 text-slate-400">
                  <span className="text-2xl border border-dashed border-slate-300 font-bold px-4 py-2 rounded">
                    Unknown
                  </span>
                  <button 
                    disabled
                    className="text-[10px] mt-2 px-3 py-1 bg-slate-300 text-slate-500 font-bold rounded uppercase tracking-widest cursor-not-allowed"
                  >
                     Save Chord
                  </button>
                </div>
              )}
            </div>
         </div>

         {/* Fretboard */}
         <Fretboard
           numFrets={25}
           markers={markers}
           onFretClick={handleFretClick}
           getGhostClass={getGhostClass}
         />

        {/* Spacer to match Trainer flex distribution */}
        <div className="mt-6 pointer-events-none opacity-0 select-none py-4 text-xl">_</div>
      </main>

      {/* RIGHT SIDEBAR - HISTORY */}
      <aside className="w-full lg:w-72 h-full overflow-y-auto bg-slate-50 border-l border-slate-200 flex flex-col shrink-0 p-6">
        <HistoryPanel history={history} onClear={clearHistory} onRestore={(state) => setClickedFrets(state)} />
        <LegendPanel />
      </aside>
    </div>
  );
};

export default SandboxMode;