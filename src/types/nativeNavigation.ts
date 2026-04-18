export interface ShapePresetRequest {
  quality: string;
  rootString: number;
  fretOffset: number;
  chordId?: string;
  rootVoicing?: string;
  shapeIndex?: number;
}

export interface GalleryJumpRequest {
  key: string;
  quality: string;
  chordId?: string;
}
