// src/hooks/useFretboardGame.ts
import { useState, useCallback } from 'react';

import { TUNING, getLetterIndices } from '../utils/musicTheory';

export type FretPosition = { stringIndex: number; fret: number };
export type GameMode = 'WINDOW' | 'OCTAVE' | 'CHORD';
export type AccidentalMode = 'SHARP' | 'FLAT' | 'BOTH';

// CHORDS unused for now

const createRoundData = (count: number, gameMode: GameMode, accidentalMode: AccidentalMode) => {
  const newNotes = new Set<number>();
  const usedLetters = new Set<number>();
  let chordName = '';
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
    chord: chordName,
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

  const { notes: targetNotes, anchor: anchorFret, colorIndices, roundUseFlats, chord: targetChord } = roundData;

  const windowStart = gameMode === 'WINDOW' ? Math.max(0, anchorFret - 3) : 0;
  const windowEnd   = gameMode === 'WINDOW' ? Math.min(14, anchorFret + 3) : 14;

  const generateNewRound = useCallback(() => {
    setRoundData(createRoundData(noteCount, gameMode, accidentalMode));
    setClickedFrets([]);
    setGameState('GUESSING');
  }, [noteCount, gameMode, accidentalMode]);

  const toggleGameMode = () => {
    setGameMode(prev => {
      const newMode = prev === 'WINDOW' ? 'OCTAVE' : prev === 'OCTAVE' ? 'CHORD' : 'WINDOW';
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
        if (gameMode === 'WINDOW' || gameMode === 'CHORD') {
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
    TUNING,
    targetChord,
  };
};