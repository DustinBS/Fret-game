import { useState, useCallback, useMemo, useEffect } from 'react';
import { CHORD_DICTIONARY, type ChordShape } from '../utils/chordLibrary';
import { TUNING, NOTES_FLAT, NOTES_SHARP } from '../utils/musicTheory';
import { readSessionJson, writeSessionJson } from '../utils/viewState';

type QuizState = 'PLAYING' | 'REVEALED';

interface QuizData {
  rootPitchClass: number; // 0-11
  quality: string;
  shape: ChordShape;
  rootString: number;
  rootFret: number;
  activePitches: number[];
  useFlats: boolean;
}

export const QUIZ_ROOT_STRING_OPTIONS = [5, 4, 3] as const;
export type QuizRootString = (typeof QUIZ_ROOT_STRING_OPTIONS)[number];
const QUIZ_STATE_KEY = 'fret-quiz-state';

interface QuizPersistedState {
  streak: number;
  gameState: QuizState;
  quizData: QuizData | null;
  inputRoot: string;
  inputQuality: string;
  inputShape: string;
  enabledRootStrings: QuizRootString[];
  keyConstraint: string;
}

function normalizeRootStringSelection(selection: QuizRootString[]): QuizRootString[] {
  return QUIZ_ROOT_STRING_OPTIONS.filter((rootString) => selection.includes(rootString));
}

function normalizeRootStringSelectionFromUnknown(value: unknown): QuizRootString[] {
  if (!Array.isArray(value)) {
    return [...QUIZ_ROOT_STRING_OPTIONS];
  }

  const normalized = value
    .map((entry) => Number(entry))
    .filter((entry): entry is QuizRootString => QUIZ_ROOT_STRING_OPTIONS.includes(entry as QuizRootString));

  return normalizeRootStringSelection(normalized);
}

function normalizeQuizData(value: unknown): QuizData | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<QuizData>;
  if (
    !Number.isFinite(candidate.rootPitchClass) ||
    typeof candidate.quality !== 'string' ||
    !candidate.shape ||
    typeof candidate.shape !== 'object' ||
    !Number.isFinite(candidate.rootString) ||
    !Number.isFinite(candidate.rootFret) ||
    !Array.isArray(candidate.activePitches) ||
    typeof candidate.useFlats !== 'boolean'
  ) {
    return null;
  }

  return {
    rootPitchClass: Number(candidate.rootPitchClass),
    quality: candidate.quality,
    shape: candidate.shape as ChordShape,
    rootString: Number(candidate.rootString),
    rootFret: Number(candidate.rootFret),
    activePitches: candidate.activePitches.map((pitch) => Number(pitch)).filter((pitch) => Number.isFinite(pitch)),
    useFlats: candidate.useFlats,
  };
}

function getActiveRootStrings(selection: QuizRootString[]): readonly QuizRootString[] {
  if (selection.length === 0 || selection.length === QUIZ_ROOT_STRING_OPTIONS.length) {
    return QUIZ_ROOT_STRING_OPTIONS;
  }

  return normalizeRootStringSelection(selection);
}

export function useChordQuiz() {
  const persistedState = useMemo(
    () => readSessionJson<Partial<QuizPersistedState>>(QUIZ_STATE_KEY, {}),
    [],
  );

  const [streak, setStreak] = useState(() => {
    const value = persistedState.streak;
    return Number.isFinite(value) && Number(value) >= 0 ? Number(value) : 0;
  });
  const [gameState, setGameState] = useState<QuizState>(() => {
    return persistedState.gameState === 'REVEALED' ? 'REVEALED' : 'PLAYING';
  });
  const [quizData, setQuizData] = useState<QuizData | null>(() => normalizeQuizData(persistedState.quizData));

  const [inputRoot, setInputRoot] = useState(() => (typeof persistedState.inputRoot === 'string' ? persistedState.inputRoot : ''));
  const [inputQuality, setInputQuality] = useState(() => (typeof persistedState.inputQuality === 'string' ? persistedState.inputQuality : ''));
  const [inputShape, setInputShape] = useState(() => (typeof persistedState.inputShape === 'string' ? persistedState.inputShape : ''));
  const [enabledRootStrings, setEnabledRootStrings] = useState<QuizRootString[]>(() => {
    if (Array.isArray(persistedState.enabledRootStrings)) {
      return normalizeRootStringSelectionFromUnknown(persistedState.enabledRootStrings);
    }

    return [...QUIZ_ROOT_STRING_OPTIONS];
  });

  const [keyConstraint, setKeyConstraint] = useState(() => {
    return typeof persistedState.keyConstraint === 'string' ? persistedState.keyConstraint : 'C major';
  });

  const activeRootStrings = useMemo(() => getActiveRootStrings(enabledRootStrings), [enabledRootStrings]);

  const rootStringConstraintLabel = useMemo(() => {
    if (enabledRootStrings.length === 0 || enabledRootStrings.length === QUIZ_ROOT_STRING_OPTIONS.length) {
      return 'All root strings (6, 5, 4)';
    }

    const displayStrings = [...enabledRootStrings]
      .sort((a, b) => b - a)
      .map((rootString) => String(rootString + 1));

    return `Strings ${displayStrings.join(', ')}`;
  }, [enabledRootStrings]);

  const toggleRootStringConstraint = useCallback((rootString: QuizRootString) => {
    setEnabledRootStrings((prev) => {
      if (prev.includes(rootString)) {
        return prev.filter((value) => value !== rootString);
      }

      return normalizeRootStringSelection([...prev, rootString]);
    });
  }, []);

  useEffect(() => {
    writeSessionJson<QuizPersistedState>(QUIZ_STATE_KEY, {
      streak,
      gameState,
      quizData,
      inputRoot,
      inputQuality,
      inputShape,
      enabledRootStrings,
      keyConstraint,
    });
  }, [streak, gameState, quizData, inputRoot, inputQuality, inputShape, enabledRootStrings, keyConstraint]);

  const generateQuiz = useCallback(() => {
    let allowedQualities = CHORD_DICTIONARY;
    let allowedRoots = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    let useFlats = Math.random() > 0.5;

    if (keyConstraint !== 'None') {
        const rootString = keyConstraint.split(' ')[0]; // "C" or "Db"
        let pitchClass = NOTES_SHARP.indexOf(rootString);
        if (pitchClass === -1) pitchClass = NOTES_FLAT.indexOf(rootString);
        
        useFlats = rootString.includes('b') || rootString === 'F';
        
        const majorScaleOffsets = [0, 2, 4, 5, 7, 9, 11];
        const triadQualities = ['maj7', 'min7', 'min7', 'maj7', '7', 'min7', 'min7b5'];
        
        const index = Math.floor(Math.random() * 7);
        const chordRoot = (Math.max(0, pitchClass) + majorScaleOffsets[index]) % 12;
        const chordQuality = triadQualities[index];
        
        allowedRoots = [chordRoot];
        allowedQualities = CHORD_DICTIONARY.filter(d => d.quality === chordQuality);
    }

    const activeRootSet = new Set<number>(activeRootStrings);
    const constrainedCandidates = allowedQualities.flatMap((entry) => {
      return entry.shapes
        .filter((shape) => activeRootSet.has(shape.rootString))
        .map((shape) => ({ quality: entry.quality, shape }));
    });

    const fallbackCandidates = allowedQualities.flatMap((entry) => {
      return entry.shapes.map((shape) => ({ quality: entry.quality, shape }));
    });

    const candidates = constrainedCandidates.length > 0 ? constrainedCandidates : fallbackCandidates;
    if (candidates.length === 0) {
      return;
    }

    const selectedCandidate = candidates[Math.floor(Math.random() * candidates.length)];
    const quality = selectedCandidate.quality;
    const shape = selectedCandidate.shape;
    
    const targetPitchClass = allowedRoots[Math.floor(Math.random() * allowedRoots.length)];
    
    // Find base fret on the root string
    const stringOpenPitch = TUNING[shape.rootString];
    let rootFret = (targetPitchClass - (stringOpenPitch % 12) + 12) % 12;
    // to avoid everything being clustered at open position, maybe randomly add 12 if it's small?
    // Let's just keep it simple or randomly shift up 1 octave if fret <= 2
    if (rootFret <= 2 && Math.random() > 0.5) rootFret += 12;

    // TUNING[o.string] + rootFret + o.offset is correct for the absolute pitch of that note.
    const pitches = shape.offsets.map((o: any) => TUNING[o.string] + rootFret + o.offset);

    if (keyConstraint === 'None') {
        useFlats = [1, 3, 5, 8, 10].includes(targetPitchClass) && Math.random() > 0.5;
    }

    setQuizData({
      rootPitchClass: targetPitchClass,
      quality,
      shape: { ...shape, rootString: shape.rootString },
      rootString: shape.rootString,
      rootFret,
      activePitches: pitches,
      useFlats
    });
    
    setInputRoot('');
    setInputQuality('');
    setInputShape('');
    setGameState('PLAYING');
  }, [keyConstraint, activeRootStrings]);

  const submitGuess = useCallback(() => {
    if (!quizData || gameState !== 'PLAYING') return false;

    const correctRootNames = [NOTES_FLAT[quizData.rootPitchClass], NOTES_SHARP[quizData.rootPitchClass]];
    const isRootCorrect = correctRootNames.some(name => name.toLowerCase() === inputRoot.trim().toLowerCase());
    const isQualityCorrect = quizData.quality.toLowerCase() === inputQuality.trim().toLowerCase();
    
    // Check shape string, allow matching the string number
    const isShapeCorrect = inputShape === '' || 
        inputShape === String(quizData.rootString) || 
        inputShape.includes(String(6 - quizData.rootString)); 

    const wasCorrect = isRootCorrect && isQualityCorrect && (inputShape === '' || isShapeCorrect);
    
    if (wasCorrect) {
      setStreak((s: any) => s + 1);
    } else {
      setStreak(0);
    }

    setGameState('REVEALED');
    return wasCorrect;
  }, [quizData, inputRoot, inputQuality, inputShape, gameState]);

  return {
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
    keyConstraint,
    setKeyConstraint,
    generateQuiz,
    submitGuess
  };
}