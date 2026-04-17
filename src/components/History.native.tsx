/* eslint-disable react-refresh/only-export-components */
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { readSessionJson, writeSessionJson } from '../utils/viewState';

export interface HistoryItem<T = unknown> {
  label: string;
  timestamp: number;
  state?: T;
}

const MAX_HISTORY_ITEMS = 50;

export const useHistory = <T = unknown>(storageKey: string) => {
  const [history, setHistory] = useState<HistoryItem<T>[]>([]);

  useEffect(() => {
    const saved = readSessionJson<HistoryItem<T>[]>(storageKey, []);
    if (Array.isArray(saved)) {
      setHistory(saved);
    }
  }, [storageKey]);

  const addHistory = useCallback(
    (label: string, state?: T) => {
      setHistory((prev) => {
        const next = [{ label, timestamp: Date.now(), state }, ...prev].slice(0, MAX_HISTORY_ITEMS);
        writeSessionJson(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    writeSessionJson<HistoryItem<T>[]>(storageKey, []);
  }, [storageKey]);

  return { history, addHistory, clearHistory };
};

interface HistoryPanelProps<T = unknown> {
  history: HistoryItem<T>[];
  onClear: () => void;
  onRestore?: (state: T) => void;
}

function formatTimestamp(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export const HistoryPanel = <T,>({ history, onClear, onRestore }: HistoryPanelProps<T>) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>History</Text>
        <Pressable onPress={onClear} hitSlop={8}>
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {history.map((item) => {
          const hasState = item.state !== undefined;

          return (
            <Pressable
              key={item.timestamp}
              onPress={() => {
                if (hasState && onRestore) {
                  onRestore(item.state as T);
                }
              }}
              style={[styles.row, hasState ? styles.rowInteractive : null]}
              disabled={!hasState || !onRestore}
            >
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowTime}>{formatTimestamp(item.timestamp)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#cbd5e1',
    paddingTop: 12,
    marginTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerText: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#475569',
    fontWeight: '700',
  },
  clearText: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#dc2626',
    fontWeight: '700',
  },
  list: {
    maxHeight: 220,
  },
  listContent: {
    gap: 8,
    paddingBottom: 8,
  },
  row: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowInteractive: {
    backgroundColor: '#f1f5f9',
  },
  rowLabel: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    fontWeight: '700',
  },
  rowTime: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
