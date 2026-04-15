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
