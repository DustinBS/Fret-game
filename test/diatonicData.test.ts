import { CHORD_DICTIONARY } from '../src/utils/chordLibrary';
import { CHORD_QUALITY_DIATONIC_MAP } from '../src/utils/diatonic';
import { describe, it, expect } from 'vitest';

describe('Chord Library Data Checks', () => {
  it('should not contain b7 or b3 in purely major diatonic chords (I, IV, V)', () => {
    const purelyMajorQualities = [];
    for (const [quality, numerals] of Object.entries(CHORD_QUALITY_DIATONIC_MAP)) {
      if (numerals.every(n => ['I', 'IV', 'V'].includes(n))) {
        purelyMajorQualities.push(quality);
      }
    }

    purelyMajorQualities.forEach(quality => {
      const def = CHORD_DICTIONARY.find(c => c.quality === quality);
      if (!def) return;
      
      def.shapes.forEach(shape => {
        shape.offsets.forEach(offset => {
          if (['maj', 'maj6', 'maj7', 'maj9', 'sus4', 'maj13'].includes(quality)) {
            expect(offset.interval).not.toBe('b3');
            expect(offset.interval).not.toBe('b7');
          }
        });
      });
    });
  });

  it('should only contain expected scale degrees for every chord shape', () => {
    CHORD_DICTIONARY.forEach(def => {
      expect(def.expectedIntervals).toBeDefined();
      expect(def.expectedIntervals.length).toBeGreaterThan(0);
      
      const expectedSet = new Set(def.expectedIntervals);
      
      def.shapes.forEach((shape, sIdx) => {
        shape.offsets.forEach((offset, oIdx) => {
          const isValid = expectedSet.has(offset.interval);
          if (!isValid) {
            console.error(`Invalid interval '${offset.interval}' found in ${def.quality} shape ${sIdx + 1} at offset ${oIdx}`);
          }
          expect(isValid).toBe(true);
        });
      });
    });
  });
});
