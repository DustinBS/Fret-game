import type { ChordDefinition } from '../chordLibrary.types';

export const min13Chord: ChordDefinition = {
  "quality": "min13",
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
          "offset": 0,
          "interval": "11"
        },
        {
          "string": 2,
          "offset": 0,
          "interval": "b7"
        },
        {
          "string": 0,
          "offset": 0,
          "interval": "5"
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
          "offset": 2,
          "interval": "13"
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
    "b3",
    "5",
    "b7",
    "11",
    "13"
  ]
};
