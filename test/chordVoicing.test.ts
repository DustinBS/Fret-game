import { describe, expect, it } from 'vitest';
import { CHORD_DICTIONARY } from '../src/utils/chordLibrary';
import { getDefinitionRootVoicings } from '../src/utils/chordVoicing';

describe('Chord voicing constraints', () => {
  it('limits root voicing archetypes by root string', () => {
    CHORD_DICTIONARY.forEach((definition) => {
      const voicings = getDefinitionRootVoicings(definition);

      voicings.forEach((voicing) => {
        const archetype = voicing.rootVoicing.charAt(0).toUpperCase();

        if (voicing.rootString === 5) {
          expect(['E', 'G']).toContain(archetype);
        }

        if (voicing.rootString === 4) {
          expect(['C', 'A']).toContain(archetype);
        }

        if (voicing.rootString === 3) {
          expect(['D']).toContain(archetype);
        }
      });
    });
  });
});
