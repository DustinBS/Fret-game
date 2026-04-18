import type { ChordDefinition } from '../chordLibrary.types';

export const sus2Chord: ChordDefinition = {
  "quality": "sus2",
  "shapes": [
    {
      "rootString": 5,
      "offsets": [
        {"string": 0, "offset": 2, "interval": "2"},
        {"string": 2, "offset": 4, "interval": "5"},
        {"string": 3, "offset": 4, "interval": "2"},
        {"string": 4, "offset": 2, "interval": "5"},
        {"string": 5, "offset": 0, "interval": "1"}
      ]
    },
    {
      "rootString": 4,
      "offsets": [
        {"string": 0, "offset": 0, "interval": "5"},
        {"string": 1, "offset": 0, "interval": "2"},
        {"string": 2, "offset": 2, "interval": "1"},
        {"string": 3, "offset": 2, "interval": "5"},
        {"string": 4, "offset": 0, "interval": "1"}
      ]
    },
    {
      "rootString": 3,
      "offsets": [
        {"string": 0, "offset": 0, "interval": "2"},
        {"string": 1, "offset": 3, "interval": "1"},
        {"string": 2, "offset": 2, "interval": "5"},
        {"string": 3, "offset": 0, "interval": "1"}
      ]
    }
  ],
  "expectedIntervals": [
    "1",
    "2",
    "5"
  ]
};
