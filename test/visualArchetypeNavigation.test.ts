import { describe, expect, it } from 'vitest';
import {
  buildVisualDiatonicOutlineState,
  getVisualGroupDiatonicOptions,
  resolveVisualDiatonicOutlineTargetsForTarget,
  resolveVisualDiatonicSelectionForTarget,
  type VisualArchetypeNavigationGroup,
} from '../src/utils/visualArchetypeNavigation';

const FIXTURE_GROUPS: VisualArchetypeNavigationGroup[] = [
  {
    impliedVisualKey: 'group-major-minor',
    members: [
      {
        quality: 'maj',
        chordId: 'maj::0',
        rootString: 5,
        rootVoicing: 'E1',
        shapeIndex: 0,
      },
      {
        quality: 'min',
        chordId: 'min::0',
        rootString: 5,
        rootVoicing: 'E1',
        shapeIndex: 2,
      },
    ],
  },
];

describe('Visual archetype deep-link diatonic selection', () => {
  it('selects the first matching diatonic option for the target quality', () => {
    const next = resolveVisualDiatonicSelectionForTarget(
      FIXTURE_GROUPS,
      {
        quality: 'min',
        chordId: 'min::0',
        rootString: 5,
        rootVoicing: 'E1',
        shapeIndex: 2,
      },
      {},
    );

    expect(next['group-major-minor']).toBe('ii');
  });

  it('falls back to the first available group option when quality has no mapped diatonic options', () => {
    const options = getVisualGroupDiatonicOptions(FIXTURE_GROUPS[0]);

    const next = resolveVisualDiatonicSelectionForTarget(
      FIXTURE_GROUPS,
      {
        quality: 'unknown-quality',
        chordId: 'min::0',
        rootString: 5,
        rootVoicing: 'E1',
        shapeIndex: 2,
      },
      {},
    );

    expect(next['group-major-minor']).toBe(options[0]);
  });

  it('does not update selection when strict shape metadata does not match', () => {
    const current = { 'group-major-minor': 'I' };
    const next = resolveVisualDiatonicSelectionForTarget(
      FIXTURE_GROUPS,
      {
        quality: 'min',
        chordId: 'min::0',
        rootString: 5,
        rootVoicing: 'E1',
        shapeIndex: 99,
      },
      current,
    );

    expect(next).toEqual(current);
  });

  it('returns all quality-compatible diatonic options for segmented-control outlining', () => {
    const majorOutlineTargets = resolveVisualDiatonicOutlineTargetsForTarget(
      FIXTURE_GROUPS,
      {
        quality: 'maj',
        chordId: 'maj::0',
        rootString: 5,
        rootVoicing: 'E1',
        shapeIndex: 0,
      },
    );

    expect(majorOutlineTargets).toEqual([
      {
        groupKey: 'group-major-minor',
        options: ['I', 'IV', 'V'],
      },
    ]);

    const minorOutlineTargets = resolveVisualDiatonicOutlineTargetsForTarget(
      FIXTURE_GROUPS,
      {
        quality: 'min',
        chordId: 'min::0',
        rootString: 5,
        rootVoicing: 'E1',
        shapeIndex: 2,
      },
    );

    expect(minorOutlineTargets).toEqual([
      {
        groupKey: 'group-major-minor',
        options: ['ii', 'iii', 'vi'],
      },
    ]);
  });

  it('falls back to first available option for outlining when quality has no compatible options', () => {
    const outlineTargets = resolveVisualDiatonicOutlineTargetsForTarget(
      FIXTURE_GROUPS,
      {
        quality: 'unknown-quality',
        chordId: 'min::0',
        rootString: 5,
        rootVoicing: 'E1',
        shapeIndex: 2,
      },
    );

    expect(outlineTargets).toEqual([
      {
        groupKey: 'group-major-minor',
        options: ['I'],
      },
    ]);
  });

  it('builds segmented outline state map from outline targets', () => {
    const outlineState = buildVisualDiatonicOutlineState([
      { groupKey: 'group-major-minor', options: ['I', 'IV', 'V'] },
      { groupKey: 'group-secondary', options: ['ii', 'iii', 'vi'] },
    ]);

    expect(outlineState).toEqual({
      'group-major-minor': ['I', 'IV', 'V'],
      'group-secondary': ['ii', 'iii', 'vi'],
    });
  });
});
