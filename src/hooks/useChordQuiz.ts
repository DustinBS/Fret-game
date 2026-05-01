import { useState, useCallback, useMemo, useEffect } from 'react';
import { CHORD_DICTIONARY, type ChordShape } from '../utils/chordLibrary';
import { getKeySignatureInfo, keySignatureUsesFlats, KEY_CONSTRAINT_OPTIONS, TUNING, NOTES_FLAT, NOTES_SHARP } from '../utils/musicTheory';
import { CHORD_QUALITY_DIATONIC_MAP, DIATONIC_INTERVALS } from '../utils/diatonic';
import { readSessionJson, writeSessionJson } from '../utils/viewState';
import { buildChordDefinitionId, getShapeRootVoicing } from '../utils/chordVoicing';
import { buildLooseRootVoicingLabel, getRootVoicingArchetype } from '../utils/rootVoicingLabel';

type QuizState = 'PLAYING' | 'REVEALED';

interface QuizData {
  rootPitchClass: number; // 0-11
  quality: string;
  rootVoicing: string;
  shape: ChordShape;
  rootString: number;
  rootFret: number;
  activePitches: number[];
  useFlats: boolean;
}

export const QUIZ_ROOT_STRING_OPTIONS = [5, 4, 3] as const;
export type QuizRootString = (typeof QUIZ_ROOT_STRING_OPTIONS)[number];
export const QUIZ_KEY_CONSTRAINT_ALL = 'ALL';
const QUIZ_STATE_KEY = 'fret-quiz-state';
const MAX_RECENT_QUIZ_KEYS = 80;

interface QuizCandidate {
  key: string;
  quality: string;
  rootVoicing: string;
  shape: ChordShape;
  rootPitchClass: number;
}

interface QuizPersistedState {
  streak: number;
  gameState: QuizState;
  quizData: QuizData | null;
  inputRoot: string;
  inputQuality: string;
  inputShape: string;
  inputVoicing: string;
  enabledRootStrings: QuizRootString[];
  keyConstraint: string;
  showRootHint: boolean;
  showVoicingHint: boolean;
  recentQuizKeys: string[];
  onlyDiatonicChords: boolean;
}

function normalizeRootStringSelection(selection: QuizRootString[]): QuizRootString[] {
  return QUIZ_ROOT_STRING_OPTIONS.filter((rootString) => selection.includes(rootString));
}

function normalizeRootStringSelectionFromUnknown(value: unknown): QuizRootString[] {
  if (!Array.isArray(value)) {
    return [...QUIZ_ROOT_STRING_OPTIONS];
  }

  const normalized = value
    .map((entry) => Number(entry))
    .filter((entry): entry is QuizRootString => QUIZ_ROOT_STRING_OPTIONS.includes(entry as QuizRootString));

  return normalizeRootStringSelection(normalized);
}

function normalizeQuizData(value: unknown): QuizData | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<QuizData>;
  if (
    !Number.isFinite(candidate.rootPitchClass) ||
    typeof candidate.quality !== 'string' ||
    typeof candidate.rootVoicing !== 'string' ||
    !candidate.shape ||
    typeof candidate.shape !== 'object' ||
    !Number.isFinite(candidate.rootString) ||
    !Number.isFinite(candidate.rootFret) ||
    !Array.isArray(candidate.activePitches) ||
    typeof candidate.useFlats !== 'boolean'
  ) {
    return null;
  }

  return {
    rootPitchClass: Number(candidate.rootPitchClass),
    quality: candidate.quality,
    rootVoicing: candidate.rootVoicing,
    shape: candidate.shape as ChordShape,
    rootString: Number(candidate.rootString),
    rootFret: Number(candidate.rootFret),
    activePitches: candidate.activePitches.map((pitch) => Number(pitch)).filter((pitch) => Number.isFinite(pitch)),
    useFlats: candidate.useFlats,
  };
}

function getActiveRootStrings(selection: QuizRootString[]): readonly QuizRootString[] {
  if (selection.length === 0 || selection.length === QUIZ_ROOT_STRING_OPTIONS.length) {
    return QUIZ_ROOT_STRING_OPTIONS;
  }

  return normalizeRootStringSelection(selection);
}

function normalizeKeyConstraint(value: unknown): string {
  if (typeof value !== 'string') {
    return QUIZ_KEY_CONSTRAINT_ALL;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return QUIZ_KEY_CONSTRAINT_ALL;
  }

  const keyRoot = trimmed.split(/\s+/)[0];
  const normalizedKeyRoot = keyRoot.toUpperCase();
  if (normalizedKeyRoot === 'NONE' || normalizedKeyRoot === 'ALL') {
    return QUIZ_KEY_CONSTRAINT_ALL;
  }

  return KEY_CONSTRAINT_OPTIONS.includes(keyRoot) ? keyRoot : QUIZ_KEY_CONSTRAINT_ALL;
}

function normalizeShapeGuess(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return '';
  }

  const firstDigit = trimmed.match(/[1-6]/)?.[0];
  return firstDigit ?? trimmed;
}

function normalizeRecentQuizKeys(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    .slice(0, MAX_RECENT_QUIZ_KEYS);
}

export function useChordQuiz() {
  const persistedState = useMemo(
    () => readSessionJson<Partial<QuizPersistedState>>(QUIZ_STATE_KEY, {}),
    [],
  );

  const [streak, setStreak] = useState(() => {
    const value = persistedState.streak;
    return Number.isFinite(value) && Number(value) >= 0 ? Number(value) : 0;
  });
  const [gameState, setGameState] = useState<QuizState>(() => {
    return persistedState.gameState === 'REVEALED' ? 'REVEALED' : 'PLAYING';
  });
  const [quizData, setQuizData] = useState<QuizData | null>(() => normalizeQuizData(persistedState.quizData));

  const [inputRoot, setInputRoot] = useState(() => (typeof persistedState.inputRoot === 'string' ? persistedState.inputRoot : ''));
  const [inputQuality, setInputQuality] = useState(() => (typeof persistedState.inputQuality === 'string' ? persistedState.inputQuality : ''));
  const [inputShape, setInputShape] = useState(() => (typeof persistedState.inputShape === 'string' ? persistedState.inputShape : ''));
  const [inputVoicing, setInputVoicing] = useState(() => (typeof persistedState.inputVoicing === 'string' ? persistedState.inputVoicing : ''));
  const [enabledRootStrings, setEnabledRootStrings] = useState<QuizRootString[]>(() => {
    if (Array.isArray(persistedState.enabledRootStrings)) {
      return normalizeRootStringSelectionFromUnknown(persistedState.enabledRootStrings);
    }

    return [...QUIZ_ROOT_STRING_OPTIONS];
  });

  const [keyConstraint, setKeyConstraint] = useState(() => {
    return normalizeKeyConstraint(persistedState.keyConstraint);
  });
  const [showRootHint, setShowRootHint] = useState(() => persistedState.showRootHint === true);
  const [showVoicingHint, setShowVoicingHint] = useState(() => persistedState.showVoicingHint !== false);
  const [recentQuizKeys, setRecentQuizKeys] = useState<string[]>(() => normalizeRecentQuizKeys(persistedState.recentQuizKeys));
  const [onlyDiatonicChords, setOnlyDiatonicChords] = useState(() => persistedState.onlyDiatonicChords === true);

  const definitionIndexMap = useMemo(() => {
    return new Map(CHORD_DICTIONARY.map((definition, definitionIndex) => [definition, definitionIndex]));
  }, []);

  const activeRootStrings = useMemo(() => getActiveRootStrings(enabledRootStrings), [enabledRootStrings]);

  const rootStringConstraintLabel = useMemo(() => {
    if (enabledRootStrings.length === 0 || enabledRootStrings.length === QUIZ_ROOT_STRING_OPTIONS.length) {
      return 'All root strings (6, 5, 4)';
    }

    const displayStrings = [...enabledRootStrings]
      .sort((a, b) => b - a)
      .map((rootString) => String(rootString + 1));

    return `Strings ${displayStrings.join(', ')}`;
  }, [enabledRootStrings]);

  const toggleRootStringConstraint = useCallback((rootString: QuizRootString) => {
    setEnabledRootStrings((prev) => {
      if (prev.includes(rootString)) {
        return prev.filter((value) => value !== rootString);
      }

      return normalizeRootStringSelection([...prev, rootString]);
    });
  }, []);

  useEffect(() => {
    writeSessionJson<QuizPersistedState>(QUIZ_STATE_KEY, {
      streak,
      gameState,
      quizData,
      inputRoot,
      inputQuality,
      inputShape,
      inputVoicing,
      enabledRootStrings,
      keyConstraint,
      showRootHint,
      showVoicingHint,
      recentQuizKeys,
      onlyDiatonicChords,
    });
  }, [streak, gameState, quizData, inputRoot, inputQuality, inputShape, inputVoicing, enabledRootStrings, keyConstraint, showRootHint, showVoicingHint, recentQuizKeys, onlyDiatonicChords]);

  useEffect(() => {
    if (!quizData || gameState !== 'PLAYING') {
      return;
    }

    if (showRootHint) {
      const hintedRoot = quizData.useFlats ? NOTES_FLAT[quizData.rootPitchClass] : NOTES_SHARP[quizData.rootPitchClass];
      setInputRoot(hintedRoot);
      return;
    }

    setInputRoot('');
  }, [showRootHint, quizData, gameState]);

  useEffect(() => {
    if (!quizData) {
      return;
    }

    if (showVoicingHint) {
      setInputVoicing(buildLooseRootVoicingLabel(quizData.rootVoicing));
      return;
    }

    if (gameState === 'PLAYING') {
      setInputVoicing('');
    }
  }, [showVoicingHint, quizData, gameState]);

  const generateQuiz = useCallback(() => {
    const allPitchClasses = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const hasKeyConstraint = keyConstraint !== QUIZ_KEY_CONSTRAINT_ALL;
    const keyInfo = hasKeyConstraint ? getKeySignatureInfo(keyConstraint) : null;

    const allowedRoots = hasKeyConstraint && keyInfo
      ? Object.values(DIATONIC_INTERVALS).map((offset) => (keyInfo.pitchClass + offset) % 12)
      : allPitchClasses;

    let useFlats = Math.random() > 0.5;

    if (hasKeyConstraint && keyInfo) {
      useFlats = keySignatureUsesFlats(keyInfo.renderableKeyName);
    }

    const activeRootSet = new Set<number>(activeRootStrings);
    const diatonicQualities = new Set<string>(Object.keys(CHORD_QUALITY_DIATONIC_MAP));
    const baseChordDictionary = onlyDiatonicChords
      ? CHORD_DICTIONARY.filter((entry) => diatonicQualities.has(entry.quality))
      : CHORD_DICTIONARY;

    const effectiveChordDictionary = baseChordDictionary.length > 0 ? baseChordDictionary : CHORD_DICTIONARY;

    const isDiatonicCandidate = (quality: string, rootPitchClass: number): boolean => {
      if (!onlyDiatonicChords) {
        return true;
      }

      const qualityDegrees = CHORD_QUALITY_DIATONIC_MAP[quality] ?? [];
      if (qualityDegrees.length === 0) {
        return false;
      }

      if (!hasKeyConstraint || !keyInfo) {
        return true;
      }

      const offset = (rootPitchClass - keyInfo.pitchClass + 12) % 12;
      const matchingDegrees = Object.entries(DIATONIC_INTERVALS)
        .filter(([, degreeOffset]) => degreeOffset === offset)
        .map(([degree]) => degree);

      if (matchingDegrees.length === 0) {
        return false;
      }

      return matchingDegrees.some((degree) => qualityDegrees.includes(degree));
    };

    const constrainedCandidates = effectiveChordDictionary.flatMap((entry) => {
      const definitionIndex = definitionIndexMap.get(entry) ?? CHORD_DICTIONARY.findIndex((candidate) => candidate === entry);
      const chordId = buildChordDefinitionId(entry.quality, definitionIndex);

      return entry.shapes.flatMap((shape, shapeIndex) => {
        if (!activeRootSet.has(shape.rootString)) {
          return [];
        }

        const rootVoicing = getShapeRootVoicing(entry, shapeIndex).rootVoicing;

        return allowedRoots
          .filter((rootPitchClass) => isDiatonicCandidate(entry.quality, rootPitchClass))
          .map((rootPitchClass) => ({
            key: `${chordId}|${rootVoicing}|${shape.rootString}|${shapeIndex}|${rootPitchClass}`,
            quality: entry.quality,
            rootVoicing,
            shape,
            rootPitchClass,
          }));
      });
    });

    const fallbackCandidates = effectiveChordDictionary.flatMap((entry) => {
      const definitionIndex = definitionIndexMap.get(entry) ?? CHORD_DICTIONARY.findIndex((candidate) => candidate === entry);
      const chordId = buildChordDefinitionId(entry.quality, definitionIndex);

      return entry.shapes.flatMap((shape, shapeIndex) => {
        const rootVoicing = getShapeRootVoicing(entry, shapeIndex).rootVoicing;

        return allowedRoots
          .filter((rootPitchClass) => isDiatonicCandidate(entry.quality, rootPitchClass))
          .map((rootPitchClass) => ({
            key: `${chordId}|${rootVoicing}|${shape.rootString}|${shapeIndex}|${rootPitchClass}`,
            quality: entry.quality,
            rootVoicing,
            shape,
            rootPitchClass,
          }));
      });
    });

    const candidates = constrainedCandidates.length > 0 ? constrainedCandidates : fallbackCandidates;
    if (candidates.length === 0) {
      return;
    }

    const recentSet = new Set(recentQuizKeys);
    const unseenCandidates = candidates.filter((candidate) => !recentSet.has(candidate.key));
    const candidatePool = unseenCandidates.length > 0 ? unseenCandidates : candidates;

    const selectedCandidate = candidatePool[Math.floor(Math.random() * candidatePool.length)] as QuizCandidate;
    const quality = selectedCandidate.quality;
    const rootVoicing = selectedCandidate.rootVoicing;
    const shape = selectedCandidate.shape;
    const targetPitchClass = selectedCandidate.rootPitchClass;
    
    // Find base fret on the root string
    const stringOpenPitch = TUNING[shape.rootString];
    let rootFret = (targetPitchClass - (stringOpenPitch % 12) + 12) % 12;
    // to avoid everything being clustered at open position, maybe randomly add 12 if it's small?
    // Let's just keep it simple or randomly shift up 1 octave if fret <= 2
    if (rootFret <= 2 && Math.random() > 0.5) rootFret += 12;

    // TUNING[o.string] + rootFret + o.offset is correct for the absolute pitch of that note.
    const pitches = shape.offsets.map((offsetDef) => TUNING[offsetDef.string] + rootFret + offsetDef.offset);

    if (!hasKeyConstraint) {
        useFlats = [1, 3, 5, 8, 10].includes(targetPitchClass) && Math.random() > 0.5;
    }

    const hintedRoot = useFlats ? NOTES_FLAT[targetPitchClass] : NOTES_SHARP[targetPitchClass];

    setQuizData({
      rootPitchClass: targetPitchClass,
      quality,
      rootVoicing,
      shape: { ...shape, rootString: shape.rootString },
      rootString: shape.rootString,
      rootFret,
      activePitches: pitches,
      useFlats
    });
    
    setInputRoot(showRootHint ? hintedRoot : '');
    setInputQuality('');
    setInputShape('');
    setInputVoicing(showVoicingHint ? buildLooseRootVoicingLabel(rootVoicing) : '');
    setGameState('PLAYING');

    setRecentQuizKeys((prev) => {
      const deduped = [selectedCandidate.key, ...prev.filter((key) => key !== selectedCandidate.key)];
      return deduped.slice(0, MAX_RECENT_QUIZ_KEYS);
    });
  }, [keyConstraint, activeRootStrings, showRootHint, showVoicingHint, recentQuizKeys, onlyDiatonicChords, definitionIndexMap]);

  const submitGuess = useCallback(() => {
    if (!quizData || gameState !== 'PLAYING') return false;

    const correctRootNames = [NOTES_FLAT[quizData.rootPitchClass], NOTES_SHARP[quizData.rootPitchClass]];
    const isRootCorrect = correctRootNames.some(name => name.toLowerCase() === inputRoot.trim().toLowerCase());
    const isQualityCorrect = quizData.quality.toLowerCase() === inputQuality.trim().toLowerCase();
    
    const normalizedShape = normalizeShapeGuess(inputShape);
    const matchesRootStringIndex = normalizedShape === String(quizData.rootString);
    const matchesDisplayedString = normalizedShape === String(quizData.rootString + 1);
    const isShapeCorrect = normalizedShape === '' || matchesRootStringIndex || matchesDisplayedString;

    const expectedVoicingArchetype = getRootVoicingArchetype(quizData.rootVoicing);
    const guessedVoicingArchetype = getRootVoicingArchetype(inputVoicing);
    const isVoicingCorrect = guessedVoicingArchetype.length > 0 && guessedVoicingArchetype === expectedVoicingArchetype;

    const wasCorrect = isRootCorrect && isQualityCorrect && isShapeCorrect && isVoicingCorrect;
    
    if (wasCorrect) {
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }

    setGameState('REVEALED');
    return wasCorrect;
  }, [quizData, inputRoot, inputQuality, inputShape, inputVoicing, gameState]);

  return {
    quizData,
    setQuizData,
    gameState,
    setGameState,
    streak,
    setStreak,
    inputRoot,
    setInputRoot,
    inputQuality,
    setInputQuality,
    inputShape,
    setInputShape,
    inputVoicing,
    setInputVoicing,
    enabledRootStrings,
    setEnabledRootStrings,
    rootStringConstraintLabel,
    toggleRootStringConstraint,
    keyConstraint,
    setKeyConstraint,
    showRootHint,
    setShowRootHint,
    showVoicingHint,
    setShowVoicingHint,
    onlyDiatonicChords,
    setOnlyDiatonicChords,
    generateQuiz,
    submitGuess
  };
}