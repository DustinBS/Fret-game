export const DIATONIC_INTERVALS: Record<string, number> = {
  "I": 0,
  "ii": 2,
  "iii": 4,
  "IV": 5,
  "V": 7,
  "vi": 9,
  "viio": 11
};

export const DIATONIC_DATA = {
  "I": {
    "triad": "maj",
    "extensions": { "6": "maj6", "7": "maj7", "9": "maj9", "11": "sus4", "13": "maj13" }
  },
  "ii": {
    "triad": "min",
    "extensions": { "6": "min6", "7": "min7", "9": "min9", "11": "min11", "13": "min13" }
  },
  "iii": {
    "triad": "min",
    "extensions": { "6": "minb6", "7": "min7", "11": "min11", "13": "min7(b13)" }
  },
  "IV": {
    "triad": "maj",
    "extensions": { "6": "maj6", "7": "maj7", "9": "maj9", "11": "maj7#11", "13": "maj13" }
  },
  "V": {
    "triad": "maj",
    "extensions": { "6": "maj6", "7": "7", "9": "9", "11": "7sus4", "13": "13" }
  },
  "vi": {
    "triad": "min",
    "extensions": { "6": "minb6", "7": "min7", "9": "min9", "11": "min11", "13": "min(b13)" }
  },
  "viio": {
    "triad": "dim",
    "extensions": { "7": "min7b5", "11": "min11(b5)" }
  }
};

// Derived directly from DIATONIC_DATA
export const CHORD_QUALITY_DIATONIC_MAP: Record<string, string[]> = {};

for (const [numeral, data] of Object.entries(DIATONIC_DATA)) {
  if (!CHORD_QUALITY_DIATONIC_MAP[data.triad]) {
    CHORD_QUALITY_DIATONIC_MAP[data.triad] = [];
  }
  if (!CHORD_QUALITY_DIATONIC_MAP[data.triad].includes(numeral)) {
    CHORD_QUALITY_DIATONIC_MAP[data.triad].push(numeral);
  }
  
  for (const extValue of Object.values(data.extensions)) {
    if (!CHORD_QUALITY_DIATONIC_MAP[extValue]) {
      CHORD_QUALITY_DIATONIC_MAP[extValue] = [];
    }
    if (!CHORD_QUALITY_DIATONIC_MAP[extValue].includes(numeral)) {
      CHORD_QUALITY_DIATONIC_MAP[extValue].push(numeral);
    }
  }
}

