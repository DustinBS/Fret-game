import { CHORD_QUALITY_DIATONIC_MAP } from './diatonic';

const DIATONIC_DISPLAY_ORDER = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'viio'];

export interface VisualArchetypeNavigationMember {
  quality: string;
  chordId: string;
  rootString: number;
  rootVoicing: string;
  shapeIndex: number;
}

export interface VisualArchetypeNavigationGroup {
  impliedVisualKey: string;
  members: VisualArchetypeNavigationMember[];
}

export interface VisualArchetypeNavigationTarget {
  quality: string;
  chordId?: string;
  rootString?: number;
  rootVoicing?: string;
  shapeIndex?: number;
}

export interface VisualDiatonicOutlineTarget {
  groupKey: string;
  options: string[];
}

function normalizeRootVoicing(value: string): string {
  return value.trim().toUpperCase();
}

function memberMatchesTarget(
  member: VisualArchetypeNavigationMember,
  target: VisualArchetypeNavigationTarget,
): boolean {
  if (target.chordId) {
    if (member.chordId !== target.chordId) {
      return false;
    }
  } else if (member.quality !== target.quality) {
    return false;
  }

  if (target.rootString !== undefined && member.rootString !== target.rootString) {
    return false;
  }

  if (target.shapeIndex !== undefined && member.shapeIndex !== target.shapeIndex) {
    return false;
  }

  if (
    target.rootVoicing
    && normalizeRootVoicing(member.rootVoicing) !== normalizeRootVoicing(target.rootVoicing)
  ) {
    return false;
  }

  return true;
}

export function getVisualGroupDiatonicOptions(
  group: Pick<VisualArchetypeNavigationGroup, 'members'>,
): string[] {
  const diatonicSet = new Set<string>();
  group.members.forEach((member) => {
    const options = CHORD_QUALITY_DIATONIC_MAP[member.quality] || [];
    options.forEach((option) => diatonicSet.add(option));
  });

  return Array.from(diatonicSet).sort((a, b) => {
    const aIdx = DIATONIC_DISPLAY_ORDER.indexOf(a);
    const bIdx = DIATONIC_DISPLAY_ORDER.indexOf(b);
    const aa = aIdx === -1 ? Number.MAX_SAFE_INTEGER : aIdx;
    const bb = bIdx === -1 ? Number.MAX_SAFE_INTEGER : bIdx;
    return aa - bb;
  });
}

export function resolveVisualDiatonicSelectionForTarget(
  groups: VisualArchetypeNavigationGroup[],
  target: VisualArchetypeNavigationTarget,
  currentSelection: Record<string, string>,
): Record<string, string> {
  let changed = false;
  const preferredByQuality = CHORD_QUALITY_DIATONIC_MAP[target.quality] || [];
  const nextSelection: Record<string, string> = { ...currentSelection };

  groups.forEach((group) => {
    if (!group.members.some((member) => memberMatchesTarget(member, target))) {
      return;
    }

    const options = getVisualGroupDiatonicOptions(group);
    if (options.length === 0) {
      return;
    }

    const preferredOption = options.find((option) => preferredByQuality.includes(option)) ?? options[0];
    if (nextSelection[group.impliedVisualKey] === preferredOption) {
      return;
    }

    nextSelection[group.impliedVisualKey] = preferredOption;
    changed = true;
  });

  return changed ? nextSelection : currentSelection;
}

export function resolveVisualDiatonicOutlineTargetsForTarget(
  groups: VisualArchetypeNavigationGroup[],
  target: VisualArchetypeNavigationTarget,
): VisualDiatonicOutlineTarget[] {
  const preferredByQuality = CHORD_QUALITY_DIATONIC_MAP[target.quality] || [];

  return groups.flatMap((group) => {
    if (!group.members.some((member) => memberMatchesTarget(member, target))) {
      return [];
    }

    const options = getVisualGroupDiatonicOptions(group);
    if (options.length === 0) {
      return [];
    }

    const qualityCompatibleOptions = options.filter((option) => preferredByQuality.includes(option));
    if (qualityCompatibleOptions.length > 0) {
      return [{ groupKey: group.impliedVisualKey, options: qualityCompatibleOptions }];
    }

    return [{ groupKey: group.impliedVisualKey, options: [options[0]] }];
  });
}

export function buildVisualDiatonicOutlineState(
  targets: VisualDiatonicOutlineTarget[] | null | undefined,
): Record<string, string[]> {
  if (!targets || targets.length === 0) {
    return {};
  }

  const next: Record<string, string[]> = {};
  targets.forEach((targetEntry) => {
    if (targetEntry.options.length > 0) {
      next[targetEntry.groupKey] = targetEntry.options;
    }
  });

  return next;
}
