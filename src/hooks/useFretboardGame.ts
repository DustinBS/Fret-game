// src/hooks/useFretboardGame.ts
import { useState, useCallback } from 'react';

// Standard Tuning High E to Low E (Visual Top to Bottom)
const TUNING = [64, 59, 55, 50, 45, 40];
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export type FretPosition = { stringIndex: number; fret: number };

// Helper to generate round data (Pure logic extracted from component state)
const createRoundData = (count: number) => {
  const newNotes = new Set<number>();
  const safeCount = Math.min(count, 12);

  while (newNotes.size < safeCount) {
    newNotes.add(Math.floor(Math.random() * 12));
  }

  // Anchor between 3 and 11
  const newAnchor = Math.floor(Math.random() * (11 - 3 + 1)) + 3;

  // New: Generate shuffled color indices (assuming palette size of 6)
  // We generate a simple array [0,1,2,3,4,5] and shuffle it
  const colorIndices = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);

  return {
    notes: Array.from(newNotes).sort((a, b) => a - b),
    anchor: newAnchor,
    colorIndices // Return the shuffled colors
  };
};

export const useFretboardGame = (initialCount: number = 1) => {
  const [noteCount, setNoteCountState] = useState<number>(initialCount);

  // Lazy initialization for the first round
  const [roundData, setRoundData] = useState(() => createRoundData(initialCount));

  const [clickedFrets, setClickedFrets] = useState<FretPosition[]>([]);
  const [gameState, setGameState] = useState<'GUESSING' | 'REVEALED'>('GUESSING');
  const [streak, setStreak] = useState(0);

  // Destructure round data
  const { notes: targetNotes, anchor: anchorFret, colorIndices } = roundData;

  // The 7-fret window: Anchor +/- 3
  const windowStart = Math.max(0, anchorFret - 3);
  const windowEnd = Math.min(14, anchorFret + 3);

  const generateNewRound = useCallback(() => {
    setRoundData(createRoundData(noteCount));
    setClickedFrets([]);
    setGameState('GUESSING');
  }, [noteCount]);

  const updateNoteCount = (delta: number) => {
    setNoteCountState(prev => {
      const newCount = Math.max(1, Math.min(4, prev + delta));
      if (newCount !== prev) {
        setRoundData(createRoundData(newCount));
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
        if (targetNotes.includes(pitch % 12)) {
          correctPositions.push({ stringIndex: s, fret: f });
        }
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
    targetNoteIndices: targetNotes,
    targetNoteNames: targetNotes.map(n => NOTE_NAMES[n]),
    colorIndices, // Export the shuffled indices
    noteCount,
    updateNoteCount,
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