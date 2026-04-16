export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export interface Template { qualities: string[]; req: number[]; opt: number[]; score?: number; }

export const TEMPLATES: Template[] = [
  // --- Dictionary (Score 0) ---
  { qualities: ['maj'], req: [0,4], opt: [7], score: 0 },
  { qualities: ['min'], req: [0,3], opt: [7], score: 0 },
  { qualities: ['dim'], req: [0,3,6], opt: [], score: 0 },
  { qualities: ['aug'], req: [0,4,8], opt: [], score: 0 },
  { qualities: ['sus2'], req: [0,2], opt: [7], score: 0 },
  { qualities: ['sus4'], req: [0,5], opt: [7], score: 0 },

  { qualities: ['maj7'], req: [0,4,11], opt: [7], score: 0 },
  { qualities: ['min7'], req: [0,3,10], opt: [7], score: 0 },
  { qualities: ['7'], req: [0,4,10], opt: [7], score: 0 },
  { qualities: ['dim7'], req: [0,3,6,9], opt: [], score: 0 },
  { qualities: ['min7b5', 'half-dim'], req: [0,3,6,10], opt: [], score: 0 },
  { qualities: ['maj6'], req: [0,4,9], opt: [7], score: 0 },
  { qualities: ['min6'], req: [0,3,9], opt: [7], score: 0 },
  
  { qualities: ['7sus4'], req: [0,5,10], opt: [7], score: 0 },
  { qualities: ['aug7'], req: [0,4,8,10], opt: [], score: 0 },

  { qualities: ['maj9'], req: [0,11,2], opt: [4,7], score: 0 },
  { qualities: ['min9'], req: [0,3,10,2], opt: [7], score: 0 },
  { qualities: ['9'], req: [0,10,2], opt: [4,7], score: 0 },

  { qualities: ['maj13'], req: [0,11,9], opt: [4,7,2,5], score: 0 }, 
  { qualities: ['min13'], req: [0,3,10,9], opt: [7,2,5], score: 0 }, 
  { qualities: ['13'], req: [0,10,9], opt: [4,7,2,5], score: 0 }, 

  { qualities: ['min11'], req: [0,3,10,5], opt: [7,2], score: 0 },
  { qualities: ['min11(b5)'], req: [0,3,6,10,5], opt: [2], score: 0 },

  { qualities: ['minb6'], req: [0,3,8], opt: [7], score: 0 },
  { qualities: ['min(b13)', 'min7(b13)'], req: [0,3,10,8], opt: [7,2,5], score: 0 },

  { qualities: ['maj7#11'], req: [0,11,6], opt: [4,7,2], score: 0 },

  // --- Common Additions (Score 1) ---
  { qualities: ['add9'], req: [0,4,2], opt: [7], score: 1 },
  { qualities: ['m(add9)'], req: [0,3,2], opt: [7], score: 1 },
  { qualities: ['m(add11)'], req: [0,3,5], opt: [7], score: 1 },
  { qualities: ['6/9'], req: [0,4,9,2], opt: [7], score: 1 },
  { qualities: ['m6/9'], req: [0,3,9,2], opt: [7], score: 1 },
  { qualities: ['sus4add9', 'sus2/4'], req: [0,5,2], opt: [7], score: 1 },
  { qualities: ['dim(add11)'], req: [0,3,6,5], opt: [], score: 1 },
  { qualities: ['m7(b5,11)'], req: [0,3,6,10,5], opt: [], score: 1 },
  { qualities: ['m7(b5,b13)'], req: [0,3,6,10,8], opt: [], score: 1 },
  { qualities: ['sus4(b5)'], req: [0,5,6], opt: [7], score: 1 },
  { qualities: ['7sus4(b5)'], req: [0,5,6,10], opt: [7], score: 1 },
  { qualities: ['7(b9)'], req: [0,4,10,1], opt: [7], score: 1 },
  { qualities: ['7(#9)'], req: [0,4,10,3], opt: [7], score: 1 },
  { qualities: ['7(b9,#11)'], req: [0,4,10,1,6], opt: [7], score: 1 },
  { qualities: ['maj7(b5)'], req: [0,4,6,11], opt: [], score: 1 },
  
  // --- Uncommon Additions (Score 2) ---
  { qualities: ['maj7sus2'], req: [0,2,11], opt: [7], score: 2 },
  { qualities: ['maj7sus4'], req: [0,5,11], opt: [7], score: 2 },
  { qualities: ['6sus2'], req: [0,2,9], opt: [7], score: 2 },
  { qualities: ['6sus4'], req: [0,5,9], opt: [7], score: 2 },
  { qualities: ['6(11)'], req: [0,4,9,5], opt: [7], score: 2 },
  { qualities: ['7sus2'], req: [0,2,10], opt: [7], score: 2 },
  { qualities: ['m6(11)'], req: [0,3,9,5], opt: [7], score: 2 },
  { qualities: ['7susb2'], req: [0,1,10], opt: [7], score: 2 },
  { qualities: ['m(b6,11)'], req: [0,3,8,5], opt: [7], score: 2 },
  { qualities: ['dim(b6)'], req: [0,3,6,8], opt: [], score: 2 },
  { qualities: ['sus4(b5,b6)'], req: [0,5,6,8], opt: [], score: 2 },
  { qualities: ['m(b5,b6,11)'], req: [0,3,6,8,5], opt: [], score: 2 }
];

export interface AnalyzedChordResult { name: string; rootMidi: number; bassMidi: number; intervals: number[]; score: number; }

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
            recognizedChords.push({ name: chordName, rootMidi: root, bassMidi: bassPitchClass, intervals, score: t.score ?? 0 });
          }
        }
      }
    }
  }

  // Sort results to prioritize primarily those with matching bass (i.e. not slash chords), then by score (0 first)
  recognizedChords.sort((a, b) => {
    const aIsSlash = a.bassMidi !== a.rootMidi;
    const bIsSlash = b.bassMidi !== b.rootMidi;
    if (aIsSlash !== bIsSlash) return aIsSlash ? 1 : -1;
    return a.score - b.score;
  });

  return recognizedChords;
}