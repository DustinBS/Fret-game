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

export const INTERVAL_COLORS: Record<string, { bg: string, text: string, hex: string }> = {
    '1':  { bg: 'bg-[#a6cee3]', text: 'text-slate-900', hex: '#a6cee3' }, // 0
    'b2': { bg: 'bg-[#1f78b4]', text: 'text-white',     hex: '#1f78b4' }, // 1
    '2':  { bg: 'bg-[#b2df8a]', text: 'text-slate-900', hex: '#b2df8a' }, // 2
    '9':  { bg: 'bg-[#b2df8a]', text: 'text-slate-900', hex: '#b2df8a' },
    'b3': { bg: 'bg-[#33a02c]', text: 'text-white',     hex: '#33a02c' }, // 3
    '3':  { bg: 'bg-[#fb9a99]', text: 'text-slate-900', hex: '#fb9a99' }, // 4
    '4':  { bg: 'bg-[#e31a1c]', text: 'text-white',     hex: '#e31a1c' }, // 5
    '11': { bg: 'bg-[#e31a1c]', text: 'text-white',     hex: '#e31a1c' },
    '#11':{ bg: 'bg-[#fdbf6f]', text: 'text-slate-900', hex: '#fdbf6f' }, // 6
    'b5': { bg: 'bg-[#fdbf6f]', text: 'text-slate-900', hex: '#fdbf6f' }, // 6
    '#4': { bg: 'bg-[#fdbf6f]', text: 'text-slate-900', hex: '#fdbf6f' }, // 6
    '5':  { bg: 'bg-[#ff7f00]', text: 'text-white',     hex: '#ff7f00' }, // 7
    '#5': { bg: 'bg-[#cab2d6]', text: 'text-slate-900', hex: '#cab2d6' }, // 8
    'b6': { bg: 'bg-[#cab2d6]', text: 'text-slate-900', hex: '#cab2d6' }, // 8
    '6':  { bg: 'bg-[#6a3d9a]', text: 'text-white',     hex: '#6a3d9a' }, // 9
    '13': { bg: 'bg-[#6a3d9a]', text: 'text-white',     hex: '#6a3d9a' },
    'b7': { bg: 'bg-[#facc15]', text: 'text-slate-900', hex: '#facc15' }, // 10
    '7':  { bg: 'bg-[#b15928]', text: 'text-white',     hex: '#b15928' }, // 11
};

export const getIntervalColor = (interval: string) => {
    const fallback = { bg: 'bg-slate-500', text: 'text-white' };
    const styles = INTERVAL_COLORS[interval] || fallback;
    return `${styles.bg} ${styles.text}`;
};

export const getIntervalHexColor = (interval: string) => {
    return INTERVAL_COLORS[interval]?.hex || '#64748b';
};

export const semitoneToIntervalString = (semitone: number, chordName?: string): string => {
   const c = (chordName || '').toLowerCase();
   
   if (semitone === 0) return '1';
   if (semitone === 1) return c.includes('b9') ? 'b9' : 'b2';
   if (semitone === 2) return (c.includes('9') || c.includes('11') || c.includes('13')) ? '9' : '2';
   if (semitone === 3) return c.includes('#9') ? '#9' : 'b3';
   if (semitone === 4) return '3';
   if (semitone === 5) return (c.includes('11') || c.includes('13')) ? '11' : '4';
   if (semitone === 6) {
       if (c.includes('#11')) return '#11';
       if (c.includes('#4')) return '#4';
       return 'b5';
   }
   if (semitone === 7) return '5';
   if (semitone === 8) {
       if (c.includes('#5') || c.includes('aug')) return '#5';
       if (c.includes('b13')) return 'b13';
       return 'b6';
   }
   if (semitone === 9) {
       if (c.includes('13')) return '13';
       if (c.includes('dim7')) return 'bb7';
       return '6';
   }
   if (semitone === 10) return 'b7';
   if (semitone === 11) return '7';
   return '?';
};