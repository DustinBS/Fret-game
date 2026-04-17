import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const legendItems = [
  { label: '1', color: '#a6cee3' },
  { label: 'b2', color: '#1f78b4' },
  { label: '2 / 9', color: '#b2df8a' },
  { label: 'b3', color: '#33a02c' },
  { label: '3', color: '#fb9a99' },
  { label: '4 / 11', color: '#e31a1c' },
  { label: 'b5 / #4', color: '#fdbf6f' },
  { label: '5', color: '#ff7f00' },
  { label: 'b6 / #5', color: '#cab2d6' },
  { label: '6 / 13', color: '#6a3d9a' },
  { label: 'b7', color: '#facc15' },
  { label: '7', color: '#b15928' },
];

interface LegendPanelProps {
  variant?: 'normal' | 'large';
}

export const LegendPanel: React.FC<LegendPanelProps> = ({ variant = 'normal' }) => {
  const isLarge = variant === 'large';

  return (
    <View style={[styles.container, isLarge ? styles.largeContainer : null]}>
      <Text style={[styles.title, isLarge ? styles.largeTitle : null]}>Interval Legend</Text>
      <View style={[styles.grid, isLarge ? styles.largeGrid : null]}>
        {legendItems.map((item) => (
          <View key={item.label} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: item.color }, isLarge ? styles.largeDot : null]} />
            <Text style={[styles.label, isLarge ? styles.largeLabel : null]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 10,
  },
  largeContainer: {
    padding: 14,
  },
  title: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#64748b',
    fontWeight: '800',
  },
  largeTitle: {
    fontSize: 11,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  largeGrid: {
    gap: 10,
  },
  row: {
    width: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 11,
  },
  largeDot: {
    width: 13,
    height: 13,
  },
  label: {
    fontSize: 9,
    letterSpacing: 0.5,
    color: '#334155',
    fontWeight: '700',
  },
  largeLabel: {
    fontSize: 10,
  },
});
