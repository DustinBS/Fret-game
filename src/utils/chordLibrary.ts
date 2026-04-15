export type ChordShape = {
  rootString: number;
  offsets: { string: number; offset: number; interval: string }[];
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
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 4, offset: 2, interval: '5' }, { string: 3, offset: 2, interval: '1' }, { string: 2, offset: 1, interval: '3' }, { string: 1, offset: 0, interval: '5' }, { string: 0, offset: 0, interval: '1' }] }, // E major shape
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 2, interval: '5' }, { string: 2, offset: 2, interval: '1' }, { string: 1, offset: 2, interval: '3' }, { string: 0, offset: 0, interval: '5' }] }, // A major shape
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 2, interval: '5' }, { string: 1, offset: 3, interval: '1' }, { string: 0, offset: 2, interval: '3' }] } // D major shape
    ]
  },
  {
    quality: "minor",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 4, offset: 2, interval: '5' }, { string: 3, offset: 2, interval: '1' }, { string: 2, offset: 0, interval: 'b3' }, { string: 1, offset: 0, interval: '5' }, { string: 0, offset: 0, interval: '1' }] }, // E minor shape
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 2, interval: '5' }, { string: 2, offset: 2, interval: '1' }, { string: 1, offset: 1, interval: 'b3' }, { string: 0, offset: 0, interval: '5' }] }, // A minor shape
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 2, interval: '5' }, { string: 1, offset: 3, interval: '1' }, { string: 0, offset: 1, interval: 'b3' }] } // D minor shape
    ]
  },
  {
    quality: "diminished",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 4, offset: 1, interval: 'b5' }, { string: 2, offset: 0, interval: 'b3' }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 1, interval: 'b5' }, { string: 2, offset: 2, interval: '1' }, { string: 1, offset: 1, interval: 'b3' }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 1, interval: 'b5' }, { string: 0, offset: 1, interval: 'b3' }] }
    ]
  },
  {
    quality: "dim7",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 3, offset: -1, interval: '6' }, { string: 2, offset: 0, interval: 'b3' }, { string: 1, offset: -1, interval: 'b5' }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 1, interval: 'b5' }, { string: 2, offset: -1, interval: '6' }, { string: 1, offset: 1, interval: 'b3' }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 1, interval: 'b5' }, { string: 1, offset: 0, interval: '6' }, { string: 0, offset: 1, interval: 'b3' }] }
    ]
  },
  {
    quality: "6",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 4, offset: 2, interval: '5' }, { string: 3, offset: 2, interval: '1' }, { string: 2, offset: 1, interval: '3' }, { string: 1, offset: 2, interval: '6' }, { string: 0, offset: 0, interval: '1' }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 2, interval: '5' }, { string: 2, offset: 2, interval: '1' }, { string: 1, offset: 2, interval: '3' }, { string: 0, offset: 2, interval: '6' }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 2, interval: '5' }, { string: 1, offset: 0, interval: '6' }, { string: 0, offset: 2, interval: '3' }] }
    ]
  },
  {
    quality: "maj7",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 3, offset: 1, interval: '7' }, { string: 2, offset: 1, interval: '3' }, { string: 1, offset: 0, interval: '5' }] }, // Drop 2
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 2, interval: '5' }, { string: 2, offset: 1, interval: '7' }, { string: 1, offset: 2, interval: '3' }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 2, interval: '5' }, { string: 1, offset: 2, interval: '7' }, { string: 0, offset: 2, interval: '3' }] }
    ]
  },
  {
    quality: "maj9",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 3, offset: 1, interval: '7' }, { string: 2, offset: 3, interval: 'b5' }, { string: 1, offset: 0, interval: '5' }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 2, interval: '5' }, { string: 2, offset: 1, interval: '7' }, { string: 1, offset: 0, interval: '9' }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 2, interval: '5' }, { string: 1, offset: 2, interval: '7' }, { string: 0, offset: 0, interval: '9' }] }
    ]
  },
  {
    quality: "sus4",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 4, offset: 2, interval: '5' }, { string: 3, offset: 2, interval: '1' }, { string: 2, offset: 2, interval: '4' }, { string: 1, offset: 0, interval: '5' }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 2, interval: '5' }, { string: 2, offset: 2, interval: '1' }, { string: 1, offset: 3, interval: '4' }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 2, interval: '5' }, { string: 1, offset: 3, interval: '1' }, { string: 0, offset: 3, interval: '4' }] }
    ]
  },
  {
    quality: "maj13",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 3, offset: 1, interval: '7' }, { string: 2, offset: 1, interval: '3' }, { string: 1, offset: 2, interval: '13' }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 2, interval: '5' }, { string: 2, offset: 1, interval: '7' }, { string: 1, offset: 2, interval: '3' }, { string: 0, offset: 2, interval: '13' }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 1, offset: 2, interval: '7' }, { string: 0, offset: 2, interval: '3' }] }
    ]
  },
  {
    quality: "min6",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 3, offset: 2, interval: '1' }, { string: 2, offset: 0, interval: 'b3' }, { string: 1, offset: 2, interval: '6' }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 2, interval: '5' }, { string: 2, offset: 1, interval: '7' }, { string: 1, offset: 1, interval: 'b3' }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 2, interval: '5' }, { string: 1, offset: 0, interval: '6' }, { string: 0, offset: 1, interval: 'b3' }] }
    ]
  },
  {
    quality: "min7",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 3, offset: 0, interval: 'b7' }, { string: 2, offset: 0, interval: 'b3' }, { string: 1, offset: 0, interval: '5' }] }, // Drop 2
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 2, interval: '5' }, { string: 2, offset: 0, interval: 'b7' }, { string: 1, offset: 1, interval: 'b3' }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 2, interval: '5' }, { string: 1, offset: 1, interval: 'b7' }, { string: 0, offset: 1, interval: 'b3' }] }
    ]
  },
  {
    quality: "min9",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 3, offset: 0, interval: 'b7' }, { string: 2, offset: 0, interval: 'b3' }, { string: 1, offset: 2, interval: '6' }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 2, interval: '5' }, { string: 2, offset: 0, interval: 'b7' }, { string: 1, offset: 0, interval: '9' }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 2, interval: '5' }, { string: 1, offset: 1, interval: 'b7' }, { string: 0, offset: 0, interval: '9' }] }
    ]
  },
  {
    quality: "min11",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 3, offset: 0, interval: 'b7' }, { string: 2, offset: 0, interval: 'b3' }, { string: 1, offset: 0, interval: '5' }, { string: 0, offset: 0, interval: '1' }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 2, interval: '5' }, { string: 2, offset: 0, interval: 'b7' }, { string: 1, offset: 1, interval: 'b3' }, { string: 0, offset: 3, interval: 'b7' }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 2, interval: '5' }, { string: 1, offset: 1, interval: 'b7' }, { string: 0, offset: 1, interval: 'b3' }] }
    ]
  },
  {
    quality: "min13",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 3, offset: 0, interval: 'b7' }, { string: 2, offset: 0, interval: 'b3' }, { string: 1, offset: 2, interval: '13' }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 2, interval: '5' }, { string: 2, offset: 0, interval: 'b7' }, { string: 1, offset: 1, interval: 'b3' }, { string: 0, offset: 2, interval: '13' }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 2, interval: '5' }, { string: 1, offset: 1, interval: 'b7' }, { string: 0, offset: 1, interval: 'b3' }] }
    ]
  },
  {
    quality: "minb6",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 4, offset: 3, interval: 'b6' }, { string: 3, offset: 2, interval: '1' }, { string: 2, offset: 0, interval: 'b3' }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 2, interval: '5' }, { string: 2, offset: 1, interval: '7' }, { string: 1, offset: 2, interval: '3' }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 2, interval: '5' }, { string: 1, offset: 2, interval: '7' }, { string: 0, offset: 1, interval: 'b3' }] }
    ]
  },
  {
    quality: "maj7#11",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 4, offset: 1, interval: '#11' }, { string: 3, offset: 2, interval: '1' }, { string: 2, offset: 1, interval: '3' }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 2, interval: '5' }, { string: 2, offset: 1, interval: '7' }, { string: 1, offset: 4, interval: '#11' }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 2, interval: '5' }, { string: 1, offset: 2, interval: '7' }, { string: 0, offset: 4, interval: '#11' }] }
    ]
  },
  {
    quality: "7",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 3, offset: 0, interval: 'b7' }, { string: 2, offset: 1, interval: '3' }, { string: 1, offset: 0, interval: '5' }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 2, interval: '5' }, { string: 2, offset: 0, interval: 'b7' }, { string: 1, offset: 2, interval: '3' }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 2, interval: '5' }, { string: 1, offset: 1, interval: 'b7' }, { string: 0, offset: 2, interval: '3' }] }
    ]
  },
  {
    quality: "9",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 3, offset: 0, interval: 'b7' }, { string: 2, offset: 1, interval: '3' }, { string: 1, offset: 2, interval: '6' }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 2, interval: '5' }, { string: 2, offset: 0, interval: 'b7' }, { string: 1, offset: 0, interval: '9' }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 2, interval: '5' }, { string: 1, offset: 1, interval: 'b7' }, { string: 0, offset: 0, interval: '9' }] }
    ]
  },
  {
    quality: "7sus4",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 3, offset: 0, interval: 'b7' }, { string: 2, offset: 2, interval: '4' }, { string: 1, offset: 0, interval: '5' }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 2, interval: '5' }, { string: 2, offset: 0, interval: 'b7' }, { string: 1, offset: 3, interval: '4' }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 2, interval: '5' }, { string: 1, offset: 3, interval: '1' }, { string: 0, offset: 3, interval: '4' }] }
    ]
  },
  {
    quality: "13",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 3, offset: 0, interval: 'b7' }, { string: 2, offset: 1, interval: '3' }, { string: 1, offset: 2, interval: '13' }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 2, interval: '5' }, { string: 2, offset: 0, interval: 'b7' }, { string: 1, offset: 2, interval: '3' }, { string: 0, offset: 2, interval: '13' }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 2, interval: '5' }, { string: 1, offset: 1, interval: 'b7' }, { string: 0, offset: 4, interval: 'b5' }] }
    ]
  },
  {
    quality: "min(b13)",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 4, offset: 3, interval: 'b6' }, { string: 3, offset: 2, interval: '1' }, { string: 2, offset: 0, interval: 'b3' }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 2, interval: '5' }, { string: 2, offset: 0, interval: 'b7' }, { string: 1, offset: 1, interval: 'b3' }, { string: 0, offset: 1, interval: 'b6' }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 2, interval: '5' }, { string: 1, offset: 1, interval: 'b7' }, { string: 0, offset: 1, interval: 'b3' }] }
    ]
  },
  {
    quality: "min7b5",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 3, offset: 0, interval: 'b7' }, { string: 2, offset: 0, interval: 'b3' }, { string: 1, offset: -1, interval: 'b5' }] }, // Or string:1 offset:0 but flat 5 is lower. Adjusted to realistic drop.
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 1, interval: 'b5' }, { string: 2, offset: 0, interval: 'b7' }, { string: 1, offset: 1, interval: 'b3' }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 1, interval: 'b5' }, { string: 1, offset: 1, interval: 'b7' }, { string: 0, offset: 1, interval: 'b3' }] }
    ]
  },
  {
    quality: "min11(b5)",
    shapes: [
      { rootString: 5, offsets: [{ string: 5, offset: 0, interval: '1' }, { string: 4, offset: 1, interval: 'b5' }, { string: 3, offset: 0, interval: 'b7' }, { string: 2, offset: 0, interval: 'b3' }] },
      { rootString: 4, offsets: [{ string: 4, offset: 0, interval: '1' }, { string: 3, offset: 1, interval: 'b5' }, { string: 2, offset: 0, interval: 'b7' }, { string: 1, offset: 1, interval: 'b3' }, { string: 0, offset: 3, interval: 'b7' }] },
      { rootString: 3, offsets: [{ string: 3, offset: 0, interval: '1' }, { string: 2, offset: 1, interval: 'b5' }, { string: 1, offset: 1, interval: 'b7' }, { string: 0, offset: 1, interval: 'b3' }] }
    ]
  }
];
