// src/hooks/useFretboardGame.ts
import { useState, useCallback } from 'react';

// Standard Tuning High E to Low E (Visual Top to Bottom)
// MIDI 40 = E2 (Low E), MIDI 64 = E4 (High E)
const TUNING = [64, 59, 55, 50, 45, 40];
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export type FretPosition = { stringIndex: number; fret: number };
export type GameMode = 'WINDOW' | 'OCTAVE'; 

export const getNoteName = (midi: number) => {
  const note = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1; 
  return { note, octave };
};

const createRoundData = (count: number, mode: GameMode) => {
  const newNotes = new Set<number>();
  const safeCount = Math.min(count, 12);
  
  while (newNotes.size < safeCount) {
    if (mode === 'WINDOW') {
      newNotes.add(Math.floor(Math.random() * 12));
    } else {
      const s = Math.floor(Math.random() * 6);
      const f = Math.floor(Math.random() * 15);
      const pitch = TUNING[s] + f;
      newNotes.add(pitch);
    }
  }
  
  const newAnchor = Math.floor(Math.random() * (11 - 3 + 1)) + 3;
  const colorIndices = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);

  return {
    notes: Array.from(newNotes).sort((a, b) => a - b),
    anchor: newAnchor,
    colorIndices
  };
};

export const useFretboardGame = (initialCount: number = 1) => {
  const [gameMode, setGameMode] = useState<GameMode>('WINDOW');
  const [noteCount, setNoteCountState] = useState<number>(initialCount);
  
  // New Toggles
  const [isSheetMode, setIsSheetMode] = useState(false);
  const [isHiddenMode, setIsHiddenMode] = useState(false);

  const [roundData, setRoundData] = useState(() => createRoundData(initialCount, 'WINDOW'));
  
  const [clickedFrets, setClickedFrets] = useState<FretPosition[]>([]);
  const [gameState, setGameState] = useState<'GUESSING' | 'REVEALED'>('GUESSING');
  const [streak, setStreak] = useState(0);

  const { notes: targetNotes, anchor: anchorFret, colorIndices } = roundData;

  const windowStart = gameMode === 'WINDOW' ? Math.max(0, anchorFret - 3) : 0;
  const windowEnd   = gameMode === 'WINDOW' ? Math.min(14, anchorFret + 3) : 14;

  const generateNewRound = useCallback(() => {
    setRoundData(createRoundData(noteCount, gameMode));
    setClickedFrets([]);
    setGameState('GUESSING');
  }, [noteCount, gameMode]);

  const toggleMode = () => {
    setGameMode(prev => {
      const newMode = prev === 'WINDOW' ? 'OCTAVE' : 'WINDOW';
      setStreak(0);
      setRoundData(createRoundData(noteCount, newMode)); 
      setClickedFrets([]);
      setGameState('GUESSING');
      return newMode;
    });
  };

  const updateNoteCount = (delta: number) => {
    setNoteCountState(prev => {
      const newCount = Math.max(1, Math.min(4, prev + delta));
      if (newCount !== prev) {
        setRoundData(createRoundData(newCount, gameMode));
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
    noteCount,
    updateNoteCount,
    gameMode,
    toggleMode,
    isSheetMode,    // New
    setIsSheetMode, // New
    isHiddenMode,   // New
    setIsHiddenMode,// New
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
  };
};