import type { ChordDefinition } from '../chordLibrary.types';

export const sus4Chord: ChordDefinition = {
  "quality": "sus4",
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
          "offset": 3,
          "interval": "1"
        },
        {
          "string": 0,
          "offset": 3,
          "interval": "4"
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
          "offset": 2,
          "interval": "1"
        },
        {
          "string": 1,
          "offset": 3,
          "interval": "4"
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
          "offset": 2,
          "interval": "4"
        }
      ]
    }
  ],
  "expectedIntervals": [
    "1",
    "4",
    "5"
  ]
};
