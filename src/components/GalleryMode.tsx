import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CHORD_DICTIONARY } from '../utils/chordLibrary';
import { getIntervalHexColor, TUNING, NOTES_FLAT, NOTES_SHARP, getNoteNameFromPitchClass } from '../utils/musicTheory';
import { DIATONIC_INTERVALS, CHORD_QUALITY_DIATONIC_MAP } from '../utils/diatonic';
import SheetMusic from './SheetMusic';
import { LegendPanel } from './LegendPanel';

export const GalleryMode: React.FC = () => {
  const [keyConstraint, setKeyConstraintState] = useState('C');
  const [showDiatonic, setShowDiatonic] = useState(false);
  const [selectedDiatonic, setSelectedDiatonic] = useState<Record<string, string>>({});
  const scrollContainerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleUrlState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab')?.toLowerCase();
      if (tab === 'gallery') {
        const key = params.get('key');
        if (key && (NOTES_FLAT.includes(key) || NOTES_SHARP.includes(key))) {
          setKeyConstraintState(key);
        }

        const scrollTo = params.get('scrollTo');
        if (scrollTo && scrollContainerRef.current) {
          const el = scrollContainerRef.current.querySelector(`[data-quality="${scrollTo}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            params.delete('scrollTo');
            window.history.replaceState({}, '', '?' + params.toString());
          }
        } else if (scrollContainerRef.current) {
           const savedScroll = sessionStorage.getItem('galleryScroll');
           if (savedScroll) {
             scrollContainerRef.current.scrollTop = parseInt(savedScroll, 10);
           }
        }
      }
    };
    setTimeout(handleUrlState, 100);
    window.addEventListener('popstate', handleUrlState);
    return () => window.removeEventListener('popstate', handleUrlState);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
     sessionStorage.setItem('galleryScroll', e.currentTarget.scrollTop.toString());
  };

  const setKeyConstraint = (key: string) => {
    setKeyConstraintState(key);
    const params = new URLSearchParams(window.location.search);
    params.set('key', key);
    window.history.replaceState({}, '', '?' + params.toString());
  };

  // Parse Key Constraint to root Pitch Class (0-11)
  const rootObj = useMemo(() => {
      let pitchClass = 0;
      let useFlats = false;
      const keyName = keyConstraint.split(' ')[0];
      if (NOTES_FLAT.includes(keyName)) {
          pitchClass = NOTES_FLAT.indexOf(keyName);
          useFlats = true;
      } else if (NOTES_SHARP.includes(keyName)) {
          pitchClass = NOTES_SHARP.indexOf(keyName);
          useFlats = false;
      }
      if (keyName === 'F') useFlats = true;
      return { pitchClass, useFlats };
  }, [keyConstraint]);

  const stringShapes = [5, 4, 3, 2]; // Usually shapes are mostly from E (5), A (4), D (3), G (2) strings

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-white text-slate-900 font-sans select-none">
      
      {/* SIDEBAR */}
      <aside className="w-full lg:w-72 h-full overflow-y-auto bg-slate-50 border-r border-slate-200 flex flex-col p-6 gap-8 shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">
            Chord<span className="text-slate-400">Gallery</span>
          </h1>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Visual Matrix
          </div>
        </div>

        <div className="flex flex-col gap-4">
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Key Constraint</label>
            <select 
                className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none"
                value={keyConstraint}
                onChange={e => setKeyConstraint(e.target.value)}
            >
                {Array.from(new Set([...NOTES_FLAT, ...NOTES_SHARP])).sort().map(note => (
                    <option key={note} value={note}>{note}</option>
                ))}
            </select>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <label className="text-xs font-bold uppercase text-slate-500 tracking-wider cursor-pointer select-none" htmlFor="diatonicToggle">
            Show Diatonic Context
          </label>
          <input 
            type="checkbox" 
            id="diatonicToggle"
            checked={showDiatonic}
            onChange={(e) => setShowDiatonic(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer"
          />
        </div>

        {/* LEGEND NOW INTEGRATED IN RIGHT SIDEBAR */}
      </aside>

      {/* MAIN GALLERY */}
      <main ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 h-full overflow-y-auto flex flex-col py-1 p-4 lg:p-8 gap-4 min-w-0 bg-slate-100/50">
          <div className="w-full overflow-x-auto bg-white rounded border border-slate-200 shadow-sm">
            <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 shadow-[1px_0_0_rgba(226,232,240,1)]">Quality</th>
                        {stringShapes.map(str => (
                            <th key={str} className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                                Str {str+1} Root
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {CHORD_DICTIONARY.map(def => {
                        const diatonicOptions = CHORD_QUALITY_DIATONIC_MAP[def.quality] || [];
                        const hasDiatonic = diatonicOptions.length > 0;
                        const activeDiatonic = selectedDiatonic[def.quality] || diatonicOptions[0];
                        let offsetFromKey = 0;
                        
                        if (showDiatonic && hasDiatonic && DIATONIC_INTERVALS[activeDiatonic] !== undefined) {
                           offsetFromKey = DIATONIC_INTERVALS[activeDiatonic];
                        }
                        
                        const actualRootPitch = (rootObj.pitchClass + offsetFromKey) % 12;
                        const actualRootName = getNoteNameFromPitchClass(actualRootPitch, rootObj.useFlats);

                        return (
                          <tr key={def.quality} data-quality={def.quality} className="hover:bg-slate-50">
                              <td className="p-4 font-bold text-slate-700 sticky left-0 bg-inherit z-10 shadow-[1px_0_0_rgba(226,232,240,1)] bg-white align-middle">
                                  <div className="flex flex-col gap-1">
                                      <span className="whitespace-nowrap">
                                        {showDiatonic && hasDiatonic ? <span className="text-blue-600 mr-1">{actualRootName}</span> : null}
                                        {def.quality}
                                      </span>
                                      
                                      {showDiatonic && (
                                        diatonicOptions.length > 1 ? (
                                           <select 
                                             className="text-xs p-1 border border-slate-200 rounded bg-slate-50 mt-1 cursor-pointer w-16"
                                             value={activeDiatonic}
                                             onChange={(e) => setSelectedDiatonic({...selectedDiatonic, [def.quality]: e.target.value})}
                                           >
                                             {diatonicOptions.map(d => <option key={d} value={d}>{d}</option>)}
                                           </select>
                                        ) : diatonicOptions.length === 1 ? (
                                           <span className="text-[10px] text-slate-500 font-normal border border-slate-200 bg-slate-50 px-1 flex items-center justify-center h-6 rounded w-10 mt-1">
                                             {diatonicOptions[0]}
                                           </span>
                                        ) : (
                                           <span className="text-[10px] text-slate-400 italic mt-1 h-6 flex items-center">Non-diatonic</span>
                                        )
                                      )}
                                  </div>
                              </td>
                              {stringShapes.map(str => {
                                  const shape = def.shapes.find(s => s.rootString === str);
                                  if (!shape) return <td key={str} className="p-4 text-center text-slate-300">-</td>;

                                  const stringOpenPitch = TUNING[shape.rootString];
                                  let rootFret = (actualRootPitch - (stringOpenPitch % 12) + 12) % 12;
                                  if (rootFret <= 2) rootFret += 12; // Push up to avoid too many ledger lines if desired

                                  const pitches = shape.offsets.map(o => TUNING[o.string] + rootFret + o.offset);
                                  const colors = shape.offsets.map(o => getIntervalHexColor(o.interval || '1'));

                                  const handleCellClick = () => {
                                      const params = new URLSearchParams(window.location.search);
                                      params.set('tab', 'sandbox');
                                      params.set('quality', def.quality);
                                      params.set('rootString', str.toString());
                                      params.set('fretOffset', rootFret.toString());
                                      params.delete('key');
                                      window.history.pushState({}, '', '?' + params.toString());
                                      window.dispatchEvent(new Event('popstate'));
                                  };

                                  return (
                                      <td key={str} className="p-2 text-center align-middle transform scale-90 origin-center">
                                          <div 
                                            onClick={handleCellClick}
                                            className="cursor-pointer border border-transparent hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm rounded-lg p-2 transition-all"
                                            title={`Open ${actualRootName} ${def.quality} (String ${str+1}) in Sandbox`}
                                          >
                                            <SheetMusic 
                                                notes={pitches} 
                                                colors={colors} 
                                                gameMode="SANDBOX" 
                                                useFlats={rootObj.useFlats} 
                                            />
                                          </div>
                                      </td>
                                  );
                              })}
                          </tr>
                        );
                    })}
                </tbody>
            </table>
          </div>
      </main>

      <aside className="w-full lg:w-72 h-full overflow-y-auto bg-slate-50 border-l border-slate-200 flex flex-col shrink-0 p-6">
        <LegendPanel variant="large" />
      </aside>

    </div>
  );
};

export default GalleryMode;