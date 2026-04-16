import { describe, expect, it } from 'vitest';
import { CHORD_DICTIONARY } from '../src/utils/chordLibrary';
import { buildVisualArchetypeGroups, compareVisualDegreeSequences } from '../src/utils/visualArchetypes';

describe('Visual Archetype Grouping', () => {
  it('groups maj and min string-6-root shapes into the same implied archetype', () => {
    const groups = buildVisualArchetypeGroups(CHORD_DICTIONARY);

    const target = groups.find((group) => {
      if (group.rootString !== 5) {
        return false;
      }
      const qualities = new Set(group.members.map((member) => member.quality));
      return qualities.has('maj') && qualities.has('min');
    });

    expect(target).toBeDefined();

    const majMember = target?.members.find((member) => member.quality === 'maj');
    const minMember = target?.members.find((member) => member.quality === 'min');

    expect(majMember).toBeDefined();
    expect(minMember).toBeDefined();
    expect(majMember?.impliedVisualKey).toBe(minMember?.impliedVisualKey);
    expect(majMember?.strictVisualKey).toBe(minMember?.strictVisualKey);
    expect(majMember?.rawIntervalSignature).not.toBe(minMember?.rawIntervalSignature);
    expect(target?.degreeSequence).toEqual([1, 5, 1, 3, 5, 1]);
  });

  it('returns only groups that collide across different chord qualities', () => {
    const groups = buildVisualArchetypeGroups(CHORD_DICTIONARY);

    expect(groups.length).toBeGreaterThan(0);
    groups.forEach((group) => {
      const qualityCount = new Set(group.members.map((member) => member.quality)).size;
      expect(qualityCount).toBeGreaterThan(1);
    });
  });

  it('keeps root-string voicing families separated', () => {
    const groups = buildVisualArchetypeGroups(CHORD_DICTIONARY);

    groups.forEach((group) => {
      group.members.forEach((member) => {
        expect(member.rootString).toBe(group.rootString);
      });
    });
  });

  it('does not group non-diatonic aug7 with dominant 7 visuals', () => {
    const groups = buildVisualArchetypeGroups(CHORD_DICTIONARY);

    const hasAug7AndDom7InSameGroup = groups.some((group) => {
      const qualities = new Set(group.members.map((member) => member.quality));
      return qualities.has('aug7') && qualities.has('7');
    });

    expect(hasAug7AndDom7InSameGroup).toBe(false);
  });

  it('sorts visual degree sequences by length then lexical degree order', () => {
    const sequences = [
      [1, 5, 1, 3, 5, 1],
      [1, 7, 3, 5],
      [1, 5, 7, 3, 5, 1],
      [1, 4, 7, 3, 5, 1],
    ];

    const sorted = [...sequences].sort(compareVisualDegreeSequences);

    expect(sorted).toEqual([
      [1, 7, 3, 5],
      [1, 4, 7, 3, 5, 1],
      [1, 5, 1, 3, 5, 1],
      [1, 5, 7, 3, 5, 1],
    ]);
  });
});
