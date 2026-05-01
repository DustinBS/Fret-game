const ROOT_STRING_OPEN_NOTES: Record<number, string> = {
  5: 'E',
  4: 'A',
  3: 'D',
  2: 'G',
  1: 'B',
  0: 'e',
};

export interface RootVoicingDisplayParts {
  baseLabel: string;
  voicingLabel: string | null;
  plainLabel: string;
}

export function getRootVoicingArchetype(value: string): string {
  const match = value.trim().toUpperCase().match(/[A-G]/);
  return match ? match[0] : '';
}

export function buildLooseRootVoicingLabel(value: string): string {
  const archetype = getRootVoicingArchetype(value);
  if (archetype) {
    return archetype;
  }

  return value.trim().toUpperCase();
}

function normalizeRootVoicingLabel(value: string): string {
  return value.trim().toUpperCase();
}

export function buildRootVoicingDisplayParts(rootString: number, rootVoicing: string): RootVoicingDisplayParts {
  const openNote = ROOT_STRING_OPEN_NOTES[rootString] ?? '';
  const baseLabel = openNote ? `Str ${rootString + 1}${openNote}` : `Str ${rootString + 1}`;

  if (!rootVoicing) {
    return {
      baseLabel,
      voicingLabel: null,
      plainLabel: baseLabel,
    };
  }

  const voicingLabel = normalizeRootVoicingLabel(rootVoicing) || null;

  return {
    baseLabel,
    voicingLabel,
    plainLabel: voicingLabel ? `${baseLabel} ${voicingLabel}` : baseLabel,
  };
}

export function buildRootVoicingPlainLabel(rootString: number, rootVoicing: string): string {
  return buildRootVoicingDisplayParts(rootString, rootVoicing).plainLabel;
}
