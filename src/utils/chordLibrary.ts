export type ChordShape = {
  rootString: number;
  offsets: { string: number; offset: number }[];
};

export type ChordDefinition = {
  quality: string;
  shapes: ChordShape[];
};

// String layout:
// 0: High E
// 1: B   
// 2: G   
// 3: D   
// 4: A   
// 5: Low E

export const CHORD_DICTIONARY: ChordDefinition[] = [
  {
    quality: "major",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 4, offset: 2 }, { string: 3, offset: 2 }, { string: 2, offset: 1 }, { string: 1, offset: 0 }, { string: 0, offset: 0 }] }, // E major shape
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 2 }, { string: 2, offset: 2 }, { string: 1, offset: 2 }, { string: 0, offset: 0 }] }, // A major shape
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 2, offset: 2 }, { string: 1, offset: 3 }, { string: 0, offset: 2 }] } // D major shape
    ]
  },
  {
    quality: "minor",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 4, offset: 2 }, { string: 3, offset: 2 }, { string: 2, offset: 0 }, { string: 1, offset: 0 }, { string: 0, offset: 0 }] }, // E minor shape
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 2 }, { string: 2, offset: 2 }, { string: 1, offset: 1 }, { string: 0, offset: 0 }] }, // A minor shape
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 2, offset: 2 }, { string: 1, offset: 3 }, { string: 0, offset: 1 }] } // D minor shape
    ]
  },
  {
    quality: "diminished",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 4, offset: 1 }, { string: 3, offset: 2 }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 1 }, { string: 2, offset: 2 }, { string: 1, offset: 1 }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 2, offset: 1 }, { string: 1, offset: 2 }, { string: 0, offset: 1 }] }
    ]
  },
  {
    quality: "6",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 4, offset: 2 }, { string: 3, offset: 2 }, { string: 2, offset: 1 }, { string: 1, offset: 2 }, { string: 0, offset: 0 }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 2 }, { string: 2, offset: 2 }, { string: 1, offset: 2 }, { string: 0, offset: 2 }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 2, offset: 2 }, { string: 1, offset: 0 }, { string: 0, offset: 2 }] }
    ]
  },
  {
    quality: "maj7",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 3, offset: 1 }, { string: 2, offset: 1 }, { string: 1, offset: 0 }] }, // Drop 2
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 2 }, { string: 2, offset: 1 }, { string: 1, offset: 2 }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 2, offset: 2 }, { string: 1, offset: 2 }, { string: 0, offset: 2 }] }
    ]
  },
  {
    quality: "maj9",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 3, offset: 1 }, { string: 2, offset: 3 }, { string: 1, offset: 0 }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 2 }, { string: 2, offset: 1 }, { string: 1, offset: 0 }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 2, offset: 2 }, { string: 1, offset: 2 }, { string: 0, offset: 0 }] }
    ]
  },
  {
    quality: "sus4",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 4, offset: 2 }, { string: 3, offset: 2 }, { string: 2, offset: 2 }, { string: 1, offset: 0 }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 2 }, { string: 2, offset: 2 }, { string: 1, offset: 3 }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 2, offset: 2 }, { string: 1, offset: 3 }, { string: 0, offset: 3 }] }
    ]
  },
  {
    quality: "maj13",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 3, offset: 1 }, { string: 2, offset: 1 }, { string: 1, offset: 2 }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 2 }, { string: 2, offset: 1 }, { string: 1, offset: 2 }, { string: 0, offset: 2 }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 1, offset: 2 }, { string: 0, offset: 2 }] }
    ]
  },
  {
    quality: "min6",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 3, offset: 2 }, { string: 2, offset: 0 }, { string: 1, offset: 2 }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 2 }, { string: 2, offset: 1 }, { string: 1, offset: 1 }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 2, offset: 2 }, { string: 1, offset: 0 }, { string: 0, offset: 1 }] }
    ]
  },
  {
    quality: "min7",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 3, offset: 0 }, { string: 2, offset: 0 }, { string: 1, offset: 0 }] }, // Drop 2
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 2 }, { string: 2, offset: 0 }, { string: 1, offset: 1 }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 2, offset: 2 }, { string: 1, offset: 1 }, { string: 0, offset: 1 }] }
    ]
  },
  {
    quality: "min9",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 3, offset: 0 }, { string: 2, offset: 0 }, { string: 1, offset: 2 }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 2 }, { string: 2, offset: 0 }, { string: 1, offset: 0 }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 2, offset: 2 }, { string: 1, offset: 1 }, { string: 0, offset: 0 }] }
    ]
  },
  {
    quality: "min11",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 3, offset: 0 }, { string: 2, offset: 0 }, { string: 1, offset: 0 }, { string: 0, offset: 0 }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 2 }, { string: 2, offset: 0 }, { string: 1, offset: 1 }, { string: 0, offset: 3 }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 2, offset: 2 }, { string: 1, offset: 1 }, { string: 0, offset: 1 }] }
    ]
  },
  {
    quality: "min13",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 3, offset: 0 }, { string: 2, offset: 0 }, { string: 1, offset: 2 }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 2 }, { string: 2, offset: 0 }, { string: 1, offset: 1 }, { string: 0, offset: 2 }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 2, offset: 2 }, { string: 1, offset: 1 }, { string: 0, offset: 1 }] }
    ]
  },
  {
    quality: "minb6",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 4, offset: 3 }, { string: 3, offset: 2 }, { string: 2, offset: 0 }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 2 }, { string: 2, offset: 1 }, { string: 1, offset: 2 }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 2, offset: 2 }, { string: 1, offset: 2 }, { string: 0, offset: 1 }] }
    ]
  },
  {
    quality: "maj7#11",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 4, offset: 1 }, { string: 3, offset: 2 }, { string: 2, offset: 1 }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 2 }, { string: 2, offset: 1 }, { string: 1, offset: 4 }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 2, offset: 2 }, { string: 1, offset: 2 }, { string: 0, offset: 4 }] }
    ]
  },
  {
    quality: "7",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 3, offset: 0 }, { string: 2, offset: 1 }, { string: 1, offset: 0 }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 2 }, { string: 2, offset: 0 }, { string: 1, offset: 2 }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 2, offset: 2 }, { string: 1, offset: 1 }, { string: 0, offset: 2 }] }
    ]
  },
  {
    quality: "9",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 3, offset: 0 }, { string: 2, offset: 1 }, { string: 1, offset: 2 }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 2 }, { string: 2, offset: 0 }, { string: 1, offset: 0 }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 2, offset: 2 }, { string: 1, offset: 1 }, { string: 0, offset: 0 }] }
    ]
  },
  {
    quality: "7sus4",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 3, offset: 0 }, { string: 2, offset: 2 }, { string: 1, offset: 0 }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 2 }, { string: 2, offset: 0 }, { string: 1, offset: 3 }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 2, offset: 2 }, { string: 1, offset: 3 }, { string: 0, offset: 3 }] }
    ]
  },
  {
    quality: "13",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 3, offset: 0 }, { string: 2, offset: 1 }, { string: 1, offset: 2 }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 2 }, { string: 2, offset: 0 }, { string: 1, offset: 2 }, { string: 0, offset: 2 }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 2, offset: 2 }, { string: 1, offset: 1 }, { string: 0, offset: 4 }] }
    ]
  },
  {
    quality: "min(b13)",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 4, offset: 3 }, { string: 3, offset: 2 }, { string: 2, offset: 0 }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 2 }, { string: 2, offset: 0 }, { string: 1, offset: 1 }, { string: 0, offset: 1 }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 2, offset: 2 }, { string: 1, offset: 1 }, { string: 0, offset: 1 }] }
    ]
  },
  {
    quality: "min7b5",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 3, offset: 0 }, { string: 2, offset: 0 }, { string: 1, offset: -1 }] }, // Or string:1 offset:0 but flat 5 is lower. Adjusted to realistic drop.
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 1 }, { string: 2, offset: 0 }, { string: 1, offset: 1 }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 2, offset: 1 }, { string: 1, offset: 1 }, { string: 0, offset: 1 }] }
    ]
  },
  {
    quality: "min11(b5)",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0 }, { string: 4, offset: 1 }, { string: 3, offset: 0 }, { string: 2, offset: 0 }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0 }, { string: 3, offset: 1 }, { string: 2, offset: 0 }, { string: 1, offset: 1 }, { string: 0, offset: 3 }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0 }, { string: 2, offset: 1 }, { string: 1, offset: 1 }, { string: 0, offset: 1 }] }
    ]
  }
];
