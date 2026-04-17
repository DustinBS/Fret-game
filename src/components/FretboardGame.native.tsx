// src/components/FretboardGame.native.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { useFretboardGame } from '../hooks/useFretboardGame';
import { getNoteName } from '../utils/musicTheory';
import SheetMusic from './SheetMusic';
import { Fretboard, type FretMarker } from './Fretboard';

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
    streak, handleFretClick, submitGuess, clearGuesses, generateNewRound, TUNING,
  } = useFretboardGame(3);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentRoundColors = targetNotes.map((_, idx) => {
    const colorIdx = colorIndices[idx % colorIndices.length];
    return SAFE_PALETTE[colorIdx].hex;
  });

  const getGameModeName = (mode: string) => {
    if (mode === 'WINDOW') return 'Position';
    if (mode === 'OCTAVE') return 'Octave';
    return '';
  }

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
    <View className="flex-1 bg-white">

{/* --- HEADER --- */}
      {/* items-end: Ensures content aligns to bottom of header */}
      <View className="h-24 flex-row items-end justify-between px-2 border-b border-slate-200 bg-slate-50 z-10">

        {/* LEFT: Buttons (Aligned center relative to their row, but sitting at bottom of header) */}
        <View className="flex-row items-center gap-3 w-24 h-full pb-3">
            <Pressable onPress={() => setIsMenuOpen(true)} className="p-1">
               <Text className="text-xl text-slate-800 font-bold">☰</Text>
            </Pressable>

            <Pressable onPress={clearGuesses} className="bg-red-50 px-2 py-1.5 rounded border border-red-200">
               <Text className="text-[10px] font-bold text-red-700 uppercase">CLEAR</Text>
            </Pressable>
        </View>

        {/* CENTER: Targets */}
        {/* pb-0 ensures no padding lifts the music up */}
        <View className="flex-1 items-center justify-end h-full pb-0">
          {isSheetMode ? (
               // SCALE + TRANSLATE:
               // scale-75 shrinks it.
               // translateY-15 pushes it down 15px to counteract the "lift" from scaling center.
               // Calculation: (OriginalHeight 120 * (1 - 0.75)) / 2 = 15px
               <View
                 style={{ transform: [{ scale: 0.60 }, { translateY: 60 }] }}
               >
                 <SheetMusic notes={targetNotes} colors={currentRoundColors} gameMode={gameMode} useFlats={roundUseFlats} />
               </View>
            ) : (
               <View className="flex-row gap-1 flex-wrap justify-center mb-4">
                {targetNotes.map((val, idx) => {
                  const color = SAFE_PALETTE[colorIndices[idx % colorIndices.length]];
                  const { note } = getNoteName(val, roundUseFlats);
                  return (
                    <View key={idx} className={`w-8 h-8 rounded-full ${color.bg} items-center justify-center shadow-sm`}>
                        <Text className="text-white font-bold text-sm">{note}</Text>
                    </View>
                  );
                })}
               </View>
            )}
        </View>

        {/* RIGHT: Stats (Aligned bottom) */}
        <View className="flex-row items-center justify-end gap-3 w-24 h-full pb-3">
            <View className="items-center">
               <Text className="text-[8px] font-bold text-slate-400 leading-none mb-0.5">STREAK</Text>
               <Text className={`text-sm font-mono font-bold leading-none ${streak > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>
                 {streak}
               </Text>
            </View>

            {gameState === 'GUESSING' ? (
               <Pressable onPress={submitGuess} className="bg-slate-900 px-3 py-2 rounded">
                  <Text className="text-white font-bold text-[10px] uppercase">CHECK</Text>
               </Pressable>
            ) : (
               <Pressable onPress={generateNewRound} className="bg-white border border-slate-900 px-3 py-2 rounded">
                  <Text className="text-slate-900 font-bold text-[10px] uppercase">NEXT →</Text>
               </Pressable>
            )}
        </View>
      </View>

      {/* --- FRETBOARD --- */}
      <View className="flex-1 bg-slate-100 px-1 justify-center w-full py-4">
          <Fretboard
              markers={markers}
              windowStart={windowStart}
              windowEnd={windowEnd}
              onFretClick={handleFretClick}
          />
      </View>

      {/* --- SETTINGS MODAL --- */}
      <Modal animationType="slide" transparent={true} visible={isMenuOpen} onRequestClose={() => setIsMenuOpen(false)}>
        <View className="flex-1 bg-black/50 justify-end">
           <View className="bg-white rounded-t-3xl p-6 pb-10">
              <View className="flex-row justify-between items-center mb-6">
                 <Text className="text-xl font-black uppercase">Settings</Text>
                 <Pressable onPress={() => setIsMenuOpen(false)} className="p-2 bg-slate-100 rounded-full"><Text>✕</Text></Pressable>
              </View>

              <View className="gap-6">
                 <View className="flex-row justify-between items-center">
                    <Text className="font-bold text-slate-500 uppercase">Note Count</Text>
                    <View className="flex-row items-center border border-slate-300 rounded h-10">
                       <Pressable onPress={() => updateNoteCount(-1)} className="px-4 justify-center bg-slate-50"><Text>-</Text></Pressable>
                       <Text className="w-10 text-center font-bold">{noteCount}</Text>
                       <Pressable onPress={() => updateNoteCount(1)} className="px-4 justify-center bg-slate-50"><Text>+</Text></Pressable>
                    </View>
                 </View>

                 <ToggleRow label="Sheet Music Mode" checked={isSheetMode} onChange={setIsSheetMode} />
                 <ToggleRow label="Hide Guesses" checked={isHiddenMode} onChange={setIsHiddenMode} />

                 <Pressable onPress={toggleGameMode} className="bg-blue-50 p-4 rounded-lg flex-row justify-between">
                    <Text className="font-bold text-blue-800 uppercase">Game Mode</Text>
                    <Text className="font-bold text-blue-600">{
                      getGameModeName(gameMode)
                    }</Text>
                 </Pressable>

                 <Pressable onPress={cycleAccidentalMode} className="bg-blue-50 p-4 rounded-lg flex-row justify-between">
                    <Text className="font-bold text-blue-800 uppercase">Accidentals</Text>
                    <Text className="font-bold text-blue-600">{accidentalMode}</Text>
                 </Pressable>
              </View>
           </View>
        </View>
      </Modal>

    </View>
  );
};

const ToggleRow = ({ label, checked, onChange, disabled }: any) => (
   <View className={`flex-row justify-between items-center py-2 ${disabled ? 'opacity-50' : ''}`}>
      <Text className="font-bold text-slate-500 uppercase">{label}</Text>
      <Pressable onPress={() => !disabled && onChange(!checked)} className={`w-12 h-7 rounded-full justify-center px-1 ${checked ? 'bg-green-500' : 'bg-slate-300'}`}>
         <View className={`w-5 h-5 bg-white rounded-full shadow-sm ${checked ? 'self-end' : 'self-start'}`} />
      </Pressable>
   </View>
);

export default FretboardGame;