import React, { useState } from 'react';
import { useSandbox } from '../hooks/useSandbox';
import { Fretboard, type FretMarker } from './Fretboard';
import SheetMusic from './SheetMusic';
import { CHORD_DICTIONARY } from '../utils/chordLibrary';

const SandboxMode: React.FC = () => {
  const {
    clickedFrets,
    handleFretClick,
    setChordShape,
    clearSelection,
    analyzedChords,
    activePitches
  } = useSandbox();

  const [search, setSearch] = useState('');

  const filteredChords = CHORD_DICTIONARY.filter(c => 
    c.quality.toLowerCase().includes(search.toLowerCase())
  );

  const markers: FretMarker[] = clickedFrets.map(p => ({
    stringIndex: p.stringIndex,
    fret: p.fret,
    markerClass: "scale-100 bg-blue-500 border-2 border-slate-900 shadow-sm"
  }));

  const getGhostClass = (_sIdx: number, _fret: number) => {
    return "scale-0 group-hover:scale-75 group-hover:bg-blue-300/50 transition-all";
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white text-slate-900 font-sans select-none">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-72 bg-slate-50 border-r border-slate-200 flex flex-col p-6 gap-8 shrink-0">
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
                       onClick={() => setChordShape(def, shape)}
                       className="text-[10px] bg-slate-100 hover:bg-blue-100 text-slate-700 px-2 py-1 rounded"
                     >
                       Str {shape.rootString}
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

      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-8 min-w-0">
         
         {/* Top HUD */}
         <div className="flex flex-col items-center justify-center min-h-[200px] w-full">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Detected Chords</h2>
            {analyzedChords.length > 0 ? (
               <div className="flex flex-wrap items-center justify-center gap-4">
                 {analyzedChords.map((chord, i) => (
                   <span key={i} className="text-4xl font-black text-slate-800 bg-blue-100 px-4 py-2 rounded">
                     {chord}
                   </span>
                 ))}
               </div>
            ) : (
               <div className="text-xl font-bold text-slate-300">Click frets to analyze...</div>
            )}

            {/* Render actual exact pitches */}
            {activePitches.length > 0 && (
                <div className="mt-8 scale-125">
                   <SheetMusic 
                      notes={activePitches} 
                      colors={activePitches.map(() => '#2563eb')} 
                      gameMode="SANDBOX" 
                      useFlats={true} 
                   />
                </div>
            )}
         </div>

         {/* Fretboard */}
         <Fretboard
           markers={markers}
           onFretClick={handleFretClick}
           getGhostClass={getGhostClass}
         />

      </main>
    </div>
  );
};

export default SandboxMode;