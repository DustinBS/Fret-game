import type { ChordDefinition } from '../chordLibrary.types';

export const maj6Chord: ChordDefinition = {
  "quality": "maj6",
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
          "offset": 2,
          "interval": "3"
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
          "offset": 2,
          "interval": "5"
        },
        {
          "string": 2,
          "offset": -1,
          "interval": "6"
        },
        {
          "string": 1,
          "offset": 2,
          "interval": "3"
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
          "string": 2,
          "offset": 1,
          "interval": "3"
        },
        {
          "string": 1,
          "offset": 2,
          "interval": "6"
        },
        {
          "string": 4,
          "offset": 2,
          "interval": "5"
        }
      ]
    }
  ],
  "expectedIntervals": [
    "1",
    "3",
    "5",
    "6"
  ]
};
