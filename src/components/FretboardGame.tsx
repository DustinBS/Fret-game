// src/components/FretboardGame.tsx
import React from 'react';
import { useFretboardGame, getNoteName } from '../hooks/useFretboardGame';
import SheetMusic from './SheetMusic';

const SAFE_PALETTE = [
  { name: 'Blue',   bg: 'bg-blue-600',   text: 'text-blue-600',   border: 'border-blue-800' },
  { name: 'Orange', bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-700' },
  { name: 'Purple', bg: 'bg-violet-600', text: 'text-violet-600', border: 'border-violet-800' },
  { name: 'Emerald',bg: 'bg-emerald-600',text: 'text-emerald-600',border: 'border-emerald-800' },
  { name: 'Cyan',   bg: 'bg-cyan-600',   text: 'text-cyan-600',   border: 'border-cyan-800' },
  { name: 'Pink',   bg: 'bg-pink-600',   text: 'text-pink-600',   border: 'border-pink-800' },
];

const FretboardGame: React.FC = () => {
  const {
    targetNotes,
    colorIndices,
    noteCount,
    updateNoteCount,
    gameMode,
    toggleMode,
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
    generateNewRound,
    TUNING
  } = useFretboardGame(2);

  const STRING_THICKNESS = [1, 2, 3, 4, 5, 6];

  return (
    <div className="flex flex-col items-center p-8 min-h-screen bg-white text-slate-900 w-full font-sans select-none">

      {/* HEADER HUD */}
      <div className="mb-8 w-full max-w-[1000px] flex flex-col xl:flex-row justify-between items-end border-b-2 border-slate-900 pb-4 gap-4">

        {/* LEFT: Controls & Title */}
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline gap-2">
            <h1 className="text-3xl font-black tracking-tighter uppercase">
              Fretboard<span className="text-slate-400">Focus</span>
            </h1>
            <span className={`text-xs font-bold px-2 py-1 rounded text-white ${gameMode === 'WINDOW' ? 'bg-slate-800' : 'bg-indigo-600'}`}>
              {gameMode === 'WINDOW' ? 'POSITION MODE' : 'OCTAVE MODE'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
             {/* TARGET STEPPER */}
             <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Targets:</span>
                <div className="flex items-center border-2 border-slate-200 rounded-lg overflow-hidden">
                  <button onClick={() => updateNoteCount(-1)} className="px-3 py-1 hover:bg-slate-100 font-bold text-slate-600">-</button>
                  <div className="px-3 py-1 font-mono font-bold text-slate-900 min-w-[2rem] text-center border-x-2 border-slate-100">{noteCount}</div>
                  <button onClick={() => updateNoteCount(1)} className="px-3 py-1 hover:bg-slate-100 font-bold text-slate-600">+</button>
                </div>
             </div>

             {/* MODE TOGGLES */}
             <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
                <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600">
                    <input
                        type="checkbox"
                        checked={isSheetMode}
                        onChange={(e) => setIsSheetMode(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Sheet Music
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600">
                    <input
                        type="checkbox"
                        checked={isHiddenMode}
                        onChange={(e) => setIsHiddenMode(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Hide Guesses
                </label>
             </div>

             <button
               onClick={toggleMode}
               className="text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-2"
             >
               Switch to {gameMode === 'WINDOW' ? 'Octave' : 'Position'} Mode
             </button>
          </div>
        </div>

        {/* CENTER: Target Notes Display */}
        <div className="flex flex-col items-center flex-grow px-4">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Find All</p>
           <div className="flex items-baseline flex-wrap justify-center gap-4">
             {targetNotes.map((val, idx) => {
                const colorIndex = colorIndices[idx % colorIndices.length];
                const color = SAFE_PALETTE[colorIndex];
                const { note, octave } = getNoteName(val);

                return (
                  <div key={idx} className="flex flex-col items-center relative">
                    {/* Visual Dot Indicator */}
                    <div className={`w-3 h-3 rounded-full mb-1 ${color.bg}`} />

                    {isSheetMode ? (
                        /* VEXFLOW RENDERER */
                        <div className="scale-75 origin-top -mb-4">
                          <SheetMusic noteValue={val} gameMode={gameMode} />
                        </div>
                    ) : (
                        /* TEXT RENDERER */
                        <span className={`text-6xl font-black ${color.text} flex items-baseline`}>
                            {note}
                            {gameMode === 'OCTAVE' && (
                            <span className="text-3xl font-bold ml-1 opacity-80">{octave}</span>
                            )}
                        </span>
                    )}
                  </div>
                );
             })}
           </div>
        </div>

        {/* RIGHT: Streak */}
        <div className="text-right whitespace-nowrap">
           <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Streak</div>
           <div className={`text-4xl font-mono font-bold ${streak > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
             {streak}
           </div>
        </div>
      </div>

      {/* FRETBOARD CONTAINER */}
      <div className="relative w-full max-w-[1000px] overflow-x-auto pb-4 custom-scrollbar">

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
        <div className="relative border-y-[12px] border-[#5D4037] bg-slate-100 shadow-sm min-w-[800px]">

          {/* Fret Vertical Lines & Zoning */}
          <div className="absolute inset-0 flex pl-10">
            {Array.from({ length: 15 }).map((_, fret) => {
              const isActive = fret >= windowStart && fret <= windowEnd;
              return (
                <div
                  key={fret}
                  className={`
                    flex-1 border-r border-slate-400 h-full relative
                    ${fret === 0 ? 'border-r-[6px] border-slate-800' : ''}
                    ${isActive ? 'bg-white' : 'bg-slate-100 opacity-60'}
                  `}
                >
                   {/* Inlays */}
                   {[3, 5, 7, 9].includes(fret) && (
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-300 rounded-full" />
                   )}
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
                <div
                  className="absolute w-full bg-slate-900 pointer-events-none"
                  style={{ height: `${STRING_THICKNESS[sIdx]}px` }}
                />

                <div className="flex w-full h-full pl-10">
                  {Array.from({ length: 15 }).map((_, fret) => {
                    const isActiveWindow = fret >= windowStart && fret <= windowEnd;
                    const isClicked = clickedFrets.some(c => c.stringIndex === sIdx && c.fret === fret);
                    const isAnchorPos = gameMode === 'WINDOW' && sIdx === 0 && fret === anchorFret;

                    const pitch = TUNING[sIdx] + fret;

                    // --- MATCHING LOGIC ---
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

                    // --- VISUAL STATE LOGIC ---
                    let markerClass = "scale-0";

                    if (gameState === 'GUESSING') {
                        if (isClicked) {
                            if (isHiddenMode) {
                                // INVISIBLE MODE: Scale 0 means it takes space but is invisible
                                markerClass = "scale-0";
                            } else {
                                // STANDARD MODE: Show selection immediately
                                markerClass = "scale-100 bg-amber-400 border-2 border-slate-900 shadow-sm";
                            }
                        }
                    } else {
                        // REVEALED
                        if (isTarget && isClicked) {
                             markerClass = `scale-100 ${colorTheme?.bg} border-2 ${colorTheme?.border} shadow-md`;
                        }
                        else if (isTarget && !isClicked && isActiveWindow) {
                             markerClass = `scale-75 ${colorTheme?.bg} opacity-50`;
                        }
                        else if (!isTarget && isClicked) {
                             // False Positive
                             markerClass = "scale-75 bg-slate-700 border-2 border-slate-900";
                        }
                    }

                    return (
                      <div
                        key={fret}
                        onClick={() => handleFretClick(sIdx, fret)}
                        className={`
                          flex-1 flex items-center justify-center relative group
                          ${isActiveWindow ? 'cursor-pointer hover:bg-slate-900/5' : 'cursor-not-allowed'}
                        `}
                      >
                         {isAnchorPos && (
                           <div className="absolute w-3 h-3 bg-red-600 rounded-sm z-0 opacity-80" />
                         )}
                         <div className={`w-6 h-6 rounded-full transition-all duration-200 z-10 flex items-center justify-center ${markerClass}`}>
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center gap-4">
        <p className="text-slate-400 text-sm font-medium">
          {gameState === 'GUESSING'
            ? `Locate all target notes${gameMode === 'WINDOW' ? ' within the bright window' : ''}.`
            : `Round Complete.`}
        </p>
        {gameState === 'GUESSING' ? (
          <button onClick={submitGuess} className="px-12 py-3 bg-slate-900 text-white text-lg font-bold tracking-wide hover:bg-slate-700 transition-colors active:transform active:scale-95 shadow-xl rounded-sm">
            CHECK ANSWER
          </button>
        ) : (
          <button onClick={generateNewRound} className="px-12 py-3 bg-white text-slate-900 border-2 border-slate-900 text-lg font-bold tracking-wide hover:bg-slate-50 transition-colors active:transform active:scale-95 shadow-xl rounded-sm flex items-center gap-2">
            NEXT ROUND <span>→</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default FretboardGame;