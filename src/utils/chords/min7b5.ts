import type { ChordDefinition } from '../chordLibrary.types';

export const min7b5Chord: ChordDefinition = {
  "quality": "min7b5",
  "shapes": [
    {
      "rootString": 3,
      "offsets": [
        {
          "string": 3,
          "offset": 0,
          "interval": "1"
        },
        {
          "string": 2,
          "offset": 1,
          "interval": "b5"
        },
        {
          "string": 1,
          "offset": 1,
          "interval": "b7"
        },
        {
          "string": 0,
          "offset": 1,
          "interval": "b3"
        }
      ]
    },
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
          "offset": 1,
          "interval": "b5"
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
        }
      ]
    }
  ],
  "expectedIntervals": [
    "1",
    "b3",
    "b5",
    "b7"
  ]
};
