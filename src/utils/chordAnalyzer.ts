export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const FORMULA_TO_CHORD: Record<string, string[]> = {
  "0,2,4,7,9,10": [
    "13"
  ],
  "0,4,7,10": [
    "7"
  ],
  "0,5,7,10": [
    "7sus4"
  ],
  "0,2,4,7,10": [
    "9",
    "13"
  ],
  "0,4,8": [
    "aug"
  ],
  "0,4,8,10": [
    "aug7"
  ],
  "0,3,6": [
    "dim"
  ],
  "0,3,6,9": [
    "dim7"
  ],
  "0,4,7": [
    "maj"
  ],
  "0,2,4,7,9,11": [
    "maj13"
  ],
  "0,4,7,9": [
    "maj6"
  ],
  "0,4,7,11": [
    "maj7"
  ],
  "0,4,6,7,11": [
    "maj7#11"
  ],
  "0,2,4,7,11": [
    "maj9"
  ],
  "0,3,7": [
    "min"
  ],
  "0,3,5,7,10": [
    "min11",
    "min13"
  ],
  "0,3,5,6,10": [
    "min11(b5)"
  ],
  "0,3,5,7,9,10": [
    "min13"
  ],
  "0,3,7,9": [
    "min6"
  ],
  "0,3,7,10": [
    "min7",
    "min(b13)"
  ],
  "0,3,6,10": [
    "min7b5"
  ],
  "0,3,7,8,10": [
    "min7(b13)",
    "minb6",
    "min(b13)"
  ],
  "0,2,3,7,10": [
    "min9"
  ],
  "0,2,7": [
    "sus2"
  ],
  "0,5,7": [
    "sus4"
  ],
  "0,4,7,9,10": [
    "13"
  ],
  "0,2,4,10": [
    "9"
  ],
  "0,2,4,11": [
    "maj13"
  ],
  "0,4,7,9,11": [
    "maj13"
  ],
  "0,2,4,9,11": [
    "maj13"
  ],
  "0,6,7,11": [
    "maj7#11"
  ],
  "0,2,7,11": [
    "maj9"
  ],
  "0,3,5,10": [
    "min11"
  ],
  "0,3,7,9,10": [
    "min13"
  ],
  "0,2,3,10": [
    "min9"
  ]
};

export interface AnalyzedChordResult { name: string; rootMidi: number; bassMidi: number; intervals: number[]; }

export function analyzeChord(midiPitches: number[]): AnalyzedChordResult[] {
  if (!midiPitches || midiPitches.length === 0) {
    return [];
  }

  // 3. The lowest pitch in midiPitches is the bass note.
  const lowestPitch = Math.min(...midiPitches);
  const bassPitchClass = lowestPitch % 12;
  const bassNoteName = NOTE_NAMES[bassPitchClass];

  // 2. Deduplicate pitch classes (0-11) from the midiPitches.
  const pitchClasses = Array.from(new Set(midiPitches.map((p) => p % 12)));
  
  const recognizedChords: AnalyzedChordResult[] = [];

  // 4. Iterate over every pitch class present as a potential root.
  for (const root of pitchClasses) {
    const rootName = NOTE_NAMES[root];

    // 5. For each potential root, map the remaining pitch classes to semitone intervals (0-11) relative to that root.
    const intervals = pitchClasses.map((pc) => (pc - root + 12) % 12);
    
    // Sort intervals conceptually building the chord
    intervals.sort((a, b) => a - b);
    
    const formulaString = intervals.join(",");

    // 6. Look up those intervals (sorted) in a dictionary of well-known chord formulas
    const chordTypes = FORMULA_TO_CHORD[formulaString];

    if (chordTypes) {
      for (const chordType of chordTypes) {
        // 7. Format the string: e.g. `C maj7`. If the bass note is NOT the root note, format it as a slash chord: `C maj7 / G`.
        let chordName = `${rootName} ${chordType}`;
        if (bassPitchClass !== root) {
          chordName += ` / ${bassNoteName}`;
        }
        recognizedChords.push({ name: chordName, rootMidi: root, bassMidi: bassPitchClass, intervals });
      }
    }
  }

  // 8. Return an array of all possible recognized names
  return recognizedChords;
}
