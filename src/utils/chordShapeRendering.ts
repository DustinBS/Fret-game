import type { ChordShape } from './chordLibrary.types';
import { getIntervalHexColor, TUNING } from './musicTheory';

export const SHEET_MAX_PITCH = 77;

export interface ShapeSheetPreview {
  rootFret: number;
  notes: number[];
  colors: string[];
  zoomSemitones: number;
}

export function resolveRootFretForShape(rootPitchClass: number, shape: ChordShape): number {
  const stringOpenPitch = TUNING[shape.rootString];
  let rootFret = (rootPitchClass - (stringOpenPitch % 12) + 12) % 12;

  let minFretInShape = Math.min(...shape.offsets.map((offsetDef) => rootFret + offsetDef.offset));
  while (minFretInShape < 0) {
    rootFret += 12;
    minFretInShape += 12;
  }

  if (rootFret <= 2) {
    rootFret += 12;
  }

  return rootFret;
}

export function buildShapeSheetPreview(
  shape: ChordShape,
  rootPitchClass: number,
  useGalleryColors: boolean,
): ShapeSheetPreview {
  const rootFret = resolveRootFretForShape(rootPitchClass, shape);
  const notes = shape.offsets.map((offsetDef) => TUNING[offsetDef.string] + rootFret + offsetDef.offset);
  const colors = shape.offsets.map((offsetDef) => (useGalleryColors ? getIntervalHexColor(offsetDef.interval || '1') : '#111111'));

  const highestPitch = notes.length > 0 ? Math.max(...notes) : 0;
  const zoomSemitones = highestPitch > SHEET_MAX_PITCH ? highestPitch - SHEET_MAX_PITCH : 0;

  return { rootFret, notes, colors, zoomSemitones };
}
