import type { ChordDefinition } from './chordLibrary.types';
import { getGalleryOrderedChordDefinitions } from './chordOrdering';
import { buildChordDefinitionId } from './chordVoicing';

export interface OrderedChordEntry {
  definition: ChordDefinition;
  chordId: string;
}

export function buildOrderedChordEntries(chords: ChordDefinition[]): OrderedChordEntry[] {
  const definitionIndexMap = new Map(chords.map((definition, definitionIndex) => [definition, definitionIndex]));

  return getGalleryOrderedChordDefinitions(chords).map((definition) => {
    const definitionIndex = definitionIndexMap.get(definition) ?? chords.findIndex((candidate) => candidate === definition);

    return {
      definition,
      chordId: buildChordDefinitionId(definition.quality, definitionIndex),
    };
  });
}

export function buildQualityDisplayLabelMap(entries: OrderedChordEntry[]): Map<string, string> {
  const qualityCounts = new Map<string, number>();
  entries.forEach(({ definition }) => {
    qualityCounts.set(definition.quality, (qualityCounts.get(definition.quality) ?? 0) + 1);
  });

  const seenByQuality = new Map<string, number>();
  const labelsByChordId = new Map<string, string>();

  entries.forEach(({ definition, chordId }) => {
    const count = qualityCounts.get(definition.quality) ?? 0;
    if (count <= 1) {
      labelsByChordId.set(chordId, definition.quality);
      return;
    }

    const nextOrdinal = (seenByQuality.get(definition.quality) ?? 0) + 1;
    seenByQuality.set(definition.quality, nextOrdinal);
    labelsByChordId.set(chordId, `${definition.quality} #${nextOrdinal}`);
  });

  return labelsByChordId;
}
