import type { ChordDefinition } from '../chordLibrary.types';

export const minb6Chord: ChordDefinition = {
  "quality": "minb6",
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
          "string": 0,
          "offset": 1,
          "interval": "b6"
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
          "string": 1,
          "offset": 1,
          "interval": "b6"
        },
        {
          "string": 0,
          "offset": -2,
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
    "b6"
  ]
};
