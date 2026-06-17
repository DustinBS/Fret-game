/* eslint-disable react-refresh/only-export-components */
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, type TextStyle, View } from 'react-native';
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
  renderLabel?: (item: HistoryItem<T>) => React.ReactNode;
  getLabelStyle?: (item: HistoryItem<T>) => TextStyle | undefined;
}

interface HistoryModalProps<T = unknown> extends HistoryPanelProps<T> {
  visible: boolean;
  onClose: () => void;
}

export function getCorrectMissHistoryTextStyle<T>(item: HistoryItem<T>): TextStyle {
  const stateCandidate = item.state as { wasCorrect?: unknown } | undefined;
  if (typeof stateCandidate?.wasCorrect === 'boolean') {
    return { color: stateCandidate.wasCorrect ? '#059669' : '#dc2626' };
  }

  if (item.label.includes('(Correct)')) {
    return { color: '#059669' };
  }

  if (item.label.includes('(Miss)')) {
    return { color: '#dc2626' };
  }

  return {};
}

function formatTimestamp(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export const HistoryPanel = <T,>({ history, onClear, onRestore, renderLabel, getLabelStyle }: HistoryPanelProps<T>) => {
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
              <Text style={[styles.rowLabel, getLabelStyle?.(item)]}>{renderLabel ? renderLabel(item) : item.label}</Text>
              <Text style={styles.rowTime}>{formatTimestamp(item.timestamp)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export const HistoryModal = <T,>({ visible, onClose, history, onClear, onRestore, renderLabel, getLabelStyle }: HistoryModalProps<T>) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>History</Text>
            <Pressable onPress={onClear} hitSlop={8}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          </View>

          {history.length > 0 ? (
            <HistoryPanel
              history={history}
              onClear={onClear}
              onRestore={onRestore}
              renderLabel={renderLabel}
              getLabelStyle={getLabelStyle}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No history yet.</Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '82%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 16,
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
});
