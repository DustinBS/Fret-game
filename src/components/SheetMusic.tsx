// src/components/SheetMusic.tsx
import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Accidental, Formatter, Voice } from 'vexflow';
import { SHEET_WIDTH, SHEET_HEIGHT, VIEWBOX_BOTTOM_PAD, VIEWBOX_UNITS_PER_SEMITONE, MAX_EXTRA_TOP_UNITS } from './sheetMusicConfig';

const STAVE_X = 10;
const STAVE_Y = 0;
const STAVE_WIDTH = SHEET_WIDTH - 20;

interface SheetMusicProps {
  notes: number[];
  colors: string[];
  gameMode: 'WINDOW' | 'OCTAVE' | 'CHORD' | 'SANDBOX' | string;
  useFlats: boolean;
  zoomSemitones?: number;
}

const SheetMusic: React.FC<SheetMusicProps> = ({
  notes,
  colors,
  gameMode,
  useFlats,
  zoomSemitones
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(SHEET_WIDTH, SHEET_HEIGHT);
    const context = renderer.getContext();

    const stave = new Stave(STAVE_X, STAVE_Y, STAVE_WIDTH);
    stave.addClef('treble', 'default', '8vb');
    stave.setContext(context).draw();

    interface NoteData {
      key: string;
      accidental: string | null;
      color: string;
      rawVal: number;
    }

    const noteDataList: NoteData[] = notes.map((val, i) => {
      let renderMidi = val;
      // 'WINDOW' mode passes relative offsets; center them around middle C
      if (gameMode === 'WINDOW') {
        renderMidi = 60 + val;
      } else {
        // We use a treble clef with 8vb (guitar transcription). VexFlow draws
        // the written pitch, so to represent sounding guitar pitches we must
        // write them an octave higher (sounding = written - 12). Thus add +12
        // to the sounding MIDI to get the written MIDI for rendering.
        renderMidi = val + 12;
      }

      const octave = Math.floor(renderMidi / 12) - 1;
      const semitone = renderMidi % 12;

      let noteLetter = '';
      let accidental = null;

      if (useFlats) {
         const flatNames = ['c', 'd', 'd', 'e', 'e', 'f', 'g', 'g', 'a', 'a', 'b', 'b'];
         const isFlat = [1, 3, 6, 8, 10].includes(semitone);
         noteLetter = flatNames[semitone];
         if (isFlat) accidental = 'b';
      } else {
         const sharpNames = ['c', 'c', 'd', 'd', 'e', 'f', 'f', 'g', 'g', 'a', 'a', 'b'];
         const isSharp = [1, 3, 6, 8, 10].includes(semitone);
         noteLetter = sharpNames[semitone];
         if (isSharp) accidental = '#';
      }

      const key = `${noteLetter}/${octave}`;

      return {
        key,
        accidental,
        color: colors[i % colors.length],
        rawVal: renderMidi
      };
    });

    noteDataList.sort((a, b) => a.rawVal - b.rawVal);

    if (noteDataList.length > 0) {
      const staveNote = new StaveNote({
        keys: noteDataList.map(n => n.key),
        duration: "w",
        autoStem: true,
      });

      noteDataList.forEach((data, index) => {
        if (data.accidental) {
          staveNote.addModifier(new Accidental(data.accidental), index);
        }
        staveNote.setKeyStyle(index, { fillStyle: data.color, strokeStyle: data.color });
      });

      const voice = new Voice({ numBeats: 4, beatValue: 4 });
      voice.addTickables([staveNote]);
      new Formatter().joinVoices([voice]).format([voice], STAVE_WIDTH - 30);
      voice.draw(context, stave);
    }

    // Apply zoom by adjusting SVG viewBox instead of scaling the container.
    // This keeps the viewport window fixed and makes notation gradually smaller.
    // We always add a tiny bottom pad so low E2 isn't clipped at default zoom.
    const svg = containerRef.current.querySelector('svg') as SVGSVGElement | null;
    if (svg) {
      const semitones = Math.max(0, zoomSemitones ?? 0);
      const extraTopUnits = Math.min(MAX_EXTRA_TOP_UNITS, semitones * VIEWBOX_UNITS_PER_SEMITONE);
      const viewBoxY = -extraTopUnits;
      const viewBoxHeight = SHEET_HEIGHT + extraTopUnits + VIEWBOX_BOTTOM_PAD;

      svg.setAttribute('viewBox', `0 ${viewBoxY} ${SHEET_WIDTH} ${viewBoxHeight}`);
      svg.setAttribute('preserveAspectRatio', 'xMidYMax meet');

      svg.style.overflow = 'visible';
      svg.style.display = 'block';
    }

    }, [notes, colors, gameMode, useFlats, zoomSemitones]);

  return (
    <div
      ref={containerRef}
      className="inline-block"
      style={{ width: `${SHEET_WIDTH}px`, height: `${SHEET_HEIGHT}px` }}
    />
  );
};

export default SheetMusic;
