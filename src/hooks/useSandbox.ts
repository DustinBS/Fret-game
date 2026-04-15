import { useState, useMemo } from 'react';
import { TUNING } from '../utils/musicTheory';
import { analyzeChord } from '../utils/chordAnalyzer';

export type FretPosition = { stringIndex: number; fret: number };

export const useSandbox = () => {
  const [clickedFrets, setClickedFrets] = useState<FretPosition[]>([]);
  const [selectedChordName, setSelectedChordName] = useState<string>('');

  const handleFretClick = (stringIndex: number, fret: number) => {
    setClickedFrets(prev => {
      const exists = prev.find(p => p.stringIndex === stringIndex && p.fret === fret);
      if (exists) return prev.filter(p => p !== exists);
      return [...prev, { stringIndex, fret }];
    });
  };

  const clearSelection = () => {
    setClickedFrets([]);
    setSelectedChordName('');
  };

  const setChordShape = (definition: any, shape: any) => {
    const newPositions: FretPosition[] = [];
    shape.offsets.forEach((so: any) => {
      newPositions.push({ stringIndex: so.string, fret: so.offset });
    });
    setClickedFrets(newPositions);
    setSelectedChordName(`${definition.quality} (String ${shape.rootString} root)`);
  };

  const analyzedChords = useMemo(() => {
    if (clickedFrets.length === 0) return [];
    const pitches = clickedFrets.map(pos => TUNING[pos.stringIndex] + pos.fret);
    return analyzeChord(pitches);
  }, [clickedFrets]);

  const activePitches = useMemo(() => {
    return clickedFrets.map(pos => TUNING[pos.stringIndex] + pos.fret);
  }, [clickedFrets]);

  return {
    clickedFrets,
    handleFretClick,
    clearSelection,
    setChordShape,
    analyzedChords,
    activePitches,
    selectedChordName
  };
};