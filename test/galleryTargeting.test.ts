import { describe, expect, it } from 'vitest';
import { CHORD_DICTIONARY } from '../src/utils/chordLibrary';
import { buildOrderedChordEntries } from '../src/utils/chordEntries';
import {
  buildChordShapeTargetKey,
  resolveGalleryTargetFromSandbox,
} from '../src/utils/galleryTargeting';

type ClickedFret = {
  stringIndex: number;
  fret: number;
  interval: string;
};

function buildClickedFretsFromShape(shape: (typeof CHORD_DICTIONARY)[number]['shapes'][number]): ClickedFret[] {
  const anchorFret = 5;

  return shape.offsets.map((offsetDef) => ({
    stringIndex: offsetDef.string,
    fret: anchorFret + offsetDef.offset,
    interval: offsetDef.interval,
  }));
}

describe('Gallery targeting from Sandbox', () => {
  it('requires an exact shape signature match', () => {
    const entries = buildOrderedChordEntries(CHORD_DICTIONARY);
    const entry = entries[0];
    const firstShape = entry.definition.shapes[0];
    const clickedFrets = buildClickedFretsFromShape(firstShape);

    const exactMatch = resolveGalleryTargetFromSandbox(entries, entry.definition.quality, clickedFrets);

    expect(exactMatch.isAvailable).toBe(true);
    expect(exactMatch.chordId).toBe(entry.chordId);
    expect(exactMatch.rootString).toBe(firstShape.rootString);
    expect(typeof exactMatch.rootVoicing).toBe('string');
    expect(typeof exactMatch.shapeIndex).toBe('number');

    const mismatchedFrets = [...clickedFrets];
    mismatchedFrets[0] = {
      ...mismatchedFrets[0],
      interval: 'b2',
    };

    const mismatch = resolveGalleryTargetFromSandbox(entries, entry.definition.quality, mismatchedFrets);
    expect(mismatch.isAvailable).toBe(false);
  });

  it('honors allowed shape keys for filtered destinations', () => {
    const entries = buildOrderedChordEntries(CHORD_DICTIONARY);
    const entry = entries[0];
    const firstShape = entry.definition.shapes[0];
    const clickedFrets = buildClickedFretsFromShape(firstShape);

    const unrestricted = resolveGalleryTargetFromSandbox(entries, entry.definition.quality, clickedFrets);
    expect(unrestricted.isAvailable).toBe(true);
    if (!unrestricted.chordId || unrestricted.shapeIndex === undefined) {
      throw new Error('Expected unrestricted match to include chordId and shapeIndex');
    }

    const allowedNone = resolveGalleryTargetFromSandbox(entries, entry.definition.quality, clickedFrets, {
      allowedShapeKeys: new Set<string>(),
    });
    expect(allowedNone.isAvailable).toBe(false);

    const allowedExact = resolveGalleryTargetFromSandbox(entries, entry.definition.quality, clickedFrets, {
      allowedShapeKeys: new Set<string>([
        buildChordShapeTargetKey(unrestricted.chordId, unrestricted.shapeIndex),
      ]),
    });

    expect(allowedExact.isAvailable).toBe(true);
    expect(allowedExact.chordId).toBe(unrestricted.chordId);
    expect(allowedExact.shapeIndex).toBe(unrestricted.shapeIndex);
  });
});
