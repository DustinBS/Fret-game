import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { QUIZ_ROOT_STRING_OPTIONS, useChordQuiz } from '../hooks/useChordQuiz';
import { getIntervalColor, getIntervalHexColor, getNoteNameFromPitchClass } from '../utils/musicTheory';
import { Fretboard, type FretMarker } from './Fretboard';
import SheetMusic from './SheetMusic';
import { CHORD_DICTIONARY } from '../utils/chordLibrary';
import { SheetFretSplit } from './SheetFretSplit.native';
import { buildRootVoicingDisplayParts } from '../utils/rootVoicingLabel';
import { HistoryModal, getCorrectMissHistoryTextStyle, useHistory } from './History.native';

interface QuizHistoryState {
  quizData: {
    rootPitchClass: number;
    quality: string;
    rootVoicing: string;
    shape: {
      rootString: number;
      offsets: Array<{ string: number; offset: number; interval: string | undefined }>;
    };
    rootString: number;
    rootFret: number;
    activePitches: number[];
    useFlats: boolean;
  };
  gameState: 'PLAYING' | 'REVEALED';
  inputRoot: string;
  inputQuality: string;
  inputShape: string;
  inputVoicing: string;
  enabledRootStrings: readonly number[];
  keyConstraint: string;
  showRootHint: boolean;
  showVoicingHint: boolean;
  streak: number;
  wasCorrect: boolean;
}

const ChordQuizMode: React.FC<{ sidebarCollapsed?: boolean }> = ({ sidebarCollapsed }) => {
  const {
    quizData,
    setQuizData,
    gameState,
    setGameState,
    streak,
    setStreak,
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
    setEnabledRootStrings,
    keyConstraint,
    setKeyConstraint,
    generateQuiz,
    submitGuess,
  } = useChordQuiz();
  const { history, addHistory, clearHistory } = useHistory<QuizHistoryState>('fret-native-quiz-history');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const rootChipRowRef = useRef<ScrollView>(null);
  const rootChipOffsetsRef = useRef<Record<string, number>>({});
  const lastHintedRootRef = useRef<string | null>(null);
  const hintedRoot = quizData ? getNoteNameFromPitchClass(quizData.rootPitchClass, quizData.useFlats) : '';

  useEffect(() => {
    if (!quizData) {
      generateQuiz();
    }
  }, [quizData, generateQuiz]);

  const panHintIntoView = (note: string) => {
    const offset = rootChipOffsetsRef.current[note];
    if (offset === undefined) {
      return;
    }

    requestAnimationFrame(() => {
      rootChipRowRef.current?.scrollTo({ x: Math.max(0, offset - 24), animated: true });
    });
  };

  useEffect(() => {
    if (!showRootHint || gameState !== 'PLAYING') {
      return;
    }

    if (lastHintedRootRef.current !== hintedRoot) {
      lastHintedRootRef.current = hintedRoot;
      panHintIntoView(hintedRoot);
      return;
    }

    panHintIntoView(hintedRoot);
  }, [hintedRoot, gameState, showRootHint]);

  if (!quizData) {
    return null;
  }

  const handleSubmit = () => {
    if (gameState !== 'PLAYING') {
      return;
    }

    const wasCorrect = submitGuess();
    const actualName = `${getNoteNameFromPitchClass(quizData.rootPitchClass, quizData.useFlats)} ${quizData.quality}`;
    const voicingLabel = buildRootVoicingDisplayParts(quizData.rootString, quizData.rootVoicing).plainLabel;

    addHistory(`${actualName} (${voicingLabel})`, {
      quizData,
      gameState: 'REVEALED',
      inputRoot,
      inputQuality,
      inputShape,
      inputVoicing,
      enabledRootStrings,
      keyConstraint,
      showRootHint,
      showVoicingHint,
      streak: wasCorrect ? streak + 1 : 0,
      wasCorrect,
    });

    setIsHistoryOpen(false);
  };

  const handleRestoreHistory = (state: QuizHistoryState) => {
    const normalizedQuizData = {
      ...state.quizData,
      shape: {
        ...state.quizData.shape,
        offsets: state.quizData.shape.offsets.map((off) => ({
          ...off,
          interval: off.interval ?? '1',
        })),
      },
    };

    setQuizData(normalizedQuizData as any);
    setGameState(state.gameState);
    setStreak(Number.isFinite(state.streak) && state.streak >= 0 ? state.streak : 0);
    setInputRoot(state.inputRoot);
    setInputQuality(state.inputQuality);
    setInputShape(state.inputShape);
    setInputVoicing(state.inputVoicing);
    setEnabledRootStrings(
      [...state.enabledRootStrings].filter((rootString): rootString is (typeof QUIZ_ROOT_STRING_OPTIONS)[number] =>
        QUIZ_ROOT_STRING_OPTIONS.includes(rootString as (typeof QUIZ_ROOT_STRING_OPTIONS)[number]),
      ),
    );
    setKeyConstraint(state.keyConstraint);
    setShowRootHint(state.showRootHint);
    setShowVoicingHint(state.showVoicingHint);
    setIsHistoryOpen(false);
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
  const shouldShowVoicingReveal = gameState === 'REVEALED' || showVoicingHint;

  return (
    <View style={styles.screen}>
      <View style={[styles.sideRail, sidebarCollapsed ? styles.sideRailCollapsed : styles.sideRailExpanded]}>
        {!sidebarCollapsed ? (
          <ScrollView contentContainerStyle={styles.sideRailContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sideRailTitle}>Root Strings</Text>
          <View style={styles.constraintRow}>
            {QUIZ_ROOT_STRING_OPTIONS.map((rootString) => {
              const checked = enabledRootStrings.includes(rootString);
              return (
                <Pressable
                  key={rootString}
                  style={[styles.constraintButton, checked ? styles.constraintButtonActive : null]}
                  onPress={() => toggleRootStringConstraint(rootString)}
                >
                  <Text style={[styles.constraintText, checked ? styles.constraintTextActive : null]}>Str {5 - rootString + 1}</Text>
                </Pressable>
              );
            })}
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
            <ScrollView ref={rootChipRowRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.qualitySuggestions}>
              {['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'].map((note) => (
                <Pressable
                  key={note}
                  style={[styles.qualityChip, inputRoot === note ? styles.qualityChipActive : null, gameState === 'REVEALED' ? styles.chipReadonly : null]}
                  onPress={() => setInputRoot(note)}
                  onLayout={(event) => {
                    rootChipOffsetsRef.current[note] = event.nativeEvent.layout.x;
                    if (showRootHint && gameState === 'PLAYING' && note === hintedRoot) {
                      panHintIntoView(note);
                    }
                  }}
                  disabled={gameState === 'REVEALED'}
                >
                  <Text style={[styles.qualityChipText, inputRoot === note ? styles.shapeButtonTextActive : null]}>
                    {note}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
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
                submitGuess();
              }
            }}
            style={[styles.primaryAction, gameState === 'PLAYING' ? styles.submitAction : styles.readonlyAction]}
          >
            <Text style={styles.primaryActionText}>
              {gameState === 'PLAYING' ? 'Submit Answer' : 'Close'}
            </Text>
          </Pressable>
        </ScrollView>
          ) : null}
      </View>
      <View style={styles.mainContent}>
        <View style={styles.tinyHeader}>
          <Pressable
            onPress={() => {
              if (gameState === 'PLAYING') {
                setGameState('REVEALED');
              } else {
                generateQuiz();
              }
            }}
            style={[
              styles.headerButton,
              gameState === 'PLAYING' ? styles.giveUpButton : styles.headerButtonActive,
            ]}
          >
            <Text
              style={[
                styles.headerButtonText,
                gameState === 'PLAYING' ? styles.giveUpButtonText : styles.headerButtonTextActive,
              ]}
            >
              {gameState === 'PLAYING' ? 'Give Up' : 'Next Round'}
            </Text>
          </Pressable>

          {!sidebarCollapsed ? (
            <Pressable onPress={() => setIsHistoryOpen(true)} style={styles.menuButton}>
              <Text style={styles.menuButtonText}>History</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            style={[styles.headerButton, styles.submitHeaderButton]}
          >
            <Text style={[styles.headerButtonText, styles.submitHeaderButtonText]}>
              Submit Answer
            </Text>
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
                    {shouldShowVoicingReveal
                      ? `Shape: ${gameState === 'REVEALED' ? revealVoicingParts.baseLabel : '?'} | Voicing: ${quizData.rootVoicing}`
                      : 'Shape: ? | Voicing: ?'}
                  </Text>
                </View>

                <Text style={styles.constraintSummary}>Root Strings: {rootStringConstraintLabel}</Text>
              </View>
            }
            fretboardContent={
              <Fretboard
                numFrets={25}
                markers={markers}
                onFretClick={() => {}}
              />
            }
          />
        </View>
      </View>

      <HistoryModal
        visible={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClear={clearHistory}
        onRestore={handleRestoreHistory}
        getLabelStyle={getCorrectMissHistoryTextStyle}
      />

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
  headerButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerButtonActive: {
    borderColor: '#059669',
    backgroundColor: '#059669',
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
  giveUpButton: {
    borderColor: '#dc2626',
    backgroundColor: '#dc2626',
  },
  giveUpButtonText: {
    color: '#ffffff',
  },
  submitHeaderButton: {
    borderColor: '#059669',
    backgroundColor: '#059669',
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
  qualityChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
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
