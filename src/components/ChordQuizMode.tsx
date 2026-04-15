import { useEffect } from 'react';
import { useChordQuiz } from '../hooks/useChordQuiz';
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
    
    setInputShape,
    
    
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
    generateQuiz();
  }, [generateQuiz]);

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

        <div className="flex flex-col items-end lg:items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Streak</span>
            <span className={`text-3xl font-mono font-bold leading-none ${streak > 0 ? '(Correct)' : '(Miss)'}`}>
              {streak}
            </span>
        </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 pt-6">
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

          <div className={`flex flex-col items-center justify-center w-64 min-h-[96px] transition-opacity duration-300 ${gameState === 'REVEALED' ? '(Correct)' : '(Miss)'}`}>
            <p className="text-3xl font-black text-slate-800 bg-blue-100 px-4 py-2 rounded shadow-sm">{getNoteNameFromPitchClass(quizData.rootPitchClass, quizData.useFlats)} {quizData.quality}</p>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">{STRING_NAMES[quizData.rootString] || `String ${quizData.rootString}`} Shape</p>
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
            markerClass: `scale-100 ${getIntervalColor((o as any).interval || '1')} ${o.string === quizData.rootString ? '(Correct)' : '(Miss)'} text-white shadow-sm`,
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
