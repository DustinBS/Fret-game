export const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const getNoteName = (midi: number, isFlat: boolean) => {
  const names = isFlat ? NOTES_FLAT : NOTES_SHARP;
  const note = names[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return { note, octave };
};

export function getNoteNameFromPitchClass(pitchClass: number, useFlats: boolean) {
  return useFlats ? NOTES_FLAT[pitchClass] : NOTES_SHARP[pitchClass];
}

// Map Pitch Class (0-11) to Staff Letter Index (0=C...6=B)
export const getLetterIndices = (isFlat: boolean) => {
    if (isFlat) {
        // C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B
        return [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];
    } else {
        // C, C#, D, D#, E, F, F#, G, G#, A, A#, B
        return [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
    }
};

// Standard Tuning High E to Low E (Visual Top to Bottom)
export const TUNING = [64, 59, 55, 50, 45, 40];

export const STRING_NAMES = ['Str 1e', 'Str 2B', 'Str 3G', 'Str 4D', 'Str 5A', 'Str 6E'];

export const getIntervalColor = (interval: string) => {
    switch (interval) {
        case '1': return 'bg-red-600 text-white';
        case 'b2': case '2': case '9': return 'bg-orange-500 text-white';
        case 'b3': case '3': return 'bg-yellow-400 text-slate-900';
        case '4': case '11': case '#11': return 'bg-green-500 text-white';
        case 'b5': case '5': case '#5': return 'bg-cyan-500 text-white';
        case 'b6': case '6': case '13': return 'bg-blue-600 text-white';
        case 'bb7': case 'b7': case '7': return 'bg-purple-600 text-white';
        default: return 'bg-slate-500 text-white';
    }
};


export const getIntervalHexColor = (interval: string) => {
    switch (interval) {
        case '1': return '#dc2626';
        case 'b2': case '2': case '9': return '#f97316';
        case 'b3': case '3': return '#facc15';
        case '4': case '11': case '#11': return '#22c55e';
        case 'b5': case '5': case '#5': return '#06b6d4';
        case 'b6': case '6': case '13': return '#2563eb';
        case 'bb7': case 'b7': case '7': return '#9333ea';
        default: return '#64748b';
    }
};

export const semitoneToIntervalString = (semitone: number): string => {
   const map: Record<number, string> = {
      0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: 'b5', 7: '5', 8: '#5', 9: '6', 10: 'b7', 11: '7'
   };
   return map[semitone] || '?';
};