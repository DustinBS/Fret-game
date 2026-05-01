import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { CHORD_DICTIONARY } from '../utils/chordLibrary';
import {
  getKeySignatureInfo,
  getNoteNameFromPitchClass,
  KEY_CONSTRAINT_OPTIONS,
  keySignatureUsesFlats,
} from '../utils/musicTheory';
import { DIATONIC_INTERVALS, CHORD_QUALITY_DIATONIC_MAP } from '../utils/diatonic';
import {
  readSessionBoolean,
  readSessionJson,
  readSessionNumber,
  writeSessionBoolean,
  writeSessionJson,
  writeSessionNumber,
} from '../utils/viewState';
import { buildShapeSheetPreview } from '../utils/chordShapeRendering';
import type { ShapePresetRequest } from '../types/nativeNavigation';
import SheetMusic from './SheetMusic';
import { LegendPanel } from './LegendPanel';
import {
  buildShapeSelectionStateKey,
  getRootStringShapeOptions,
} from '../utils/chordVoicing';
import { buildOrderedChordEntries, buildQualityDisplayLabelMap } from '../utils/chordEntries';
import {
  NATIVE_SCROLL_IDLE_HIGHLIGHT_MS,
  NAVIGATION_FOCUS_HIGHLIGHT_HOLD_MS,
} from '../utils/navigationFeedback';

const GALLERY_MAIN_SCROLL_KEY = 'fret-gallery-main-scroll';
const GALLERY_SHOW_DIATONIC_KEY = 'fret-gallery-show-diatonic';
const GALLERY_SELECTED_DIATONIC_KEY = 'fret-gallery-selected-diatonic';
const GALLERY_SELECTED_VOICING_KEY = 'fret-gallery-selected-voicing-native';

const STRING_SHAPES = [5, 4, 3] as const;

function buildGalleryShapeCellKey(
  chordId: string,
  rootString: number,
  rootVoicing: string,
  shapeIndex: number,
): string {
  return `${chordId}|${rootString}|${rootVoicing.trim().toUpperCase()}|${shapeIndex}`;
}

interface GalleryScrollTarget {
  quality: string;
  chordId?: string;
  rootString?: number;
  rootVoicing?: string;
  shapeIndex?: number;
}

interface GalleryModeProps {
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
}

const GalleryMode: React.FC<GalleryModeProps> = ({
  keyConstraint,
  useGalleryColors,
  onToggleGalleryColors,
  onChangeKeyConstraint,
  onOpenSandbox,
  scrollRequest,
}) => {
  const [showDiatonic, setShowDiatonic] = useState(() => readSessionBoolean(GALLERY_SHOW_DIATONIC_KEY, true));
  const [selectedDiatonic, setSelectedDiatonic] = useState<Record<string, string>>(
    () => readSessionJson<Record<string, string>>(GALLERY_SELECTED_DIATONIC_KEY, {}),
  );
  const [selectedVoicingByRoot, setSelectedVoicingByRoot] = useState<Record<string, string>>(
    () => readSessionJson<Record<string, string>>(GALLERY_SELECTED_VOICING_KEY, {}),
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChordListOpen, setIsChordListOpen] = useState(false);
  const [isKeyPickerOpen, setIsKeyPickerOpen] = useState(false);
  const [qualitySearch, setQualitySearch] = useState('');

  const scrollRef = useRef<FlatList>(null);
  const qualityOffsetsRef = useRef<Record<string, number>>({});
  const [pendingScrollTarget, setPendingScrollTarget] = useState<GalleryScrollTarget | null>(null);
  const [highlightedShapeCellKey, setHighlightedShapeCellKey] = useState<string | null>(null);
  const pendingShapeHighlightKeyRef = useRef<string | null>(null);
  const pendingShapeHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildShapeCellKeyFromTarget = (target: GalleryScrollTarget): string | null => {
    if (!target.chordId) {
      return null;
    }

    if (target.rootString === undefined || !target.rootVoicing || target.shapeIndex === undefined) {
      return null;
    }

    return buildGalleryShapeCellKey(target.chordId, target.rootString, target.rootVoicing, target.shapeIndex);
  };

  const flushPendingShapeHighlight = () => {
    const nextFocusKey = pendingShapeHighlightKeyRef.current;
    if (!nextFocusKey) {
      return;
    }

    setHighlightedShapeCellKey(nextFocusKey);
    pendingShapeHighlightKeyRef.current = null;
  };

  const queueShapeHighlightAfterScrollSettle = (focusKey: string) => {
    pendingShapeHighlightKeyRef.current = focusKey;
    if (pendingShapeHighlightTimeoutRef.current) {
      clearTimeout(pendingShapeHighlightTimeoutRef.current);
    }

    pendingShapeHighlightTimeoutRef.current = setTimeout(() => {
      pendingShapeHighlightTimeoutRef.current = null;
      flushPendingShapeHighlight();
    }, NATIVE_SCROLL_IDLE_HIGHLIGHT_MS);
  };

  const orderedChordEntries = useMemo(() => buildOrderedChordEntries(CHORD_DICTIONARY), []);
  const qualityDisplayLabelMap = useMemo(() => buildQualityDisplayLabelMap(orderedChordEntries), [orderedChordEntries]);
  const filteredChordEntries = useMemo(() => {
    const query = qualitySearch.trim().toLowerCase();
    if (!query) {
      return orderedChordEntries;
    }

    return orderedChordEntries.filter(({ definition }) => definition.quality.toLowerCase().includes(query));
  }, [orderedChordEntries, qualitySearch]);

  const getDisplayQuality = (chordId: string, quality: string): string => {
    return qualityDisplayLabelMap.get(chordId) ?? quality;
  };

  const rootObj = useMemo(() => getKeySignatureInfo(keyConstraint), [keyConstraint]);
  const notationUsesFlats = useMemo(
    () => keySignatureUsesFlats(rootObj.renderableKeyName),
    [rootObj.renderableKeyName],
  );

  useEffect(() => {
    writeSessionBoolean(GALLERY_SHOW_DIATONIC_KEY, showDiatonic);
  }, [showDiatonic]);

  useEffect(() => {
    writeSessionJson(GALLERY_SELECTED_DIATONIC_KEY, selectedDiatonic);
  }, [selectedDiatonic]);

  useEffect(() => {
    writeSessionJson(GALLERY_SELECTED_VOICING_KEY, selectedVoicingByRoot);
  }, [selectedVoicingByRoot]);

  useEffect(() => {
    // Native card surfaces can report layout over multiple frames. Restore after an
    // extra RAF so content has had a chance to mount and measure.
    const target = readSessionNumber(GALLERY_MAIN_SCROLL_KEY, 0);
    const first = requestAnimationFrame(() => {
      const second = requestAnimationFrame(() => {
        scrollRef.current?.scrollToOffset({ offset: target, animated: false });
      });

      return () => cancelAnimationFrame(second);
    });

    return () => cancelAnimationFrame(first);
  }, []);

  useEffect(() => {
    return () => {
      if (pendingShapeHighlightTimeoutRef.current) {
        clearTimeout(pendingShapeHighlightTimeoutRef.current);
      }
      pendingShapeHighlightTimeoutRef.current = null;
      pendingShapeHighlightKeyRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!scrollRequest) {
      return;
    }

    setPendingScrollTarget({
      quality: scrollRequest.quality,
      chordId: scrollRequest.chordId,
      rootString: scrollRequest.rootString,
      rootVoicing: scrollRequest.rootVoicing,
      shapeIndex: scrollRequest.shapeIndex,
    });
  }, [scrollRequest]);

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

    scrollRef.current?.scrollToOffset({ offset: Math.max(0, y - 10), animated: true });
    const targetShapeKey = buildShapeCellKeyFromTarget(pendingScrollTarget);
    if (targetShapeKey) {
      queueShapeHighlightAfterScrollSettle(targetShapeKey);
    }
    setPendingScrollTarget(null);
  }, [pendingScrollTarget, selectedDiatonic, showDiatonic]);

  useEffect(() => {
    if (!highlightedShapeCellKey) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setHighlightedShapeCellKey(null);
    }, NAVIGATION_FOCUS_HIGHLIGHT_HOLD_MS);

    return () => clearTimeout(timeoutId);
  }, [highlightedShapeCellKey]);

  const scrollToQuality = (target: GalleryScrollTarget) => {
    const y = target.chordId
      ? qualityOffsetsRef.current[target.chordId]
      : qualityOffsetsRef.current[target.quality];

    if (y !== undefined) {
      scrollRef.current?.scrollToOffset({ offset: Math.max(0, y - 10), animated: true });
      const targetShapeKey = buildShapeCellKeyFromTarget(target);
      if (targetShapeKey) {
        queueShapeHighlightAfterScrollSettle(targetShapeKey);
      }
      return;
    }

    setPendingScrollTarget(target);
  };

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

        <Pressable onPress={() => setIsMenuOpen(true)} style={styles.menuButton}>
          <Text style={styles.menuButtonText}>☰</Text>
        </Pressable>
      </View>

      <FlatList
        ref={scrollRef}
        style={styles.mainScroll}
        contentContainerStyle={styles.mainContent}
        data={orderedChordEntries}
        initialNumToRender={10}
        windowSize={5}
        removeClippedSubviews={true}
        keyExtractor={(item) => item.chordId}
        onScroll={(event) => {
          writeSessionNumber(GALLERY_MAIN_SCROLL_KEY, event.nativeEvent.contentOffset.y);
          if (pendingShapeHighlightKeyRef.current) {
            queueShapeHighlightAfterScrollSettle(pendingShapeHighlightKeyRef.current);
          }
        }}
        onMomentumScrollEnd={flushPendingShapeHighlight}
        onScrollEndDrag={flushPendingShapeHighlight}
        scrollEventThrottle={16}
        renderItem={({ item }) => {
          const { definition, chordId } = item;
          const diatonicOptions = CHORD_QUALITY_DIATONIC_MAP[definition.quality] || [];
          const hasDiatonic = diatonicOptions.length > 0;
          const activeDiatonic = selectedDiatonic[chordId] || diatonicOptions[0];
          const offsetFromKey =
            showDiatonic && hasDiatonic && DIATONIC_INTERVALS[activeDiatonic] !== undefined
              ? DIATONIC_INTERVALS[activeDiatonic]
              : 0;

          const actualRootPitch = (rootObj.pitchClass + offsetFromKey) % 12;
          const actualRootName = getNoteNameFromPitchClass(actualRootPitch, notationUsesFlats);
          const displayQuality = getDisplayQuality(chordId, definition.quality);

          return (
            <View
              style={styles.card}
              onLayout={(event) => {
                qualityOffsetsRef.current[chordId] = event.nativeEvent.layout.y;
                if (qualityOffsetsRef.current[definition.quality] === undefined) {
                  qualityOffsetsRef.current[definition.quality] = event.nativeEvent.layout.y;
                }

                if (pendingScrollTarget?.chordId === chordId || (!pendingScrollTarget?.chordId && pendingScrollTarget?.quality === definition.quality)) {
                  scrollRef.current?.scrollToOffset({ offset: Math.max(0, event.nativeEvent.layout.y - 10), animated: true });
                  const targetShapeKey = pendingScrollTarget
                    ? buildShapeCellKeyFromTarget(pendingScrollTarget)
                    : null;
                  if (targetShapeKey) {
                    queueShapeHighlightAfterScrollSettle(targetShapeKey);
                  }
                  setPendingScrollTarget(null);
                }
              }}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>
                    {showDiatonic && hasDiatonic ? `${actualRootName} ` : ''}
                    {displayQuality}
                  </Text>
                  <Text style={styles.cardSubtitle}>Key: {rootObj.renderableKeyName}</Text>
                </View>

                <View style={styles.keyBadge}>
                  <Text style={styles.keyBadgeText}>{rootObj.keyName}</Text>
                </View>
              </View>

              {showDiatonic ? (
                <View style={styles.diatonicRow}>
                  {diatonicOptions.length > 0 ? (
                    diatonicOptions.map((option) => {
                      const active = activeDiatonic === option;
                      return (
                        <Pressable
                          key={`${definition.quality}-${option}`}
                          style={[styles.diatonicChip, active ? styles.diatonicChipActive : null]}
                          onPress={() => setSelectedDiatonic((prev) => ({ ...prev, [chordId]: option }))}
                        >
                          <Text style={[styles.diatonicChipText, active ? styles.diatonicChipTextActive : null]}>{option}</Text>
                        </Pressable>
                      );
                    })
                  ) : (
                    <Text style={styles.nonDiatonicText}>Non-diatonic</Text>
                  )}
                </View>
              ) : null}

              <View style={styles.shapeRow}>
                {STRING_SHAPES.map((rootString) => {
                  const rootStringOptions = getRootStringShapeOptions(definition, rootString);
                  if (rootStringOptions.length === 0) {
                    return (
                      <View key={`${chordId}-${rootString}`} style={styles.shapeColumn}>
                        <View style={[styles.shapeCard, styles.shapeCardDisabled]}>
                          <Text style={styles.shapeCardDisabledText}>Str {rootString + 1}</Text>
                          <Text style={styles.shapeCardDisabledText}>N/A</Text>
                        </View>
                      </View>
                    );
                  }

                  const voicingSelectionKey = buildShapeSelectionStateKey(chordId, rootString);
                  const selectedRootVoicing = selectedVoicingByRoot[voicingSelectionKey];
                  const activeOption = rootStringOptions.find((option) => option.rootVoicing === selectedRootVoicing) ?? rootStringOptions[0];
                  const preview = buildShapeSheetPreview(activeOption.shape, actualRootPitch, useGalleryColors);
                  const activeShapeCellKey = buildGalleryShapeCellKey(
                    chordId,
                    rootString,
                    activeOption.rootVoicing,
                    activeOption.shapeIndex,
                  );

                  return (
                    <View key={`${chordId}-${rootString}`} style={styles.shapeColumn}>
                      <Text style={styles.shapeCardTitle}>Str {rootString + 1}</Text>

                      {rootStringOptions.length > 1 ? (
                        <View style={styles.voicingChipRow}>
                          {rootStringOptions.map((option) => {
                            const active = option.rootVoicing === activeOption.rootVoicing;
                            return (
                              <Pressable
                                key={`${chordId}-${rootString}-${option.rootVoicing}-${option.shapeIndex}`}
                                style={[styles.voicingChip, active ? styles.voicingChipActive : null]}
                                onPress={() => {
                                  setSelectedVoicingByRoot((prev) => ({
                                    ...prev,
                                    [voicingSelectionKey]: option.rootVoicing,
                                  }));
                                }}
                              >
                                <Text style={[styles.voicingChipText, active ? styles.voicingChipTextActive : null]}>{option.rootVoicing}</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      ) : (
                        <Text style={styles.singleVoicingText}>{activeOption.rootVoicing}</Text>
                      )}

                      <Pressable
                        style={[
                          styles.shapeCard,
                          highlightedShapeCellKey === activeShapeCellKey ? styles.shapeCardFocused : null,
                        ]}
                        onPress={() => {
                          onOpenSandbox?.({
                            chordId,
                            quality: definition.quality,
                            rootString,
                            rootVoicing: activeOption.rootVoicing,
                            shapeIndex: activeOption.shapeIndex,
                            fretOffset: preview.rootFret,
                            focusLibrary: true,
                          });
                        }}
                      >
                        <SheetMusic
                          notes={preview.notes}
                          colors={preview.colors}
                          gameMode="SANDBOX"
                          useFlats={notationUsesFlats}
                          keySignature={rootObj.renderableKeyName}
                          suppressDiatonicAccidentals
                          zoomSemitones={preview.zoomSemitones}
                        />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        }}
        ListFooterComponent={<LegendPanel variant="large" />}
      />

      <Modal visible={isMenuOpen} animationType="fade" transparent onRequestClose={() => setIsMenuOpen(false)}>
        <View style={styles.floatingMenuBackdrop}>
          <View style={styles.floatingMenuSheet}>
            <ScrollView contentContainerStyle={styles.floatingMenuSheetContent} showsVerticalScrollIndicator={false}>
              <View style={styles.floatingMenuHeader}>
                <Text style={styles.floatingMenuTitle}>Gallery Menu</Text>
                <Pressable onPress={() => setIsMenuOpen(false)} hitSlop={8}>
                  <Text style={styles.floatingMenuClose}>Close</Text>
                </Pressable>
              </View>
              <View style={styles.floatingMenuRow}>
                <Text style={styles.floatingMenuLabel}>Diatonic</Text>
                <Switch value={showDiatonic} onValueChange={setShowDiatonic} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
              value={qualitySearch}
              onChangeText={setQualitySearch}
              placeholder="Search quality (e.g. min9)"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
              {filteredChordEntries.map(({ definition, chordId }) => (
                <Pressable
                  key={chordId}
                  style={styles.modalListItem}
                  onPress={() => {
                    scrollToQuality({ quality: definition.quality, chordId });
                    setIsChordListOpen(false);
                  }}
                >
                  <Text style={styles.modalListItemText}>{getDisplayQuality(chordId, definition.quality)}</Text>
                </Pressable>
              ))}
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

            <ScrollView style={styles.modalList} contentContainerStyle={styles.keyListContent}>
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
  menuButton: {
    marginLeft: 'auto',
    width: 34,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonText: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '900',
  },
  
  
  floatingMenuSheetContent: {
    gap: 10,
    paddingBottom: 10,
  },
  
  
  
  floatingMenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floatingMenuLabel: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
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
  modalListItemText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  keyListContent: {
    gap: 8,
    paddingBottom: 10,
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
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    padding: 12,
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '900',
  },
  cardSubtitle: {
    color: '#64748b',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '700',
  },
  keyBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  keyBadgeText: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '800',
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
  nonDiatonicText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  shapeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  shapeColumn: {
    flex: 1,
    minWidth: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 6,
    alignItems: 'stretch',
  },
  shapeCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  shapeCardFocused: {
    borderColor: '#f59e0b',
    borderWidth: 2,
    backgroundColor: '#fffbeb',
  },
  voicingChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  voicingChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  voicingChipActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  voicingChipText: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  voicingChipTextActive: {
    color: '#ffffff',
  },
  singleVoicingText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  shapeCardDisabled: {
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    opacity: 0.55,
  },
  shapeCardTitle: {
    color: '#334155',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '800',
  },
  shapeCardDisabledText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default GalleryMode;
