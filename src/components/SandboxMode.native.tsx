import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSandbox } from '../hooks/useSandbox';
import { Fretboard, type FretMarker } from './Fretboard';
import SheetMusic from './SheetMusic';
import { CHORD_DICTIONARY } from '../utils/chordLibrary';
import { getIntervalColor, getIntervalHexColor, getKeySignatureInfo, getNoteName, TUNING } from '../utils/musicTheory';
import { readSessionString, writeSessionString } from '../utils/viewState';
import type { GalleryJumpRequest, ShapePresetRequest, VisualArchetypeJumpRequest } from '../types/nativeNavigation';
import { SheetFretSplit } from './SheetFretSplit.native';
import { resolveRootFretForShape } from '../utils/chordShapeRendering';
import {
  getDefinitionRootVoicings,
  getRootStringShapeOptions,
  parseChordDefinitionId,
} from '../utils/chordVoicing';
import { buildOrderedChordEntries } from '../utils/chordEntries';
import { buildRootVoicingDisplayParts } from '../utils/rootVoicingLabel';
import { buildVisualArchetypeGroups } from '../utils/visualArchetypes';
import { resolveDetectedChordNavigationTargetFromSandbox } from '../utils/detectedChordNavigation';
import { buildChordShapeTargetKey } from '../utils/galleryTargeting';
import {
  NATIVE_SCROLL_IDLE_HIGHLIGHT_MS,
  NAVIGATION_FOCUS_HIGHLIGHT_HOLD_MS,
} from '../utils/navigationFeedback';

const SANDBOX_SEARCH_KEY = 'fret-sandbox-search-native';

const LIBRARY_ROOT_STRINGS = [5, 4, 3] as const;

function buildLibraryVoicingButtonKey(chordIdentifier: string, rootString: number, rootVoicing: string): string {
  return `${chordIdentifier}|${rootString}|${rootVoicing.trim().toUpperCase()}`;
}

interface SandboxModeProps {
  presetRequest?: { id: number; preset: ShapePresetRequest } | null;
  onOpenGallery?: (request: GalleryJumpRequest) => void;
  onOpenVisualArchetype?: (request: VisualArchetypeJumpRequest) => void;
  keyConstraint?: string;
}

interface SandboxModePropsInternal extends SandboxModeProps {
  sidebarCollapsed?: boolean;
}

const SandboxMode: React.FC<SandboxModePropsInternal> = ({
  presetRequest,
  onOpenGallery,
  onOpenVisualArchetype,
  keyConstraint = 'C',
  sidebarCollapsed,
}) => {
  const {
    clickedFrets,
    handleFretClick,
    setChordShape,
    clearSelection,
    analyzedChords,
    selectedChordIndex,
    setSelectedChordIndex,
    activePitches,
    oneNotePerString,
    setOneNotePerString,
  } = useSandbox();

  const [search, setSearch] = useState(() => readSessionString(SANDBOX_SEARCH_KEY, ''));
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  
  const [pendingLibraryFocus, setPendingLibraryFocus] = useState<{
    chordId?: string;
    quality: string;
    rootString: number;
    rootVoicing: string;
  } | null>(null);
  const [highlightedLibraryVoicingKey, setHighlightedLibraryVoicingKey] = useState<string | null>(null);
  const keyPitchClass = useMemo(() => getKeySignatureInfo(keyConstraint).pitchClass, [keyConstraint]);
  const libraryScrollRef = useRef<ScrollView>(null);
  const libraryQualityOffsetsRef = useRef<Record<string, number>>({});
  const pendingLibraryHighlightKeyRef = useRef<string | null>(null);
  const pendingLibraryHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushPendingLibraryHighlight = () => {
    const nextFocusKey = pendingLibraryHighlightKeyRef.current;
    if (!nextFocusKey) {
      return;
    }

    setHighlightedLibraryVoicingKey(nextFocusKey);
    pendingLibraryHighlightKeyRef.current = null;
  };

  const queueLibraryHighlightAfterScrollSettle = (focusKey: string) => {
    pendingLibraryHighlightKeyRef.current = focusKey;
    if (pendingLibraryHighlightTimeoutRef.current) {
      clearTimeout(pendingLibraryHighlightTimeoutRef.current);
    }

    // Programmatic ScrollView motion can complete after layout callbacks. Delay highlight
    // until we observe a small idle window with no scroll events to avoid race-condition flashes.
    pendingLibraryHighlightTimeoutRef.current = setTimeout(() => {
      pendingLibraryHighlightTimeoutRef.current = null;
      flushPendingLibraryHighlight();
    }, NATIVE_SCROLL_IDLE_HIGHLIGHT_MS);
  };

  useEffect(() => {
    writeSessionString(SANDBOX_SEARCH_KEY, search);
  }, [search]);

  useEffect(() => {
    return () => {
      if (pendingLibraryHighlightTimeoutRef.current) {
        clearTimeout(pendingLibraryHighlightTimeoutRef.current);
      }
      pendingLibraryHighlightTimeoutRef.current = null;
      pendingLibraryHighlightKeyRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!presetRequest) {
      return;
    }

    const preset = presetRequest.preset;
    const parsedChordId = parseChordDefinitionId(preset.chordId ?? null);
    let definition = parsedChordId
      ? CHORD_DICTIONARY[parsedChordId.dictionaryIndex]
      : undefined;

    if (definition && definition.quality !== parsedChordId?.quality) {
      definition = undefined;
    }

    if (!definition) {
      definition = CHORD_DICTIONARY.find((candidate) => candidate.quality === preset.quality);
    }

    if (!definition) {
      return;
    }

    const parsedShapeIndex = Number(preset.shapeIndex);
    const hasRootString = Number.isFinite(preset.rootString);
    const hasShapeIndex = Number.isFinite(parsedShapeIndex);

    let shape = hasShapeIndex
      ? definition.shapes[parsedShapeIndex]
      : undefined;

    if (shape && hasRootString && shape.rootString !== preset.rootString) {
      shape = undefined;
    }

    if (!shape && hasRootString && preset.rootVoicing) {
      shape = getRootStringShapeOptions(definition, preset.rootString)
        .find((option) => option.rootVoicing === preset.rootVoicing)
        ?.shape;
    }

    if (!shape && hasRootString) {
      shape = definition.shapes.find((candidate) => candidate.rootString === preset.rootString);
    }

    if (!shape && preset.rootVoicing) {
      const voicingInfo = getDefinitionRootVoicings(definition).find(
        (candidate) => candidate.rootVoicing === preset.rootVoicing,
      );
      shape = voicingInfo ? definition.shapes[voicingInfo.shapeIndex] : undefined;
    }

    if (!shape) {
      return;
    }

    setChordShape(definition, shape, preset.fretOffset);

    if (preset.focusLibrary && hasRootString && preset.rootVoicing) {
      setSearch('');
      setIsLibraryOpen(true);
      setPendingLibraryFocus({
        chordId: preset.chordId,
        quality: definition.quality,
        rootString: preset.rootString,
        rootVoicing: preset.rootVoicing,
      });
    }
  }, [presetRequest, setChordShape]);

  const chordEntries = useMemo(() => buildOrderedChordEntries(CHORD_DICTIONARY), []);
  const visualArchetypeShapeKeys = useMemo(() => {
    const shapeKeys = new Set<string>();
    buildVisualArchetypeGroups(CHORD_DICTIONARY).forEach((group) => {
      group.members.forEach((member) => shapeKeys.add(buildChordShapeTargetKey(member.chordId, member.shapeIndex)));
    });

    return shapeKeys;
  }, []);

  const renderRootVoicingLabel = (rootString: number, rootVoicing: string) => {
    const parts = buildRootVoicingDisplayParts(rootString, rootVoicing);

    return (
      <Text style={styles.shapeButtonText}>
        {parts.baseLabel}
        {parts.voicingLabel ? <Text style={styles.shapeButtonVoicing}>{` ${parts.voicingLabel}`}</Text> : null}
      </Text>
    );
  };

  const filteredChords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return chordEntries;
    }

    return chordEntries.filter(({ definition }) => definition.quality.toLowerCase().includes(query));
  }, [chordEntries, search]);

  useEffect(() => {
    if (!pendingLibraryFocus || !isLibraryOpen) {
      return;
    }

    const y = pendingLibraryFocus.chordId
      ? libraryQualityOffsetsRef.current[pendingLibraryFocus.chordId]
      : libraryQualityOffsetsRef.current[pendingLibraryFocus.quality];

    if (y === undefined) {
      return;
    }

    libraryScrollRef.current?.scrollTo({ y: Math.max(0, y - 10), animated: true });

    const chordIdentifier = pendingLibraryFocus.chordId ?? pendingLibraryFocus.quality;
    queueLibraryHighlightAfterScrollSettle(
      buildLibraryVoicingButtonKey(chordIdentifier, pendingLibraryFocus.rootString, pendingLibraryFocus.rootVoicing),
    );
    setPendingLibraryFocus(null);
  }, [pendingLibraryFocus, isLibraryOpen, search]);

  useEffect(() => {
    if (!highlightedLibraryVoicingKey) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setHighlightedLibraryVoicingKey(null);
    }, NAVIGATION_FOCUS_HIGHLIGHT_HOLD_MS);

    return () => clearTimeout(timeoutId);
  }, [highlightedLibraryVoicingKey]);

  const markers: FretMarker[] = clickedFrets.map((position) => ({
    stringIndex: position.stringIndex,
    fret: position.fret,
    markerClass: `opacity-100 ${position.interval ? getIntervalColor(position.interval) : 'bg-blue-500 text-white'} ${position.interval === '1' ? 'border-2 border-slate-900' : ''}`,
    label: position.interval || undefined,
  }));

  const highestPitch = activePitches.length > 0 ? Math.max(...activePitches) : 0;
  const zoomSemitones = highestPitch > 77 ? highestPitch - 77 : 0;

  const useFlatsForLabels = useMemo(() => {
    const selectedChordName = analyzedChords[selectedChordIndex]?.name ?? '';
    const rootAccidental = selectedChordName.match(/^([A-G])([b#]?)/)?.[2];

    if (rootAccidental === '#') {
      return false;
    }
    if (rootAccidental === 'b') {
      return true;
    }

    const intervals = clickedFrets.map((position) => position.interval ?? '');
    const hasSharpIntervals = intervals.some((interval) => interval.includes('#'));
    const hasFlatIntervals = intervals.some((interval) => interval.includes('b'));

    if (hasSharpIntervals && !hasFlatIntervals) {
      return false;
    }
    if (hasFlatIntervals && !hasSharpIntervals) {
      return true;
    }

    return getKeySignatureInfo(keyConstraint).useFlats;
  }, [analyzedChords, selectedChordIndex, clickedFrets, keyConstraint]);

  const sortedNotes = useMemo(() => {
    return [...clickedFrets]
      .map((position) => {
        const pitch = position.stringIndex >= 0 ? TUNING[position.stringIndex] + position.fret : 0;
        return { ...position, pitch, ...getNoteName(pitch, useFlatsForLabels) };
      })
      .sort((a, b) => a.pitch - b.pitch);
  }, [clickedFrets, useFlatsForLabels]);

  const detectedChordNavigationTarget = useMemo(() => {
    return resolveDetectedChordNavigationTargetFromSandbox({
      chordName: analyzedChords[selectedChordIndex]?.name,
      entries: chordEntries,
      clickedFrets,
      visualArchetypeShapeKeys,
    });
  }, [analyzedChords, selectedChordIndex, chordEntries, clickedFrets, visualArchetypeShapeKeys]);

  const canOpenSelectedChordInGallery = Boolean(detectedChordNavigationTarget?.galleryTarget.isAvailable);
  const canOpenSelectedChordInVisualArchetype = Boolean(detectedChordNavigationTarget?.visualArchetypeTarget.isAvailable);

  const openSelectedChordInGallery = () => {
    if (!onOpenGallery) {
      return;
    }

    if (!detectedChordNavigationTarget || !detectedChordNavigationTarget.galleryTarget.isAvailable) {
      return;
    }

    onOpenGallery({
      quality: detectedChordNavigationTarget.galleryTarget.quality,
      chordId: detectedChordNavigationTarget.galleryTarget.chordId,
      rootString: detectedChordNavigationTarget.galleryTarget.rootString,
      rootVoicing: detectedChordNavigationTarget.galleryTarget.rootVoicing,
      shapeIndex: detectedChordNavigationTarget.galleryTarget.shapeIndex,
    });
  };

  const openSelectedChordInVisualArchetype = () => {
    if (!onOpenVisualArchetype) {
      return;
    }

    if (!detectedChordNavigationTarget || !detectedChordNavigationTarget.visualArchetypeTarget.isAvailable) {
      return;
    }

    onOpenVisualArchetype({
      quality: detectedChordNavigationTarget.visualArchetypeTarget.quality,
      chordId: detectedChordNavigationTarget.visualArchetypeTarget.chordId,
      rootString: detectedChordNavigationTarget.visualArchetypeTarget.rootString,
      rootVoicing: detectedChordNavigationTarget.visualArchetypeTarget.rootVoicing,
      shapeIndex: detectedChordNavigationTarget.visualArchetypeTarget.shapeIndex,
    });
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.sideRail, sidebarCollapsed ? styles.sideRailCollapsed : styles.sideRailExpanded]}>
        {!sidebarCollapsed ? (
          <ScrollView contentContainerStyle={styles.sideRailContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sideRailTitle}>Sandbox Menu</Text>
          <Pressable
            onPress={() => {
              setIsLibraryOpen(true);
            }}
            style={styles.menuAction}
          >
            <Text style={styles.menuActionText}>Open Chord Library</Text>
          </Pressable>

          <View style={styles.menuToggleRow}>
            <Text style={styles.menuToggleLabel}>One Note / String</Text>
            <Switch value={oneNotePerString} onValueChange={setOneNotePerString} />
          </View>

          <Pressable onPress={clearSelection} style={styles.menuAction}>
            <Text style={styles.menuActionText}>Clear Selection</Text>
          </Pressable>

          <Pressable
            onPress={openSelectedChordInGallery}
            disabled={!canOpenSelectedChordInGallery}
            style={[styles.menuAction, !canOpenSelectedChordInGallery ? styles.menuActionDisabled : null]}
          >
            <Text style={[styles.menuActionText, !canOpenSelectedChordInGallery ? styles.menuActionTextDisabled : null]}>
              See In Gallery
            </Text>
          </Pressable>

          <Pressable
            onPress={openSelectedChordInVisualArchetype}
            disabled={!canOpenSelectedChordInVisualArchetype}
            style={[styles.menuAction, !canOpenSelectedChordInVisualArchetype ? styles.menuActionDisabled : null]}
          >
            <Text style={[styles.menuActionText, !canOpenSelectedChordInVisualArchetype ? styles.menuActionTextDisabled : null]}>
              See Visual Archetype
            </Text>
          </Pressable>
          </ScrollView>
        ) : null}
      </View>

      <View style={styles.mainContent}>
        <View style={styles.tinyHeader}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.headerChipRail} contentContainerStyle={styles.headerChipRailContent}>
            {analyzedChords.length === 0 ? (
              <View style={styles.headerEmptyChip}>
                <Text style={styles.headerEmptyChipText}>[No Detected Chord]</Text>
              </View>
            ) : (
              analyzedChords.map((chord, index) => (
                <Pressable
                  key={`${chord.name}-${index}`}
                  onPress={() => setSelectedChordIndex(index)}
                  style={[styles.headerChordChip, selectedChordIndex === index ? styles.headerChordChipActive : null]}
                >
                  <Text style={[styles.headerChordChipText, selectedChordIndex === index ? styles.headerChordChipTextActive : null]}>
                    [{chord.name}]
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>

          <Pressable onPress={() => console.log('History Placeholder')} style={styles.menuButton}>
            <Text style={styles.menuButtonText}>History</Text>
          </Pressable>
        </View>

        <View style={styles.body}>
          <SheetFretSplit
            modeKey="SANDBOX"
            sheetTitle="Music Sheet"
            sheetContent={
              <View style={styles.sheetContentWrap}>
                <View style={styles.sheetCard}>
                  <SheetMusic
                    notes={activePitches}
                    colors={clickedFrets.map((position) => (position.interval ? getIntervalHexColor(position.interval) : '#2563eb'))}
                    gameMode="SANDBOX"
                    useFlats={useFlatsForLabels}
                    zoomSemitones={zoomSemitones}
                  />
                </View>

                <Text style={styles.sectionLabel}>Note Sequence</Text>
                <View style={styles.noteChipRow}>
                  {sortedNotes.length > 0 ? (
                    sortedNotes.map((note, index) => (
                      <View
                        key={`${note.stringIndex}-${note.fret}-${index}`}
                        style={[
                          styles.noteChip,
                          { backgroundColor: note.interval ? getIntervalHexColor(note.interval) : '#2563eb' },
                        ]}
                      >
                        <Text style={styles.noteChipText}>{note.note}{note.octave}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>Tap frets to build a chord.</Text>
                  )}
                </View>
              </View>
            }
            fretboardContent={<Fretboard numFrets={25} markers={markers} onFretClick={handleFretClick} />}
          />
        </View>
      </View>

      <Modal visible={isLibraryOpen} animationType="slide" transparent onRequestClose={() => setIsLibraryOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chord Library</Text>
              <Pressable onPress={() => setIsLibraryOpen(false)} hitSlop={8}>
                <Text style={styles.modalClose}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>1 Note / String</Text>
              <Switch value={oneNotePerString} onValueChange={setOneNotePerString} />
            </View>

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search quality (e.g. maj7)"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <ScrollView
              ref={libraryScrollRef}
              style={styles.modalList}
              contentContainerStyle={styles.modalListContent}
              scrollEventThrottle={16}
              onScroll={() => {
                if (!pendingLibraryHighlightKeyRef.current) {
                  return;
                }

                queueLibraryHighlightAfterScrollSettle(pendingLibraryHighlightKeyRef.current);
              }}
              onMomentumScrollEnd={flushPendingLibraryHighlight}
              onScrollEndDrag={flushPendingLibraryHighlight}
            >
              {filteredChords.map(({ definition, chordId }) => (
                <View
                  key={chordId}
                  style={styles.modalCard}
                  onLayout={(event) => {
                    libraryQualityOffsetsRef.current[chordId] = event.nativeEvent.layout.y;
                    if (libraryQualityOffsetsRef.current[definition.quality] === undefined) {
                      libraryQualityOffsetsRef.current[definition.quality] = event.nativeEvent.layout.y;
                    }

                    if (!pendingLibraryFocus) {
                      return;
                    }

                    const focusCardMatches = pendingLibraryFocus.chordId
                      ? pendingLibraryFocus.chordId === chordId
                      : pendingLibraryFocus.quality === definition.quality;

                    if (!focusCardMatches) {
                      return;
                    }

                    libraryScrollRef.current?.scrollTo({ y: Math.max(0, event.nativeEvent.layout.y - 10), animated: true });
                    const chordIdentifier = pendingLibraryFocus.chordId ?? pendingLibraryFocus.quality;
                    queueLibraryHighlightAfterScrollSettle(
                      buildLibraryVoicingButtonKey(chordIdentifier, pendingLibraryFocus.rootString, pendingLibraryFocus.rootVoicing),
                    );
                    setPendingLibraryFocus(null);
                  }}
                >
                  <Text style={styles.modalCardTitle}>{definition.quality}</Text>
                  <View style={styles.modalCardActions}>
                    {LIBRARY_ROOT_STRINGS.map((rootString) => {
                      const rootStringOptions = getRootStringShapeOptions(definition, rootString);

                      if (rootStringOptions.length === 0) {
                        return (
                          <View key={`${chordId}-${rootString}`} style={styles.shapeColumn}>
                            <View style={[styles.shapeButton, styles.shapeButtonDisabled]}>
                              <Text style={styles.shapeButtonDisabledText}>N/A</Text>
                            </View>
                          </View>
                        );
                      }

                      return (
                        <View key={`${chordId}-${rootString}`} style={styles.shapeColumn}>
                          {rootStringOptions.map((option) => {
                            const buttonFocusKey = buildLibraryVoicingButtonKey(chordId, rootString, option.rootVoicing);

                            return (
                              <Pressable
                                key={`${chordId}-${rootString}-${option.rootVoicing}-${option.shapeIndex}`}
                                style={[
                                  styles.shapeButton,
                                  highlightedLibraryVoicingKey === buttonFocusKey
                                    ? styles.shapeButtonFocused
                                    : null,
                                ]}
                                onPress={() => {
                                  const pinnedRootFret = resolveRootFretForShape(keyPitchClass, option.shape);
                                  setChordShape(definition, option.shape, pinnedRootFret);
                                  setIsLibraryOpen(false);
                                }}
                              >
                                {renderRootVoicingLabel(rootString, option.rootVoicing)}
                              </Pressable>
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
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
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
  },
  sideRail: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  sideRailExpanded: {
    width: 160,
  },
  sideRailCollapsed: {
    width: 56,
  },
  sideRailContent: {
    padding: 8,
    gap: 12,
  },
  sideRailTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 4,
  },
  tinyHeader: {
    height: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerChipRail: {
    flex: 1,
  },
  headerChipRailContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
  },
  headerChordChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerChordChipActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  headerChordChipText: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  headerChordChipTextActive: {
    color: '#ffffff',
  },
  headerEmptyChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerEmptyChipText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  body: {
    flex: 1,
    padding: 8,
    backgroundColor: '#f1f5f9',
  },
  sheetContentWrap: {
    flex: 1,
    gap: 10,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sheetCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    alignItems: 'center',
  },
  noteChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  noteChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  noteChipText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  
  
  
  
  
  
  menuAction: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  menuActionDisabled: {
    opacity: 0.45,
  },
  menuActionText: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  menuActionTextDisabled: {
    color: '#94a3b8',
  },
  menuToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuToggleLabel: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  
  
  
  
  
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  toggleLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
  modalCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  modalCardTitle: {
    color: '#1e293b',
    fontWeight: '800',
    fontSize: 13,
  },
  modalCardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  shapeColumn: {
    flex: 1,
    gap: 6,
  },
  shapeButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    paddingVertical: 7,
  },
  shapeButtonFocused: {
    borderColor: '#f59e0b',
    borderWidth: 2,
    backgroundColor: '#fffbeb',
  },
  shapeButtonDisabled: {
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    opacity: 0.55,
  },
  shapeButtonText: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  shapeButtonVoicing: {
    fontSize: 8,
    fontWeight: '800',
    color: '#0f172a',
  },
  shapeButtonDisabledText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default SandboxMode;
