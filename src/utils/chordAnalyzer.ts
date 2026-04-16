export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export interface Template { qualities: string[]; req: number[]; opt: number[]; }

export const TEMPLATES: Template[] = [
  // Triads
  { qualities: ['maj'], req: [0,4], opt: [7] },
  { qualities: ['min'], req: [0,3], opt: [7] },
  { qualities: ['dim'], req: [0,3,6], opt: [] },
  { qualities: ['aug'], req: [0,4,8], opt: [] },
  { qualities: ['sus2'], req: [0,2], opt: [7] },
  { qualities: ['sus4'], req: [0,5], opt: [7] },

  // 7ths
  { qualities: ['maj7'], req: [0,4,11], opt: [7] },
  { qualities: ['min7'], req: [0,3,10], opt: [7] },
  { qualities: ['7'], req: [0,4,10], opt: [7] },
  { qualities: ['dim7'], req: [0,3,6,9], opt: [] },
  { qualities: ['min7b5', 'half-dim'], req: [0,3,6,10], opt: [] },
  { qualities: ['maj6'], req: [0,4,9], opt: [7] },
  { qualities: ['min6'], req: [0,3,9], opt: [7] },
  
  // 7sus4
  { qualities: ['7sus4'], req: [0,5,10], opt: [7] },
  { qualities: ['aug7'], req: [0,4,8,10], opt: [] },

  // Extensions
  { qualities: ['maj9'], req: [0,11,2], opt: [4,7] },
  { qualities: ['min9'], req: [0,3,10,2], opt: [7] },
  { qualities: ['9'], req: [0,10,2], opt: [4,7] },

  { qualities: ['maj13'], req: [0,11,9], opt: [4,7,2,5] }, 
  { qualities: ['min13'], req: [0,3,10,9], opt: [7,2,5] }, 
  { qualities: ['13'], req: [0,10,9], opt: [4,7,2,5] }, 

  { qualities: ['min11'], req: [0,3,10,5], opt: [7,2] },
  { qualities: ['min11(b5)'], req: [0,3,6,10,5], opt: [2] },

  { qualities: ['minb6'], req: [0,3,8], opt: [7] },
  { qualities: ['min(b13)', 'min7(b13)'], req: [0,3,10,8], opt: [7,2,5] },

  { qualities: ['maj7#11'], req: [0,11,6], opt: [4,7,2] },
];

export interface AnalyzedChordResult { name: string; rootMidi: number; bassMidi: number; intervals: number[]; }

export function analyzeChord(midiPitches: number[]): AnalyzedChordResult[] {
  if (!midiPitches || midiPitches.length === 0) {
    return [];
  }

  const lowestPitch = Math.min(...midiPitches);
  const bassPitchClass = lowestPitch % 12;
  const bassNoteName = NOTE_NAMES[bassPitchClass];

  const pitchClasses = Array.from(new Set(midiPitches.map((p) => p % 12)));
  const recognizedChords: AnalyzedChordResult[] = [];

  for (const root of pitchClasses) {
    const rootName = NOTE_NAMES[root];
    const intervals = pitchClasses.map((pc) => (pc - root + 12) % 12);
    intervals.sort((a, b) => a - b);

    // Rule matching
    for (const t of TEMPLATES) {
      const hasAllReq = t.req.every(r => intervals.includes(r));
      const noExtra = intervals.every(i => t.req.includes(i) || t.opt.includes(i));
      
      if (hasAllReq && noExtra) {
        for (const chordType of t.qualities) {
          let chordName = `${rootName} ${chordType}`;
          if (bassPitchClass !== root) {
            chordName += ` / ${bassNoteName}`;
          }
          if (!recognizedChords.find(c => c.name === chordName)) {
            recognizedChords.push({ name: chordName, rootMidi: root, bassMidi: bassPitchClass, intervals });
          }
        }
      }
    }
  }

  // Sort results to prioritize those with matching bass (i.e. not slash chords)
  recognizedChords.sort((a, b) => {
    const aIsSlash = a.bassMidi !== a.rootMidi;
    const bIsSlash = b.bassMidi !== b.rootMidi;
    return (aIsSlash === bIsSlash) ? 0 : aIsSlash ? 1 : -1;
  });

  return recognizedChords;
}