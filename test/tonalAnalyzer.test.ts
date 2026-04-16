import { describe, it, expect } from 'vitest';
import { CHORD_DICTIONARY } from '../src/utils/chordLibrary';
import { TUNING } from '../src/utils/musicTheory';
import { Chord, Note } from 'tonal';

describe('Tonal check', () => {
  it('should see what tonal outputs', () => {
    CHORD_DICTIONARY.forEach(def => {
      def.shapes.forEach((shape, index) => {
        const minOffset = Math.min(...shape.offsets.map((so: any) => so.offset));
        const baseFret = Math.max(0, -minOffset) + 5;

        const pitches = shape.offsets.map((so: any) => TUNING[so.string] + so.offset + baseFret);
        const notes = pitches.map(p => Note.fromMidi(p));
        const results = Chord.detect(notes);
        console.log(`${def.quality} => ${results.join(', ')}`);
      });
    });
  });
});
