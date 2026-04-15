import type { ChordDefinition } from '../chordLibrary.types';

export const maj7_11Chord: ChordDefinition = {
  "quality": "maj7#11",
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
          "offset": 1,
          "interval": "7"
        },
        {
          "string": 1,
          "offset": 4,
          "interval": "#11"
        },
        {
          "string": 0,
          "offset": 0,
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
          "string": 2,
          "offset": 1,
          "interval": "3"
        },
        {
          "string": 1,
          "offset": -1,
          "interval": "#11"
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
    "7",
    "#11"
  ]
};
