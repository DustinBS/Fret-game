// src/components/SheetMusic.native.tsx
import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { SHEET_WIDTH, SHEET_HEIGHT } from './sheetMusicConfig';

interface SheetMusicProps {
  notes: number[];
  colors: string[];
  gameMode: 'WINDOW' | 'OCTAVE' | 'CHORD' | 'SANDBOX' | string;
  useFlats: boolean;
}

const SheetMusic: React.FC<SheetMusicProps> = ({ notes, colors, gameMode, useFlats }) => {

  const noteData = notes.map((val, i) => {
    let renderMidi = val;
    if (gameMode === 'WINDOW') renderMidi = 60 + val;
    else renderMidi = val + 12;

    const octave = Math.floor(renderMidi / 12) - 1;
    const semitone = renderMidi % 12;

    const flatNames = ['c', 'd', 'd', 'e', 'e', 'f', 'g', 'g', 'a', 'a', 'b', 'b'];
    const sharpNames = ['c', 'c', 'd', 'd', 'e', 'f', 'f', 'g', 'g', 'a', 'a', 'b'];

    let noteLetter = useFlats ? flatNames[semitone] : sharpNames[semitone];
    let accidental = null;

    if (useFlats && [1, 3, 6, 8, 10].includes(semitone)) accidental = 'b';
    else if (!useFlats && [1, 3, 6, 8, 10].includes(semitone)) accidental = '#';

    return {
      key: `${noteLetter}/${octave}`,
      accidental,
      color: colors[i % colors.length],
      rawVal: renderMidi
    };
  }).sort((a, b) => a.rawVal - b.rawVal);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://unpkg.com/vexflow@3.0.9/releases/vexflow-min.js"></script>
        <style>
          /* Bottom align the SVG within the WebView */
          body { margin: 0; padding: 0; background: transparent; overflow: hidden; display: flex; align-items: flex-end; justify-content: center; height: 100vh; }
          #error { color: red; font-size: 10px; font-weight: bold; position: absolute; top: 0; left: 0; white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <div id="output"></div>
        <div id="error"></div>
        <script>
          try {
            const VF = Vex.Flow;
            const div = document.getElementById("output");
            const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

            const WIDTH = ${SHEET_WIDTH};
            const HEIGHT = ${SHEET_HEIGHT};

            renderer.resize(WIDTH, HEIGHT);
            const context = renderer.getContext();

            // Y=30: Push stave down so notes are closer to the bottom edge
            // This effectively removes "bottom dead space" inside the canvas
            const stave = new VF.Stave(0, 30, WIDTH - 5);
            stave.addClef("treble").setContext(context).draw();

            const notesData = ${JSON.stringify(noteData)};

            if (notesData.length > 0) {
              const keys = notesData.map(d => d.key);
              const staveNote = new VF.StaveNote({ keys: keys, duration: "w", autoStem: true });

              notesData.forEach((data, index) => {
                if (data.accidental) {
                   staveNote.addModifier(index, new VF.Accidental(data.accidental));
                }
                staveNote.setKeyStyle(index, { fillStyle: data.color, strokeStyle: data.color });
              });

              const voice = new VF.Voice({ numBeats: 4, beatValue: 4 });
              voice.addTickables([staveNote]);

              new VF.Formatter().joinVoices([voice]).format([voice], WIDTH - 50);
              voice.draw(context, stave);
            }
          } catch (e) {
            document.getElementById("error").innerText = e.toString();
          }
        </script>
      </body>
    </html>
  `;

  return (
    <View style={{ width: SHEET_WIDTH, height: SHEET_HEIGHT, overflow: 'hidden' }}>
      <WebView
        originWhitelist={['*']}
        source={{ html, baseUrl: '' }}
        scrollEnabled={false}
        style={{ backgroundColor: 'transparent' }}
        androidLayerType="software"
      />
    </View>
  );
};

export default SheetMusic;