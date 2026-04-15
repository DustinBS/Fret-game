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
  const [inputShape, setInputShape] = useState('');
  
const [keyConstraint, setKeyConstraint] = useState('C major');

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

    const randomDictEntry = allowedQualities[Math.floor(Math.random() * allowedQualities.length)];
    const quality = randomDictEntry.quality;
    const shape = randomDictEntry.shapes[Math.floor(Math.random() * randomDictEntry.shapes.length)];
    
    const targetPitchClass = allowedRoots[Math.floor(Math.random() * allowedRoots.length)];
    
    // Find base fret on the root string
    const stringOpenPitch = TUNING[shape.rootString];
    let rootFret = (targetPitchClass - (stringOpenPitch % 12) + 12) % 12;
    // to avoid everything being clustered at open position, maybe randomly add 12 if it's small?
    // Let's just keep it simple or randomly shift up 1 octave if fret <= 2
    if (rootFret <= 2 && Math.random() > 0.5) rootFret += 12;

    // TUNING[o.string] + rootFret + o.offset is correct for the absolute pitch of that note.
    const pitches = shape.offsets.map(o => TUNING[o.string] + rootFret + o.offset);

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
  }, [keyConstraint]);

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
      setStreak(s => s + 1);
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
    keyConstraint,
    setKeyConstraint,
    generateQuiz,
    submitGuess
  };
}