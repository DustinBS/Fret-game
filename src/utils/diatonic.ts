export const DIATONIC_INTERVALS: Record<string, number> = {
  "I": 0,
  "ii": 2,
  "iii": 4,
  "IV": 5,
  "V": 7,
  "vi": 9,
  "viio": 11
};

// Derived directly from diatonic_chord_map provided by user
export const CHORD_QUALITY_DIATONIC_MAP: Record<string, string[]> = {
  "major": ["I", "IV", "V"],
  "minor": ["ii", "iii", "vi"],
  "diminished": ["viio"],
  "dim7": [], // Not naturally occurring in major scale
  "6": ["I", "IV", "V"],
  "maj7": ["I", "IV"],
  "maj9": ["I", "IV"],
  "sus4": ["I"],
  "maj13": ["I", "IV"],
  "min6": ["ii"],
  "min7": ["ii", "iii", "vi"],
  "min9": ["ii", "vi"],
  "min11": ["ii", "iii", "vi"],
  "min13": ["ii"],
  "minb6": ["iii", "vi"],
  "maj7#11": ["IV"],
  "7": ["V"],
  "9": ["V"],
  "7sus4": ["V"],
  "13": ["V"],
  "min(b13)": ["vi"],
  "min7b5": ["viio"],
  "min11(b5)": ["viio"]
};
