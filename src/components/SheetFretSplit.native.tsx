import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { readSessionBoolean, writeSessionBoolean } from '../utils/viewState';

const SHEET_COLLAPSE_KEY_PREFIX = 'fret-native-sheet-collapsed-';

export type SplitModeKey = 'TRAINER' | 'SANDBOX' | 'QUIZ';

interface SheetFretSplitProps {
  modeKey: SplitModeKey;
  sheetTitle?: string;
  sheetContent: React.ReactNode;
  fretboardContent: React.ReactNode;
}

export const SheetFretSplit: React.FC<SheetFretSplitProps> = ({
  modeKey,
  sheetTitle = 'Sheet Music',
  sheetContent,
  fretboardContent,
}) => {
  const storageKey = useMemo(() => `${SHEET_COLLAPSE_KEY_PREFIX}${modeKey}`, [modeKey]);
  const [sheetCollapsed, setSheetCollapsed] = useState(() => readSessionBoolean(storageKey, false));
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    writeSessionBoolean(storageKey, sheetCollapsed);
  }, [storageKey, sheetCollapsed]);

  const expandedWidth = useMemo(() => {
    const target = containerWidth > 0 ? containerWidth * 0.34 : 320;
    return Math.max(220, Math.min(380, Math.round(target)));
  }, [containerWidth]);

  return (
    <View
      style={styles.root}
      onLayout={(event) => {
        setContainerWidth(event.nativeEvent.layout.width);
      }}
    >
      <View style={[styles.sheetPane, { width: sheetCollapsed ? 46 : expandedWidth }]}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{sheetCollapsed ? 'SM' : sheetTitle}</Text>
          <Pressable
            onPress={() => setSheetCollapsed((prev) => !prev)}
            style={styles.chevronButton}
            hitSlop={8}
          >
            <Text style={styles.chevronButtonText}>{sheetCollapsed ? '>' : '<'}</Text>
          </Pressable>
        </View>

        {sheetCollapsed ? (
          <Pressable style={styles.collapsedHint} onPress={() => setSheetCollapsed(false)}>
            <Text style={styles.collapsedHintText}>Sheet</Text>
          </Pressable>
        ) : (
          <View style={styles.sheetBody}>{sheetContent}</View>
        )}
      </View>

      <View style={styles.fretboardPane}>{fretboardContent}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  sheetPane: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  sheetHeader: {
    height: 34,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#cbd5e1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    backgroundColor: '#eef2ff',
  },
  sheetTitle: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  chevronButton: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#94a3b8',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronButtonText: {
    color: '#1e293b',
    fontSize: 11,
    fontWeight: '900',
    marginTop: -1,
  },
  sheetBody: {
    flex: 1,
    padding: 8,
  },
  collapsedHint: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  collapsedHintText: {
    color: '#64748b',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '700',
  },
  fretboardPane: {
    flex: 1,
  },
});
