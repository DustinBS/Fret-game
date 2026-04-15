import { useState, useCallback } from 'react';
import { CHORD_DICTIONARY, type ChordShape } from '../utils/chordLibrary';
import { TUNING, NOTES_FLAT, NOTES_SHARP } from '../utils/musicTheory';

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

export function useChordQuiz() {
  const [streak, setStreak] = useState(0);
  const [gameState, setGameState] = useState<QuizState>('PLAYING');
  const [quizData, setQuizData] = useState<QuizData | null>(null);

  const [inputRoot, setInputRoot] = useState('');
  const [inputQuality, setInputQuality] = useState('');

  const generateQuiz = useCallback(() => {
    const randomDictEntry = CHORD_DICTIONARY[Math.floor(Math.random() * CHORD_DICTIONARY.length)];
    const quality = randomDictEntry.quality;
    const shape = randomDictEntry.shapes[Math.floor(Math.random() * randomDictEntry.shapes.length)];
    
    const targetPitchClass = Math.floor(Math.random() * 12);
    
    // Find base fret on the root string
    const stringOpenPitch = TUNING[shape.rootString];
    let rootFret = (targetPitchClass - (stringOpenPitch % 12) + 12) % 12;
    // to avoid everything being clustered at open position, maybe randomly add 12 if it's small?
    // Let's just keep it simple or randomly shift up 1 octave if fret <= 2
    if (rootFret <= 2 && Math.random() > 0.5) rootFret += 12;

    // TUNING[o.string] + rootFret + o.offset is correct for the absolute pitch of that note.
    const pitches = shape.offsets.map(o => TUNING[o.string] + rootFret + o.offset);

    const useFlats = [1, 3, 5, 8, 10].includes(targetPitchClass) && Math.random() > 0.5;

    setQuizData({
      rootPitchClass: targetPitchClass,
      quality,
      shape,
      rootString: shape.rootString,
      rootFret,
      activePitches: pitches,
      useFlats
    });
    
    setInputRoot('');
    setInputQuality('');
    setGameState('PLAYING');
  }, []);

  const submitGuess = useCallback(() => {
    if (!quizData || gameState !== 'PLAYING') return;

    const correctRootNames = [NOTES_FLAT[quizData.rootPitchClass], NOTES_SHARP[quizData.rootPitchClass]];
    const isRootCorrect = correctRootNames.some(name => name.toLowerCase() === inputRoot.trim().toLowerCase());
    const isQualityCorrect = quizData.quality.toLowerCase() === inputQuality.trim().toLowerCase();

    if (isRootCorrect && isQualityCorrect) {
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }

    setGameState('REVEALED');
  }, [quizData, inputRoot, inputQuality, gameState]);

  return {
    quizData,
    gameState,
    streak,
    inputRoot,
    setInputRoot,
    inputQuality,
    setInputQuality,
    generateQuiz,
    submitGuess
  };
}