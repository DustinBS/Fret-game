import { useState, useMemo, useEffect } from 'react';
import { TUNING, semitoneToIntervalString } from '../utils/musicTheory';
import { analyzeChord } from '../utils/chordAnalyzer';

export type FretPosition = { stringIndex: number; fret: number; interval?: string };

export const useSandbox = () => {
  const [clickedFrets, setClickedFrets] = useState<FretPosition[]>([]);
  const [selectedChordName, setSelectedChordName] = useState<string>('');
  const [selectedChordIndex, setSelectedChordIndex] = useState<number>(0);
  const [oneNotePerString, setOneNotePerString] = useState<boolean>(true);

  const handleFretClick = (stringIndex: number, fret: number) => {
    setSelectedChordIndex(0);
    setClickedFrets(prev => {
      const exists = prev.find(p => p.stringIndex === stringIndex && p.fret === fret);
      if (exists) return prev.filter(p => p !== exists);
      // Ensure any manual interval from setChordShape gets cleared since the user is constructing something custom
      const cleaned = prev.map(p => ({ stringIndex: p.stringIndex, fret: p.fret }));
      if (oneNotePerString) {
        // remove any other frets on this string before adding the new one
        const withoutSameString = cleaned.filter(p => p.stringIndex !== stringIndex);
        return [...withoutSameString, { stringIndex, fret }];
      }
      return [...cleaned, { stringIndex, fret }];
    });
  };

  const clearSelection = () => {
    setClickedFrets([]);
    setSelectedChordName('');
    setSelectedChordIndex(0);
  };

  const setChordShape = (definition: any, shape: any, baseFretOffset?: number) => {
    // If a base fret wasn't provided, try a small range of base positions (0-12)
    // and pick one where the analyzer recognizes the same quality. This prevents
    // showing shapes at open-position pitches that accidentally resolve to other chord types
    // (e.g. the current minb6 shape showing up as C maj7/E).
    let chosenBase: number | null = null;
    if (typeof baseFretOffset === 'number') {
      chosenBase = baseFretOffset;
    } else {
      for (let candidate = 0; candidate <= 12; candidate++) {
        // compute pitches for this candidate base
        const candidatePitches = shape.offsets.map((so: any) => TUNING[so.string] + so.offset + candidate);
        const recognized = analyzeChord(candidatePitches);
        const matchesQuality = recognized.some((r) => r.name.includes(` ${definition.quality}`) || r.name.includes(` ${definition.quality} /`));
        if (matchesQuality) {
          chosenBase = candidate;
          break;
        }
      }
      if (chosenBase === null) {
        chosenBase = Math.max(0, -Math.min(...shape.offsets.map((so: any) => so.offset)));
      }
    }

    let adjustedBaseFretOffset = chosenBase;
    let minFretInShape = Math.min(...shape.offsets.map((so: any) => so.offset + adjustedBaseFretOffset));
    while (minFretInShape < 0) {
      adjustedBaseFretOffset += 12;
      minFretInShape += 12;
    }

    const newPositions: FretPosition[] = [];
    shape.offsets.forEach((so: any) => {
      newPositions.push({ stringIndex: so.string, fret: so.offset + adjustedBaseFretOffset, interval: so.interval });
    });
    setClickedFrets(newPositions);
    setSelectedChordName(`${definition.quality} (String ${shape.rootString + 1} root)`);
    return newPositions; // Return new positions so callers can use the plausible ones
  };

  const analyzedChords = useMemo(() => {
    if (clickedFrets.length === 0) return [];
    const pitches = clickedFrets.map(pos => TUNING[pos.stringIndex] + pos.fret);
    return analyzeChord(pitches);
  }, [clickedFrets]);

  useEffect(() => {
    if (selectedChordName && analyzedChords.length > 0) {
      const q = selectedChordName.split(' ')[0];
      const idx = analyzedChords.findIndex(c => c.name.includes(q.trim()));
      if (idx !== -1 && idx !== selectedChordIndex) {
        setSelectedChordIndex(idx);
      }
    }
  }, [analyzedChords, selectedChordName]);

  const mappedFrets = useMemo(() => {
    if (analyzedChords.length > 0 && selectedChordIndex < analyzedChords.length) {
      const selected = analyzedChords[selectedChordIndex];
      return clickedFrets.map(pos => {
        const pitch = TUNING[pos.stringIndex] + pos.fret;
        const semitonesFromRoot = (pitch - selected.rootMidi + 12) % 12;
        return { ...pos, interval: semitoneToIntervalString(semitonesFromRoot, selected.name) };
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
    selectedChordName,
    oneNotePerString,
    setOneNotePerString
  };
};
