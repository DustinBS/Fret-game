import type { ChordDefinition } from '../chordLibrary.types';

export const min7Chord: ChordDefinition = {
  "quality": "min7",
  "shapes": [
    {
      "rootString": 5,
      "offsets": [
        {"string": 0, "offset": 0, "interval": "1"},
        {"string": 1, "offset": 0, "interval": "5"},
        {"string": 2, "offset": 0, "interval": "b3"},
        {"string": 3, "offset": 0, "interval": "b7"},
        {"string": 4, "offset": 2, "interval": "5"},
        {"string": 5, "offset": 0, "interval": "1"}
      ]
    },
    {
      "rootString": 4,
      "offsets": [
        {"string": 0, "offset": 0, "interval": "5"},
        {"string": 1, "offset": 1, "interval": "b3"},
        {"string": 2, "offset": 0, "interval": "b7"},
        {"string": 3, "offset": 2, "interval": "5"},
        {"string": 4, "offset": 0, "interval": "1"}
      ]
    },
    {
      "rootString": 3,
      "offsets": [
        {"string": 0, "offset": 1, "interval": "b3"},
        {"string": 1, "offset": 1, "interval": "b7"},
        {"string": 2, "offset": 2, "interval": "5"},
        {"string": 3, "offset": 0, "interval": "1"}
      ]
    }
  ],
  "expectedIntervals": [
    "1",
    "b3",
    "5",
    "b7"
  ]
};
