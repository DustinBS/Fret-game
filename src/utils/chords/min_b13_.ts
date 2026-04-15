import type { ChordDefinition } from '../chordLibrary.types';

export const min_b13_Chord: ChordDefinition = {
  "quality": "min(b13)",
  "shapes": [
    {
      "rootString": 4,
      "offsets": [
        {
          "string": 4,
          "offset": 0,
          "interval": "1"
        },
        {
          "string": 3,
          "offset": 2,
          "interval": "5"
        },
        {
          "string": 2,
          "offset": 0,
          "interval": "b7"
        },
        {
          "string": 1,
          "offset": 1,
          "interval": "b3"
        },
        {
          "string": 0,
          "offset": 1,
          "interval": "b13"
        }
      ]
    },
    {
      "rootString": 5,
      "offsets": [
        {
          "string": 5,
          "offset": 0,
          "interval": "1"
        },
        {
          "string": 4,
          "offset": 2,
          "interval": "5"
        },
        {
          "string": 3,
          "offset": 2,
          "interval": "1"
        },
        {
          "string": 2,
          "offset": 0,
          "interval": "b3"
        },
        {
          "string": 0,
          "offset": 0,
          "interval": "1"
        },
        {
          "string": 1,
          "offset": 3,
          "interval": "b7"
        }
      ]
    }
  ],
  "expectedIntervals": [
    "1",
    "b3",
    "5",
    "b7",
    "b13"
  ]
};
