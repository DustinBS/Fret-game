// src/components/FretboardGame.tsx
import React from 'react';
import { useFretboardGame } from '../hooks/useFretboardGame';
import { getNoteName } from '../utils/musicTheory';
import SheetMusic from './SheetMusic';
import { Fretboard, type FretMarker } from './Fretboard';
import { useHistory, HistoryPanel } from './History';

// Trainer palette: 6 high-contrast, high-saturation colors for trainer gamemode
const SAFE_PALETTE = [
  { name: 'p1', bg: 'bg-[#ef4444]', text: 'text-[#ef4444]', border: 'border-[#ef4444]', hex: '#ef4444' }, // red
  { name: 'p2', bg: 'bg-[#f97316]', text: 'text-[#f97316]', border: 'border-[#f97316]', hex: '#f97316' }, // orange
  { name: 'p3', bg: 'bg-[#f59e0b]', text: 'text-[#f59e0b]', border: 'border-[#f59e0b]', hex: '#f59e0b' }, // amber
  { name: 'p4', bg: 'bg-[#10b981]', text: 'text-[#10b981]', border: 'border-[#10b981]', hex: '#10b981' }, // green
  { name: 'p5', bg: 'bg-[#3b82f6]', text: 'text-[#3b82f6]', border: 'border-[#3b82f6]', hex: '#3b82f6' }, // blue
  { name: 'p6', bg: 'bg-[#8b5cf6]', text: 'text-[#8b5cf6]', border: 'border-[#8b5cf6]', hex: '#8b5cf6' }, // purple
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
    setClickedFrets,
    generateNewRound,
    TUNING
  } = useFretboardGame(3); // CHANGED: Default to 3 notes

  const { history, addHistory, clearHistory } = useHistory<any>('trainerHistory');

  const handleCheckAnswer = () => {
    const wasCorrect = submitGuess();
    const targetStr = targetNotes.map((n) => getNoteName(n, roundUseFlats).note).join(', ');
    addHistory(`${getGameModeName(gameMode)}: ${targetStr} - ${wasCorrect ? '(Correct)' : '(Miss)'}`, clickedFrets);
  };


  const currentRoundColors = targetNotes.map((_, idx) => {
    const colorIdx = colorIndices[idx % colorIndices.length];
    return SAFE_PALETTE[colorIdx].hex;
  });

  const getGameModeName = (mode: string) => {
    if (mode === 'WINDOW') return 'Position';
    if (mode === 'OCTAVE') return 'Octave';
    return '';
  }

  const markers: FretMarker[] = [];
  for (let sIdx = 0; sIdx < 6; sIdx++) {
    for (let fret = 0; fret < 15; fret++) {
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

      if (markerClass !== "scale-0" || isAnchorPos) {
        markers.push({
          stringIndex: sIdx,
          fret,
          markerClass: markerClass !== "scale-0" ? markerClass : undefined,
          isAnchor: isAnchorPos
        });
      }
    }
  }

  const getGhostClass = (_sIdx: number, _fret: number) => {
    if (gameState === 'GUESSING' && !isHiddenMode) {
        return "scale-0 group-hover:scale-75 group-hover:bg-amber-400/50 transition-all";
    }
    return "";
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-white text-slate-900 font-sans select-none">

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-72 h-full overflow-y-auto bg-slate-50 border-r border-slate-200 flex flex-col p-6 gap-8 shrink-0">

        {/* Title */}
        <div>
            <div>
                <h1 className="text-2xl font-black tracking-tighter uppercase">
                  Fret<span className="text-slate-400">Focus</span>
                </h1>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Sight Reading Trainer
                </div>
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
                    <span>Switch to {
                      gameMode === 'WINDOW' ? getGameModeName('OCTAVE') : getGameModeName('WINDOW')
                    } Mode</span>
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

        <div className="mt-auto pt-4 border-t border-slate-200">
            <div className="inline-flex flex-col border border-slate-200 rounded bg-white/80 px-2 py-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Streak</span>
                <span className={`text-lg font-mono font-bold leading-none ${streak > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {streak}
                </span>
            </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-full overflow-y-auto flex flex-col items-center justify-center py-1 p-4 lg:p-10 lg:py-1 gap-1 min-w-0">

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

        {/* FRETBOARD COMPONENT */}
        <Fretboard
            markers={markers}
            windowStart={windowStart}
            windowEnd={windowEnd}
            onFretClick={handleFretClick}
            getGhostClass={getGhostClass}
        />

        {/* Action Button */}
        <div className="mt-6">
            {gameState === 'GUESSING' ? (
            <button onClick={handleCheckAnswer} className="px-16 py-4 bg-slate-900 text-white text-xl font-bold tracking-wide hover:bg-slate-700 transition-colors active:transform active:scale-95 shadow-xl rounded-sm border-2 border-transparent">CHECK ANSWER</button>
            ) : (
            <button onClick={generateNewRound} className="px-16 py-4 bg-white text-slate-900 border-2 border-slate-900 text-xl font-bold tracking-wide hover:bg-slate-50 transition-colors active:transform active:scale-95 shadow-xl rounded-sm flex items-center gap-2">NEXT ROUND <span>→</span></button>
            )}
        </div>

      </main>

      {/* RIGHT SIDEBAR - HISTORY */}
      <aside className="w-full lg:w-72 h-full overflow-y-auto bg-slate-50 border-l border-slate-200 flex flex-col shrink-0 p-6">
        <HistoryPanel history={history} onClear={clearHistory} onRestore={(state) => setClickedFrets(state)} />
      </aside>
    </div>
  );
};

const ToggleRow = ({ label, checked, onChange, disabled }: { label: string, checked: boolean, onChange: (v: boolean) => void, disabled?: boolean }) => (
    <label className={`flex items-center justify-between group py-2 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
        <span className="text-xs font-bold uppercase text-slate-500 group-hover:text-slate-800 transition-colors">{label}</span>
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled} />
            <div className={`w-10 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
        </div>
    </label>
);

export default FretboardGame;