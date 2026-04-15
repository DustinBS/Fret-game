import { useEffect } from 'react';
import { useChordQuiz } from '../hooks/useChordQuiz';
import { getNoteNameFromPitchClass } from '../utils/musicTheory';
import { Fretboard } from './Fretboard';
import SheetMusic from './SheetMusic';
import { CHORD_DICTIONARY } from '../utils/chordLibrary';

export default function ChordQuizMode() {
  const {
    quizData,
    gameState,
    streak,
    inputRoot,
    setInputRoot,
    inputQuality,
    setInputQuality,
    generateQuiz,
    submitGuess
  } = useChordQuiz();

  useEffect(() => {
    generateQuiz();
  }, [generateQuiz]);

  if (!quizData) return null;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white text-slate-900 font-sans select-none">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-72 bg-slate-50 border-r border-slate-200 flex flex-col p-6 gap-8 shrink-0">
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
            <span className={`text-3xl font-mono font-bold leading-none ${streak > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
              {streak}
            </span>
        </div>

        {gameState === 'PLAYING' && (
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
                {CHORD_DICTIONARY.map(d => (
                  <option key={d.quality} value={d.quality} />
                ))}
              </datalist>
            </div>

            <button 
              onClick={submitGuess}
              className="mt-4 w-full bg-blue-600 text-white font-bold uppercase tracking-wider py-3 rounded hover:bg-blue-700 transition"
            >
              Submit
            </button>
          </div>
        )}
        
        {gameState === 'REVEALED' && (
          <div className="flex flex-col gap-4 border-t border-slate-200 pt-6">
            <button 
              onClick={generateQuiz}
              className="w-full bg-emerald-600 text-white font-bold uppercase tracking-wider py-3 rounded hover:bg-emerald-700 transition"
            >
              Next Quiz
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col items-center justify-center p-4 lg:p-10 gap-8 min-w-0">
     
        <div className="flex justify-center scale-110 lg:scale-125 origin-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <SheetMusic 
            notes={quizData.activePitches} 
            colors={quizData.activePitches.map(() => '#333')} 
            gameMode="SANDBOX" 
            useFlats={quizData.useFlats} 
          />
        </div>

        {gameState === 'REVEALED' && (
          <div className="flex flex-col items-center space-y-8 w-full">
            <div className="text-center">
              <p className="text-2xl"><strong>Answer:</strong> {getNoteNameFromPitchClass(quizData.rootPitchClass, quizData.useFlats)} {quizData.quality}</p>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">String {quizData.rootString} Shape</p>
            </div>

            <div className="w-full overflow-hidden">
               <Fretboard 
                 windowStart={Math.max(0, quizData.rootFret - 2)}
                 windowEnd={quizData.rootFret + 4}
                 markers={quizData.shape.offsets.map(o => ({
                   stringIndex: o.string,
                   fret: quizData.rootFret + o.offset,
                   isAnchor: o.string === quizData.rootString,
                   markerClass: o.string === quizData.rootString ? "scale-100 bg-blue-600 border-2 border-slate-900" : "scale-100 bg-slate-200 text-slate-800"
                 }))}
                 onFretClick={() => {}}
               />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}