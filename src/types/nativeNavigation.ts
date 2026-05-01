export interface ShapePresetRequest {
  quality: string;
  rootString: number;
  fretOffset: number;
  chordId?: string;
  rootVoicing?: string;
  shapeIndex?: number;
  focusLibrary?: boolean;
}

export interface GalleryJumpRequest {
  key?: string;
  quality: string;
  chordId?: string;
  rootString?: number;
  rootVoicing?: string;
  shapeIndex?: number;
}

export interface VisualArchetypeJumpRequest {
  key?: string;
  quality: string;
  chordId?: string;
  rootString?: number;
  rootVoicing?: string;
  shapeIndex?: number;
}
