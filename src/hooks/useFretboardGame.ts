// src/hooks/useFretboardGame.ts
import { useState, useCallback, useEffect, useMemo } from 'react';

import { TUNING, getLetterIndices } from '../utils/musicTheory';
import { readSessionJson, writeSessionJson } from '../utils/viewState';

export type FretPosition = { stringIndex: number; fret: number };
export type GameMode = 'WINDOW' | 'OCTAVE';
export type AccidentalMode = 'SHARP' | 'FLAT' | 'BOTH';

interface RoundData {
  notes: number[];
  anchor: number;
  colorIndices: number[];
  roundUseFlats: boolean;
}

interface TrainerPersistedState {
  gameMode: GameMode;
  accidentalMode: AccidentalMode;
  noteCount: number;
  isSheetMode: boolean;
  isHiddenMode: boolean;
  roundData: RoundData;
  clickedFrets: FretPosition[];
  gameState: 'GUESSING' | 'REVEALED';
  streak: number;
}

const TRAINER_STATE_KEY = 'fret-trainer-state';

function normalizeRoundData(value: unknown): RoundData | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<RoundData>;
  if (
    !Array.isArray(candidate.notes) ||
    !Number.isFinite(candidate.anchor) ||
    !Array.isArray(candidate.colorIndices) ||
    typeof candidate.roundUseFlats !== 'boolean'
  ) {
    return null;
  }

  return {
    notes: candidate.notes.map((note) => Number(note)).filter((note) => Number.isFinite(note)),
    anchor: Number(candidate.anchor),
    colorIndices: candidate.colorIndices
      .map((index) => Number(index))
      .filter((index) => Number.isFinite(index)),
    roundUseFlats: candidate.roundUseFlats,
  };
}

function normalizeFretPositions(value: unknown): FretPosition[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const candidate = item as Partial<FretPosition>;
      if (!Number.isFinite(candidate.stringIndex) || !Number.isFinite(candidate.fret)) {
        return null;
      }
      return {
        stringIndex: Number(candidate.stringIndex),
        fret: Number(candidate.fret),
      };
    })
    .filter((position): position is FretPosition => position !== null);
}

const createRoundData = (count: number, gameMode: GameMode, accidentalMode: AccidentalMode) => {
  const newNotes = new Set<number>();
  const usedLetters = new Set<number>();
  const safeCount = Math.min(count, 7);

  // RESOLVE ACCIDENTALS FOR THIS ROUND
  // If BOTH, random choice. If SHARP/FLAT, strict.
  const useFlats = accidentalMode === 'BOTH'
    ? Math.random() > 0.5
    : accidentalMode === 'FLAT';

  const letterMap = getLetterIndices(useFlats);

  let attempts = 0;
  while (newNotes.size < safeCount && attempts < 1000) {
    attempts++;

    let candidatePitch: number;
    let pitchClass: number;

    if (gameMode === 'WINDOW') {
       candidatePitch = Math.floor(Math.random() * 12);
       pitchClass = candidatePitch;
    } else {
       const s = Math.floor(Math.random() * 6);
       const f = Math.floor(Math.random() * 15);
       candidatePitch = TUNING[s] + f;
       pitchClass = candidatePitch % 12;
    }

    const letterIndex = letterMap[pitchClass];

    if (!usedLetters.has(letterIndex) && !newNotes.has(candidatePitch)) {
        newNotes.add(candidatePitch);
        usedLetters.add(letterIndex);
    }
  }

  const newAnchor = Math.floor(Math.random() * (11 - 3 + 1)) + 3;
  const colorIndices = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);

  return {
    notes: Array.from(newNotes).sort((a, b) => a - b),
    anchor: newAnchor,
    colorIndices,
    roundUseFlats: useFlats, // Store the resolved preference
  };
};

export const useFretboardGame = (initialCount: number = 1) => {
  const persistedState = useMemo(
    () => readSessionJson<Partial<TrainerPersistedState>>(TRAINER_STATE_KEY, {}),
    [],
  );

  const initialGameMode: GameMode = persistedState.gameMode === 'WINDOW' ? 'WINDOW' : 'OCTAVE';
  const initialAccidentalMode: AccidentalMode =
    persistedState.accidentalMode === 'FLAT' || persistedState.accidentalMode === 'BOTH'
      ? persistedState.accidentalMode
      : 'SHARP';
  const initialNoteCount = Number.isFinite(persistedState.noteCount)
    ? Math.max(1, Math.min(5, Number(persistedState.noteCount)))
    : initialCount;

  const [gameMode, setGameMode] = useState<GameMode>(initialGameMode);
  const [accidentalMode, setAccidentalMode] = useState<AccidentalMode>(initialAccidentalMode);
  const [noteCount, setNoteCountState] = useState<number>(initialNoteCount);

  const [isSheetMode, setIsSheetMode] = useState(
    typeof persistedState.isSheetMode === 'boolean' ? persistedState.isSheetMode : true,
  );
  const [isHiddenMode, setIsHiddenMode] = useState(
    typeof persistedState.isHiddenMode === 'boolean' ? persistedState.isHiddenMode : false,
  );

  const [roundData, setRoundData] = useState<RoundData>(() => {
    const hydrated = normalizeRoundData(persistedState.roundData);
    if (hydrated && hydrated.notes.length > 0 && hydrated.colorIndices.length > 0) {
      return hydrated;
    }

    return createRoundData(initialNoteCount, initialGameMode, initialAccidentalMode);
  });

  const [clickedFrets, setClickedFrets] = useState<FretPosition[]>(() => normalizeFretPositions(persistedState.clickedFrets));
  const [gameState, setGameState] = useState<'GUESSING' | 'REVEALED'>(() =>
    persistedState.gameState === 'REVEALED' ? 'REVEALED' : 'GUESSING',
  );
  const [streak, setStreak] = useState(() => {
    const value = persistedState.streak;
    return Number.isFinite(value) && Number(value) >= 0 ? Number(value) : 0;
  });

  const { notes: targetNotes, anchor: anchorFret, colorIndices, roundUseFlats } = roundData;

  const windowStart = gameMode === 'WINDOW' ? Math.max(0, anchorFret - 3) : 0;
  const windowEnd   = gameMode === 'WINDOW' ? Math.min(14, anchorFret + 3) : 14;

  const generateNewRound = useCallback(() => {
    setRoundData(createRoundData(noteCount, gameMode, accidentalMode));
    setClickedFrets([]);
    setGameState('GUESSING');
  }, [noteCount, gameMode, accidentalMode]);

  const toggleGameMode = () => {
    setGameMode((prev) => {
      const newMode: GameMode = prev === 'WINDOW' ? 'OCTAVE' : 'WINDOW';
      setStreak(0);
      setRoundData(createRoundData(noteCount, newMode, accidentalMode));
      setClickedFrets([]);
      setGameState('GUESSING');
      return newMode;
    });
  };

  const cycleAccidentalMode = () => {
    setAccidentalMode(prev => {
        // Cycle: SHARP -> FLAT -> BOTH -> SHARP
        let newMode: AccidentalMode = 'SHARP';
        if (prev === 'SHARP') newMode = 'FLAT';
        else if (prev === 'FLAT') newMode = 'BOTH';
        else newMode = 'SHARP';

        setRoundData(createRoundData(noteCount, gameMode, newMode));
        setClickedFrets([]);
        setGameState('GUESSING');
        return newMode;
    });
  };

  const updateNoteCount = (delta: number) => {
    setNoteCountState(prev => {
      const newCount = Math.max(1, Math.min(5, prev + delta));
      if (newCount !== prev) {
        setRoundData(createRoundData(newCount, gameMode, accidentalMode));
        setClickedFrets([]);
        setGameState('GUESSING');
      }
      return newCount;
    });
  };

  const handleFretClick = (stringIndex: number, fret: number) => {
    if (gameState === 'REVEALED') return;
    if (fret < windowStart || fret > windowEnd) return;

    setClickedFrets(prev => {
      const exists = prev.find(p => p.stringIndex === stringIndex && p.fret === fret);
      if (exists) return prev.filter(p => p !== exists);
      return [...prev, { stringIndex, fret }];
    });
  };

  // ADDED: Helper to clear selections
  const clearGuesses = () => {
    if (gameState === 'GUESSING') {
      setClickedFrets([]);
    }
  };

  const submitGuess = () => {
    const correctPositions: FretPosition[] = [];

    for (let s = 0; s < 6; s++) {
      for (let f = windowStart; f <= windowEnd; f++) {
        const pitch = TUNING[s] + f;
        let isMatch = false;
        if (gameMode === 'WINDOW') {
          isMatch = targetNotes.includes(pitch % 12);
        } else {
          isMatch = targetNotes.includes(pitch);
        }

        if (isMatch) correctPositions.push({ stringIndex: s, fret: f });
      }
    }

    const allCorrectFound = correctPositions.every(cp =>
      clickedFrets.some(cf => cf.stringIndex === cp.stringIndex && cf.fret === cp.fret)
    );
    const noFalsePositives = clickedFrets.every(cf =>
      correctPositions.some(cp => cp.stringIndex === cf.stringIndex && cf.fret === cp.fret)
    );

    if (allCorrectFound && noFalsePositives && correctPositions.length > 0) {
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }

    setGameState('REVEALED');
    return allCorrectFound && noFalsePositives && correctPositions.length > 0;
  };

  useEffect(() => {
    writeSessionJson<TrainerPersistedState>(TRAINER_STATE_KEY, {
      gameMode,
      accidentalMode,
      noteCount,
      isSheetMode,
      isHiddenMode,
      roundData,
      clickedFrets,
      gameState,
      streak,
    });
  }, [gameMode, accidentalMode, noteCount, isSheetMode, isHiddenMode, roundData, clickedFrets, gameState, streak]);

  return {
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
    clearGuesses, // EXPORTED
    setClickedFrets,
    submitGuess,
    generateNewRound,
    TUNING,
  };
};