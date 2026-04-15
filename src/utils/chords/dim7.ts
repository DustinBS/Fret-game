import type { ChordDefinition } from '../chordLibrary.types';

export const dim7Chord: ChordDefinition = {
  "quality": "dim7",
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
          "string": 3,
          "offset": 1,
          "interval": "b5"
        },
        {
          "string": 2,
          "offset": 2,
          "interval": "1"
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
          "offset": 2,
          "interval": "1"
        },
        {
          "string": 2,
          "offset": 3,
          "interval": "b5"
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
        }
      ]
    }
  ],
  "expectedIntervals": [
    "1",
    "b3",
    "b5",
    "6"
  ]
};
