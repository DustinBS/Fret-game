// src/components/FretboardGame.native.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { useFretboardGame, getNoteName } from '../hooks/useFretboardGame';
import SheetMusic from './SheetMusic';

const SAFE_PALETTE = [
  { name: 'Blue',   bg: 'bg-blue-600',   text: 'text-blue-600',   border: 'border-blue-800', hex: '#2563eb' },
  { name: 'Orange', bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-700', hex: '#f97316' },
  { name: 'Purple', bg: 'bg-violet-600', text: 'text-violet-600', border: 'border-violet-800', hex: '#7c3aed' },
  { name: 'Emerald',bg: 'bg-emerald-600',text: 'text-emerald-600',border: 'border-emerald-800', hex: '#059669' },
  { name: 'Cyan',   bg: 'bg-cyan-600',   text: 'text-cyan-600',   border: 'border-cyan-800', hex: '#0891b2' },
  { name: 'Pink',   bg: 'bg-pink-600',   text: 'text-pink-600',   border: 'border-pink-800', hex: '#db2777' },
];

const FretboardGame = () => {
  const {
    targetNotes, colorIndices, roundUseFlats, noteCount, updateNoteCount,
    gameMode, toggleGameMode, accidentalMode, cycleAccidentalMode,
    isSheetMode, setIsSheetMode, isHiddenMode, setIsHiddenMode,
    anchorFret, windowStart, windowEnd, clickedFrets, gameState,
    streak, handleFretClick, submitGuess, clearGuesses, generateNewRound, TUNING
  } = useFretboardGame(3);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const STRING_THICKNESS = [1, 1.5, 2, 2.5, 3, 3.5];

  const currentRoundColors = targetNotes.map((_, idx) => {
    const colorIdx = colorIndices[idx % colorIndices.length];
    return SAFE_PALETTE[colorIdx].hex;
  });

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
          <View className="flex-1 bg-slate-100 shadow-xl overflow-hidden rounded-lg">

            <View className="flex-1 flex-col justify-evenly py-2">
                {[0, 1, 2, 3, 4, 5].map((sIdx) => (
                    <View key={sIdx} className="flex-1 flex-row items-center relative w-full">
                        <View className="absolute w-full bg-slate-900 z-0 pointer-events-none" style={{ height: STRING_THICKNESS[sIdx] }} />

                        {Array.from({ length: 15 }).map((_, fret) => {
                            const isActiveWindow = fret >= windowStart && fret <= windowEnd;
                            const isClicked = clickedFrets.some(c => c.stringIndex === sIdx && c.fret === fret);
                            const isAnchorPos = gameMode === 'WINDOW' && sIdx === 0 && fret === anchorFret;
                            const pitch = TUNING[sIdx] + fret;

                            let isTarget = false;
                            let colorIndex = 0;
                            const noteVal = gameMode === 'WINDOW' ? pitch % 12 : pitch;
                            const targetIdx = targetNotes.indexOf(noteVal);
                            if (targetIdx !== -1) {
                                isTarget = true;
                                colorIndex = colorIndices[targetIdx % colorIndices.length];
                            }

                            const colorTheme = isTarget ? SAFE_PALETTE[colorIndex] : null;

                            let markerStyle = "w-6 h-6 rounded-full items-center justify-center opacity-0";
                            let innerText = null;

                            if (gameState === 'GUESSING' && isClicked) {
                                markerStyle = isHiddenMode ? "w-6 h-6 opacity-0" : "w-6 h-6 rounded-full bg-amber-400 border-2 border-slate-900 shadow-sm opacity-100";
                            } else if (gameState === 'REVEALED') {
                                if (isTarget && isClicked) {
                                    markerStyle = `w-6 h-6 rounded-full ${colorTheme?.bg} border-2 ${colorTheme?.border} opacity-100`;
                                    innerText = "✓";
                                }
                                else if (isTarget && !isClicked && isActiveWindow) {
                                    markerStyle = `w-6 h-6 rounded-full ${colorTheme?.bg} opacity-50 scale-75`;
                                }
                                else if (!isTarget && isClicked) {
                                    markerStyle = "w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900 scale-75 opacity-100";
                                    innerText = "×";
                                }
                            }

                            return (
                                <Pressable
                                    key={fret}
                                    onPress={() => handleFretClick(sIdx, fret)}
                                    disabled={!isActiveWindow}
                                    className={`flex-1 h-full items-center justify-center border-r border-slate-300 ${fret === 0 ? 'border-r-4 border-slate-800' : ''} ${isActiveWindow ? '' : 'bg-slate-200/50'}`}
                                >
                                    {isAnchorPos && <View key="anchor" className="absolute w-2 h-2 bg-red-600 rounded-sm opacity-80 z-0" />}
                                    <View key="marker" className={markerStyle}>
                                        {innerText && <Text className="text-white text-[10px] font-bold">{innerText}</Text>}
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                ))}

                <View className="flex-row w-full h-4">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <View key={i} className="flex-1 items-center justify-center">
                            <Text className={`text-[8px] font-mono ${gameMode === 'WINDOW' && i === anchorFret ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                                {i}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
          </View>
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
                    <Text className="font-bold text-blue-600">{gameMode === 'WINDOW' ? 'Octave (Window)' : 'Position (Full)'}</Text>
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

const ToggleRow = ({ label, checked, onChange }: any) => (
   <View className="flex-row justify-between items-center py-2">
      <Text className="font-bold text-slate-500 uppercase">{label}</Text>
      <Pressable onPress={() => onChange(!checked)} className={`w-12 h-7 rounded-full justify-center px-1 ${checked ? 'bg-green-500' : 'bg-slate-300'}`}>
         <View className={`w-5 h-5 bg-white rounded-full shadow-sm ${checked ? 'self-end' : 'self-start'}`} />
      </Pressable>
   </View>
);

export default FretboardGame;