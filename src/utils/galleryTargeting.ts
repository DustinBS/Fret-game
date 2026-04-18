import type { ChordShape } from './chordLibrary.types';
import type { OrderedChordEntry } from './chordEntries';

interface FretLike {
  stringIndex: number;
  fret: number;
  interval?: string;
}

interface GalleryTargetMatch {
  quality: string;
  chordId?: string;
}

function buildShapeSignature(shape: ChordShape): string {
  return [...shape.offsets]
    .sort((a, b) => {
      if (a.string !== b.string) {
        return a.string - b.string;
      }
      if (a.offset !== b.offset) {
        return a.offset - b.offset;
      }
      return a.interval.localeCompare(b.interval);
    })
    .map((offsetDef) => `${offsetDef.string}:${offsetDef.offset}:${offsetDef.interval}`)
    .join('|');
}

function inferRootString(clickedFrets: FretLike[]): number | null {
  const rootNotes = clickedFrets
    .filter((fretDef) => fretDef.interval === '1')
    .map((fretDef) => fretDef.stringIndex)
    .sort((a, b) => b - a);

  if (rootNotes.length === 0) {
    return null;
  }

  return rootNotes[0] ?? null;
}

function buildClickedShapeSignature(clickedFrets: FretLike[], rootString: number | null): string | null {
  if (rootString === null) {
    return null;
  }

  const rootAnchors = clickedFrets
    .filter((fretDef) => fretDef.interval === '1' && fretDef.stringIndex === rootString)
    .sort((a, b) => a.fret - b.fret);

  const anchor = rootAnchors[0];
  if (!anchor) {
    return null;
  }

  const withIntervals = clickedFrets.filter((fretDef) => typeof fretDef.interval === 'string' && fretDef.interval.length > 0);
  if (withIntervals.length === 0) {
    return null;
  }

  return withIntervals
    .map((fretDef) => ({
      string: fretDef.stringIndex,
      offset: fretDef.fret - anchor.fret,
      interval: fretDef.interval as string,
    }))
    .sort((a, b) => {
      if (a.string !== b.string) {
        return a.string - b.string;
      }
      if (a.offset !== b.offset) {
        return a.offset - b.offset;
      }
      return a.interval.localeCompare(b.interval);
    })
    .map((offsetDef) => `${offsetDef.string}:${offsetDef.offset}:${offsetDef.interval}`)
    .join('|');
}

export function resolveGalleryTargetFromSandbox(
  entries: OrderedChordEntry[],
  quality: string,
  clickedFrets: FretLike[],
): GalleryTargetMatch {
  const qualityMatches = entries.filter((entry) => entry.definition.quality === quality);
  if (qualityMatches.length === 0) {
    return { quality };
  }

  if (qualityMatches.length === 1) {
    return { quality, chordId: qualityMatches[0].chordId };
  }

  const inferredRootString = inferRootString(clickedFrets);
  const clickedSignature = buildClickedShapeSignature(clickedFrets, inferredRootString);

  let bestMatch = qualityMatches[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  qualityMatches.forEach((entry) => {
    let score = 0;

    if (inferredRootString !== null && entry.definition.shapes.some((shape) => shape.rootString === inferredRootString)) {
      score += 50;
    }

    if (clickedSignature) {
      const shapeSignatures = new Set(entry.definition.shapes.map((shape) => buildShapeSignature(shape)));
      if (shapeSignatures.has(clickedSignature)) {
        score += 100;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  });

  return {
    quality,
    chordId: bestMatch.chordId,
  };
}
