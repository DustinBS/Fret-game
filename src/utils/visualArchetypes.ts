import type { ChordDefinition, ChordShape } from './chordLibrary.types';
import { TUNING } from './musicTheory';
import { CHORD_QUALITY_DIATONIC_MAP } from './diatonic';
import { buildChordDefinitionId, getShapeRootVoicing } from './chordVoicing';

type AccidentalMask = 'bb' | 'b' | 'clean' | '#' | '##';

const INTERVAL_TOKEN_REGEX = /^(bb|##|b|#)?(\d+)$/;

interface ShapeNoteDescriptor {
  string: number;
  offset: number;
  interval: string;
  relativeSemitone: number;
  canonicalRelativeSemitone: number;
  degreeClass: number;
  accidentalMask: AccidentalMask;
}

export interface VisualArchetypeMember {
  quality: string;
  definitionIndex: number;
  chordId: string;
  rootString: number;
  shapeIndex: number;
  rootVoicing: string;
  impliedVisualKey: string;
  strictVisualKey: string;
  rawIntervalSignature: string;
  normalizedIntervalSignature: string;
  shape: ChordShape;
  notes: ShapeNoteDescriptor[];
}

export interface VisualArchetypeGroup {
  impliedVisualKey: string;
  rootString: number;
  stringSet: number[];
  degreeSequence: number[];
  members: VisualArchetypeMember[];
}

interface ParsedInterval {
  accidentalSemitones: number;
  accidentalMask: AccidentalMask;
  degreeClass: number;
}

function parseInterval(interval: string): ParsedInterval {
  const match = interval.match(INTERVAL_TOKEN_REGEX);
  if (!match) {
    throw new Error(`Unsupported interval token: ${interval}`);
  }

  const accidentalToken = match[1] ?? '';
  const degreeNumber = Number.parseInt(match[2], 10);
  const degreeClass = ((degreeNumber - 1) % 7) + 1;

  if (accidentalToken === 'bb') {
    return { accidentalSemitones: -2, accidentalMask: 'bb', degreeClass };
  }
  if (accidentalToken === 'b') {
    return { accidentalSemitones: -1, accidentalMask: 'b', degreeClass };
  }
  if (accidentalToken === '#') {
    return { accidentalSemitones: 1, accidentalMask: '#', degreeClass };
  }
  if (accidentalToken === '##') {
    return { accidentalSemitones: 2, accidentalMask: '##', degreeClass };
  }

  return { accidentalSemitones: 0, accidentalMask: 'clean', degreeClass };
}

function isDiatonicQuality(quality: string): boolean {
  return (CHORD_QUALITY_DIATONIC_MAP[quality]?.length ?? 0) > 0;
}

function buildShapeDescriptors(shape: ChordShape, quality: string): ShapeNoteDescriptor[] {
  const rootOpenPitch = TUNING[shape.rootString];
  const diatonicQuality = isDiatonicQuality(quality);

  return shape.offsets.map((offsetDef) => {
    const parsed = parseInterval(offsetDef.interval);
    const relativeSemitone = TUNING[offsetDef.string] - rootOpenPitch + offsetDef.offset;
    const hasAccidental = parsed.accidentalSemitones !== 0;
    const implicitAccidental = hasAccidental && diatonicQuality;

    return {
      string: offsetDef.string,
      offset: offsetDef.offset,
      interval: offsetDef.interval,
      relativeSemitone,
      // Collapse accidentals only for diatonic qualities where notation is key-signature implied.
      canonicalRelativeSemitone: implicitAccidental
        ? relativeSemitone - parsed.accidentalSemitones
        : relativeSemitone,
      degreeClass: parsed.degreeClass,
      accidentalMask: implicitAccidental ? 'clean' : parsed.accidentalMask,
    };
  });
}

function orderByVisualStack(notes: ShapeNoteDescriptor[]): ShapeNoteDescriptor[] {
  return [...notes].sort((a, b) => {
    if (a.canonicalRelativeSemitone !== b.canonicalRelativeSemitone) {
      return a.canonicalRelativeSemitone - b.canonicalRelativeSemitone;
    }
    if (a.relativeSemitone !== b.relativeSemitone) {
      return a.relativeSemitone - b.relativeSemitone;
    }
    return b.string - a.string;
  });
}

export function compareVisualDegreeSequences(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    return a.length - b.length;
  }

  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen; i += 1) {
    const av = a[i] ?? -1;
    const bv = b[i] ?? -1;
    if (av !== bv) {
      return av - bv;
    }
  }

  return 0;
}

function compareCanonicalStack(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    return a.length - b.length;
  }

  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen; i += 1) {
    const av = a[i] ?? Number.NEGATIVE_INFINITY;
    const bv = b[i] ?? Number.NEGATIVE_INFINITY;
    if (av !== bv) {
      return av - bv;
    }
  }

  return 0;
}

function compareStringSet(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    return a.length - b.length;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return b[i] - a[i];
    }
  }
  return 0;
}

function getStringSet(shape: ChordShape): number[] {
  const set = new Set<number>();
  for (const offsetDef of shape.offsets) {
    set.add(offsetDef.string);
  }
  return Array.from(set).sort((a, b) => b - a);
}

function buildMember(
  quality: string,
  definitionIndex: number,
  chordId: string,
  rootVoicing: string,
  shape: ChordShape,
  shapeIndex: number,
): VisualArchetypeMember {
  const notes = orderByVisualStack(buildShapeDescriptors(shape, quality));
  const degreeSequence = notes.map((n) => n.degreeClass);
  const accidentalMask = notes.map((n) => n.accidentalMask);
  const canonicalStack = notes.map((n) => n.canonicalRelativeSemitone);
  const stringSet = getStringSet(shape);
  const impliedVisualKey = [
    `rs:${shape.rootString}`,
    `ss:${stringSet.join('.')}`,
    `stack:${canonicalStack.join('.')}`,
    `deg:${degreeSequence.join('.')}`,
  ].join('|');

  const strictVisualKey = `${impliedVisualKey}|mask:${accidentalMask.join('.')}`;

  return {
    quality,
    definitionIndex,
    chordId,
    rootString: shape.rootString,
    shapeIndex,
    rootVoicing,
    impliedVisualKey,
    strictVisualKey,
    rawIntervalSignature: notes.map((n) => n.interval).join(' '),
    normalizedIntervalSignature: degreeSequence.join(' '),
    shape,
    notes,
  };
}

export function buildVisualArchetypeGroups(chords: ChordDefinition[]): VisualArchetypeGroup[] {
  const grouped = new Map<string, VisualArchetypeGroup>();

  for (const [definitionIndex, chord] of chords.entries()) {
    const chordId = buildChordDefinitionId(chord.quality, definitionIndex);

    chord.shapes.forEach((shape, shapeIndex) => {
      const rootVoicing = getShapeRootVoicing(chord, shapeIndex).rootVoicing;
      const member = buildMember(chord.quality, definitionIndex, chordId, rootVoicing, shape, shapeIndex);
      const existing = grouped.get(member.impliedVisualKey);

      if (!existing) {
        grouped.set(member.impliedVisualKey, {
          impliedVisualKey: member.impliedVisualKey,
          rootString: shape.rootString,
          stringSet: getStringSet(shape),
          degreeSequence: member.notes.map((n) => n.degreeClass),
          members: [member],
        });
        return;
      }

      existing.members.push(member);
    });
  }

  return Array.from(grouped.values())
    .filter((group) => {
      const uniqueQualities = new Set(group.members.map((m) => m.quality));
      return uniqueQualities.size > 1;
    })
    .map((group) => ({
      ...group,
      members: [...group.members].sort((a, b) => {
        if (a.quality !== b.quality) {
          return a.quality.localeCompare(b.quality);
        }
        if (a.definitionIndex !== b.definitionIndex) {
          return a.definitionIndex - b.definitionIndex;
        }
        return a.shapeIndex - b.shapeIndex;
      }),
    }))
    .sort((a, b) => {
      const degreeCmp = compareVisualDegreeSequences(a.degreeSequence, b.degreeSequence);
      if (degreeCmp !== 0) {
        return degreeCmp;
      }

      const stackCmp = compareCanonicalStack(
        a.members[0]?.notes.map((n) => n.canonicalRelativeSemitone) ?? [],
        b.members[0]?.notes.map((n) => n.canonicalRelativeSemitone) ?? [],
      );
      if (stackCmp !== 0) {
        return stackCmp;
      }

      const stringSetCmp = compareStringSet(a.stringSet, b.stringSet);
      if (stringSetCmp !== 0) {
        return stringSetCmp;
      }

      if (a.rootString !== b.rootString) {
        return b.rootString - a.rootString;
      }
      return a.degreeSequence.join('.').localeCompare(b.degreeSequence.join('.'));
    });
}
