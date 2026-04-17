import { useEffect } from 'react';
import { QUIZ_ROOT_STRING_OPTIONS, useChordQuiz } from '../hooks/useChordQuiz';
import { getNoteNameFromPitchClass, STRING_NAMES, getIntervalColor, getIntervalHexColor } from '../utils/musicTheory';
import { Fretboard } from './Fretboard';
import SheetMusic from './SheetMusic';
import { CHORD_DICTIONARY } from '../utils/chordLibrary';
import { useHistory, HistoryPanel } from './History';
import { LegendPanel } from './LegendPanel';

export default function ChordQuizMode() {
  const {
    quizData,
    setQuizData,
    gameState,
    setGameState,
    streak,
    inputRoot,
    setInputRoot,
    inputQuality,
    setInputQuality,
    inputShape,
    setInputShape,
    enabledRootStrings,
    rootStringConstraintLabel,
    toggleRootStringConstraint,
    
    
    generateQuiz,
    submitGuess
  } = useChordQuiz();

  const { history, addHistory, clearHistory } = useHistory<any>('chordQuizHistory');

  const handleSubmit = () => {
    const wasCorrect = submitGuess();
    if (quizData && gameState === 'PLAYING') {
      const actualName = `${getNoteNameFromPitchClass(quizData.rootPitchClass, quizData.useFlats)} ${quizData.quality}`;
      const shapeName = `(Str ${quizData.rootString + 1})`;
      addHistory(`${actualName} ${shapeName} - ${wasCorrect ? '(Correct)' : '(Miss)'}`);
    }
  };

  useEffect(() => {
    if (!quizData) {
      generateQuiz();
    }
  }, [quizData, generateQuiz]);

  if (!quizData) return null;

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-white text-slate-900 font-sans select-none">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-72 h-full overflow-y-auto bg-slate-50 border-r border-slate-200 flex flex-col p-6 gap-8 shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">
            Chord<span className="text-slate-400">Quiz</span>
          </h1>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Test Your Knowledge
          </div>
        </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 pt-6">
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 block">Root String Constraint</label>
              <div className="grid grid-cols-3 gap-2">
                {QUIZ_ROOT_STRING_OPTIONS.map((rootString) => {
                  const checked = enabledRootStrings.includes(rootString);

                  return (
                    <label
                      key={rootString}
                      className={`text-[11px] font-bold border rounded px-2 py-2 flex items-center justify-center gap-1 select-none ${checked ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100 cursor-pointer'}`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleRootStringConstraint(rootString)}
                      />
                      <span>Str {rootString + 1}</span>
                    </label>
                  );
                })}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">
                Current: {rootStringConstraintLabel}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 block">Root Note</label>
              <input 
                type="text" 
                className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none"
                placeholder="e.g. C, Db, D..."
                value={inputRoot}
                onChange={e => setInputRoot(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 block">Chord Quality</label>
              <input 
                type="text" 
                list="qualities"
                className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none"
                placeholder="e.g. maj7, min..."
                value={inputQuality}
                onChange={e => setInputQuality(e.target.value)}
              />
              <datalist id="qualities">
                {CHORD_DICTIONARY.map((d, index) => (
                  <option key={index} value={d.quality} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 block">String Shape</label>
              <select
                value={inputShape}
                onChange={e => setInputShape(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none"
              >
                 <option value="">Select Root String...</option>
                 <option value="5">String 6 (E)</option>
                 <option value="4">String 5 (A)</option>
                 <option value="3">String 4 (D)</option>
              </select>
            </div>

            {gameState === 'PLAYING' ? (
              <button 
                onClick={handleSubmit}
                className="mt-4 w-full bg-blue-600 text-white font-bold uppercase tracking-wider py-3 rounded hover:bg-blue-700 transition"
              >
                Submit
              </button>
            ) : (
              <button 
                onClick={generateQuiz}
                className="mt-4 w-full bg-emerald-600 text-white font-bold uppercase tracking-wider py-3 rounded hover:bg-emerald-700 transition"
              >
                Next Quiz
              </button>
            )}
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

      <main className="flex-1 h-full overflow-y-auto flex flex-col items-center justify-center py-1 p-4 lg:p-10 lg:py-1 gap-1 min-w-0">
     
        <div className="flex flex-row items-center justify-center min-h-40 w-full gap-8">
          <div className="flex justify-center scale-110 lg:scale-125 origin-center min-w-[200px]">
            <SheetMusic 
              notes={quizData.activePitches} 
              colors={gameState === 'REVEALED' ? quizData.shape.offsets.map((o: any) => getIntervalHexColor(o.interval || '1')) : quizData.activePitches.map(() => '#333')} 
              gameMode="SANDBOX" 
              useFlats={quizData.useFlats} 
            />
          </div>

          <div className={`flex flex-col items-center justify-center w-64 min-h-[96px] transition-opacity duration-300 ${gameState === 'REVEALED' ? 'opacity-100' : 'opacity-70'}`}>
            <p className="text-3xl font-black text-slate-800 bg-blue-100 px-4 py-2 rounded shadow-sm">
              {getNoteNameFromPitchClass(quizData.rootPitchClass, quizData.useFlats)} {gameState === 'REVEALED' ? quizData.quality : '—'}
            </p>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">
              {gameState === 'REVEALED' ? (STRING_NAMES[quizData.rootString] || `String ${quizData.rootString}`) : 'String ?'} Shape
            </p>
          </div>
        </div>

        <Fretboard
          numFrets={25}
          windowStart={Math.max(0, quizData.rootFret - 2)}
          windowEnd={quizData.rootFret + 4}
          markers={gameState === 'REVEALED' ? quizData.shape.offsets.map((o: any) => ({
            stringIndex: o.string,
            fret: quizData.rootFret + o.offset,
            isAnchor: o.string === quizData.rootString,
            markerClass: `scale-100 ${getIntervalColor((o as any).interval || '1')} ${o.string === quizData.rootString ? 'ring-2 ring-slate-900' : ''} text-white shadow-sm`,
            label: (o as any).interval || '1'
          })) : []}
          onFretClick={() => {}}
        />

        {/* Spacer to match Trainer flex distribution */}
        <div className="mt-6 pointer-events-none opacity-0 select-none py-4 text-xl">_</div>

      </main>

      {/* RIGHT SIDEBAR - HISTORY */}
      <aside className="w-full lg:w-72 h-full overflow-y-auto bg-slate-50 border-l border-slate-200 flex flex-col shrink-0 p-6">
        <HistoryPanel 
            history={history} 
            onClear={clearHistory} 
            onRestore={(state) => {
                setQuizData(state.quizData);
                setInputRoot(state.inputRoot);
                setInputQuality(state.inputQuality);
                setInputShape(state.inputShape);
                setGameState('REVEALED');
            }} 
        />
        <LegendPanel />
      </aside>
    </div>
  );
}
