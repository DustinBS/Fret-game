export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const FORMULA_TO_CHORD: Record<string, string> = {
  // Triads
  "0,4,7": "maj",
  "0,3,7": "m",
  "0,3,6": "dim",
  "0,4,8": "aug",
  "0,2,7": "sus2",
  "0,5,7": "sus4",

  // 6ths
  "0,4,7,9": "6",
  "0,3,7,9": "m6",
  "0,3,7,8": "mb6",

  // 7ths
  "0,4,7,11": "maj7",
  "0,3,7,10": "m7",
  "0,4,7,10": "7",
  "0,3,6,10": "m7b5",
  "0,3,6,9": "dim7",
  "0,4,8,10": "aug7",
  "0,5,7,10": "7sus4",
  "0,4,6,7,11": "maj7#11",

  // 9ths (sorted)
  "0,2,4,7,11": "maj9",
  "0,2,3,7,10": "m9",
  "0,2,4,7,10": "9",
  "0,1,4,7,10": "7b9",
  "0,3,4,7,10": "7#9",

  // 11ths (sorted)
  "0,2,3,5,7,10": "m11",
  "0,2,4,5,7,10": "11",
  "0,3,5,6,10": "m11b5", // simplified or partial

  // 13ths (sorted)
  "0,2,4,7,9,11": "maj13",
  "0,2,3,7,9,10": "m13",
  "0,2,4,7,9,10": "13",
  "0,3,7,8,10": "m(b13)",

  // Some common rootless/shell voicings or typical subsets can be added if needed
};

export function analyzeChord(midiPitches: number[]): string[] {
  if (!midiPitches || midiPitches.length === 0) {
    return [];
  }

  // 3. The lowest pitch in midiPitches is the bass note.
  const lowestPitch = Math.min(...midiPitches);
  const bassPitchClass = lowestPitch % 12;
  const bassNoteName = NOTE_NAMES[bassPitchClass];

  // 2. Deduplicate pitch classes (0-11) from the midiPitches.
  const pitchClasses = Array.from(new Set(midiPitches.map((p) => p % 12)));
  
  const recognizedChords: string[] = [];

  // 4. Iterate over every pitch class present as a potential root.
  for (const root of pitchClasses) {
    const rootName = NOTE_NAMES[root];

    // 5. For each potential root, map the remaining pitch classes to semitone intervals (0-11) relative to that root.
    const intervals = pitchClasses.map((pc) => (pc - root + 12) % 12);
    
    // Sort intervals conceptually building the chord
    intervals.sort((a, b) => a - b);
    
    const formulaString = intervals.join(",");

    // 6. Look up those intervals (sorted) in a dictionary of well-known chord formulas
    const chordType = FORMULA_TO_CHORD[formulaString];

    if (chordType) {
      // 7. Format the string: e.g. `C maj7`. If the bass note is NOT the root note, format it as a slash chord: `C maj7 / G`.
      let chordName = `${rootName}${chordType}`;
      if (bassPitchClass !== root) {
        chordName += ` / ${bassNoteName}`;
      }
      recognizedChords.push(chordName);
    }
  }

  // 8. Return an array of all possible recognized names
  return recognizedChords;
}
