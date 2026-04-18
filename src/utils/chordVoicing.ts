import type { ChordDefinition, ChordShape } from './chordLibrary.types';

export type CagedArchetype = 'C' | 'A' | 'G' | 'E' | 'D';

interface KernelPoint {
  stringDelta: number;
  fretDelta: number;
}

interface ShapePoint {
  string: number;
  fret: number;
  interval: string;
  degreeClass: number;
}

interface RootCandidate {
  string: number;
  fret: number;
}

const CHORD_ID_SEPARATOR = '@@';
const INTERVAL_TOKEN_REGEX = /^(bb|##|b|#)?(\d+)$/;

const CAGED_KERNELS: Record<CagedArchetype, KernelPoint[]> = {
  C: [
    { stringDelta: 0, fretDelta: 0 },
    { stringDelta: -1, fretDelta: -1 },
    { stringDelta: -2, fretDelta: -3 },
    { stringDelta: -3, fretDelta: -2 },
    { stringDelta: -4, fretDelta: -3 },
  ],
  A: [
    { stringDelta: 0, fretDelta: 0 },
    { stringDelta: -1, fretDelta: 2 },
    { stringDelta: -2, fretDelta: 2 },
    { stringDelta: -3, fretDelta: 2 },
    { stringDelta: -4, fretDelta: 0 },
  ],
  G: [
    { stringDelta: 1, fretDelta: 3 },
    { stringDelta: 0, fretDelta: 2 },
    { stringDelta: -1, fretDelta: 0 },
    { stringDelta: -2, fretDelta: 0 },
    { stringDelta: -3, fretDelta: 0 },
    { stringDelta: -4, fretDelta: 3 },
  ],
  E: [
    { stringDelta: 0, fretDelta: 0 },
    { stringDelta: -1, fretDelta: 2 },
    { stringDelta: -2, fretDelta: 2 },
    { stringDelta: -3, fretDelta: 1 },
    { stringDelta: -4, fretDelta: 0 },
    { stringDelta: -5, fretDelta: 0 },
  ],
  D: [
    { stringDelta: 0, fretDelta: 0 },
    { stringDelta: -1, fretDelta: 2 },
    { stringDelta: -2, fretDelta: 3 },
    { stringDelta: -3, fretDelta: 2 },
  ],
};

const CAGED_ORDER: CagedArchetype[] = ['C', 'A', 'G', 'E', 'D'];

const ROOT_STRING_ARCHETYPE_CONSTRAINTS: Partial<Record<number, CagedArchetype[]>> = {
  5: ['E', 'G'],
  4: ['C', 'A'],
  3: ['D'],
};

export interface ShapeRootVoicingInfo {
  shapeIndex: number;
  rootString: number;
  archetype: CagedArchetype;
  rootVoicing: string;
  score: number;
  shapeSignature: string;
}

export interface RootStringShapeOption extends ShapeRootVoicingInfo {
  shape: ChordShape;
}

const definitionVoicingCache = new WeakMap<ChordDefinition, ShapeRootVoicingInfo[]>();

function parseDegreeClass(interval: string): number {
  const match = interval.match(INTERVAL_TOKEN_REGEX);
  if (!match) {
    return 1;
  }

  const degree = Number.parseInt(match[2], 10);
  return ((degree - 1) % 7) + 1;
}

function buildShapePoints(shape: ChordShape): ShapePoint[] {
  return shape.offsets.map((offsetDef) => ({
    string: offsetDef.string,
    fret: offsetDef.offset,
    interval: offsetDef.interval,
    degreeClass: parseDegreeClass(offsetDef.interval),
  }));
}

function resolveRootCandidates(shape: ChordShape, points: ShapePoint[]): RootCandidate[] {
  const roots = points
    .filter((point) => point.degreeClass === 1)
    .map((point) => ({ string: point.string, fret: point.fret }));

  if (roots.length > 0) {
    return roots;
  }

  const rootStringNotes = points.filter((point) => point.string === shape.rootString);
  if (rootStringNotes.length > 0) {
    const nearest = [...rootStringNotes].sort((a, b) => Math.abs(a.fret) - Math.abs(b.fret))[0];
    return [{ string: nearest.string, fret: nearest.fret }];
  }

  return [{ string: shape.rootString, fret: 0 }];
}

function manhattanDistance(a: { string: number; fret: number }, b: { string: number; fret: number }): number {
  return Math.abs(a.string - b.string) + Math.abs(a.fret - b.fret);
}

function scoreKernel(points: ShapePoint[], anchor: RootCandidate, kernel: KernelPoint[]): number {
  const alignedKernel = kernel.map((point) => ({
    string: anchor.string + point.stringDelta,
    fret: anchor.fret + point.fretDelta,
  }));

  let score = 0;

  for (const point of points) {
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const kernelPoint of alignedKernel) {
      const distance = manhattanDistance(point, kernelPoint);
      if (distance < nearestDistance) {
        nearestDistance = distance;
      }
    }

    score += nearestDistance;

    if (nearestDistance > 2) {
      score += 10 + (nearestDistance - 2) * 2;
    }
  }

  return score;
}

function classifyShape(shape: ChordShape): { archetype: CagedArchetype; score: number } {
  const points = buildShapePoints(shape);
  const rootCandidates = resolveRootCandidates(shape, points);
  const allowedArchetypes = ROOT_STRING_ARCHETYPE_CONSTRAINTS[shape.rootString] ?? CAGED_ORDER;

  let bestArchetype: CagedArchetype = 'C';
  let bestScore = Number.POSITIVE_INFINITY;

  for (const archetype of allowedArchetypes) {
    const kernel = CAGED_KERNELS[archetype];

    for (const rootCandidate of rootCandidates) {
      const score = scoreKernel(points, rootCandidate, kernel);
      if (score < bestScore) {
        bestScore = score;
        bestArchetype = archetype;
      }
    }
  }

  return { archetype: bestArchetype, score: bestScore };
}

function buildShapeSignature(shape: ChordShape): string {
  const sortedOffsets = [...shape.offsets].sort((a, b) => {
    if (a.string !== b.string) {
      return a.string - b.string;
    }
    if (a.offset !== b.offset) {
      return a.offset - b.offset;
    }
    return a.interval.localeCompare(b.interval);
  });

  return sortedOffsets
    .map((offsetDef) => `${offsetDef.string}:${offsetDef.offset}:${offsetDef.interval}`)
    .join('|');
}

export function buildChordDefinitionId(quality: string, dictionaryIndex: number): string {
  return `${quality}${CHORD_ID_SEPARATOR}${dictionaryIndex}`;
}

export function parseChordDefinitionId(chordId: string | null): { quality: string; dictionaryIndex: number } | null {
  if (!chordId) {
    return null;
  }

  const separatorIndex = chordId.lastIndexOf(CHORD_ID_SEPARATOR);
  if (separatorIndex <= 0 || separatorIndex >= chordId.length - CHORD_ID_SEPARATOR.length) {
    return null;
  }

  const quality = chordId.slice(0, separatorIndex);
  const indexToken = chordId.slice(separatorIndex + CHORD_ID_SEPARATOR.length);
  const dictionaryIndex = Number.parseInt(indexToken, 10);

  if (!Number.isFinite(dictionaryIndex) || dictionaryIndex < 0) {
    return null;
  }

  return {
    quality,
    dictionaryIndex,
  };
}

export function getDefinitionRootVoicings(definition: ChordDefinition): ShapeRootVoicingInfo[] {
  const cached = definitionVoicingCache.get(definition);
  if (cached) {
    return cached;
  }

  const shapeVoicings = definition.shapes.map((shape, shapeIndex) => {
    const classification = classifyShape(shape);

    return {
      shapeIndex,
      rootString: shape.rootString,
      archetype: classification.archetype,
      rootVoicing: classification.archetype,
      score: classification.score,
      shapeSignature: buildShapeSignature(shape),
    } satisfies ShapeRootVoicingInfo;
  });

  const groupedByArchetypeAndString = new Map<string, ShapeRootVoicingInfo[]>();
  shapeVoicings.forEach((voicing) => {
    const groupKey = `${voicing.rootString}|${voicing.archetype}`;
    const group = groupedByArchetypeAndString.get(groupKey) ?? [];
    group.push(voicing);
    groupedByArchetypeAndString.set(groupKey, group);
  });

  groupedByArchetypeAndString.forEach((group) => {
    if (group.length === 1) {
      group[0].rootVoicing = group[0].archetype;
      return;
    }

    group
      .sort((a, b) => {
        const signatureCmp = a.shapeSignature.localeCompare(b.shapeSignature);
        if (signatureCmp !== 0) {
          return signatureCmp;
        }
        return a.shapeIndex - b.shapeIndex;
      })
      .forEach((entry, index) => {
        entry.rootVoicing = `${entry.archetype}${index + 1}`;
      });
  });

  const normalized = [...shapeVoicings].sort((a, b) => a.shapeIndex - b.shapeIndex);
  definitionVoicingCache.set(definition, normalized);

  return normalized;
}

export function getShapeRootVoicing(definition: ChordDefinition, shapeIndex: number): ShapeRootVoicingInfo {
  const voicings = getDefinitionRootVoicings(definition);
  const match = voicings.find((voicing) => voicing.shapeIndex === shapeIndex);
  if (match) {
    return match;
  }

  const shape = definition.shapes[shapeIndex];
  if (!shape) {
    throw new Error(`Invalid shape index ${shapeIndex} for quality ${definition.quality}`);
  }

  const classification = classifyShape(shape);
  return {
    shapeIndex,
    rootString: shape.rootString,
    archetype: classification.archetype,
    rootVoicing: classification.archetype,
    score: classification.score,
    shapeSignature: buildShapeSignature(shape),
  };
}

export function getRootStringShapeOptions(definition: ChordDefinition, rootString: number): RootStringShapeOption[] {
  const voicings = getDefinitionRootVoicings(definition)
    .filter((voicing) => voicing.rootString === rootString)
    .sort((a, b) => {
      const voicingCmp = a.rootVoicing.localeCompare(b.rootVoicing, undefined, { numeric: true });
      if (voicingCmp !== 0) {
        return voicingCmp;
      }
      return a.shapeIndex - b.shapeIndex;
    });

  return voicings.map((voicing) => ({
    ...voicing,
    shape: definition.shapes[voicing.shapeIndex] as ChordShape,
  }));
}

export function buildShapeSelectionStateKey(chordId: string, rootString: number): string {
  return `${chordId}|rs:${rootString}`;
}

export function buildFingeringOffsetArray(shape: ChordShape): string {
  const offsetsByString = new Map<number, number>();

  shape.offsets.forEach((offsetDef) => {
    const existing = offsetsByString.get(offsetDef.string);
    if (existing === undefined || Math.abs(offsetDef.offset) < Math.abs(existing)) {
      offsetsByString.set(offsetDef.string, offsetDef.offset);
    }
  });

  const values: string[] = [];
  for (let stringIndex = 5; stringIndex >= 0; stringIndex -= 1) {
    const offset = offsetsByString.get(stringIndex);
    values.push(offset === undefined ? 'x' : String(offset));
  }

  return `[${values.join(',')}]`;
}
