import type { OrderedChordEntry } from './chordEntries';
import { getDefinitionRootVoicings } from './chordVoicing';

interface FretLike {
  stringIndex: number;
  fret: number;
  interval?: string;
}

export interface GalleryTargetMatch {
  quality: string;
  chordId?: string;
  rootString?: number;
  rootVoicing?: string;
  shapeIndex?: number;
  isAvailable: boolean;
}

interface ResolveGalleryTargetOptions {
  allowedChordIds?: ReadonlySet<string>;
  allowedShapeKeys?: ReadonlySet<string>;
}

export function buildChordShapeTargetKey(chordId: string, shapeIndex: number): string {
  return `${chordId}::${shapeIndex}`;
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

function buildUnavailableTarget(quality: string): GalleryTargetMatch {
  return {
    quality,
    isAvailable: false,
  };
}

function isShapeAllowed(chordId: string, shapeIndex: number, allowedShapeKeys?: ReadonlySet<string>): boolean {
  if (!allowedShapeKeys) {
    return true;
  }

  return allowedShapeKeys.has(buildChordShapeTargetKey(chordId, shapeIndex));
}

export function resolveGalleryTargetFromSandbox(
  entries: OrderedChordEntry[],
  quality: string,
  clickedFrets: FretLike[],
  options?: ResolveGalleryTargetOptions,
): GalleryTargetMatch {
  const qualityMatches = entries.filter((entry) => entry.definition.quality === quality);
  if (qualityMatches.length === 0) {
    return buildUnavailableTarget(quality);
  }

  const allowedChordIds = options?.allowedChordIds;
  const eligibleMatches = allowedChordIds
    ? qualityMatches.filter((entry) => allowedChordIds.has(entry.chordId))
    : qualityMatches;

  if (eligibleMatches.length === 0) {
    return buildUnavailableTarget(quality);
  }

  const inferredRootString = inferRootString(clickedFrets);
  const clickedSignature = buildClickedShapeSignature(clickedFrets, inferredRootString);

  // Strict mode for Sandbox outbound actions: require an exact shape match.
  if (inferredRootString === null || !clickedSignature) {
    return buildUnavailableTarget(quality);
  }

  for (const entry of eligibleMatches) {
    const matchingVoicing = getDefinitionRootVoicings(entry.definition).find((voicing) => {
      if (voicing.rootString !== inferredRootString) {
        return false;
      }

      if (voicing.shapeSignature !== clickedSignature) {
        return false;
      }

      return isShapeAllowed(entry.chordId, voicing.shapeIndex, options?.allowedShapeKeys);
    });

    if (!matchingVoicing) {
      continue;
    }

    return {
      quality,
      chordId: entry.chordId,
      rootString: matchingVoicing.rootString,
      rootVoicing: matchingVoicing.rootVoicing,
      shapeIndex: matchingVoicing.shapeIndex,
      isAvailable: true,
    };
  }

  return buildUnavailableTarget(quality);
}
