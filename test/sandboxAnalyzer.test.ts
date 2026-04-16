import { describe, it, expect } from 'vitest';
import { CHORD_DICTIONARY } from '../src/utils/chordLibrary';
import { analyzeChord } from '../src/utils/chordAnalyzer';
import { TUNING } from '../src/utils/musicTheory';

describe('Sandbox Analyzer Check', () => {
  it('should correctly recognize all shapes for all chord qualities', () => {
    const failedShapes: string[] = [];

    CHORD_DICTIONARY.forEach(def => {
      def.shapes.forEach((shape, index) => {
        // Find a base fret that avoids negative offsets
        const minOffset = Math.min(...shape.offsets.map((so: any) => so.offset));
        const baseFret = Math.max(0, -minOffset) + 5; // Push it to middle of the neck

        const pitches = shape.offsets.map((so: any) => TUNING[so.string] + so.offset + baseFret);
        const results = analyzeChord(pitches);

        // Check if ANY of the results match the def.quality
        const matches = results.some(r => r.name.includes(` ${def.quality}`) || r.name.includes(` ${def.quality} /`));
        if (!matches) {
          failedShapes.push(`${def.quality} shape ${index + 1} (root string ${shape.rootString}): Returned ${results.map(r => r.name).join(', ') || 'Unknown'}`);
        }
      });
    });

    if (failedShapes.length > 0) {
      console.error('Failed Analyzer Matches:\n' + failedShapes.join('\n'));
    }
    expect(failedShapes).toEqual([]);
  });
});
