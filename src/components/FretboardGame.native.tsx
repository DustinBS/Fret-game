import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFretboardGame } from '../hooks/useFretboardGame';
import { getNoteName } from '../utils/musicTheory';
import SheetMusic from './SheetMusic';
import { Fretboard, type FretMarker } from './Fretboard';
import { SheetFretSplit } from './SheetFretSplit.native';

const SAFE_PALETTE = [
  { name: '1',  bg: 'bg-[#a6cee3]', text: 'text-[#a6cee3]', border: 'border-[#a6cee3]', hex: '#a6cee3' },
  { name: 'b2', bg: 'bg-[#1f78b4]', text: 'text-[#1f78b4]', border: 'border-[#1f78b4]', hex: '#1f78b4' },
  { name: '2',  bg: 'bg-[#b2df8a]', text: 'text-[#b2df8a]', border: 'border-[#b2df8a]', hex: '#b2df8a' },
  { name: 'b3', bg: 'bg-[#33a02c]', text: 'text-[#33a02c]', border: 'border-[#33a02c]', hex: '#33a02c' },
  { name: '3',  bg: 'bg-[#fb9a99]', text: 'text-[#fb9a99]', border: 'border-[#fb9a99]', hex: '#fb9a99' },
  { name: '4',  bg: 'bg-[#e31a1c]', text: 'text-[#e31a1c]', border: 'border-[#e31a1c]', hex: '#e31a1c' },
  { name: 'b5', bg: 'bg-[#fdbf6f]', text: 'text-[#fdbf6f]', border: 'border-[#fdbf6f]', hex: '#fdbf6f' },
  { name: '5',  bg: 'bg-[#ff7f00]', text: 'text-[#ff7f00]', border: 'border-[#ff7f00]', hex: '#ff7f00' },
  { name: 'b6', bg: 'bg-[#cab2d6]', text: 'text-[#cab2d6]', border: 'border-[#cab2d6]', hex: '#cab2d6' },
  { name: '6',  bg: 'bg-[#6a3d9a]', text: 'text-[#6a3d9a]', border: 'border-[#6a3d9a]', hex: '#6a3d9a' },
  { name: 'b7', bg: 'bg-[#ffff99]', text: 'text-[#ffff99]', border: 'border-[#ffff99]', hex: '#ffff99' },
  { name: '7',  bg: 'bg-[#b15928]', text: 'text-[#b15928]', border: 'border-[#b15928]', hex: '#b15928' },
];

const FretboardGame = () => {
  const {
    targetNotes, colorIndices, roundUseFlats, noteCount, updateNoteCount,
    gameMode, toggleGameMode, accidentalMode, cycleAccidentalMode,
    isSheetMode, setIsSheetMode, isHiddenMode, setIsHiddenMode,
    anchorFret, windowStart, windowEnd, clickedFrets, gameState,
    handleFretClick, submitGuess, clearGuesses, generateNewRound, TUNING,
  } = useFretboardGame(3);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentRoundColors = targetNotes.map((_, idx) => {
    const colorIdx = colorIndices[idx % colorIndices.length];
    return SAFE_PALETTE[colorIdx].hex;
  });

  const noteBadges = useMemo(() => {
    return targetNotes.map((value, index) => {
      const colorIdx = colorIndices[index % colorIndices.length];
      const color = SAFE_PALETTE[colorIdx].hex;
      const { note, octave } = getNoteName(value, roundUseFlats);
      const label = gameMode === 'WINDOW' ? note : `${note}${octave}`;
      return { label, color };
    });
  }, [targetNotes, colorIndices, roundUseFlats, gameMode]);

  const markers: FretMarker[] = [];
  for (let sIdx = 0; sIdx < 6; sIdx++) {
    for (let fret = 0; fret < 15; fret++) {
      const isActiveWindow = fret >= windowStart && fret <= windowEnd;
      const isClicked = clickedFrets.some(c => c.stringIndex === sIdx && c.fret === fret);
      const isAnchorPos = gameMode === 'WINDOW' && sIdx === 0 && fret === anchorFret;
      const pitch = TUNING[sIdx] + fret;

      let isTarget = false;
      let colorIndex = 0;

        if (gameMode === 'WINDOW') {
          const targetIdx = targetNotes.indexOf(pitch % 12);
          isTarget = targetIdx !== -1;
          if (isTarget) colorIndex = colorIndices[targetIdx % colorIndices.length];
      } else {
          const targetIdx = targetNotes.indexOf(pitch);
          isTarget = targetIdx !== -1;
          if (isTarget) colorIndex = colorIndices[targetIdx % colorIndices.length];
      }

      const colorTheme = isTarget ? SAFE_PALETTE[colorIndex] : null;

      let markerClass = "opacity-0";
      let label: string | undefined = undefined;

      if (gameState === 'GUESSING') {
          if (isClicked) {
              markerClass = isHiddenMode ? "opacity-0" : "bg-amber-400 border-2 border-slate-900 shadow-sm opacity-100";
          }
      } else if (gameState === 'REVEALED') {
          if (isTarget && isClicked) {
              markerClass = `${colorTheme?.bg} border-2 ${colorTheme?.border} opacity-100`;
              label = "✓";
          }
          else if (isTarget && !isClicked && isActiveWindow) markerClass = `${colorTheme?.bg} opacity-50 scale-75`;
          else if (!isTarget && isClicked) {
              markerClass = "bg-slate-700 border-2 border-slate-900 scale-75 opacity-100";
              label = "×";
          }
      }

      if (markerClass !== "opacity-0" || isAnchorPos) {
        markers.push({
          stringIndex: sIdx,
          fret,
          markerClass: markerClass !== "opacity-0" ? markerClass : undefined,
          label,
          isAnchor: isAnchorPos
        });
      }
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.tinyHeader}>
        <Pressable
          onPress={gameState === 'GUESSING' ? submitGuess : generateNewRound}
          style={[styles.headerButton, styles.primaryHeaderButton]}
        >
          <Text style={[styles.headerButtonText, styles.primaryHeaderButtonText]}>
            {gameState === 'GUESSING' ? 'Check Answer' : 'Next Round'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setIsSheetMode((prev) => !prev)}
          style={[styles.headerButton, isSheetMode ? styles.sheetButtonActive : null]}
        >
          <Text style={[styles.headerButtonText, isSheetMode ? styles.sheetButtonActiveText : null]}>Sheet Music</Text>
        </Pressable>

        <Pressable onPress={() => setIsMenuOpen(true)} style={[styles.headerButton, styles.menuButton]}>
          <Text style={styles.menuButtonText}>☰</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <SheetFretSplit
          modeKey="TRAINER"
          sheetTitle="Target Sequence"
          sheetContent={
            <View style={styles.sheetPaneContent}>
              {isSheetMode ? (
                <View style={styles.sheetMusicWrap}>
                  <SheetMusic
                    notes={targetNotes}
                    colors={currentRoundColors}
                    gameMode={gameMode}
                    useFlats={roundUseFlats}
                  />
                </View>
              ) : (
                <View style={styles.noteBadgeWrap}>
                  {noteBadges.map((noteBadge, index) => (
                    <View key={`${noteBadge.label}-${index}`} style={[styles.noteBadge, { backgroundColor: noteBadge.color }]}>
                      <Text style={styles.noteBadgeText}>{noteBadge.label}</Text>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.sheetHintText}>
                {gameMode === 'WINDOW'
                  ? `Window centered near fret ${anchorFret}`
                  : 'Full-position octave matching'}
              </Text>
            </View>
          }
          fretboardContent={
            <Fretboard
              markers={markers}
              windowStart={windowStart}
              windowEnd={windowEnd}
              onFretClick={handleFretClick}
            />
          }
        />
      </View>

      <Modal animationType="slide" transparent visible={isMenuOpen} onRequestClose={() => setIsMenuOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <ScrollView contentContainerStyle={styles.modalSheetContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Trainer Menu</Text>
                <Pressable onPress={() => setIsMenuOpen(false)} hitSlop={8}>
                  <Text style={styles.modalClose}>Close</Text>
                </Pressable>
              </View>

              <View style={styles.noteCountRow}>
                <Text style={styles.settingLabel}>Note Count</Text>
                <View style={styles.counterWrap}>
                  <Pressable onPress={() => updateNoteCount(-1)} style={styles.counterButton}>
                    <Text style={styles.counterButtonText}>-</Text>
                  </Pressable>
                  <Text style={styles.counterValue}>{noteCount}</Text>
                  <Pressable onPress={() => updateNoteCount(1)} style={styles.counterButton}>
                    <Text style={styles.counterButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <ToggleRow label="Hide Guesses" checked={isHiddenMode} onChange={setIsHiddenMode} />

              <Pressable onPress={toggleGameMode} style={styles.menuActionButton}>
                <Text style={styles.menuActionLabel}>Game Mode</Text>
                <Text style={styles.menuActionValue}>{gameMode === 'WINDOW' ? 'Position' : 'Octave'}</Text>
              </Pressable>

              <Pressable onPress={cycleAccidentalMode} style={styles.menuActionButton}>
                <Text style={styles.menuActionLabel}>Accidentals</Text>
                <Text style={styles.menuActionValue}>{accidentalMode}</Text>
              </Pressable>

              <Pressable onPress={clearGuesses} style={[styles.menuActionButton, styles.clearActionButton]}>
                <Text style={[styles.menuActionLabel, styles.clearActionLabel]}>Clear Guesses</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const ToggleRow = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) => (
  <View style={styles.toggleRow}>
    <Text style={styles.settingLabel}>{label}</Text>
    <Pressable
      onPress={() => onChange(!checked)}
      style={[styles.toggleTrack, checked ? styles.toggleTrackActive : null]}
    >
      <View style={[styles.toggleThumb, checked ? styles.toggleThumbActive : null]} />
    </Pressable>
  </View>
);

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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
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
  headerButtonText: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  primaryHeaderButton: {
    borderColor: '#0f172a',
    backgroundColor: '#0f172a',
  },
  primaryHeaderButtonText: {
    color: '#ffffff',
  },
  sheetButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  sheetButtonActiveText: {
    color: '#ffffff',
  },
  menuButton: {
    marginLeft: 'auto',
    width: 34,
    alignItems: 'center',
    paddingHorizontal: 0,
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
  sheetMusicWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 170,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 8,
  },
  noteBadgeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    minHeight: 170,
    alignContent: 'flex-start',
  },
  noteBadge: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  sheetHintText: {
    color: '#64748b',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900',
  },
  modalClose: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  noteCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  settingLabel: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  counterWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    overflow: 'hidden',
  },
  counterButton: {
    width: 32,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  counterButtonText: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '800',
    marginTop: -1,
  },
  counterValue: {
    width: 34,
    textAlign: 'center',
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#cbd5e1',
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: '#16a34a',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  menuActionButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuActionLabel: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  menuActionValue: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '800',
  },
  clearActionButton: {
    borderColor: '#fecaca',
    backgroundColor: '#fff1f2',
  },
  clearActionLabel: {
    color: '#b91c1c',
  },
});

export default FretboardGame;