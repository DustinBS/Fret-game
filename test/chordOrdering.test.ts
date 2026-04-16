import { describe, expect, it } from 'vitest';
import { CHORD_DICTIONARY } from '../src/utils/chordLibrary';
import { getGalleryOrderedChordDefinitions } from '../src/utils/chordOrdering';

describe('Chord Gallery Ordering', () => {
  it('orders gallery rows by category and complexity ground-truth sequence', () => {
    const ordered = getGalleryOrderedChordDefinitions(CHORD_DICTIONARY).map((c) => c.quality);

    expect(ordered).toEqual([
      'maj',
      'maj6',
      'maj7',
      'maj7#11',
      'maj9',
      'maj13',
      'min',
      'minb6',
      'min6',
      'min7',
      'min9',
      'min11',
      'min13',
      'min(b13)',
      'min7(b13)',
      '7',
      '9',
      '13',
      'sus2',
      'sus4',
      '7sus4',
      'dim',
      'dim7',
      'min7b5',
      'min11(b5)',
      'aug',
      'aug7',
    ]);
  });
});
