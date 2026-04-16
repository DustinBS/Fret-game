import type { ChordDefinition } from '../chordLibrary.types';

export const maj13Chord: ChordDefinition = {
  "quality": "maj13",
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
          "offset": -1,
          "interval": "3"
        },
        {
          "string": 1,
          "offset": 2,
          "interval": "7"
        },
        {
          "string": 0,
          "offset": 0,
          "interval": "9"
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
          "interval": "13"
        },
        {
          "string": 1,
          "offset": 2,
          "interval": "3"
        },
        {
          "string": 0,
          "offset": 4,
          "interval": "7"
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
          "offset": 1,
          "interval": "7"
        },
        {
          "string": 1,
          "offset": 2,
          "interval": "13"
        },
        {
          "string": 2,
          "offset": 2,
          "interval": "11"
        },
        {
          "string": 4,
          "offset": -1,
          "interval": "3"
        }
      ]
    }
  ],
  "expectedIntervals": [
    "1",
    "3",
    "5",
    "7",
    "9",
    "11",
    "13"
  ]
};
