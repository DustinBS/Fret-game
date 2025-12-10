// src/hooks/useFretboardGame.ts
import { useState, useCallback } from 'react';

// Standard Tuning High E to Low E (Visual Top to Bottom)
const TUNING = [64, 59, 55, 50, 45, 40];

const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Map Pitch Class (0-11) to Staff Letter Index (0=C...6=B)
const getLetterIndices = (isFlat: boolean) => {
    if (isFlat) {
        // C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B
        return [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];
    } else {
        // C, C#, D, D#, E, F, F#, G, G#, A, A#, B
        return [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
    }
};

export type FretPosition = { stringIndex: number; fret: number };
export type GameMode = 'WINDOW' | 'OCTAVE';
export type AccidentalMode = 'SHARP' | 'FLAT' | 'BOTH';

// Helper now takes the *resolved* mode for the round
export const getNoteName = (midi: number, isFlat: boolean) => {
  const names = isFlat ? FLATS : SHARPS;
  const note = names[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return { note, octave };
};

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
    roundUseFlats: useFlats // Store the resolved preference
  };
};

export const useFretboardGame = (initialCount: number = 1) => {
  // CHANGED: Default to 'OCTAVE'
  const [gameMode, setGameMode] = useState<GameMode>('OCTAVE');
  const [accidentalMode, setAccidentalMode] = useState<AccidentalMode>('SHARP');
  const [noteCount, setNoteCountState] = useState<number>(initialCount);

  // CHANGED: Default isSheetMode to true
  const [isSheetMode, setIsSheetMode] = useState(true);
  const [isHiddenMode, setIsHiddenMode] = useState(false);

  // CHANGED: Initialize roundData with 'OCTAVE' to match gameMode state
  const [roundData, setRoundData] = useState(() => createRoundData(initialCount, 'OCTAVE', 'SHARP'));

  const [clickedFrets, setClickedFrets] = useState<FretPosition[]>([]);
  const [gameState, setGameState] = useState<'GUESSING' | 'REVEALED'>('GUESSING');
  const [streak, setStreak] = useState(0);

  const { notes: targetNotes, anchor: anchorFret, colorIndices, roundUseFlats } = roundData;

  const windowStart = gameMode === 'WINDOW' ? Math.max(0, anchorFret - 3) : 0;
  const windowEnd   = gameMode === 'WINDOW' ? Math.min(14, anchorFret + 3) : 14;

  const generateNewRound = useCallback(() => {
    setRoundData(createRoundData(noteCount, gameMode, accidentalMode));
    setClickedFrets([]);
    setGameState('GUESSING');
  }, [noteCount, gameMode, accidentalMode]);

  const toggleGameMode = () => {
    setGameMode(prev => {
      const newMode = prev === 'WINDOW' ? 'OCTAVE' : 'WINDOW';
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
  };

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
    submitGuess,
    generateNewRound,
    TUNING
  };
};