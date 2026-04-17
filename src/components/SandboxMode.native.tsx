import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSandbox } from '../hooks/useSandbox';
import { Fretboard, type FretMarker } from './Fretboard';
import SheetMusic from './SheetMusic';
import { CHORD_DICTIONARY } from '../utils/chordLibrary';
import { getIntervalColor, getIntervalHexColor, getKeySignatureInfo, getNoteName, TUNING } from '../utils/musicTheory';
import { readSessionString, writeSessionString } from '../utils/viewState';
import type { GalleryJumpRequest, ShapePresetRequest } from '../types/nativeNavigation';
import { SheetFretSplit } from './SheetFretSplit.native';

const SANDBOX_SEARCH_KEY = 'fret-sandbox-search-native';

const LIBRARY_ROOT_STRINGS = [5, 4, 3] as const;

const STRING_NAMES: Record<number, string> = {
  5: 'Str 6E',
  4: 'Str 5A',
  3: 'Str 4D',
  2: 'Str 3G',
  1: 'Str 2B',
  0: 'Str 1e',
};

interface SandboxModeProps {
  presetRequest?: { id: number; preset: ShapePresetRequest } | null;
  onOpenGallery?: (request: GalleryJumpRequest) => void;
  keyConstraint?: string;
}

const SandboxMode: React.FC<SandboxModeProps> = ({ presetRequest, onOpenGallery, keyConstraint = 'C' }) => {
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    writeSessionString(SANDBOX_SEARCH_KEY, search);
  }, [search]);

  useEffect(() => {
    if (!presetRequest) {
      return;
    }

    const preset = presetRequest.preset;
    const def = CHORD_DICTIONARY.find((candidate) => candidate.quality === preset.quality);
    if (!def) {
      return;
    }

    const shape = def.shapes.find((candidate) => candidate.rootString === preset.rootString);
    if (!shape) {
      return;
    }

    setChordShape(def, shape, preset.fretOffset);
  }, [presetRequest, setChordShape]);

  const filteredChords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return CHORD_DICTIONARY;
    }

    return CHORD_DICTIONARY.filter((definition) => definition.quality.toLowerCase().includes(query));
  }, [search]);

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

  const openSelectedChordInGallery = () => {
    if (!onOpenGallery) {
      return;
    }

    const chord = analyzedChords[selectedChordIndex];
    if (!chord) {
      return;
    }

    const namePart = chord.name.split('/')[0].trim();
    const match = namePart.match(/^([A-G][b#]?)(.*)$/);
    if (!match) {
      return;
    }

    onOpenGallery({
      key: match[1],
      quality: match[2].trim(),
    });
  };

  const selectedChord = analyzedChords[selectedChordIndex];

  return (
    <View style={styles.screen}>
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

        <Pressable onPress={() => setIsMenuOpen(true)} style={styles.menuButton}>
          <Text style={styles.menuButtonText}>☰</Text>
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

      <Modal visible={isMenuOpen} animationType="fade" transparent onRequestClose={() => setIsMenuOpen(false)}>
        <View style={styles.menuBackdrop}>
          <View style={styles.menuSheet}>
            <ScrollView contentContainerStyle={styles.menuSheetContent} showsVerticalScrollIndicator={false}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>Sandbox Menu</Text>
                <Pressable onPress={() => setIsMenuOpen(false)} hitSlop={8}>
                  <Text style={styles.menuClose}>Close</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => {
                  setIsMenuOpen(false);
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
                disabled={!selectedChord}
                style={[styles.menuAction, !selectedChord ? styles.menuActionDisabled : null]}
              >
                <Text style={[styles.menuActionText, !selectedChord ? styles.menuActionTextDisabled : null]}>
                  See In Gallery
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

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

            <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
              {filteredChords.map((definition) => (
                <View key={definition.quality} style={styles.modalCard}>
                  <Text style={styles.modalCardTitle}>{definition.quality}</Text>
                  <View style={styles.modalCardActions}>
                    {LIBRARY_ROOT_STRINGS.map((rootString) => {
                      const shape = definition.shapes.find((candidate) => candidate.rootString === rootString);
                      if (!shape) {
                        return (
                          <View key={`${definition.quality}-${rootString}`} style={[styles.shapeButton, styles.shapeButtonDisabled]}>
                            <Text style={styles.shapeButtonDisabledText}>N/A</Text>
                          </View>
                        );
                      }

                      return (
                        <Pressable
                          key={`${definition.quality}-${rootString}`}
                          style={styles.shapeButton}
                          onPress={() => {
                            setChordShape(definition, shape);
                            setIsLibraryOpen(false);
                          }}
                        >
                          <Text style={styles.shapeButtonText}>{STRING_NAMES[rootString]}</Text>
                        </Pressable>
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
    backgroundColor: '#ffffff',
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
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.38)',
    justifyContent: 'flex-start',
    paddingTop: 48,
    paddingHorizontal: 10,
  },
  menuSheet: {
    maxHeight: '88%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  menuSheetContent: {
    gap: 10,
    paddingBottom: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuTitle: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  menuClose: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
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
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  modalClose: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
  shapeButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    paddingVertical: 7,
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
  shapeButtonDisabledText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default SandboxMode;
