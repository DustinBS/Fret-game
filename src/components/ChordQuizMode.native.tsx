import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { QUIZ_ROOT_STRING_OPTIONS, useChordQuiz } from '../hooks/useChordQuiz';
import { getIntervalColor, getIntervalHexColor, getNoteNameFromPitchClass } from '../utils/musicTheory';
import { Fretboard, type FretMarker } from './Fretboard';
import SheetMusic from './SheetMusic';
import { CHORD_DICTIONARY } from '../utils/chordLibrary';
import { SheetFretSplit } from './SheetFretSplit.native';
import { buildRootVoicingDisplayParts } from '../utils/rootVoicingLabel';

const ChordQuizMode: React.FC = () => {
  const {
    quizData,
    gameState,
    setGameState,
    inputRoot,
    setInputRoot,
    inputQuality,
    setInputQuality,
    inputShape,
    setInputShape,
    inputVoicing,
    setInputVoicing,
    enabledRootStrings,
    rootStringConstraintLabel,
    toggleRootStringConstraint,
    showRootHint,
    setShowRootHint,
    showVoicingHint,
    setShowVoicingHint,
    generateQuiz,
    submitGuess,
  } = useChordQuiz();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!quizData) {
      generateQuiz();
    }
  }, [quizData, generateQuiz]);

  if (!quizData) {
    return null;
  }

  const handleSubmit = () => {
    submitGuess();
  };

  const markers: FretMarker[] = gameState === 'REVEALED'
    ? quizData.shape.offsets.map((offsetDef) => ({
        stringIndex: offsetDef.string,
        fret: quizData.rootFret + offsetDef.offset,
        isAnchor: offsetDef.string === quizData.rootString,
        markerClass: `opacity-100 ${getIntervalColor(offsetDef.interval || '1')} ${offsetDef.string === quizData.rootString ? 'border-2 border-slate-900' : ''}`,
        label: offsetDef.interval || '1',
      }))
    : [];

  const revealVoicingParts = buildRootVoicingDisplayParts(quizData.rootString, quizData.rootVoicing);

  return (
    <View style={styles.screen}>
      <View style={styles.tinyHeader}>
        <Pressable
          onPress={() => {
            if (gameState === 'PLAYING') {
              setGameState('REVEALED');
            } else {
              generateQuiz();
            }
          }}
          style={[styles.headerButton, gameState === 'REVEALED' ? styles.headerButtonActive : null]}
        >
          <Text style={[styles.headerButtonText, gameState === 'REVEALED' ? styles.headerButtonTextActive : null]}>
            {gameState === 'PLAYING' ? 'Actual Answer' : 'Next Round'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setIsSubmitModalOpen(true)}
          style={[styles.headerButton, styles.submitHeaderButton]}
        >
          <Text style={[styles.headerButtonText, styles.submitHeaderButtonText]}>
            Submit Answer
          </Text>
        </Pressable>

        <Pressable onPress={() => setIsMenuOpen(true)} style={styles.menuButton}>
          <Text style={styles.menuButtonText}>☰</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <SheetFretSplit
          modeKey="QUIZ"
          sheetTitle="Quiz Sheet"
          sheetContent={
            <View style={styles.sheetPaneContent}>
              <View style={styles.sheetCard}>
                <SheetMusic
                  notes={quizData.activePitches}
                  colors={gameState === 'REVEALED'
                    ? quizData.shape.offsets.map((offsetDef) => getIntervalHexColor(offsetDef.interval || '1'))
                    : quizData.activePitches.map(() => '#334155')}
                  gameMode="SANDBOX"
                  useFlats={quizData.useFlats}
                />
              </View>

              <View style={[styles.revealPanel, gameState === 'REVEALED' ? styles.revealPanelVisible : styles.revealPanelHidden]}>
                <Text style={styles.revealName}>
                  {getNoteNameFromPitchClass(quizData.rootPitchClass, quizData.useFlats)} {gameState === 'REVEALED' ? quizData.quality : '—'}
                </Text>
                <Text style={styles.revealSubtitle}>
                  {gameState === 'REVEALED' ? 'Exact Reveal' : 'Shape / Voicing'}
                </Text>
                <Text style={styles.revealVoicing}>
                  {gameState === 'REVEALED' ? `Shape: ${revealVoicingParts.baseLabel} | Voicing: ` : 'Shape: ? | Voicing: ?'}
                  {gameState === 'REVEALED' ? <Text style={styles.revealVoicingToken}>{quizData.rootVoicing}</Text> : null}
                </Text>
              </View>

              <Text style={styles.constraintSummary}>Root Strings: {rootStringConstraintLabel}</Text>
            </View>
          }
          fretboardContent={
            <Fretboard
              numFrets={25}
              windowStart={Math.max(0, quizData.rootFret - 2)}
              windowEnd={quizData.rootFret + 4}
              markers={markers}
              onFretClick={() => {}}
            />
          }
        />
      </View>

      <Modal visible={isMenuOpen} animationType="fade" transparent onRequestClose={() => setIsMenuOpen(false)}>
        <View style={styles.menuBackdrop}>
          <View style={styles.menuSheet}>
            <ScrollView contentContainerStyle={styles.menuSheetContent} showsVerticalScrollIndicator={false}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>Root String Constraints</Text>
                <Pressable onPress={() => setIsMenuOpen(false)} hitSlop={8}>
                  <Text style={styles.menuClose}>Close</Text>
                </Pressable>
              </View>

              <View style={styles.constraintRow}>
                {QUIZ_ROOT_STRING_OPTIONS.map((rootString) => {
                  const checked = enabledRootStrings.includes(rootString);
                  return (
                    <Pressable
                      key={rootString}
                      style={[styles.constraintButton, checked ? styles.constraintButtonActive : null]}
                      onPress={() => toggleRootStringConstraint(rootString)}
                    >
                      <Text style={[styles.constraintText, checked ? styles.constraintTextActive : null]}>Str {rootString + 1}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={isSubmitModalOpen} animationType="slide" transparent onRequestClose={() => setIsSubmitModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <ScrollView contentContainerStyle={styles.modalSheetContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{gameState === 'PLAYING' ? 'Submit Answer' : 'Answer Review'}</Text>
                <Pressable onPress={() => setIsSubmitModalOpen(false)} hitSlop={8}>
                  <Text style={styles.modalClose}>Close</Text>
                </Pressable>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Root Note</Text>
                  <Pressable
                    onPress={() => setShowRootHint((prev) => !prev)}
                    style={[styles.hintToggle, showRootHint ? styles.hintToggleActive : null]}
                  >
                    <Text style={[styles.hintToggleText, showRootHint ? styles.hintToggleTextActive : null]}>
                      Hint: {showRootHint ? 'On' : 'Off'}
                    </Text>
                  </Pressable>
                </View>
                <TextInput
                  value={inputRoot}
                  onChangeText={setInputRoot}
                  placeholder="C, Db, D..."
                  style={[styles.input, gameState === 'REVEALED' ? styles.inputReadonly : null]}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={gameState === 'PLAYING'}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Chord Quality</Text>
                <TextInput
                  value={inputQuality}
                  onChangeText={setInputQuality}
                  placeholder="maj7, min..."
                  style={[styles.input, gameState === 'REVEALED' ? styles.inputReadonly : null]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={gameState === 'PLAYING'}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.qualitySuggestions}>
                  {CHORD_DICTIONARY.map((definition) => (
                    <Pressable
                      key={definition.quality}
                      style={[styles.qualityChip, gameState === 'REVEALED' ? styles.chipReadonly : null]}
                      onPress={() => setInputQuality(definition.quality)}
                      disabled={gameState === 'REVEALED'}
                    >
                      <Text style={styles.qualityChipText}>{definition.quality}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>String Shape</Text>
                <View style={styles.shapeRow}>
                  {['5', '4', '3'].map((shapeValue) => {
                    const active = inputShape === shapeValue;
                    return (
                      <Pressable
                        key={shapeValue}
                        style={[styles.shapeButton, active ? styles.shapeButtonActive : null, gameState === 'REVEALED' ? styles.chipReadonly : null]}
                        onPress={() => setInputShape(shapeValue)}
                        disabled={gameState === 'REVEALED'}
                      >
                        <Text style={[styles.shapeButtonText, active ? styles.shapeButtonTextActive : null]}>
                          String {Number(shapeValue) + 1}
                        </Text>
                      </Pressable>
                    );
                  })}
                  <Pressable
                    style={[styles.shapeButton, gameState === 'REVEALED' ? styles.chipReadonly : null]}
                    onPress={() => setInputShape('')}
                    disabled={gameState === 'REVEALED'}
                  >
                    <Text style={styles.shapeButtonText}>Any</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Root Voicing</Text>
                  <Pressable
                    onPress={() => setShowVoicingHint((prev) => !prev)}
                    style={[styles.hintToggle, showVoicingHint ? styles.hintToggleActive : null]}
                  >
                    <Text style={[styles.hintToggleText, showVoicingHint ? styles.hintToggleTextActive : null]}>
                      Hint: {showVoicingHint ? 'On' : 'Off'}
                    </Text>
                  </Pressable>
                </View>
                <TextInput
                  value={inputVoicing}
                  onChangeText={setInputVoicing}
                  placeholder="E, G, C, A, D"
                  style={[styles.input, gameState === 'REVEALED' ? styles.inputReadonly : null]}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={gameState === 'PLAYING'}
                />
              </View>

              <Pressable
                onPress={() => {
                  if (gameState === 'PLAYING') {
                    handleSubmit();
                  }
                  setIsSubmitModalOpen(false);
                }}
                style={[styles.primaryAction, gameState === 'PLAYING' ? styles.submitAction : styles.readonlyAction]}
              >
                <Text style={styles.primaryActionText}>{gameState === 'PLAYING' ? 'Submit Answer' : 'Close'}</Text>
              </Pressable>
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
  headerButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  headerButtonText: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  headerButtonTextActive: {
    color: '#ffffff',
  },
  submitHeaderButton: {
    borderColor: '#0f172a',
    backgroundColor: '#0f172a',
  },
  submitHeaderButtonText: {
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
  body: {
    flex: 1,
    padding: 8,
    backgroundColor: '#f1f5f9',
  },
  sheetPaneContent: {
    flex: 1,
    gap: 10,
  },
  sheetCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    alignItems: 'center',
  },
  constraintRow: {
    flexDirection: 'row',
    gap: 8,
  },
  constraintButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  constraintButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  constraintText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '700',
  },
  constraintTextActive: {
    color: '#ffffff',
  },
  constraintSummary: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  revealPanel: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 210,
  },
  revealPanelVisible: {
    backgroundColor: '#dbeafe',
  },
  revealPanelHidden: {
    backgroundColor: '#f1f5f9',
  },
  revealName: {
    fontSize: 24,
    color: '#0f172a',
    fontWeight: '900',
  },
  revealSubtitle: {
    marginTop: 4,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#64748b',
    fontWeight: '700',
  },
  revealVoicing: {
    marginTop: 2,
    fontSize: 11,
    color: '#1d4ed8',
    fontWeight: '700',
  },
  revealVoicingToken: {
    fontSize: 8,
    fontWeight: '800',
    color: '#1e40af',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.38)',
    justifyContent: 'flex-start',
    paddingTop: 48,
    paddingHorizontal: 10,
  },
  menuSheet: {
    maxHeight: '86%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  modalSheetContent: {
    gap: 10,
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  hintToggle: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hintToggleActive: {
    borderColor: '#059669',
    backgroundColor: '#059669',
  },
  hintToggleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  hintToggleTextActive: {
    color: '#ffffff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#0f172a',
    fontSize: 13,
  },
  inputReadonly: {
    backgroundColor: '#f8fafc',
    color: '#64748b',
  },
  qualitySuggestions: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 2,
  },
  qualityChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipReadonly: {
    opacity: 0.55,
  },
  qualityChipText: {
    color: '#1e293b',
    fontSize: 11,
    fontWeight: '700',
  },
  shapeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  shapeButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#ffffff',
  },
  shapeButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  shapeButtonText: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  shapeButtonTextActive: {
    color: '#ffffff',
  },
  primaryAction: {
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  submitAction: {
    backgroundColor: '#2563eb',
  },
  nextAction: {
    backgroundColor: '#059669',
  },
  readonlyAction: {
    backgroundColor: '#64748b',
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    fontWeight: '800',
  },
});

export default ChordQuizMode;
