import type { ChordShape, ChordDefinition } from './chordLibrary.types';
export type { ChordShape, ChordDefinition };
import { q_13Chord } from './chords/13';
import { q_7Chord } from './chords/7';
import { q_7sus4Chord } from './chords/7sus4';
import { q_9Chord } from './chords/9';
import { augChord } from './chords/aug';
import { aug7Chord } from './chords/aug7';
import { dimChord } from './chords/dim';
import { dim7Chord } from './chords/dim7';
import { majChord } from './chords/maj';
import { maj13Chord } from './chords/maj13';
import { maj6Chord } from './chords/maj6';
import { maj7_11Chord } from './chords/maj7_11';
import { maj7Chord } from './chords/maj7';
import { maj9Chord } from './chords/maj9';
import { min_b13_Chord } from './chords/min_b13_';
import { minChord } from './chords/min';
import { min11_b5_Chord } from './chords/min11_b5_';
import { min11Chord } from './chords/min11';
import { min13Chord } from './chords/min13';
import { min6Chord } from './chords/min6';
import { min7_b13_Chord } from './chords/min7_b13_';
import { min7Chord } from './chords/min7';
import { min7b5Chord } from './chords/min7b5';
import { min9Chord } from './chords/min9';
import { minb6Chord } from './chords/minb6';
import { sus2Chord } from './chords/sus2';
import { sus4Chord } from './chords/sus4';

export const CHORD_DICTIONARY: ChordDefinition[] = [
  q_13Chord,
  q_7Chord,
  q_7sus4Chord,
  q_9Chord,
  augChord,
  aug7Chord,
  dimChord,
  dim7Chord,
  majChord,
  maj13Chord,
  maj6Chord,
  maj7_11Chord,
  maj7Chord,
  maj9Chord,
  min_b13_Chord,
  minChord,
  min11_b5_Chord,
  min11Chord,
  min13Chord,
  min6Chord,
  min7_b13_Chord,
  min7Chord,
  min7b5Chord,
  min9Chord,
  minb6Chord,
  sus2Chord,
  sus4Chord
];
