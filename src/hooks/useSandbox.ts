import { useState, useMemo } from 'react';
import { TUNING, semitoneToIntervalString } from '../utils/musicTheory';
import { analyzeChord } from '../utils/chordAnalyzer';

export type FretPosition = { stringIndex: number; fret: number; interval?: string };

export const useSandbox = () => {
  const [clickedFrets, setClickedFrets] = useState<FretPosition[]>([]);
  const [selectedChordName, setSelectedChordName] = useState<string>('');
  const [selectedChordIndex, setSelectedChordIndex] = useState<number>(0);

  const handleFretClick = (stringIndex: number, fret: number) => {
    setSelectedChordIndex(0);
    setClickedFrets(prev => {
      const exists = prev.find(p => p.stringIndex === stringIndex && p.fret === fret);
      if (exists) return prev.filter(p => p !== exists);
      // Ensure any manual interval from setChordShape gets cleared since the user is constructing something custom
      const cleaned = prev.map(p => ({ stringIndex: p.stringIndex, fret: p.fret }));
      return [...cleaned, { stringIndex, fret }];
    });
  };

  const clearSelection = () => {
    setClickedFrets([]);
    setSelectedChordName('');
    setSelectedChordIndex(0);
  };

  const setChordShape = (definition: any, shape: any) => {
    const newPositions: FretPosition[] = [];
    shape.offsets.forEach((so: any) => {
      newPositions.push({ stringIndex: so.string, fret: so.offset, interval: so.interval });
    });
    setClickedFrets(newPositions);
    setSelectedChordName(`${definition.quality} (String ${shape.rootString} root)`);
  };

  const analyzedChords = useMemo(() => {
    if (clickedFrets.length === 0) return [];
    const pitches = clickedFrets.map(pos => TUNING[pos.stringIndex] + pos.fret);
    return analyzeChord(pitches);
  }, [clickedFrets]);

  const mappedFrets = useMemo(() => {
    if (analyzedChords.length > 0 && selectedChordIndex < analyzedChords.length) {
      const selected = analyzedChords[selectedChordIndex];
      return clickedFrets.map(pos => {
        const pitch = TUNING[pos.stringIndex] + pos.fret;
        const semitonesFromRoot = (pitch - selected.rootMidi + 12) % 12;
        return { ...pos, interval: semitoneToIntervalString(semitonesFromRoot) };
      });
    }
    return clickedFrets;
  }, [clickedFrets, analyzedChords, selectedChordIndex]);

  const activePitches = useMemo(() => {
    return clickedFrets.map(pos => TUNING[pos.stringIndex] + pos.fret);
  }, [clickedFrets]);

  return {
    clickedFrets: mappedFrets,
    setClickedFrets,
    handleFretClick,
    clearSelection,
    setChordShape,
    analyzedChords,
    selectedChordIndex,
    setSelectedChordIndex,
    activePitches,
    selectedChordName
  };
};
