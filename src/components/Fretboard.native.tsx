import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    type TextStyle,
    View,
    type ViewStyle,
} from 'react-native';

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
    numFrets?: number;
    onFretClick: (stringIndex: number, fret: number) => void;
}

const NAMED_BG_COLORS: Record<string, string> = {
    'bg-amber-400': '#fbbf24',
    'bg-blue-500': '#3b82f6',
    'bg-slate-100': '#f1f5f9',
    'bg-slate-700': '#334155',
    'bg-slate-500': '#64748b',
};

const NAMED_BORDER_COLORS: Record<string, string> = {
    'border-slate-900': '#0f172a',
    'border-slate-800': '#1e293b',
};

const NAMED_TEXT_COLORS: Record<string, string> = {
    'text-white': '#ffffff',
    'text-slate-900': '#0f172a',
};

function parseColorToken(token: string, prefix: string): string | null {
    const start = `${prefix}[`;
    if (!token.startsWith(start) || !token.endsWith(']')) {
        return null;
    }

    const value = token.slice(start.length, -1);
    return /^#[0-9a-fA-F]{3,8}$/u.test(value) ? value : null;
}

function parseMarkerClass(markerClass?: string): { markerStyle: ViewStyle; labelStyle: TextStyle } {
    const markerStyle: ViewStyle = {};
    const labelStyle: TextStyle = {};

    if (!markerClass) {
        return { markerStyle, labelStyle };
    }

    const tokens = markerClass.split(/\s+/u).filter(Boolean);
    tokens.forEach((token) => {
        if (token === 'opacity-100') markerStyle.opacity = 1;
        if (token === 'opacity-50') markerStyle.opacity = 0.5;
        if (token === 'opacity-0') markerStyle.opacity = 0;
        if (token === 'border-2') markerStyle.borderWidth = 2;
        if (token === 'scale-0') markerStyle.transform = [{ scale: 0 }];
        if (token === 'scale-75') markerStyle.transform = [{ scale: 0.75 }];
        if (token === 'scale-100') markerStyle.transform = [{ scale: 1 }];
        if (token === 'shadow-sm') {
            markerStyle.shadowColor = '#0f172a';
            markerStyle.shadowOpacity = 0.2;
            markerStyle.shadowRadius = 2;
            markerStyle.shadowOffset = { width: 0, height: 1 };
            markerStyle.elevation = 1;
        }
        if (token === 'shadow-md') {
            markerStyle.shadowColor = '#0f172a';
            markerStyle.shadowOpacity = 0.28;
            markerStyle.shadowRadius = 3;
            markerStyle.shadowOffset = { width: 0, height: 2 };
            markerStyle.elevation = 2;
        }

        const bgHex = parseColorToken(token, 'bg-');
        if (bgHex) markerStyle.backgroundColor = bgHex;

        const borderHex = parseColorToken(token, 'border-');
        if (borderHex) markerStyle.borderColor = borderHex;

        const textHex = parseColorToken(token, 'text-');
        if (textHex) labelStyle.color = textHex;

        if (NAMED_BG_COLORS[token]) markerStyle.backgroundColor = NAMED_BG_COLORS[token];
        if (NAMED_BORDER_COLORS[token]) markerStyle.borderColor = NAMED_BORDER_COLORS[token];
        if (NAMED_TEXT_COLORS[token]) labelStyle.color = NAMED_TEXT_COLORS[token];
    });

    return { markerStyle, labelStyle };
}

function hasSingleInlay(fret: number): boolean {
    return [3, 5, 7, 9, 15, 17, 19, 21].includes(fret);
}

function hasDoubleInlay(fret: number): boolean {
    return fret > 0 && fret % 12 === 0;
}

export const Fretboard: React.FC<FretboardProps> = ({
    markers,
    windowStart = 0,
    windowEnd,
    numFrets = 15,
    onFretClick,
}) => {
    const effectiveWindowEnd = windowEnd ?? numFrets - 1;
    const boardWidth = Math.max(760, numFrets * 48);
    const fretWidth = boardWidth / numFrets;

    const markerMap = new Map<string, FretMarker>();
    const anchorFretSet = new Set<number>();

    markers.forEach((marker) => {
        markerMap.set(`${marker.stringIndex}:${marker.fret}`, marker);
        if (marker.isAnchor) {
            anchorFretSet.add(marker.fret);
        }
    });

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                bounces={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={[styles.boardShell, { width: boardWidth }]}> 
                    <View style={styles.boardEdgeTop} />
                    <View style={styles.boardCore}>
                        {[0, 1, 2, 3, 4, 5].map((sIdx) => (
                            <View key={sIdx} style={styles.stringRow}>
                                <View style={[styles.stringLine, { height: STRING_THICKNESS[sIdx] }]} />

                                {Array.from({ length: numFrets }).map((_, fret) => {
                                    const isActiveWindow = fret >= windowStart && fret <= effectiveWindowEnd;
                                    const marker = markerMap.get(`${sIdx}:${fret}`);
                                    const { markerStyle, labelStyle } = parseMarkerClass(marker?.markerClass);
                                    const showSingleInlay = sIdx === 2 && hasSingleInlay(fret);
                                    const showDoubleInlay = hasDoubleInlay(fret) && (sIdx === 1 || sIdx === 4);

                                    return (
                                        <Pressable
                                            key={fret}
                                            onPress={() => onFretClick(sIdx, fret)}
                                            disabled={!isActiveWindow}
                                            style={[
                                                styles.fretCell,
                                                { width: fretWidth },
                                                fret === 0 ? styles.nutFret : null,
                                                !isActiveWindow ? styles.inactiveFret : null,
                                            ]}
                                        >
                                            {showSingleInlay || showDoubleInlay ? <View style={styles.inlayDot} /> : null}
                                            {marker?.isAnchor ? <View style={styles.anchorMarker} /> : null}

                                            <View
                                                style={[
                                                    styles.marker,
                                                    marker ? styles.markerVisible : styles.markerHidden,
                                                    markerStyle,
                                                ]}
                                            >
                                                {marker?.label ? <Text style={[styles.markerLabel, labelStyle]}>{marker.label}</Text> : null}
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        ))}

                        <View style={styles.fretNumberRow}>
                            {Array.from({ length: numFrets }).map((_, fret) => {
                                const activeAnchor = anchorFretSet.has(fret);
                                return (
                                    <View key={fret} style={[styles.fretNumberCell, { width: fretWidth }]}>
                                        <Text style={[styles.fretNumberText, activeAnchor ? styles.fretNumberAnchor : null]}>{fret}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                    <View style={styles.boardEdgeBottom} />
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: 16,
        backgroundColor: '#e2e8f0',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#cbd5e1',
    },
    scrollContent: {
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    boardShell: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#475569',
        backgroundColor: '#f8fafc',
    },
    boardEdgeTop: {
        height: 10,
        backgroundColor: '#5D4037',
    },
    boardEdgeBottom: {
        height: 10,
        backgroundColor: '#5D4037',
    },
    boardCore: {
        gap: 0,
        backgroundColor: '#f8fafc',
    },
    stringRow: {
        height: 42,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    stringLine: {
        position: 'absolute',
        width: '100%',
        backgroundColor: '#0f172a',
        opacity: 0.85,
    },
    fretCell: {
        height: '100%',
        borderRightWidth: 1,
        borderRightColor: '#94a3b8',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
    },
    inactiveFret: {
        backgroundColor: '#e2e8f0',
        opacity: 0.65,
    },
    nutFret: {
        borderRightWidth: 6,
        borderRightColor: '#0f172a',
    },
    inlayDot: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 999,
        backgroundColor: '#cbd5e1',
        opacity: 0.9,
    },
    anchorMarker: {
        position: 'absolute',
        width: 9,
        height: 9,
        backgroundColor: '#dc2626',
        borderRadius: 2,
        opacity: 0.9,
        zIndex: 1,
    },
    marker: {
        width: 26,
        height: 26,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    markerHidden: {
        opacity: 0,
        transform: [{ scale: 0 }],
    },
    markerVisible: {
        opacity: 1,
    },
    markerLabel: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '800',
    },
    fretNumberRow: {
        height: 18,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
    },
    fretNumberCell: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    fretNumberText: {
        fontSize: 9,
        color: '#94a3b8',
        fontWeight: '700',
    },
    fretNumberAnchor: {
        color: '#dc2626',
    },
});
