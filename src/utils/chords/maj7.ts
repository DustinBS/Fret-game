import type { ChordDefinition } from '../chordLibrary.types';

export const maj7Chord: ChordDefinition = {
  "quality": "maj7",
  "shapes": [
    {
      "rootString": 5,
      "offsets": [
        {"string": 1, "offset": 0, "interval": "5"},
        {"string": 2, "offset": 1, "interval": "3"},
        {"string": 3, "offset": 1, "interval": "7"},
        {"string": 5, "offset": 0, "interval": "1"}
      ]
    },
    {
      "rootString": 4,
      "offsets": [
        {"string": 1, "offset": 2, "interval": "3"},
        {"string": 2, "offset": 1, "interval": "7"},
        {"string": 3, "offset": 2, "interval": "5"},
        {"string": 4, "offset": 0, "interval": "1"}
      ]
    },
    {
      "rootString": 3,
      "offsets": [
        {"string": 0, "offset": 2, "interval": "3"},
        {"string": 1, "offset": 2, "interval": "7"},
        {"string": 2, "offset": 2, "interval": "5"},
        {"string": 3, "offset": 0, "interval": "1"}
      ]
    },
    {
      "rootString": 3,
      "offsets": [
        {"string": 0, "offset": -3, "interval": "7"},
        {"string": 1, "offset": -2, "interval": "5"},
        {"string": 2, "offset": -1, "interval": "3"},
        {"string": 3, "offset": 0, "interval": "1"}
      ]
    }
  ],
  "expectedIntervals": [
    "1",
    "3",
    "5",
    "7"
  ]
};
