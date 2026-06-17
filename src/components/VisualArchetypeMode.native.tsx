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
import {
  buildVisualDiatonicOutlineState,
  getVisualGroupDiatonicOptions,
  resolveVisualDiatonicOutlineTargetsForTarget,
  resolveVisualDiatonicSelectionForTarget,
  type VisualDiatonicOutlineTarget,
} from '../utils/visualArchetypeNavigation';
import { buildShapeSheetPreview, resolveRootFretForShape } from '../utils/chordShapeRendering';
import type { ShapePresetRequest } from '../types/nativeNavigation';
import { buildFingeringOffsetArray } from '../utils/chordVoicing';
import { buildOrderedChordEntries, buildQualityDisplayLabelMap } from '../utils/chordEntries';
import {
  NATIVE_SCROLL_IDLE_HIGHLIGHT_MS,
  NAVIGATION_OUTLINE_ACCENT_HEX,
  NAVIGATION_OUTLINE_SOFT_BACKGROUND_HEX,
  NAVIGATION_OUTLINE_TOTAL_MS,
} from '../utils/navigationFeedback';

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

function getActiveMemberForDiatonic(
  group: VisualArchetypeGroup,
  activeDiatonic: string | null,
  chordOrderMap: Map<string, number>,
): VisualArchetypeMember {
  let candidates = [...group.members];

  if (activeDiatonic) {
    const matched = candidates.filter((member) => (CHORD_QUALITY_DIATONIC_MAP[member.quality] || []).includes(activeDiatonic));
    if (matched.length > 0) {
      candidates = matched;
    }
  }

  candidates.sort((a, b) => {
    const aRank = chordOrderMap.get(a.chordId) ?? Number.MAX_SAFE_INTEGER;
    const bRank = chordOrderMap.get(b.chordId) ?? Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) {
      return aRank - bRank;
    }
    if (a.quality !== b.quality) {
      return a.quality.localeCompare(b.quality);
    }
    if (a.definitionIndex !== b.definitionIndex) {
      return a.definitionIndex - b.definitionIndex;
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
  scrollRequest?: {
    id: number;
    quality: string;
    chordId?: string;
    rootString?: number;
    rootVoicing?: string;
    shapeIndex?: number;
  } | null;
  sidebarCollapsed?: boolean;
}

const ROOT_FILTER_OPTIONS: RootStringFilter[] = ['ALL', 5, 4, 3, 2];

function buildVisualMemberCellKey(
  chordId: string,
  rootString: number,
  rootVoicing: string,
  shapeIndex: number,
): string {
  return `${chordId}|${rootString}|${rootVoicing.trim().toUpperCase()}|${shapeIndex}`;
}

interface VisualScrollTarget {
  quality: string;
  chordId?: string;
  rootString?: number;
  rootVoicing?: string;
  shapeIndex?: number;
}

const VisualArchetypeMode: React.FC<VisualArchetypeModeProps> = ({
  keyConstraint,
  useGalleryColors,
  onToggleGalleryColors,
  onChangeKeyConstraint,
  onOpenSandbox,
  scrollRequest,
  sidebarCollapsed,
}) => {
  const [rootStringFilter, setRootStringFilter] = useState<RootStringFilter>(() => {
    return parseRootStringFilter(readSessionString(VISUAL_ROOT_FILTER_KEY, 'ALL'));
  });
  const [selectedDiatonicByGroup, setSelectedDiatonicByGroup] = useState<Record<string, string>>(
    () => readSessionJson<Record<string, string>>(VISUAL_SELECTED_DIATONIC_KEY, {}),
  );
  const [highlightedDiatonicOptionsByGroup, setHighlightedDiatonicOptionsByGroup] = useState<Record<string, string[]>>({});
  const [chordSearch, setChordSearch] = useState(() => readSessionString(VISUAL_CHORD_SEARCH_KEY, ''));

  const scrollRef = useRef<ScrollView>(null);
  const qualityOffsetsRef = useRef<Record<string, number>>({});
  const [pendingScrollTarget, setPendingScrollTarget] = useState<VisualScrollTarget | null>(null);
  const [highlightedMemberCellKey, setHighlightedMemberCellKey] = useState<string | null>(null);
  const pendingMemberHighlightKeyRef = useRef<string | null>(null);
  const pendingMemberHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDiatonicOutlineTargetsRef = useRef<VisualDiatonicOutlineTarget[] | null>(null);
  const [isChordListOpen, setIsChordListOpen] = useState(false);
  const [isKeyPickerOpen, setIsKeyPickerOpen] = useState(false);
  const [isRootFilterOpen, setIsRootFilterOpen] = useState(false);

  const rootObj = useMemo(() => getKeySignatureInfo(keyConstraint), [keyConstraint]);
  const notationUsesFlats = useMemo(
    () => keySignatureUsesFlats(rootObj.renderableKeyName),
    [rootObj.renderableKeyName],
  );

  const buildMemberCellKeyFromTarget = (target: VisualScrollTarget): string | null => {
    if (!target.chordId) {
      return null;
    }

    if (target.rootString === undefined || !target.rootVoicing || target.shapeIndex === undefined) {
      return null;
    }

    return buildVisualMemberCellKey(target.chordId, target.rootString, target.rootVoicing, target.shapeIndex);
  };

  const flushPendingMemberHighlight = () => {
    const nextFocusKey = pendingMemberHighlightKeyRef.current;
    const pendingDiatonicOutlineTargets = pendingDiatonicOutlineTargetsRef.current;
    pendingDiatonicOutlineTargetsRef.current = null;

    const nextOutlineState = buildVisualDiatonicOutlineState(pendingDiatonicOutlineTargets);
    if (Object.keys(nextOutlineState).length > 0) {
      setHighlightedDiatonicOptionsByGroup(nextOutlineState);
    }

    if (!nextFocusKey) {
      return;
    }

    setHighlightedMemberCellKey(nextFocusKey);
    pendingMemberHighlightKeyRef.current = null;
  };

  const queueMemberHighlightAfterScrollSettle = (focusKey: string) => {
    pendingMemberHighlightKeyRef.current = focusKey;
    if (pendingMemberHighlightTimeoutRef.current) {
      clearTimeout(pendingMemberHighlightTimeoutRef.current);
    }

    pendingMemberHighlightTimeoutRef.current = setTimeout(() => {
      pendingMemberHighlightTimeoutRef.current = null;
      flushPendingMemberHighlight();
    }, NATIVE_SCROLL_IDLE_HIGHLIGHT_MS);
  };

  const groups = useMemo(() => buildVisualArchetypeGroups(CHORD_DICTIONARY), []);
  const orderedChordEntries = useMemo(() => buildOrderedChordEntries(CHORD_DICTIONARY), []);
  const qualityDisplayLabelMap = useMemo(() => buildQualityDisplayLabelMap(orderedChordEntries), [orderedChordEntries]);

  const chordOrderMap = useMemo(() => {
    return new Map(orderedChordEntries.map(({ chordId }, index) => [chordId, index]));
  }, [orderedChordEntries]);

  const getDisplayQuality = (chordId: string, quality: string): string => {
    return qualityDisplayLabelMap.get(chordId) ?? quality;
  };

  const filteredChordList = useMemo(() => {
    const query = chordSearch.trim().toLowerCase();
    if (!query) {
      return orderedChordEntries;
    }

    return orderedChordEntries.filter(({ definition }) => definition.quality.toLowerCase().includes(query));
  }, [orderedChordEntries, chordSearch]);

  const filteredGroups = useMemo(() => {
    if (rootStringFilter === 'ALL') {
      return groups;
    }

    return groups.filter((group) => group.rootString === rootStringFilter);
  }, [groups, rootStringFilter]);

  useEffect(() => {
    qualityOffsetsRef.current = {};
  }, [filteredGroups]);

  const availableChordIds = useMemo(() => {
    const set = new Set<string>();
    filteredGroups.forEach((group) => {
      group.members.forEach((member) => set.add(member.chordId));
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
    const groupKeys = Object.keys(highlightedDiatonicOptionsByGroup);
    if (groupKeys.length === 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setHighlightedDiatonicOptionsByGroup({});
    }, NAVIGATION_OUTLINE_TOTAL_MS);

    return () => clearTimeout(timeoutId);
  }, [highlightedDiatonicOptionsByGroup]);

  useEffect(() => {
    return () => {
      if (pendingMemberHighlightTimeoutRef.current) {
        clearTimeout(pendingMemberHighlightTimeoutRef.current);
      }
      pendingMemberHighlightTimeoutRef.current = null;
      pendingMemberHighlightKeyRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!pendingScrollTarget) {
      return;
    }

    const y = pendingScrollTarget.chordId
      ? qualityOffsetsRef.current[pendingScrollTarget.chordId]
      : qualityOffsetsRef.current[pendingScrollTarget.quality];

    if (y === undefined) {
      return;
    }

    scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
    const memberCellKey = buildMemberCellKeyFromTarget(pendingScrollTarget);
    if (memberCellKey) {
      queueMemberHighlightAfterScrollSettle(memberCellKey);
    }
    setPendingScrollTarget(null);
  }, [pendingScrollTarget, selectedDiatonicByGroup, rootStringFilter]);

  useEffect(() => {
    if (!highlightedMemberCellKey) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setHighlightedMemberCellKey(null);
    }, NAVIGATION_OUTLINE_TOTAL_MS);

    return () => clearTimeout(timeoutId);
  }, [highlightedMemberCellKey]);

  useEffect(() => {
    if (!scrollRequest) {
      return;
    }

    const deepLinkTarget: VisualScrollTarget = {
      quality: scrollRequest.quality,
      chordId: scrollRequest.chordId,
      rootString: scrollRequest.rootString,
      rootVoicing: scrollRequest.rootVoicing,
      shapeIndex: scrollRequest.shapeIndex,
    };

    setRootStringFilter((prev) => (prev === 'ALL' ? prev : 'ALL'));
    setSelectedDiatonicByGroup((prev) =>
      resolveVisualDiatonicSelectionForTarget(groups, deepLinkTarget, prev),
    );
    pendingDiatonicOutlineTargetsRef.current = resolveVisualDiatonicOutlineTargetsForTarget(groups, deepLinkTarget);

    setPendingScrollTarget(deepLinkTarget);
  }, [groups, scrollRequest]);

  return (
    <View style={styles.screen}>
      {!sidebarCollapsed ? (
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
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={() => {
          if (pendingMemberHighlightKeyRef.current) {
            queueMemberHighlightAfterScrollSettle(pendingMemberHighlightKeyRef.current);
          }
        }}
        onMomentumScrollEnd={flushPendingMemberHighlight}
        onScrollEndDrag={flushPendingMemberHighlight}
        scrollEventThrottle={16}
      >
        {filteredGroups.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No visual archetype collisions for this filter.</Text>
          </View>
        ) : (
          filteredGroups.map((group) => {
            const diatonicOptions = getVisualGroupDiatonicOptions(group);
            const activeDiatonic = diatonicOptions.length > 0
              ? selectedDiatonicByGroup[group.impliedVisualKey] || diatonicOptions[0]
              : null;

            const previewRootPitchClass = activeDiatonic
              ? (rootObj.pitchClass + DIATONIC_INTERVALS[activeDiatonic]) % 12
              : rootObj.pitchClass;

            const activeMember = getActiveMemberForDiatonic(group, activeDiatonic, chordOrderMap);
            const preview = buildShapeSheetPreview(activeMember.shape, previewRootPitchClass, useGalleryColors);
            const previewRootLabel = getNoteNameFromPitchClass(previewRootPitchClass, notationUsesFlats);

            const groupQualities = Array.from(new Set(group.members.map((member) => member.quality)));
            const groupChordIds = Array.from(new Set(group.members.map((member) => member.chordId)));

            return (
              <View
                key={group.impliedVisualKey}
                style={styles.groupCard}
                onLayout={(event) => {
                  const y = event.nativeEvent.layout.y;
                  groupChordIds.forEach((chordId) => {
                    if (qualityOffsetsRef.current[chordId] === undefined) {
                      qualityOffsetsRef.current[chordId] = y;
                    }
                  });

                  groupQualities.forEach((quality) => {
                    if (qualityOffsetsRef.current[quality] === undefined) {
                      qualityOffsetsRef.current[quality] = y;
                    }
                  });

                  if (
                    (pendingScrollTarget?.chordId && groupChordIds.includes(pendingScrollTarget.chordId))
                    || (!pendingScrollTarget?.chordId && pendingScrollTarget?.quality && groupQualities.includes(pendingScrollTarget.quality))
                  ) {
                    scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
                    const memberCellKey = pendingScrollTarget
                      ? buildMemberCellKeyFromTarget(pendingScrollTarget)
                      : null;
                    if (memberCellKey) {
                      queueMemberHighlightAfterScrollSettle(memberCellKey);
                    }
                    setPendingScrollTarget(null);
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
                          style={[
                            styles.diatonicChip,
                            active ? styles.diatonicChipActive : null,
                            highlightedDiatonicOptionsByGroup[group.impliedVisualKey]?.includes(option)
                              ? styles.diatonicChipFocused
                              : null,
                          ]}
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
                      member.chordId === activeMember.chordId && member.shapeIndex === activeMember.shapeIndex;
                    const fingeringArray = buildFingeringOffsetArray(member.shape);
                    const memberCellKey = buildVisualMemberCellKey(
                      member.chordId,
                      member.rootString,
                      member.rootVoicing,
                      member.shapeIndex,
                    );

                    return (
                      <Pressable
                        key={`${member.chordId}-${member.rootString}-${member.shapeIndex}`}
                        style={[
                          styles.memberCard,
                          isActive ? styles.memberCardActive : null,
                          highlightedMemberCellKey === memberCellKey ? styles.memberCardFocused : null,
                        ]}
                        onPress={() => {
                          onOpenSandbox?.({
                            chordId: member.chordId,
                            quality: member.quality,
                            rootString: member.rootString,
                            rootVoicing: member.rootVoicing,
                            shapeIndex: member.shapeIndex,
                            fretOffset: sandboxFret,
                            focusLibrary: true,
                          });
                        }}
                      >
                        <Text style={styles.memberTitle}>{member.quality}</Text>
                        <Text style={styles.memberFret}>Root Voicing: {member.rootVoicing}</Text>
                        <Text style={styles.memberText}>Raw: {member.rawIntervalSignature}</Text>
                        <Text style={styles.memberText}>Diatonic: {diatonic.length > 0 ? diatonic.join(', ') : 'none'}</Text>
                        <Text style={styles.memberFret}>Fingering: {fingeringArray}</Text>
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
              {filteredChordList.map(({ definition, chordId }) => {
                const isAvailable = availableChordIds.has(chordId);
                const displayQuality = getDisplayQuality(chordId, definition.quality);
                return (
                  <Pressable
                    key={chordId}
                    disabled={!isAvailable}
                    onPress={() => {
                      const y = qualityOffsetsRef.current[chordId] ?? qualityOffsetsRef.current[definition.quality];
                      if (y !== undefined) {
                        scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
                      } else {
                        setPendingScrollTarget({ quality: definition.quality, chordId });
                      }
                      setIsChordListOpen(false);
                    }}
                    style={[styles.modalListItem, !isAvailable ? styles.modalListItemDisabled : null]}
                  >
                    <Text style={[styles.modalListItemText, !isAvailable ? styles.modalListItemTextDisabled : null]}>
                      {displayQuality}
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
            <ScrollView contentContainerStyle={styles.modalSheetContent} showsVerticalScrollIndicator={false}>
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
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles: any = StyleSheet.create({
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
  diatonicChipFocused: {
    borderColor: NAVIGATION_OUTLINE_ACCENT_HEX,
    borderWidth: 1,
    backgroundColor: NAVIGATION_OUTLINE_SOFT_BACKGROUND_HEX,
    shadowColor: NAVIGATION_OUTLINE_ACCENT_HEX,
    shadowOpacity: 0.26,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
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
  memberCardFocused: {
    borderColor: '#f59e0b',
    borderWidth: 2,
    backgroundColor: '#fffbeb',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'center',
    padding: 12,
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    maxHeight: 640,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900',
  },
  modalClose: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  modalSheetContent: {
    gap: 8,
    paddingBottom: 10,
  },
});

export default VisualArchetypeMode;
