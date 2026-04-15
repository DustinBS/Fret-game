import React from 'react';
import { View, Text, Pressable } from 'react-native';

const STRING_THICKNESS = [1, 1.5, 2, 2.5, 3, 3.5];

export type FretMarker = {
    stringIndex: number;
    fret: number;
    markerClass?: string;
    label?: string;
    isAnchor?: boolean;
};

interface FretboardProps {
    markers: FretMarker[];
    windowStart?: number;
    windowEnd?: number;
    onFretClick: (stringIndex: number, fret: number) => void;
}

export const Fretboard: React.FC<FretboardProps> = ({ 
    markers, 
    windowStart = 0, 
    windowEnd = 14, 
    onFretClick
}) => {
    return (
        <View className="flex-1 bg-slate-100 shadow-xl overflow-hidden rounded-lg">
            <View className="flex-1 flex-col justify-evenly py-2">
                {[0, 1, 2, 3, 4, 5].map((sIdx) => (
                    <View key={sIdx} className="flex-1 flex-row items-center relative w-full">
                        <View className="absolute w-full bg-slate-900 z-0 pointer-events-none" style={{ height: STRING_THICKNESS[sIdx] }} />

                        {Array.from({ length: 15 }).map((_, fret) => {
                            const isActiveWindow = fret >= windowStart && fret <= windowEnd;
                            const marker = markers.find(m => m.stringIndex === sIdx && m.fret === fret);
                            
                            const defaultClass = marker?.markerClass || "opacity-0";

                            return (
                                <Pressable
                                    key={fret}
                                    onPress={() => onFretClick(sIdx, fret)}
                                    disabled={!isActiveWindow}
                                    className={`flex-1 h-full items-center justify-center border-r border-slate-300 ${fret === 0 ? 'border-r-4 border-slate-800' : ''} ${isActiveWindow ? '' : 'bg-slate-200/50'}`}
                                >
                                    {marker?.isAnchor && <View className="absolute w-2 h-2 bg-red-600 rounded-sm opacity-80 z-0" />}
                                    <View className={`w-6 h-6 rounded-full items-center justify-center ${defaultClass}`}>
                                        {marker?.label && <Text className="text-white text-[10px] font-bold">{marker.label}</Text>}
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                ))}

                <View className="flex-row w-full h-4">
                    {Array.from({ length: 15 }).map((_, i) => {
                        const anchor = markers.find(m => m.fret === i && m.isAnchor);
                        return (
                            <View key={i} className="flex-1 items-center justify-center">
                                <Text className={`text-[8px] font-mono ${anchor ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                                    {i}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};
