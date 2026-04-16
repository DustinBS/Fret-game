import { describe, expect, it } from 'vitest';
import {
  KEY_CONSTRAINT_OPTIONS,
  getKeySignatureInfo,
  getRenderableKeySignature,
  getKeySignatureLetterAccidentals,
  keySignatureUsesFlats,
} from '../src/utils/musicTheory';

describe('Key Constraint Options', () => {
  it('matches the expanded key dropdown options exactly', () => {
    expect(KEY_CONSTRAINT_OPTIONS).toEqual([
      'A', 'A#', 'Ab',
      'B', 'B#', 'Bb',
      'C', 'C#', 'Cb',
      'D', 'D#', 'Db',
      'E', 'E#', 'Eb',
      'F', 'F#', 'Fb',
      'G', 'G#', 'Gb',
    ]);
  });

  it('parses enharmonic key names to pitch class and spelling preference', () => {
    expect(getKeySignatureInfo('B#')).toMatchObject({ pitchClass: 0, useFlats: false });
    expect(getKeySignatureInfo('Cb')).toMatchObject({ pitchClass: 11, useFlats: true });
    expect(getKeySignatureInfo('E#')).toMatchObject({ pitchClass: 5, useFlats: false });
    expect(getKeySignatureInfo('Fb')).toMatchObject({ pitchClass: 4, useFlats: true });
    expect(getKeySignatureInfo('G#')).toMatchObject({ pitchClass: 8, useFlats: false });
    expect(getKeySignatureInfo('Ab')).toMatchObject({ pitchClass: 8, useFlats: true });
  });

  it('normalizes non-standard key names to renderable key signatures', () => {
    expect(getRenderableKeySignature('A#')).toBe('Bb');
    expect(getRenderableKeySignature('B#')).toBe('C');
    expect(getRenderableKeySignature('D#')).toBe('Eb');
    expect(getRenderableKeySignature('E#')).toBe('F');
    expect(getRenderableKeySignature('G#')).toBe('Ab');
    expect(getRenderableKeySignature('Fb')).toBe('E');
  });

  it('provides staff-letter accidental maps for key signatures', () => {
    expect(getKeySignatureLetterAccidentals('Ab')).toEqual({
      B: 'b',
      E: 'b',
      A: 'b',
      D: 'b',
    });
    expect(getKeySignatureLetterAccidentals('C#')).toEqual({
      F: '#',
      C: '#',
      G: '#',
      D: '#',
      A: '#',
      E: '#',
      B: '#',
    });
    expect(getKeySignatureLetterAccidentals('C')).toEqual({});
  });

  it('chooses flat-vs-sharp note spelling from renderable key signatures', () => {
    expect(keySignatureUsesFlats('A#')).toBe(true); // renderable Bb
    expect(keySignatureUsesFlats('Bb')).toBe(true);
    expect(keySignatureUsesFlats('F')).toBe(true);
    expect(keySignatureUsesFlats('D')).toBe(false);
    expect(keySignatureUsesFlats('E#')).toBe(true); // renderable F
  });
});
