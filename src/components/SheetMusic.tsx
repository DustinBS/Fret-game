import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Accidental, Formatter, Voice } from 'vexflow';

interface SheetMusicProps {
  noteValue: number; // 0-11 (Window) or MIDI (Octave)
  gameMode: 'WINDOW' | 'OCTAVE';
  width?: number;
  height?: number;
}

const SheetMusic: React.FC<SheetMusicProps> = ({ 
  noteValue, 
  gameMode, 
  width = 100, 
  height = 120 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Clear previous render
    containerRef.current.innerHTML = '';

    // 2. Setup VexFlow Factory
    // In VexFlow 4+, we import Renderer directly. 
    // Renderer.Backends.SVG is the standard way to access the backend enum.
    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    
    renderer.resize(width, height);
    const context = renderer.getContext();

    // 3. Create Stave (Treble Clef 8vb for Guitar)
    // We position it to center the note
    const stave = new Stave(0, 0, width);
    
    // Add Treble Clef with "8vb" annotation (Standard Classical Guitar Notation)
    stave.addClef('treble', 'default', '8vb');
    stave.setContext(context).draw();

    // 4. Calculate Key for VexFlow
    // Guitar Logic: 
    // Sounding Middle C (MIDI 60 on Piano) is 3rd string, 5th fret.
    // In notation, Guitar is transposing. Sounding 60 is Written 72 (C5).
    // Guitar sounding Low E (MIDI 40) is written as E below staff (approx MIDI 52 relative to piano staff).
    // Standard VexFlow Treble Clef treats "c/4" as Middle C (MIDI 60).
    // To write Guitar Low E (Sounding 40), we need to write it as E3 ("e/3").
    // Formula: Written Note = Sounding MIDI Note + 12 semitones (1 Octave)
    
    let renderMidi = noteValue;

    if (gameMode === 'WINDOW') {
      // Input is 0-11 (Pitch Class)
      // We want to display it in a readable range on the staff.
      // Let's map it to the octave starting at Middle C (Sounding C3 / Written C4)
      // Sounding C3 = MIDI 48. Written C4 = MIDI 60.
      // So Base is 60.
      renderMidi = 60 + noteValue; 
    } else {
        // Input is Actual Sounding MIDI (e.g. 40 for Low E)
        // We must transpose +12 for Written Notation
        renderMidi = noteValue + 12;
    }

    // Convert MIDI to VexFlow Key String (e.g., 61 -> "c#/4")
    const noteNames = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
    const octave = Math.floor(renderMidi / 12) - 1; // VexFlow: C4 is Middle C
    const semitone = renderMidi % 12;
    const noteName = noteNames[semitone];
    
    // Check for accidental (Sharp)
    const hasSharp = noteName.includes('#');
    const cleanKey = `${noteName[0]}/${octave}`; // e.g. "c/4"

    // 5. Create Voice and Note
    const note = new StaveNote({
      keys: [cleanKey],
      duration: "w", // Whole note
      // align_center is sometimes used but Formatter handles it best
    });

    if (hasSharp) {
      note.addModifier(new Accidental("#"));
    }

    // 6. Format and Draw
    const voice = new Voice({ numBeats: 4, beatValue: 4 });
    voice.addTickables([note]);

    // Format the voice to fit within the stave width (minus padding)
    new Formatter().joinVoices([voice]).format([voice], width - 50);

    voice.draw(context, stave);

  }, [noteValue, gameMode, width, height]);

  return <div ref={containerRef} className="inline-block" />;
};

export default SheetMusic;