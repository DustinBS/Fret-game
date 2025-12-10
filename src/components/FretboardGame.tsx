// src/components/FretboardGame.tsx
import React from 'react';
import { useFretboardGame, getNoteName } from '../hooks/useFretboardGame';
import SheetMusic from './SheetMusic';

const SAFE_PALETTE = [
  { name: 'Blue',   bg: 'bg-blue-600',   text: 'text-blue-600',   border: 'border-blue-800', hex: '#2563eb' },
  { name: 'Orange', bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-700', hex: '#f97316' },
  { name: 'Purple', bg: 'bg-violet-600', text: 'text-violet-600', border: 'border-violet-800', hex: '#7c3aed' },
  { name: 'Emerald',bg: 'bg-emerald-600',text: 'text-emerald-600',border: 'border-emerald-800', hex: '#059669' },
  { name: 'Cyan',   bg: 'bg-cyan-600',   text: 'text-cyan-600',   border: 'border-cyan-800', hex: '#0891b2' },
  { name: 'Pink',   bg: 'bg-pink-600',   text: 'text-pink-600',   border: 'border-pink-800', hex: '#db2777' },
];

const FretboardGame: React.FC = () => {
  const {
    targetNotes,
    colorIndices,
    roundUseFlats,
    noteCount,
    updateNoteCount,
    gameMode,
    toggleGameMode,
    accidentalMode,
    cycleAccidentalMode,
    isSheetMode,
    setIsSheetMode,
    isHiddenMode,
    setIsHiddenMode,
    anchorFret,
    windowStart,
    windowEnd,
    clickedFrets,
    gameState,
    streak,
    handleFretClick,
    submitGuess,
    clearGuesses, // IMPORTED
    generateNewRound,
    TUNING
  } = useFretboardGame(3); // CHANGED: Default to 3 notes

  const STRING_THICKNESS = [1, 2, 3, 4, 5, 6];

  const currentRoundColors = targetNotes.map((_, idx) => {
    const colorIdx = colorIndices[idx % colorIndices.length];
    return SAFE_PALETTE[colorIdx].hex;
  });

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white text-slate-900 font-sans select-none">

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-72 bg-slate-50 border-r border-slate-200 flex flex-col p-6 gap-8 shrink-0">

        {/* Title & Streak */}
        <div className="flex flex-row lg:flex-col justify-between items-baseline lg:items-start gap-4">
            <div>
                <h1 className="text-2xl font-black tracking-tighter uppercase">
                  Fret<span className="text-slate-400">Focus</span>
                </h1>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Sight Reading Trainer
                </div>
            </div>

            <div className="flex flex-col items-end lg:items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Streak</span>
                <span className={`text-3xl font-mono font-bold leading-none ${streak > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                  {streak}
                </span>
            </div>
        </div>

        {/* Controls Container */}
        <div className="flex flex-col gap-6">

            {/* Note Count */}
            <div className="space-y-1">
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Note Count</span>
                <div className="flex items-center border border-slate-300 rounded bg-white w-full max-w-[140px]">
                  <button onClick={() => updateNoteCount(-1)} className="px-4 py-2 hover:bg-slate-100 font-bold text-slate-600 border-r border-slate-100">-</button>
                  <div className="flex-1 text-center font-mono font-bold text-slate-900">{noteCount}</div>
                  <button onClick={() => updateNoteCount(1)} className="px-4 py-2 hover:bg-slate-100 font-bold text-slate-600 border-l border-slate-100">+</button>
                </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
                <ToggleRow label="Sheet Music" checked={isSheetMode} onChange={setIsSheetMode} />
                <ToggleRow label="Hide Guesses" checked={isHiddenMode} onChange={setIsHiddenMode} />
            </div>

            {/* Actions / Modes */}
            <div className="flex flex-col gap-3 pt-2 border-t border-slate-200">

                <button
                    onClick={clearGuesses}
                    className="text-left text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 py-2 px-3 -mx-3 rounded transition-colors uppercase tracking-wider flex items-center justify-between group"
                >
                    <span>Clear Selection</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">×</span>
                </button>

                <button
                    onClick={toggleGameMode}
                    className="text-left text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 py-2 px-3 -mx-3 rounded transition-colors uppercase tracking-wider flex items-center justify-between group"
                >
                    <span>Switch to {gameMode === 'WINDOW' ? 'Octave' : 'Position'} Mode</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </button>

                <button
                    onClick={cycleAccidentalMode}
                    className="text-left text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 py-2 px-3 -mx-3 rounded transition-colors uppercase tracking-wider flex items-center justify-between group"
                >
                    <span>Accidentals: <span className="text-slate-900">{accidentalMode === 'BOTH' ? 'Mixed' : accidentalMode}</span></span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </button>

            </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col items-center justify-center py-1 p-4 lg:p-10 lg:py-1 gap-1 min-w-0">

        {/* TARGET DISPLAY */}
        <div className="flex flex-col items-center min-h-40 justify-center w-full">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Find All</p>

           {isSheetMode ? (
              <div className="flex justify-center scale-110 lg:scale-125 origin-center">
                 <SheetMusic
                   notes={targetNotes}
                   colors={currentRoundColors}
                   gameMode={gameMode}
                   useFlats={roundUseFlats}
                 />
              </div>
           ) : (
              <div className="flex items-baseline flex-wrap justify-center gap-8">
                {targetNotes.map((val, idx) => {
                    const colorIndex = colorIndices[idx % colorIndices.length];
                    const color = SAFE_PALETTE[colorIndex];
                    const { note, octave } = getNoteName(val, roundUseFlats);

                    return (
                      <div key={idx} className="flex flex-col items-center relative">
                        <div className={`w-3 h-3 rounded-full mb-3 ${color.bg}`} />
                        <span className={`text-7xl font-black ${color.text} flex items-baseline`}>
                            {note}
                            {gameMode === 'OCTAVE' && (
                                <span className="text-4xl font-bold ml-1 opacity-60">{octave}</span>
                            )}
                        </span>
                      </div>
                    );
                })}
              </div>
           )}
        </div>

        {/* FRETBOARD SCROLL WRAPPER */}
        {/* Added wrapper with max-width to ensure it doesn't overflow improperly */}
        <div className="relative w-full max-w-[1000px] overflow-x-auto pb-4 custom-scrollbar px-4">

            {/* Fret Numbers */}
            <div className="flex pl-10 mb-1 min-w-[800px]">
            {Array.from({ length: 15 }).map((_, i) => (
                <div
                key={i}
                className={`flex-1 text-center text-xs font-mono transition-colors duration-300
                    ${gameMode === 'WINDOW' && i === anchorFret ? 'text-red-600 font-bold' : 'text-slate-400'}`}
                >
                {i}
                </div>
            ))}
            </div>

            {/* The Board */}
            <div className="relative border-y-12 border-[#5D4037] bg-slate-100 shadow-sm min-w-[800px]">
            {/* Fret Lines */}
            <div className="absolute inset-0 flex pl-10">
                {Array.from({ length: 15 }).map((_, fret) => {
                const isActive = fret >= windowStart && fret <= windowEnd;
                return (
                    <div key={fret} className={`flex-1 border-r border-slate-400 h-full relative ${fret === 0 ? 'border-r-[6px] border-slate-800' : ''} ${isActive ? 'bg-white' : 'bg-slate-100 opacity-60'}`}>
                    {[3, 5, 7, 9].includes(fret) && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-300 rounded-full" />}
                    {fret === 12 && (
                        <>
                        <div className="absolute top-[33%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-300 rounded-full" />
                        <div className="absolute top-[66%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-300 rounded-full" />
                        </>
                    )}
                    </div>
                );
                })}
            </div>

            {/* Strings */}
            <div className="relative flex flex-col z-10 py-4">
                {[0, 1, 2, 3, 4, 5].map((sIdx) => (
                <div key={sIdx} className="relative h-12 flex items-center">
                    <div className="absolute w-full bg-slate-900 pointer-events-none" style={{ height: `${STRING_THICKNESS[sIdx]}px` }} />
                    <div className="flex w-full h-full pl-10">
                    {Array.from({ length: 15 }).map((_, fret) => {
                        const isActiveWindow = fret >= windowStart && fret <= windowEnd;
                        const isClicked = clickedFrets.some(c => c.stringIndex === sIdx && c.fret === fret);
                        const isAnchorPos = gameMode === 'WINDOW' && sIdx === 0 && fret === anchorFret;
                        const pitch = TUNING[sIdx] + fret;

                        let isTarget = false;
                        let colorIndex = 0;

                        if (gameMode === 'WINDOW') {
                            const targetIdx = targetNotes.indexOf(pitch % 12);
                            isTarget = targetIdx !== -1;
                            if (isTarget) colorIndex = colorIndices[targetIdx % colorIndices.length];
                        } else {
                            const targetIdx = targetNotes.indexOf(pitch);
                            isTarget = targetIdx !== -1;
                            if (isTarget) colorIndex = colorIndices[targetIdx % colorIndices.length];
                        }

                        const colorTheme = isTarget ? SAFE_PALETTE[colorIndex] : null;
                        let markerClass = "scale-0";

                        if (gameState === 'GUESSING') {
                            if (isClicked) {
                                markerClass = isHiddenMode ? "scale-0" : "scale-100 bg-amber-400 border-2 border-slate-900 shadow-sm";
                            }
                        } else {
                            if (isTarget && isClicked) markerClass = `scale-100 ${colorTheme?.bg} border-2 ${colorTheme?.border} shadow-md`;
                            else if (isTarget && !isClicked && isActiveWindow) markerClass = `scale-75 ${colorTheme?.bg} opacity-50`;
                            else if (!isTarget && isClicked) markerClass = "scale-75 bg-slate-700 border-2 border-slate-900";
                        }

                        return (
                        <div key={fret} onClick={() => handleFretClick(sIdx, fret)} className={`flex-1 flex items-center justify-center relative group ${isActiveWindow ? 'cursor-pointer hover:bg-slate-900/5' : 'cursor-not-allowed'}`}>
                            {isAnchorPos && <div className="absolute w-3 h-3 bg-red-600 rounded-sm z-0 opacity-80" />}
                            <div className={`w-6 h-6 rounded-full transition-all duration-200 z-10 flex items-center justify-center ${markerClass}`}></div>
                        </div>
                        );
                    })}
                    </div>
                </div>
                ))}
            </div>
            </div>
        </div>

        {/* Action Button */}
        <div className="mt-6">
            {gameState === 'GUESSING' ? (
            <button onClick={submitGuess} className="px-16 py-4 bg-slate-900 text-white text-xl font-bold tracking-wide hover:bg-slate-700 transition-colors active:transform active:scale-95 shadow-xl rounded-sm border-2 border-transparent">CHECK ANSWER</button>
            ) : (
            <button onClick={generateNewRound} className="px-16 py-4 bg-white text-slate-900 border-2 border-slate-900 text-xl font-bold tracking-wide hover:bg-slate-50 transition-colors active:transform active:scale-95 shadow-xl rounded-sm flex items-center gap-2">NEXT ROUND <span>→</span></button>
            )}
        </div>

      </main>
    </div>
  );
};

const ToggleRow = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
    <label className="flex items-center justify-between cursor-pointer group py-2">
        <span className="text-xs font-bold uppercase text-slate-500 group-hover:text-slate-800 transition-colors">{label}</span>
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
            <div className={`w-10 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
        </div>
    </label>
);

export default FretboardGame;