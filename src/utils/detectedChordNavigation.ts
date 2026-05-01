import type { OrderedChordEntry } from './chordEntries';
import { resolveGalleryTargetFromSandbox, type GalleryTargetMatch } from './galleryTargeting';

interface FretLike {
  stringIndex: number;
  fret: number;
  interval?: string;
}

export interface ParsedDetectedChordName {
  key: string;
  quality: string;
}

export interface DetectedChordNavigationTarget {
  quality: string;
  galleryTarget: GalleryTargetMatch;
  visualArchetypeTarget: GalleryTargetMatch;
}

function resolveDetectedQualityAlias(rawQuality: string, entries: OrderedChordEntry[]): string {
  const qualitySet = new Set(entries.map((entry) => entry.definition.quality));
  const compact = rawQuality.trim();
  const fallback = compact.length > 0 ? compact : 'maj';

  const candidates = [
    fallback,
    fallback.toLowerCase(),
    fallback.replace(/^M(?=$|\d|\()/, 'maj'),
    fallback.replace(/^m(?=$|\d|\()/, 'min'),
    fallback.replace(/^Maj/i, 'maj'),
    fallback.replace(/^Min/i, 'min'),
    fallback.replace(/^sus$/i, 'sus4'),
  ];

  for (const candidate of candidates) {
    const normalizedCandidate = candidate.trim();
    if (!normalizedCandidate) {
      continue;
    }

    if (qualitySet.has(normalizedCandidate)) {
      return normalizedCandidate;
    }
  }

  return fallback;
}

export function parseDetectedChordName(chordName: string): ParsedDetectedChordName | null {
  const namePart = chordName.split('/')[0].trim();
  const match = namePart.match(/^([A-G][b#]?)(.*)$/);
  if (!match) {
    return null;
  }

  const rawQuality = match[2].trim();

  return {
    key: match[1],
    quality: rawQuality.length > 0 ? rawQuality : 'maj',
  };
}

export function resolveDetectedChordNavigationTargetFromSandbox(args: {
  chordName?: string;
  entries: OrderedChordEntry[];
  clickedFrets: FretLike[];
  visualArchetypeShapeKeys: ReadonlySet<string>;
}): DetectedChordNavigationTarget | null {
  const { chordName, entries, clickedFrets, visualArchetypeShapeKeys } = args;
  if (!chordName) {
    return null;
  }

  const parsedChordName = parseDetectedChordName(chordName);
  if (!parsedChordName) {
    return null;
  }

  const resolvedQuality = resolveDetectedQualityAlias(parsedChordName.quality, entries);

  const galleryTarget = resolveGalleryTargetFromSandbox(entries, resolvedQuality, clickedFrets);
  const visualArchetypeTarget = resolveGalleryTargetFromSandbox(
    entries,
    resolvedQuality,
    clickedFrets,
    { allowedShapeKeys: visualArchetypeShapeKeys },
  );

  return {
    quality: resolvedQuality,
    galleryTarget,
    visualArchetypeTarget,
  };
}
