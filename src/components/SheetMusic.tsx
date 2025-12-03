// src/components/SheetMusic.tsx
import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Accidental, Formatter, Voice } from 'vexflow';

interface SheetMusicProps {
  notes: number[];
  colors: string[];
  gameMode: 'WINDOW' | 'OCTAVE';
  useFlats: boolean;
}

const SheetMusic: React.FC<SheetMusicProps> = ({
  notes,
  colors,
  gameMode,
  useFlats
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const WIDTH = 200;
    const HEIGHT = 140;

    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(WIDTH, HEIGHT);
    const context = renderer.getContext();

    const stave = new Stave(10, 0, WIDTH - 20);
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
      if (gameMode === 'WINDOW') renderMidi = 60 + val;
      else renderMidi = val + 12;

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
    new Formatter().joinVoices([voice]).format([voice], WIDTH - 50);
    voice.draw(context, stave);

  }, [notes, colors, gameMode, useFlats]);

  return <div ref={containerRef} className="inline-block" />;
};

export default SheetMusic;