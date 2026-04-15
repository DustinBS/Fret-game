export type ChordShape = { rootString: number; offsets: { string: number; offset: number; interval: string }[]; };
export type ChordDefinition = { quality: string; expectedIntervals: string[]; shapes: ChordShape[]; };
