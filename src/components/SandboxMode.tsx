import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { type FretPosition, useSandbox } from '../hooks/useSandbox';
import { Fretboard, type FretMarker } from './Fretboard';
import SheetMusic from './SheetMusic';
import { CHORD_DICTIONARY } from '../utils/chordLibrary';
import { getIntervalColor, getIntervalHexColor, getKeySignatureInfo, getNoteName, TUNING } from '../utils/musicTheory';
import { useHistory, HistoryPanel } from './History';
import { LegendPanel } from './LegendPanel';
import { useGlobalKeyConstraint } from '../hooks/useGlobalKey';
import { buildSearchWithUpdates, navigateFromClick, preventMiddleMouseDefault } from '../utils/queryNavigation';
import { readSessionNumber, readSessionString, restoreScrollTopWithRetries, writeSessionNumber, writeSessionString } from '../utils/viewState';
import { resolveRootFretForShape } from '../utils/chordShapeRendering';
import {
  getDefinitionRootVoicings,
  getRootStringShapeOptions,
  parseChordDefinitionId,
} from '../utils/chordVoicing';
import { buildOrderedChordEntries } from '../utils/chordEntries';
import { buildRootVoicingDisplayParts, buildRootVoicingPlainLabel } from '../utils/rootVoicingLabel';
import { resolveGalleryTargetFromSandbox } from '../utils/galleryTargeting';

const SANDBOX_SEARCH_KEY = 'fret-sandbox-search';
const SANDBOX_LIBRARY_SCROLL_KEY = 'fret-sandbox-library-scroll';

const CHORD_CONSUMER_NOTES = [
  'Add this file to src/utils/chords/, then run npm run format:chords to auto-register it in src/utils/chordLibrary.ts.',
  'Sandbox chord library + URL shape loading will include it.',
  'Quiz generation and quiz quality suggestions will include it.',
  'Gallery tables/lists (web + native) will include it.',
  'Visual Archetype grouping/collision views (web + native) will include it.',
  'Data-driven tests that read CHORD_DICTIONARY will validate it (ordering, diatonic, analyzer, archetype tests).',
];

const INTERVAL_RANK: Record<string, number> = {
  '1': 0,
  'b2': 1,
  '2': 2,
  '9': 2,
  '#9': 3,
  'b3': 3,
  '3': 4,
  '4': 5,
  '11': 5,
  '#4': 6,
  'b5': 6,
  '#11': 6,
  '5': 7,
  '#5': 8,
  'b6': 8,
  '6': 9,
  '13': 9,
  'b7': 10,
  '7': 11,
};

interface ExportOffset {
  string: number;
  offset: number;
  interval: string;
}

interface SaveChordExportData {
  quality: string;
  fileName: string;
  exportConstName: string;
  fullFileTemplate: string;
  shapeSnippet: string;
}

function parseDetectedChordQuality(chordName: string): string | null {
  const namePart = chordName.split('/')[0].trim();
  const match = namePart.match(/^([A-G][b#]?)(.*)$/);
  if (!match) {
    return null;
  }

  const rawQuality = match[2].trim();
  return rawQuality.length > 0 ? rawQuality : 'maj';
}

function sanitizeQualityForFileName(quality: string): string {
  const compact = quality.trim().replace(/\s+/g, '');
  const sanitized = compact
    .replace(/#/g, '_')
    .replace(/[()/+-]/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return sanitized.length > 0 ? sanitized.toLowerCase() : 'custom';
}

function formatShapeSnippet(rootString: number, offsets: ExportOffset[]): string {
  const offsetLines = offsets
    .map((offsetDef) => {
      return `        {"string": ${offsetDef.string}, "offset": ${offsetDef.offset}, "interval": ${JSON.stringify(offsetDef.interval)}}`;
    })
    .join(',\n');

  return [
    '    {',
    `      "rootString": ${rootString},`,
    '      "offsets": [',
    offsetLines,
    '      ]',
    '    }',
  ].join('\n');
}

function buildSaveChordExportData(quality: string, frets: FretPosition[]): SaveChordExportData {
  const candidateRootPositions = frets.filter((position) => position.interval === '1');
  const anchor = [...(candidateRootPositions.length > 0 ? candidateRootPositions : frets)].sort((a, b) => {
    if (a.stringIndex !== b.stringIndex) {
      return b.stringIndex - a.stringIndex;
    }

    return a.fret - b.fret;
  })[0];

  const rootString = anchor?.stringIndex ?? 5;
  const baseFret = anchor?.fret ?? 0;

  const offsets = [...frets]
    .map((position) => ({
      string: position.stringIndex,
      offset: position.fret - baseFret,
      interval: position.interval ?? '1',
    }))
    .sort((a, b) => {
      if (a.string !== b.string) {
        return a.string - b.string;
      }

      return a.offset - b.offset;
    });

  const expectedIntervals = Array.from(new Set(offsets.map((offsetDef) => offsetDef.interval)))
    .sort((a, b) => {
      const rankA = INTERVAL_RANK[a] ?? Number.MAX_SAFE_INTEGER;
      const rankB = INTERVAL_RANK[b] ?? Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) {
        return rankA - rankB;
      }

      return a.localeCompare(b);
    });

  const fileBaseName = sanitizeQualityForFileName(quality);
  const startsWithDigit = /^\d/.test(fileBaseName);
  const fileName = `${fileBaseName}.ts`;
  const exportConstName = `${startsWithDigit ? `q_${fileBaseName}` : fileBaseName}Chord`;
  const shapeSnippet = formatShapeSnippet(rootString, offsets);
  const expectedIntervalLines = expectedIntervals
    .map((interval) => `    ${JSON.stringify(interval)}`)
    .join(',\n');

  const fullFileTemplate = [
    "import type { ChordDefinition } from '../chordLibrary.types';",
    '',
    `export const ${exportConstName}: ChordDefinition = {`,
    `  "quality": ${JSON.stringify(quality)},`,
    '  "shapes": [',
    shapeSnippet,
    '  ],',
    '  "expectedIntervals": [',
    expectedIntervalLines,
    '  ]',
    '};',
  ].join('\n');

  return {
    quality,
    fileName,
    exportConstName,
    fullFileTemplate,
    shapeSnippet,
  };
}

const SandboxMode: React.FC = () => {
  const {
    clickedFrets,
    handleFretClick,
    setChordShape,
    clearSelection,
    analyzedChords,
    selectedChordIndex,
    setSelectedChordIndex,
    activePitches,
    setClickedFrets,
    oneNotePerString,
    setOneNotePerString
  } = useSandbox();

  const { history, addHistory, clearHistory } = useHistory<FretPosition[]>('sandboxHistory');
  const [keyConstraint] = useGlobalKeyConstraint('C');
  const keyPitchClass = useMemo(() => getKeySignatureInfo(keyConstraint).pitchClass, [keyConstraint]);

  const [search, setSearch] = useState(() => readSessionString(SANDBOX_SEARCH_KEY, ''));
  const chordLibraryRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveChordExport, setSaveChordExport] = useState<SaveChordExportData | null>(null);
  const [copiedTarget, setCopiedTarget] = useState<'full' | 'shape' | null>(null);

  const STRING_NAMES: Record<number, string> = {
    5: "Str 6E",
    4: "Str 5A",
    3: "Str 4D",
    2: "Str 3G",
    1: "Str 2B",
    0: "Str 1e"
  };

  useEffect(() => {
    writeSessionString(SANDBOX_SEARCH_KEY, search);
  }, [search]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useLayoutEffect(() => {
    if (!chordLibraryRef.current) {
      return;
    }

    return restoreScrollTopWithRetries(
      chordLibraryRef.current,
      readSessionNumber(SANDBOX_LIBRARY_SCROLL_KEY, 0),
      {
        maxFrames: 72,
        stableFrames: 3,
      },
    );
  }, []);

  useEffect(() => {
    const handleUrlState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab')?.toLowerCase();
      if (tab === 'sandbox') {
        const chordId = params.get('chordId');
        const quality = params.get('quality');
        const rootString = params.get('rootString');
        const rootVoicing = params.get('rootVoicing');
        const shapeIndex = params.get('shapeIndex');
        const fretOffset = params.get('fretOffset');

        const parsedChordId = parseChordDefinitionId(chordId);
        let definition = parsedChordId
          ? CHORD_DICTIONARY[parsedChordId.dictionaryIndex]
          : undefined;

        if (definition && definition.quality !== parsedChordId?.quality) {
          definition = undefined;
        }

        if (!definition && quality) {
          definition = CHORD_DICTIONARY.find((candidate) => candidate.quality === quality);
        }

        if (definition) {
          const parsedRootString = Number.parseInt(rootString ?? '', 10);
          const parsedShapeIndex = Number.parseInt(shapeIndex ?? '', 10);
          const parsedFretOffset = Number.parseInt(fretOffset ?? '', 10);

          const hasRootString = Number.isFinite(parsedRootString);
          const hasShapeIndex = Number.isFinite(parsedShapeIndex);
          const hasFretOffset = Number.isFinite(parsedFretOffset);

          let shape = hasShapeIndex
            ? definition.shapes[parsedShapeIndex]
            : undefined;

          if (shape && hasRootString && shape.rootString !== parsedRootString) {
            shape = undefined;
          }

          if (!shape && hasRootString && rootVoicing) {
            shape = getRootStringShapeOptions(definition, parsedRootString)
              .find((option) => option.rootVoicing === rootVoicing)
              ?.shape;
          }

          if (!shape && hasRootString) {
            shape = definition.shapes.find((candidate) => candidate.rootString === parsedRootString);
          }

          if (!shape && rootVoicing) {
            const voicingInfo = getDefinitionRootVoicings(definition).find(
              (candidate) => candidate.rootVoicing === rootVoicing,
            );
            shape = voicingInfo ? definition.shapes[voicingInfo.shapeIndex] : undefined;
          }

          if (shape) {
            if (hasFretOffset) {
              setChordShape(definition, shape, parsedFretOffset);
            } else {
              setChordShape(definition, shape);
            }
          }

          // Clear parameters so it doesn't get sticky if user navigates tabs
          window.history.replaceState({}, '', '?tab=sandbox');
        }
      }
    };
    
    handleUrlState();
    window.addEventListener('popstate', handleUrlState);
    return () => window.removeEventListener('popstate', handleUrlState);
  }, [setChordShape]);

  const orderedChordEntries = useMemo(() => buildOrderedChordEntries(CHORD_DICTIONARY), []);

  const renderRootVoicingLabel = (rootString: number, rootVoicing: string) => {
    const parts = buildRootVoicingDisplayParts(rootString, rootVoicing);
    return (
      <>
        {parts.baseLabel}
        {parts.voicingLabel ? <span className="ml-1 text-[9px] align-baseline font-extrabold">{parts.voicingLabel}</span> : null}
      </>
    );
  };

  const copyToClipboard = async (text: string, target: 'full' | 'shape') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTarget(target);
      return;
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      setCopiedTarget(target);
    }
  };

  const filteredChords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return orderedChordEntries;
    }

    return orderedChordEntries.filter(({ definition }) => definition.quality.toLowerCase().includes(query));
  }, [orderedChordEntries, search]);

  const handleChordLibraryScroll = (event: React.UIEvent<HTMLDivElement>) => {
    writeSessionNumber(SANDBOX_LIBRARY_SCROLL_KEY, event.currentTarget.scrollTop);
  };

  const markers: FretMarker[] = clickedFrets.map(p => ({
    stringIndex: p.stringIndex,
    fret: p.fret,
      markerClass: `scale-100 ${p.interval ? getIntervalColor(p.interval) : 'bg-blue-500 text-white'} ${p.interval === '1' ? 'border-2 border-slate-900' : ''} shadow-sm`,
    label: p.interval || undefined
  }));

  const getGhostClass = () => {
    return "scale-0 group-hover:scale-75 group-hover:bg-blue-300/50 transition-all";
  };

  const highestPitch = activePitches.length > 0 ? Math.max(...activePitches) : 0;
  const SHEET_MAX_PITCH = 77; // F5 - begin zooming only above this pitch
  const zoomSemitones = highestPitch > SHEET_MAX_PITCH ? highestPitch - SHEET_MAX_PITCH : 0;

  const useFlatsForLabels = useMemo(() => {
    const selectedChordName = analyzedChords[selectedChordIndex]?.name ?? '';
    const rootAccidental = selectedChordName.match(/^([A-G])([b#]?)/)?.[2];

    if (rootAccidental === '#') {
      return false;
    }
    if (rootAccidental === 'b') {
      return true;
    }

    const intervals = clickedFrets.map(p => p.interval ?? '');
    const hasSharpIntervals = intervals.some(interval => interval.includes('#'));
    const hasFlatIntervals = intervals.some(interval => interval.includes('b'));

    if (hasSharpIntervals && !hasFlatIntervals) {
      return false;
    }
    if (hasFlatIntervals && !hasSharpIntervals) {
      return true;
    }

    return getKeySignatureInfo(keyConstraint).useFlats;
  }, [analyzedChords, selectedChordIndex, clickedFrets, keyConstraint]);

  // Pre-calculate notes correctly ordered by pitch for the bottom row
  const sortedNotes = [...clickedFrets]
    .map(p => {
      const pitch = p.stringIndex >= 0 ? TUNING[p.stringIndex] + p.fret : 0;
      return { ...p, pitch, ...getNoteName(pitch, useFlatsForLabels) };
    })
    .sort((a, b) => a.pitch - b.pitch);

  const openSelectedChordInGallery = (event: React.MouseEvent<HTMLButtonElement>) => {
    const chord = analyzedChords[selectedChordIndex];
    if (!chord) {
      return;
    }

    const namePart = chord.name.split('/')[0].trim();
    const match = namePart.match(/^([A-G][b#]?)(.*)$/);
    if (!match) {
      return;
    }

    const key = match[1];
    const galleryQuality = match[2].trim();

    const galleryTarget = resolveGalleryTargetFromSandbox(orderedChordEntries, galleryQuality, clickedFrets);

    const gallerySearch = buildSearchWithUpdates({
      tab: 'gallery',
      key,
      scrollTo: galleryTarget.quality,
      scrollToId: galleryTarget.chordId ?? null,
    });

    navigateFromClick(event, gallerySearch);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-white text-slate-900 font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-72 h-full overflow-y-auto bg-slate-50 border-r border-slate-200 flex flex-col p-6 gap-8 shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">
            Fret<span className="text-slate-400">Sandbox</span>
          </h1>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Explorer Mode
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
             <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Search Chord Shape</span>
             <input 
               ref={searchInputRef}
               type="text" 
               className="w-full mt-2 p-2 border border-slate-300 rounded focus:border-blue-500 outline-none" 
               value={search} 
               onChange={e => setSearch(e.target.value)} 
               placeholder="e.g. maj7" 
             />
          </div>

          <label className="flex items-center justify-between group py-2">
            <span className="text-xs font-bold uppercase text-slate-500 group-hover:text-slate-800 transition-colors">1 Note / String</span>
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={oneNotePerString} onChange={e => setOneNotePerString(e.target.checked)} />
              <div className={`w-10 h-6 rounded-full transition-colors ${oneNotePerString ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${oneNotePerString ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
          </label>

          <div
            ref={chordLibraryRef}
            onScroll={handleChordLibraryScroll}
            className="h-[300px] overflow-y-auto border border-slate-200 bg-white rounded flex flex-col"
          >
            {filteredChords.map(({ definition, chordId }) => (
              <div key={chordId} className="border-b border-slate-100 last:border-0 p-2">
                <div className="font-bold text-sm mb-1">{definition.quality}</div>
                <div className="flex gap-1 justify-between">
                  {[5, 4, 3].map((rootString) => {
                    const rootStringOptions = getRootStringShapeOptions(definition, rootString);

                    if (rootStringOptions.length === 0) {
                      return (
                        <button
                          key={`${chordId}-${rootString}`}
                          disabled
                          title="none found"
                          className="flex-1 text-[10px] bg-slate-50 text-slate-300 px-1 py-1 rounded border border-slate-100 cursor-not-allowed text-center whitespace-nowrap"
                        >
                          {STRING_NAMES[rootString] || `Str ${rootString + 1}`}
                        </button>
                      );
                    }

                    return (
                      <div key={`${chordId}-${rootString}`} className="flex-1 flex flex-col gap-1">
                        {rootStringOptions.map((option) => (
                          <button
                            key={`${chordId}-${rootString}-${option.rootVoicing}-${option.shapeIndex}`}
                            onClick={() => {
                              const pinnedRootFret = resolveRootFretForShape(keyPitchClass, option.shape);
                              const newPositions = setChordShape(definition, option.shape, pinnedRootFret);
                              const rootLabel = buildRootVoicingPlainLabel(option.rootString, option.rootVoicing);
                              addHistory(`${definition.quality} (${rootLabel})`, newPositions);
                            }}
                            title={`Pin to key ${keyConstraint}: ${option.rootVoicing}`}
                            className="w-full text-[10px] bg-slate-100 hover:bg-blue-100 text-slate-700 px-1 py-1 rounded text-center whitespace-nowrap"
                          >
                            {renderRootVoicingLabel(option.rootString, option.rootVoicing)}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
              onClick={clearSelection}
              className="text-left text-xs font-bold text-red-600 hover:text-red-800 hover:bg-red-50 py-2 px-3 -mx-3 rounded transition-colors uppercase tracking-wider flex items-center justify-between group"
          >
              <span>Clear Selection</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">×</span>
          </button>
        </div>

      </aside>

      <main className="flex-1 h-full overflow-y-auto flex flex-col items-center justify-center py-1 p-4 lg:p-10 lg:py-1 gap-1 min-w-0">
         
         <div className="flex flex-row items-center justify-center min-h-40 w-full gap-8">
            <div className="flex justify-center scale-110 lg:scale-125 origin-center min-w-[200px]">
              <SheetMusic 
                notes={activePitches} 
                colors={clickedFrets.map(p => p.interval ? getIntervalHexColor(p.interval) : '#2563eb')} 
                gameMode="SANDBOX" 
                useFlats={useFlatsForLabels}
                zoomSemitones={zoomSemitones}
              />
            </div>

            <div className="flex flex-col items-center min-h-[96px] max-h-[140px] px-2 w-[340px]">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 shrink-0">Detected Chords</h2>
              {analyzedChords.length > 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 w-full h-full overflow-hidden">
                  <div className="flex flex-row items-center justify-start gap-2 overflow-x-auto w-full max-h-[85px] custom-scrollbar pb-1 px-1">
                    {analyzedChords.map((chord, i) => (
                      <button 
                        key={i} 
                        onClick={() => setSelectedChordIndex(i)}
                        className={`text-sm font-bold px-3 py-2 rounded transition-colors break-words whitespace-nowrap min-w-max max-w-[200px] ${selectedChordIndex === i ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-100 text-slate-800 hover:bg-blue-200'}`}
                      >
                        {chord.name}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => {
                        const selected = analyzedChords[selectedChordIndex];
                        if (!selected) {
                          return;
                        }

                        const quality = parseDetectedChordQuality(selected.name);
                        if (!quality) {
                          return;
                        }

                        addHistory(selected.name, clickedFrets);
                        setCopiedTarget(null);
                        setSaveChordExport(buildSaveChordExportData(quality, clickedFrets));
                        setIsSaveModalOpen(true);
                      }}
                      className="text-[10px] px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded uppercase tracking-widest transition"
                    >
                      Save Chord
                    </button>
                    <button 
                      onClick={openSelectedChordInGallery}
                      onAuxClick={openSelectedChordInGallery}
                      onMouseDown={preventMiddleMouseDefault}
                      className="text-[10px] px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded uppercase tracking-widest transition"
                    >
                      See In Gallery
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 opacity-50 text-slate-400">
                  <span className="text-2xl border border-dashed border-slate-300 font-bold px-4 py-2 rounded">
                    Unknown
                  </span>
                  <button 
                    disabled
                    className="text-[10px] mt-2 px-3 py-1 bg-slate-300 text-slate-500 font-bold rounded uppercase tracking-widest cursor-not-allowed"
                  >
                     Save Chord
                  </button>
                </div>
              )}
            </div>
         </div>

         {/* Fretboard */}
         <Fretboard
           numFrets={25}
           markers={markers}
           onFretClick={handleFretClick}
           getGhostClass={getGhostClass}
         />

         {/* Spacer to match Trainer flex distribution */}
         <div className="mt-0 opacity-100 flex flex-row gap-2 justify-center py-0 flex-wrap">
           {sortedNotes.length > 0 ? (
             sortedNotes.map((n, i) => {
               const intervalClass = n.interval ? getIntervalColor(n.interval) : 'bg-blue-500 text-white';
               return (
               <div 
                 key={`${n.stringIndex}-${n.fret}-${i}`}
                 className={`px-3 py-1 font-bold text-sm tracking-wide rounded shadow-sm flex gap-0.5 items-center ${intervalClass}`}
               >
                 <span className="mr-2">{n.note}</span>
                 <span className="text-[10px] opacity-70 mb-1">{n.octave}</span>
               </div>
             )})
           ) : (
             <div className="pointer-events-none opacity-0 select-none px-3 py-1 text-xl">_</div>
           )}
         </div>
      </main>

      {/* RIGHT SIDEBAR - HISTORY */}
      <aside className="w-full lg:w-72 h-full overflow-y-auto bg-slate-50 border-l border-slate-200 flex flex-col shrink-0 p-6">
        <HistoryPanel history={history} onClear={clearHistory} onRestore={(state) => setClickedFrets(state)} />
        <LegendPanel />
      </aside>

      {isSaveModalOpen && saveChordExport ? (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          onClick={() => setIsSaveModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-chord-title"
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg border border-slate-300 bg-white shadow-xl p-5 select-text"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 id="save-chord-title" className="text-sm font-black uppercase tracking-wider text-slate-800">
                Save Chord Export
              </h2>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-5">
              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  Paste the full template into <span className="font-bold">src/utils/chords/{saveChordExport.fileName}</span> to add this chord definition.
                </p>
                <p>
                  Quality detected: <span className="font-bold">{saveChordExport.quality}</span>
                  {' | '}Export const: <span className="font-bold">{saveChordExport.exportConstName}</span>
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Data-Driven Consumers</div>
                <ul className="text-xs text-slate-600 list-disc pl-5 space-y-1">
                  {CHORD_CONSUMER_NOTES.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Full File Template</div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(saveChordExport.fullFileTemplate, 'full')}
                    className="text-[10px] px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded uppercase tracking-widest transition"
                  >
                    {copiedTarget === 'full' ? 'Copied' : 'Copy to Clipboard'}
                  </button>
                </div>
                <pre className="text-[11px] leading-relaxed bg-slate-950 text-slate-100 rounded p-3 overflow-x-auto border border-slate-700 select-text cursor-text">
{saveChordExport.fullFileTemplate}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Shape Snippet (for existing file)</div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(saveChordExport.shapeSnippet, 'shape')}
                    className="text-[10px] px-3 py-1 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded uppercase tracking-widest transition"
                  >
                    {copiedTarget === 'shape' ? 'Copied' : 'Copy to Clipboard'}
                  </button>
                </div>
                <pre className="text-[11px] leading-relaxed bg-slate-100 text-slate-900 rounded p-3 overflow-x-auto border border-slate-200 select-text cursor-text">
{saveChordExport.shapeSnippet}
                </pre>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SandboxMode;
