import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QUIZ_KEY_CONSTRAINT_ALL, QUIZ_ROOT_STRING_OPTIONS, type QuizRootString, useChordQuiz } from '../hooks/useChordQuiz';
import {
  getIntervalColor,
  getIntervalHexColor,
  getKeySignatureInfo,
  getNoteNameFromPitchClass,
  keySignatureUsesFlats,
  KEY_CONSTRAINT_OPTIONS,
} from '../utils/musicTheory';
import { Fretboard } from './Fretboard';
import SheetMusic from './SheetMusic';
import { CHORD_DICTIONARY, type ChordShape } from '../utils/chordLibrary';
import { getCorrectMissHistoryLabelClass, type HistoryItem, useHistory, HistoryPanel } from './History';
import { LegendPanel } from './LegendPanel';
import { buildRootVoicingDisplayParts } from '../utils/rootVoicingLabel';

const SHAPE_INPUT_TO_ROOT_STRING: Record<string, string> = {
  '6': '5',
  '5': '4',
  '4': '3',
};

const ROOT_STRING_TO_SHAPE_INPUT: Record<string, string> = {
  '5': '6',
  '4': '5',
  '3': '4',
};

function normalizeShapeInput(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed === 'any' || trimmed === 'all') {
    return '';
  }

  const enteredDigit = trimmed.match(/[1-6]/)?.[0];
  if (enteredDigit && SHAPE_INPUT_TO_ROOT_STRING[enteredDigit]) {
    return SHAPE_INPUT_TO_ROOT_STRING[enteredDigit];
  }

  if (trimmed in ROOT_STRING_TO_SHAPE_INPUT) {
    return trimmed;
  }

  return '';
}

function toShapeInputDisplayValue(value: string): string {
  return ROOT_STRING_TO_SHAPE_INPUT[value] ?? '';
}

interface QuizHistoryState {
  quizData: {
    rootPitchClass: number;
    quality: string;
    rootVoicing: string;
    shape: ChordShape;
    rootString: number;
    rootFret: number;
    activePitches: number[];
    useFlats: boolean;
  };
  gameState: 'PLAYING' | 'REVEALED';
  inputRoot: string;
  inputQuality: string;
  inputShape: string;
  inputVoicing: string;
  enabledRootStrings: QuizRootString[];
  keyConstraint: string;
  showRootHint: boolean;
  showVoicingHint: boolean;
  streak: number;
  wasCorrect: boolean;
}

function isQuizHistoryState(value: unknown): value is QuizHistoryState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<QuizHistoryState>;
  if (!candidate.quizData || typeof candidate.quizData !== 'object') {
    return false;
  }

  const quizData = candidate.quizData as Partial<QuizHistoryState['quizData']>;
  return Number.isFinite(quizData.rootPitchClass)
    && typeof quizData.quality === 'string'
    && typeof quizData.rootVoicing === 'string'
    && typeof quizData.rootString === 'number'
    && typeof quizData.rootFret === 'number'
    && Array.isArray(quizData.activePitches)
    && typeof quizData.useFlats === 'boolean'
    && (candidate.gameState === 'PLAYING' || candidate.gameState === 'REVEALED')
    && typeof candidate.inputRoot === 'string'
    && typeof candidate.inputQuality === 'string'
    && typeof candidate.inputShape === 'string'
    && typeof candidate.inputVoicing === 'string'
    && Array.isArray(candidate.enabledRootStrings)
    && typeof candidate.keyConstraint === 'string'
    && typeof candidate.showRootHint === 'boolean'
    && typeof candidate.showVoicingHint === 'boolean'
    && Number.isFinite(candidate.streak)
    && typeof candidate.wasCorrect === 'boolean';
}

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
    inputVoicing,
    setInputVoicing,
    setStreak,
    enabledRootStrings,
    setEnabledRootStrings,
    rootStringConstraintLabel,
    toggleRootStringConstraint,
    keyConstraint,
    setKeyConstraint,
    showRootHint,
    setShowRootHint,
    showVoicingHint,
    setShowVoicingHint,
    onlyDiatonicChords,
    setOnlyDiatonicChords,
    generateQuiz,
    submitGuess
  } = useChordQuiz();

  const { history, addHistory, clearHistory } = useHistory<QuizHistoryState>('chordQuizHistory');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<boolean | null>(null);
  const rootInputRef = useRef<HTMLInputElement>(null);

  const keySignatureInfo = useMemo(() => {
    if (keyConstraint === QUIZ_KEY_CONSTRAINT_ALL) {
      return null;
    }

    return getKeySignatureInfo(keyConstraint);
  }, [keyConstraint]);

  const shapeInputDisplayValue = useMemo(() => toShapeInputDisplayValue(inputShape), [inputShape]);
  const hasKeyConstraint = keyConstraint !== QUIZ_KEY_CONSTRAINT_ALL;
  const isKeyRemapped = Boolean(keySignatureInfo && keySignatureInfo.keyName !== keySignatureInfo.renderableKeyName);
  const sheetUseFlats = hasKeyConstraint && keySignatureInfo
    ? keySignatureUsesFlats(keySignatureInfo.renderableKeyName)
    : quizData?.useFlats ?? false;

  const focusRootInput = () => {
    requestAnimationFrame(() => {
      rootInputRef.current?.focus();
    });
  };

  const handleSubmit = useCallback(() => {
    if (gameState !== 'PLAYING') {
      return;
    }

    const wasCorrect = submitGuess();
    setLastSubmissionResult(wasCorrect);

    if (quizData && gameState === 'PLAYING') {
      const actualName = `${getNoteNameFromPitchClass(quizData.rootPitchClass, quizData.useFlats)} ${quizData.quality}`;
      const voicingLabel = buildRootVoicingDisplayParts(quizData.rootString, quizData.rootVoicing).plainLabel;
      addHistory(`${actualName} (${voicingLabel})`, {
        quizData,
        gameState: 'REVEALED',
        inputRoot,
        inputQuality,
        inputShape,
        inputVoicing,
        enabledRootStrings,
        keyConstraint,
        showRootHint,
        showVoicingHint,
        streak: wasCorrect ? streak + 1 : 0,
        wasCorrect,
      });
    }
  }, [
    gameState,
    submitGuess,
    quizData,
    inputRoot,
    inputQuality,
    inputShape,
    inputVoicing,
    enabledRootStrings,
    keyConstraint,
    showRootHint,
    showVoicingHint,
    streak,
    addHistory,
  ]);

  const handleGenerateQuiz = useCallback(() => {
    setLastSubmissionResult(null);
    setGameState('PLAYING');
    generateQuiz();
    focusRootInput();
  }, [generateQuiz, setGameState]);

  useEffect(() => {
    if (!quizData) {
      generateQuiz();
    }
  }, [quizData, generateQuiz]);

  useEffect(() => {
    if (!isConfigOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsConfigOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isConfigOpen]);

  useEffect(() => {
    const handleGlobalEnter = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat || event.defaultPrevented || event.isComposing) {
        return;
      }

      if (isConfigOpen) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      event.preventDefault();
      if (gameState === 'PLAYING') {
        handleSubmit();
      } else {
        handleGenerateQuiz();
      }
    };

    window.addEventListener('keydown', handleGlobalEnter);
    return () => window.removeEventListener('keydown', handleGlobalEnter);
  }, [gameState, isConfigOpen, handleGenerateQuiz, handleSubmit]);

  if (!quizData) return null;

  const shouldShowRootHint = gameState === 'REVEALED' || showRootHint;
  const rootLabel = shouldShowRootHint
    ? getNoteNameFromPitchClass(quizData.rootPitchClass, quizData.useFlats)
    : '—';
  const nextQuizButtonClass = lastSubmissionResult === false
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-emerald-600 hover:bg-emerald-700';
  const revealShapeParts = buildRootVoicingDisplayParts(quizData.rootString, quizData.rootVoicing);

  const renderQuizHistoryLabel = (item: HistoryItem<QuizHistoryState>) => {
    if (!isQuizHistoryState(item.state)) {
      return item.label;
    }

    const { quizData: historyQuizData } = item.state;
    const actualName = `${getNoteNameFromPitchClass(historyQuizData.rootPitchClass, historyQuizData.useFlats)} ${historyQuizData.quality}`;
    const voicingParts = buildRootVoicingDisplayParts(historyQuizData.rootString, historyQuizData.rootVoicing);

    return (
      <>
        {actualName} ({voicingParts.baseLabel}
        {historyQuizData.rootVoicing ? <span className="ml-1 text-[10px] font-extrabold align-baseline">{historyQuizData.rootVoicing}</span> : null}
        )
      </>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-white text-slate-900 font-sans">
      
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
              <button
                type="button"
                onClick={() => setIsConfigOpen(true)}
                className="w-full text-left text-xs font-bold uppercase tracking-wider border border-slate-300 rounded px-3 py-3 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                Quiz Config
              </button>
              <div className="text-[10px] font-bold tracking-wider text-slate-400 mt-2">
                Key:{' '}
                {!hasKeyConstraint ? (
                  <span>Any</span>
                ) : isKeyRemapped && keySignatureInfo ? (
                  <>
                    <span className="line-through">{keySignatureInfo.keyName} major</span>{' '}
                    <span className="text-blue-700">{keySignatureInfo.renderableKeyName} major</span>
                  </>
                ) : (
                  <span className="text-blue-700">{keySignatureInfo?.renderableKeyName} major</span>
                )}
              </div>
              <div className="text-[10px] font-bold tracking-wider text-slate-400 mt-1">
                Chords: {onlyDiatonicChords ? 'Diatonic only' : 'Full library'}
              </div>
              <div className="text-[10px] font-bold tracking-wider text-slate-400 mt-1">
                Roots: {rootStringConstraintLabel}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="quiz-root-note" className="text-xs font-bold uppercase text-slate-500 tracking-wider block">Root Note</label>
                <button
                  type="button"
                  onClick={() => setShowRootHint((prev) => !prev)}
                  className={`text-[11px] font-bold uppercase tracking-wider border rounded px-2 py-1 transition-colors ${showRootHint ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'}`}
                >
                  Hint: {showRootHint ? 'On' : 'Off'}
                </button>
              </div>
              <input 
                id="quiz-root-note"
                ref={rootInputRef}
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
              <label htmlFor="quiz-shape" className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 block">String Shape</label>
              <input
                id="quiz-shape"
                type="text"
                list="quiz-string-shape-options"
                value={shapeInputDisplayValue}
                onChange={(event) => setInputShape(normalizeShapeInput(event.target.value))}
                className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none"
                placeholder="Any, 6, 5, or 4"
              />
              <datalist id="quiz-string-shape-options">
                <option value="6">String 6 (E)</option>
                <option value="5">String 5 (A)</option>
                <option value="4">String 4 (D)</option>
              </datalist>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="quiz-root-voicing" className="text-xs font-bold uppercase text-slate-500 tracking-wider block">Root Voicing</label>
                <button
                  type="button"
                  onClick={() => setShowVoicingHint((prev) => !prev)}
                  className={`text-[11px] font-bold uppercase tracking-wider border rounded px-2 py-1 transition-colors ${showVoicingHint ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'}`}
                >
                  Hint: {showVoicingHint ? 'On' : 'Off'}
                </button>
              </div>
              <input
                id="quiz-root-voicing"
                type="text"
                list="quiz-root-voicing-options"
                className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none"
                placeholder="e.g. E, G, C, A, D"
                value={inputVoicing}
                onChange={(event) => setInputVoicing(event.target.value)}
              />
              <datalist id="quiz-root-voicing-options">
                <option value="C" />
                <option value="A" />
                <option value="G" />
                <option value="E" />
                <option value="D" />
              </datalist>
            </div>

            {gameState === 'PLAYING' ? (
              <button 
                type="button"
                onClick={handleSubmit}
                className="mt-4 w-full bg-blue-600 text-white font-bold uppercase tracking-wider py-3 rounded hover:bg-blue-700 transition"
              >
                Submit
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleGenerateQuiz}
                className={`mt-4 w-full text-white font-bold uppercase tracking-wider py-3 rounded transition ${nextQuizButtonClass}`}
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
              colors={gameState === 'REVEALED' ? quizData.shape.offsets.map((offsetDef) => getIntervalHexColor(offsetDef.interval)) : quizData.activePitches.map(() => '#333')} 
              gameMode="SANDBOX" 
              useFlats={sheetUseFlats}
              keySignature={hasKeyConstraint ? keySignatureInfo?.renderableKeyName : undefined}
              suppressDiatonicAccidentals={hasKeyConstraint}
            />
          </div>

          <div className={`flex flex-col items-center justify-center w-64 min-h-[96px] transition-opacity duration-300 ${gameState === 'REVEALED' ? 'opacity-100' : 'opacity-70'}`}>
            <p className="text-3xl font-black text-slate-800 bg-blue-100 px-4 py-2 rounded shadow-sm">
              {rootLabel} {gameState === 'REVEALED' ? quizData.quality : '—'}
            </p>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">
              {gameState === 'REVEALED' ? (
                <>
                  Shape: {revealShapeParts.baseLabel} | Voicing:{' '}
                  <span className="text-[11px] font-black text-slate-700">{quizData.rootVoicing}</span>
                </>
              ) : 'Shape: ? | Voicing: ?'}
            </p>
          </div>
        </div>

        <Fretboard
          numFrets={25}
          windowStart={Math.max(0, quizData.rootFret - 2)}
          windowEnd={quizData.rootFret + 4}
          markers={gameState === 'REVEALED' ? quizData.shape.offsets.map((offsetDef) => ({
            stringIndex: offsetDef.string,
            fret: quizData.rootFret + offsetDef.offset,
            isAnchor: offsetDef.string === quizData.rootString,
            markerClass: `scale-100 ${getIntervalColor(offsetDef.interval)} ${offsetDef.string === quizData.rootString ? 'ring-2 ring-slate-900' : ''} text-white shadow-sm`,
            label: offsetDef.interval
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
            getLabelClassName={getCorrectMissHistoryLabelClass}
            onRestore={(state) => {
                if (!isQuizHistoryState(state)) {
                  return;
                }

                const restoredRootStrings = state.enabledRootStrings.filter((value): value is QuizRootString => {
                  return QUIZ_ROOT_STRING_OPTIONS.includes(value);
                });
                const restoredKeyConstraint = state.keyConstraint === QUIZ_KEY_CONSTRAINT_ALL || KEY_CONSTRAINT_OPTIONS.includes(state.keyConstraint)
                  ? state.keyConstraint
                  : QUIZ_KEY_CONSTRAINT_ALL;

                setQuizData(state.quizData);
                setInputRoot(state.inputRoot);
                setInputQuality(state.inputQuality);
                setInputShape(state.inputShape);
                setInputVoicing(state.inputVoicing);
                setEnabledRootStrings(restoredRootStrings);
                setKeyConstraint(restoredKeyConstraint);
                setShowRootHint(state.showRootHint);
                setShowVoicingHint(state.showVoicingHint);
                setStreak(Number.isFinite(state.streak) && state.streak >= 0 ? state.streak : 0);
                setGameState(state.gameState);
                setLastSubmissionResult(state.wasCorrect);
            }} 
              renderLabel={renderQuizHistoryLabel}
        />
        <LegendPanel />
      </aside>

      {isConfigOpen ? (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          onClick={() => setIsConfigOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="quiz-config-title"
            className="w-full max-w-lg rounded-lg border border-slate-300 bg-white shadow-xl p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 id="quiz-config-title" className="text-sm font-black uppercase tracking-wider text-slate-800">
                Quiz Config
              </h2>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="quiz-key-constraint" className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 block">
                  Key Constraint
                </label>
                <select
                  id="quiz-key-constraint"
                  value={keyConstraint}
                  onChange={(event) => setKeyConstraint(event.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none bg-white"
                >
                  <option value={QUIZ_KEY_CONSTRAINT_ALL}>All</option>
                  {KEY_CONSTRAINT_OPTIONS.map((keyOption) => (
                    <option key={keyOption} value={keyOption}>
                      {keyOption}
                    </option>
                  ))}
                </select>

                {keyConstraint === QUIZ_KEY_CONSTRAINT_ALL ? (
                  <div className="text-[11px] font-bold tracking-wider text-slate-400 mt-2">
                    Key Signature: Any
                  </div>
                ) : (
                  <div className="text-[11px] font-bold tracking-wider text-slate-400 mt-2 space-y-1">
                    <div>
                      Key Signature:{' '}
                      {isKeyRemapped && keySignatureInfo ? (
                        <>
                          <span className="line-through">{keySignatureInfo.keyName} major</span>{' '}
                          <span className="text-blue-700">{keySignatureInfo.renderableKeyName} major</span>
                        </>
                      ) : (
                        <span className="text-blue-700">{keySignatureInfo?.renderableKeyName} major</span>
                      )}
                    </div>
                    {isKeyRemapped && keySignatureInfo ? (
                      <div>
                        Key: <span className="line-through">{keySignatureInfo.keyName}</span> {' -> '} <span className="text-blue-700">{keySignatureInfo.renderableKeyName}</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 block">Root String Constraint</label>
                <div className="grid grid-cols-3 gap-2">
                  {QUIZ_ROOT_STRING_OPTIONS.map((rootString) => {
                    const checked = enabledRootStrings.includes(rootString);

                    return (
                      <label
                        key={rootString}
                        className={`text-[11px] font-bold border rounded px-2 py-2 flex items-center justify-center gap-1 ${checked ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100 cursor-pointer'}`}
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
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 block">Difficulty</label>
                <button
                  type="button"
                  aria-pressed={onlyDiatonicChords}
                  onClick={() => setOnlyDiatonicChords((prev) => !prev)}
                  className={`w-full text-left text-[11px] font-bold border rounded px-3 py-2 transition-colors ${onlyDiatonicChords ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'}`}
                >
                  Diatonic Chords Only: {onlyDiatonicChords ? 'On' : 'Off'}
                </button>
                <div className="text-[10px] font-bold tracking-wider text-slate-400 mt-2">
                  Uses diatonic quality mapping per selected key.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
