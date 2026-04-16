import type { ChordDefinition } from './chordLibrary.types';

export type ChordCategory =
  | 'major'
  | 'minor'
  | 'dominant'
  | 'suspended'
  | 'diminished'
  | 'sixth'
  | 'augmented'
  | 'other';

const CATEGORY_ORDER: ChordCategory[] = [
  'major',
  'minor',
  'dominant',
  'suspended',
  'diminished',
  'sixth',
  'augmented',
  'other',
];

const EXPLICIT_QUALITY_ORDER = [
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
];

const EXPLICIT_ORDER_MAP = new Map(EXPLICIT_QUALITY_ORDER.map((quality, index) => [quality, index]));

const INTERVAL_NUMBER_REGEX = /\d+/;

function categoryRank(category: ChordCategory): number {
  const index = CATEGORY_ORDER.indexOf(category);
  return index === -1 ? CATEGORY_ORDER.length : index;
}

export function getChordCategory(quality: string): ChordCategory {
  if (['7', '9', '13'].includes(quality)) {
    return 'dominant';
  }
  if (['sus2', 'sus4', '7sus4'].includes(quality) || quality.includes('sus')) {
    return 'suspended';
  }
  if (['dim', 'dim7', 'min7b5', 'min11(b5)'].includes(quality) || quality.includes('b5')) {
    return 'diminished';
  }
  if (['aug', 'aug7'].includes(quality) || quality.includes('aug')) {
    return 'augmented';
  }
  if (quality.startsWith('maj')) {
    return 'major';
  }
  if (quality.startsWith('min')) {
    return 'minor';
  }
  if (quality.includes('6')) {
    return 'sixth';
  }
  return 'other';
}

function getChordComplexityScore(chord: ChordDefinition): number {
  const intervalCount = chord.expectedIntervals.length;
  const maxDegree = chord.expectedIntervals.reduce((max, interval) => {
    const match = interval.match(INTERVAL_NUMBER_REGEX);
    if (!match) {
      return max;
    }
    return Math.max(max, Number.parseInt(match[0], 10));
  }, 0);

  const accidentalCount = chord.expectedIntervals.filter((interval) => interval.includes('b') || interval.includes('#')).length;
  return intervalCount * 100 + maxDegree * 10 + accidentalCount;
}

export function getGalleryOrderedChordDefinitions(chords: ChordDefinition[]): ChordDefinition[] {
  return [...chords].sort((a, b) => {
    const aCategory = getChordCategory(a.quality);
    const bCategory = getChordCategory(b.quality);

    const categoryCmp = categoryRank(aCategory) - categoryRank(bCategory);
    if (categoryCmp !== 0) {
      return categoryCmp;
    }

    const aExplicit = EXPLICIT_ORDER_MAP.get(a.quality);
    const bExplicit = EXPLICIT_ORDER_MAP.get(b.quality);

    if (aExplicit !== undefined && bExplicit !== undefined) {
      return aExplicit - bExplicit;
    }
    if (aExplicit !== undefined) {
      return -1;
    }
    if (bExplicit !== undefined) {
      return 1;
    }

    const complexityCmp = getChordComplexityScore(a) - getChordComplexityScore(b);
    if (complexityCmp !== 0) {
      return complexityCmp;
    }

    return a.quality.localeCompare(b.quality);
  });
}
