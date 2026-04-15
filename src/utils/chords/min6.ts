import type { ChordDefinition } from '../chordLibrary.types';

export const min6Chord: ChordDefinition = {
  "quality": "min6",
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
          "offset": 2,
          "interval": "5"
        },
        {
          "string": 1,
          "offset": 0,
          "interval": "6"
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
          "string": 2,
          "offset": -1,
          "interval": "6"
        },
        {
          "string": 1,
          "offset": 1,
          "interval": "b3"
        },
        {
          "string": 0,
          "offset": 2,
          "interval": "6"
        },
        {
          "string": 3,
          "offset": 2,
          "interval": "5"
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
          "offset": -1,
          "interval": "6"
        },
        {
          "string": 1,
          "offset": 2,
          "interval": "6"
        },
        {
          "string": 4,
          "offset": -2,
          "interval": "b3"
        },
        {
          "string": 2,
          "offset": 4,
          "interval": "5"
        }
      ]
    }
  ],
  "expectedIntervals": [
    "1",
    "b3",
    "5",
    "6"
  ]
};
