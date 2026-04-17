import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import SheetMusic from './SheetMusic';
import { LegendPanel } from './LegendPanel';
import { CHORD_DICTIONARY } from '../utils/chordLibrary';
import { CHORD_QUALITY_DIATONIC_MAP, DIATONIC_INTERVALS } from '../utils/diatonic';
import {
  getKeySignatureInfo,
  getNoteNameFromPitchClass,
  KEY_CONSTRAINT_OPTIONS,
  keySignatureUsesFlats,
} from '../utils/musicTheory';
import { getGalleryOrderedChordDefinitions } from '../utils/chordOrdering';
import {
  readSessionJson,
  readSessionString,
  writeSessionJson,
  writeSessionString,
} from '../utils/viewState';
import {
  buildVisualArchetypeGroups,
  type VisualArchetypeGroup,
  type VisualArchetypeMember,
} from '../utils/visualArchetypes';
import { buildShapeSheetPreview, resolveRootFretForShape } from '../utils/chordShapeRendering';
import type { ShapePresetRequest } from '../types/nativeNavigation';

const DIATONIC_DISPLAY_ORDER = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'viio'];
const VISUAL_ROOT_FILTER_KEY = 'fret-visual-root-filter';
const VISUAL_CHORD_SEARCH_KEY = 'fret-visual-chord-search';
const VISUAL_SELECTED_DIATONIC_KEY = 'fret-visual-selected-diatonic';

type RootStringFilter = 'ALL' | 5 | 4 | 3 | 2;

function parseRootStringFilter(value: string | null): RootStringFilter {
  if (value === '5' || value === '4' || value === '3' || value === '2') {
    return Number(value) as RootStringFilter;
  }

  return 'ALL';
}

function getGroupDiatonicOptions(group: VisualArchetypeGroup): string[] {
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

function getActiveMemberForDiatonic(
  group: VisualArchetypeGroup,
  activeDiatonic: string | null,
  qualityOrderMap: Map<string, number>,
): VisualArchetypeMember {
  let candidates = [...group.members];

  if (activeDiatonic) {
    const matched = candidates.filter((member) => (CHORD_QUALITY_DIATONIC_MAP[member.quality] || []).includes(activeDiatonic));
    if (matched.length > 0) {
      candidates = matched;
    }
  }

  candidates.sort((a, b) => {
    const aRank = qualityOrderMap.get(a.quality) ?? Number.MAX_SAFE_INTEGER;
    const bRank = qualityOrderMap.get(b.quality) ?? Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) {
      return aRank - bRank;
    }
    if (a.quality !== b.quality) {
      return a.quality.localeCompare(b.quality);
    }
    return a.shapeIndex - b.shapeIndex;
  });

  return candidates[0];
}

interface VisualArchetypeModeProps {
  keyConstraint: string;
  useGalleryColors: boolean;
  onToggleGalleryColors?: () => void;
  onChangeKeyConstraint?: (next: string) => void;
  onOpenSandbox?: (request: ShapePresetRequest) => void;
}

const ROOT_FILTER_OPTIONS: RootStringFilter[] = ['ALL', 5, 4, 3, 2];

const VisualArchetypeMode: React.FC<VisualArchetypeModeProps> = ({
  keyConstraint,
  useGalleryColors,
  onToggleGalleryColors,
  onChangeKeyConstraint,
  onOpenSandbox,
}) => {
  const [rootStringFilter, setRootStringFilter] = useState<RootStringFilter>(() => {
    return parseRootStringFilter(readSessionString(VISUAL_ROOT_FILTER_KEY, 'ALL'));
  });
  const [selectedDiatonicByGroup, setSelectedDiatonicByGroup] = useState<Record<string, string>>(
    () => readSessionJson<Record<string, string>>(VISUAL_SELECTED_DIATONIC_KEY, {}),
  );
  const [chordSearch, setChordSearch] = useState(() => readSessionString(VISUAL_CHORD_SEARCH_KEY, ''));

  const scrollRef = useRef<ScrollView>(null);
  const qualityOffsetsRef = useRef<Record<string, number>>({});
  const [pendingQualityScroll, setPendingQualityScroll] = useState<string | null>(null);
  const [isChordListOpen, setIsChordListOpen] = useState(false);
  const [isKeyPickerOpen, setIsKeyPickerOpen] = useState(false);
  const [isRootFilterOpen, setIsRootFilterOpen] = useState(false);

  const rootObj = useMemo(() => getKeySignatureInfo(keyConstraint), [keyConstraint]);
  const notationUsesFlats = useMemo(
    () => keySignatureUsesFlats(rootObj.renderableKeyName),
    [rootObj.renderableKeyName],
  );

  const groups = useMemo(() => buildVisualArchetypeGroups(CHORD_DICTIONARY), []);
  const orderedChordDefs = useMemo(() => getGalleryOrderedChordDefinitions(CHORD_DICTIONARY), []);

  const qualityOrderMap = useMemo(() => {
    return new Map(orderedChordDefs.map((definition, index) => [definition.quality, index]));
  }, [orderedChordDefs]);

  const filteredChordList = useMemo(() => {
    const query = chordSearch.trim().toLowerCase();
    if (!query) {
      return orderedChordDefs;
    }

    return orderedChordDefs.filter((definition) => definition.quality.toLowerCase().includes(query));
  }, [orderedChordDefs, chordSearch]);

  const filteredGroups = useMemo(() => {
    if (rootStringFilter === 'ALL') {
      return groups;
    }

    return groups.filter((group) => group.rootString === rootStringFilter);
  }, [groups, rootStringFilter]);

  useEffect(() => {
    qualityOffsetsRef.current = {};
  }, [filteredGroups]);

  const availableChordQualities = useMemo(() => {
    const set = new Set<string>();
    filteredGroups.forEach((group) => {
      group.members.forEach((member) => set.add(member.quality));
    });
    return set;
  }, [filteredGroups]);

  useEffect(() => {
    writeSessionString(VISUAL_ROOT_FILTER_KEY, String(rootStringFilter));
  }, [rootStringFilter]);

  useEffect(() => {
    writeSessionString(VISUAL_CHORD_SEARCH_KEY, chordSearch);
  }, [chordSearch]);

  useEffect(() => {
    writeSessionJson(VISUAL_SELECTED_DIATONIC_KEY, selectedDiatonicByGroup);
  }, [selectedDiatonicByGroup]);

  useEffect(() => {
    if (!pendingQualityScroll) {
      return;
    }

    const y = qualityOffsetsRef.current[pendingQualityScroll];
    if (y === undefined) {
      return;
    }

    scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
    setPendingQualityScroll(null);
  }, [pendingQualityScroll, selectedDiatonicByGroup, rootStringFilter]);

  return (
    <View style={styles.screen}>
      <View style={styles.actionHeader}>
        <Pressable onPress={() => setIsChordListOpen(true)} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Chord List</Text>
        </Pressable>

        <Pressable
          onPress={onToggleGalleryColors}
          style={[styles.actionButton, useGalleryColors ? styles.actionButtonActive : null]}
        >
          <Text style={[styles.actionButtonText, useGalleryColors ? styles.actionButtonTextActive : null]}>
            Gallery Colors
          </Text>
        </Pressable>

        <Pressable onPress={() => setIsKeyPickerOpen(true)} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Key: {rootObj.renderableKeyName}</Text>
        </Pressable>

        <Pressable onPress={() => setIsRootFilterOpen(true)} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>
            Roots: {rootStringFilter === 'ALL' ? 'All' : `Str ${rootStringFilter + 1}`}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {filteredGroups.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No visual archetype collisions for this filter.</Text>
          </View>
        ) : (
          filteredGroups.map((group) => {
            const diatonicOptions = getGroupDiatonicOptions(group);
            const activeDiatonic = diatonicOptions.length > 0
              ? selectedDiatonicByGroup[group.impliedVisualKey] || diatonicOptions[0]
              : null;

            const previewRootPitchClass = activeDiatonic
              ? (rootObj.pitchClass + DIATONIC_INTERVALS[activeDiatonic]) % 12
              : rootObj.pitchClass;

            const activeMember = getActiveMemberForDiatonic(group, activeDiatonic, qualityOrderMap);
            const preview = buildShapeSheetPreview(activeMember.shape, previewRootPitchClass, useGalleryColors);
            const previewRootLabel = getNoteNameFromPitchClass(previewRootPitchClass, notationUsesFlats);

            const groupQualities = Array.from(new Set(group.members.map((member) => member.quality)));

            return (
              <View
                key={group.impliedVisualKey}
                style={styles.groupCard}
                onLayout={(event) => {
                  const y = event.nativeEvent.layout.y;
                  groupQualities.forEach((quality) => {
                    if (qualityOffsetsRef.current[quality] === undefined) {
                      qualityOffsetsRef.current[quality] = y;
                    }
                  });

                  if (pendingQualityScroll && groupQualities.includes(pendingQualityScroll)) {
                    scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
                    setPendingQualityScroll(null);
                  }
                }}
              >
                <Text style={styles.groupTitle}>Visual Degrees: {group.degreeSequence.join(' - ')}</Text>
                <Text style={styles.groupMeta}>Root archetype on string {group.rootString + 1}</Text>

                <View style={styles.sheetFrame}>
                  <SheetMusic
                    notes={preview.notes}
                    colors={preview.colors}
                    gameMode="SANDBOX"
                    useFlats={notationUsesFlats}
                    keySignature={rootObj.renderableKeyName}
                    suppressDiatonicAccidentals
                    zoomSemitones={preview.zoomSemitones}
                  />
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaBadge}>Key Root: {previewRootLabel}</Text>
                </View>

                {diatonicOptions.length > 0 ? (
                  <View style={styles.diatonicRow}>
                    {diatonicOptions.map((option) => {
                      const active = activeDiatonic === option;
                      return (
                        <Pressable
                          key={`${group.impliedVisualKey}-${option}`}
                          style={[styles.diatonicChip, active ? styles.diatonicChipActive : null]}
                          onPress={() => setSelectedDiatonicByGroup((prev) => ({ ...prev, [group.impliedVisualKey]: option }))}
                        >
                          <Text style={[styles.diatonicChipText, active ? styles.diatonicChipTextActive : null]}>{option}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

                <View style={styles.memberRow}>
                  {group.members.map((member) => {
                    const sandboxFret = resolveRootFretForShape(previewRootPitchClass, member.shape);
                    const diatonic = CHORD_QUALITY_DIATONIC_MAP[member.quality] || [];
                    const isActive =
                      member.quality === activeMember.quality && member.shapeIndex === activeMember.shapeIndex;

                    return (
                      <Pressable
                        key={`${member.quality}-${member.rootString}-${member.shapeIndex}`}
                        style={[styles.memberCard, isActive ? styles.memberCardActive : null]}
                        onPress={() => {
                          onOpenSandbox?.({
                            quality: member.quality,
                            rootString: member.rootString,
                            fretOffset: sandboxFret,
                          });
                        }}
                      >
                        <Text style={styles.memberTitle}>{member.quality}</Text>
                        <Text style={styles.memberText}>Raw: {member.rawIntervalSignature}</Text>
                        <Text style={styles.memberText}>Diatonic: {diatonic.length > 0 ? diatonic.join(', ') : 'none'}</Text>
                        <Text style={styles.memberFret}>Sandbox fret: {sandboxFret}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}

        <LegendPanel variant="large" />
      </ScrollView>

      <Modal visible={isChordListOpen} animationType="slide" transparent onRequestClose={() => setIsChordListOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chord List</Text>
              <Pressable onPress={() => setIsChordListOpen(false)} hitSlop={8}>
                <Text style={styles.modalClose}>Close</Text>
              </Pressable>
            </View>

            <TextInput
              value={chordSearch}
              onChangeText={setChordSearch}
              placeholder="Search chord quality (e.g. min9)"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
              {filteredChordList.map((definition) => {
                const isAvailable = availableChordQualities.has(definition.quality);
                return (
                  <Pressable
                    key={definition.quality}
                    disabled={!isAvailable}
                    onPress={() => {
                      const y = qualityOffsetsRef.current[definition.quality];
                      if (y !== undefined) {
                        scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
                      } else {
                        setPendingQualityScroll(definition.quality);
                      }
                      setIsChordListOpen(false);
                    }}
                    style={[styles.modalListItem, !isAvailable ? styles.modalListItemDisabled : null]}
                  >
                    <Text style={[styles.modalListItemText, !isAvailable ? styles.modalListItemTextDisabled : null]}>
                      {definition.quality}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={isKeyPickerOpen} animationType="slide" transparent onRequestClose={() => setIsKeyPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gallery Key</Text>
              <Pressable onPress={() => setIsKeyPickerOpen(false)} hitSlop={8}>
                <Text style={styles.modalClose}>Close</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
              {KEY_CONSTRAINT_OPTIONS.map((key) => {
                const active = key === keyConstraint;
                return (
                  <Pressable
                    key={key}
                    style={[styles.keyListItem, active ? styles.keyListItemActive : null]}
                    onPress={() => {
                      onChangeKeyConstraint?.(key);
                      setIsKeyPickerOpen(false);
                    }}
                  >
                    <Text style={[styles.keyListItemText, active ? styles.keyListItemTextActive : null]}>{key}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={isRootFilterOpen} animationType="slide" transparent onRequestClose={() => setIsRootFilterOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Root String Filter</Text>
              <Pressable onPress={() => setIsRootFilterOpen(false)} hitSlop={8}>
                <Text style={styles.modalClose}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.filterRow}>
              {ROOT_FILTER_OPTIONS.map((option) => {
                const active = rootStringFilter === option;
                const label = option === 'ALL' ? 'All' : `Str ${option + 1}`;
                return (
                  <Pressable
                    key={String(option)}
                    onPress={() => {
                      setRootStringFilter(option);
                      setIsRootFilterOpen(false);
                    }}
                    style={[styles.filterChip, active ? styles.filterChipActive : null]}
                  >
                    <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  actionHeader: {
    height: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  actionButtonText: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  actionButtonTextActive: {
    color: '#ffffff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 12,
    paddingBottom: 24,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterChipActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  filterChipText: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    marginBottom: 10,
  },
  modalSheet: {
    maxHeight: '88%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900',
  },
  modalClose: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modalList: {
    maxHeight: 420,
  },
  modalListContent: {
    gap: 8,
    paddingBottom: 10,
  },
  modalListItem: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  modalListItemDisabled: {
    opacity: 0.45,
  },
  modalListItemText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalListItemTextDisabled: {
    color: '#94a3b8',
  },
  keyListItem: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  keyListItemActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  keyListItemText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
  },
  keyListItemTextActive: {
    color: '#1d4ed8',
  },
  emptyCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    fontWeight: '700',
  },
  groupCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 10,
  },
  groupTitle: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  groupMeta: {
    color: '#64748b',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '700',
  },
  sheetFrame: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaBadge: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '700',
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  diatonicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  diatonicChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  diatonicChipActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  diatonicChipText: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  diatonicChipTextActive: {
    color: '#ffffff',
  },
  memberRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberCard: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    padding: 9,
    minWidth: 150,
    gap: 2,
  },
  memberCardActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  memberTitle: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
  },
  memberText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  memberFret: {
    marginTop: 2,
    color: '#1d4ed8',
    fontSize: 10,
    fontWeight: '800',
  },
});

export default VisualArchetypeMode;
