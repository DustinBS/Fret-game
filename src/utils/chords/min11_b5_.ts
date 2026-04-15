import type { ChordDefinition } from '../chordLibrary.types';

export const min11_b5_Chord: ChordDefinition = {
  "quality": "min11(b5)",
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
          "offset": -1,
          "interval": "b5"
        },
        {
          "string": 3,
          "offset": 0,
          "interval": "11"
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
          "string": 3,
          "offset": 0,
          "interval": "b7"
        },
        {
          "string": 2,
          "offset": 0,
          "interval": "b3"
        },
        {
          "string": 1,
          "offset": -1,
          "interval": "b5"
        },
        {
          "string": 0,
          "offset": 0,
          "interval": "1"
        },
        {
          "string": 4,
          "offset": 0,
          "interval": "11"
        }
      ]
    }
  ],
  "expectedIntervals": [
    "1",
    "b3",
    "b5",
    "b7",
    "11"
  ]
};
