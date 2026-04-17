import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { CHORD_DICTIONARY } from '../utils/chordLibrary';
import { getIntervalHexColor, TUNING, getNoteNameFromPitchClass, getKeySignatureInfo, KEY_CONSTRAINT_OPTIONS, keySignatureUsesFlats } from '../utils/musicTheory';
import { DIATONIC_INTERVALS, CHORD_QUALITY_DIATONIC_MAP } from '../utils/diatonic';
import { getGalleryOrderedChordDefinitions } from '../utils/chordOrdering';
import { flashTableRowOverlay, scrollToTargetAndFlash } from '../utils/scrollFeedback';
import { buildSearchWithUpdates, navigateFromClick } from '../utils/queryNavigation';
import {
  readSessionBoolean,
  readSessionJson,
  readSessionNumber,
  restoreScrollTopWithRetries,
  writeSessionBoolean,
  writeSessionJson,
  writeSessionNumber,
} from '../utils/viewState';
import SheetMusic from './SheetMusic';
import { LegendPanel } from './LegendPanel';

const GALLERY_MAIN_SCROLL_KEY = 'fret-gallery-main-scroll';
const GALLERY_LIST_SCROLL_KEY = 'fret-gallery-list-scroll';
const GALLERY_SHOW_DIATONIC_KEY = 'fret-gallery-show-diatonic';
const GALLERY_SELECTED_DIATONIC_KEY = 'fret-gallery-selected-diatonic';

interface GalleryModeProps {
  keyConstraint: string;
  setKeyConstraint: (k: string) => void;
  useGalleryColors: boolean;
}

export const GalleryMode: React.FC<GalleryModeProps> = ({ keyConstraint, setKeyConstraint, useGalleryColors }) => {
  const [showDiatonic, setShowDiatonic] = useState(() => readSessionBoolean(GALLERY_SHOW_DIATONIC_KEY, true));
  const [selectedDiatonic, setSelectedDiatonic] = useState<Record<string, string>>(
    () => readSessionJson<Record<string, string>>(GALLERY_SELECTED_DIATONIC_KEY, {}),
  );
  const scrollContainerRef = useRef<HTMLElement>(null);
  const chordListRef = useRef<HTMLDivElement>(null);

  const orderedChordDefs = useMemo(() => getGalleryOrderedChordDefinitions(CHORD_DICTIONARY), []);
  const rootObj = useMemo(() => getKeySignatureInfo(keyConstraint), [keyConstraint]);
  const notationUsesFlats = useMemo(() => keySignatureUsesFlats(rootObj.renderableKeyName), [rootObj.renderableKeyName]);
  const stringShapes = [5, 4, 3];

  const scrollToQuality = (quality: string) => {
    if (!scrollContainerRef.current) {
      return;
    }
    const rows = Array.from(scrollContainerRef.current.querySelectorAll('tr[data-quality]'));
    const targetRow = rows.find((row) => (row as HTMLElement).dataset.quality === quality);
    if (targetRow) {
      scrollToTargetAndFlash({
        container: scrollContainerRef.current,
        target: targetRow as HTMLElement,
        flashTarget: (target) => flashTableRowOverlay(target, { thicknessPx: 5, holdMs: 240 }),
      });
    }
  };

  useEffect(() => {
    writeSessionBoolean(GALLERY_SHOW_DIATONIC_KEY, showDiatonic);
  }, [showDiatonic]);

  useEffect(() => {
    writeSessionJson(GALLERY_SELECTED_DIATONIC_KEY, selectedDiatonic);
  }, [selectedDiatonic]);

  // Gallery uses a large table with sticky cells and VexFlow previews, so scrollHeight can
  // stabilize after first paint. Use retry-based restoration instead of one-shot assignment.
  useLayoutEffect(() => {
    const cleanupFns: Array<() => void> = [];

    if (chordListRef.current) {
      cleanupFns.push(
        restoreScrollTopWithRetries(chordListRef.current, readSessionNumber(GALLERY_LIST_SCROLL_KEY, 0), {
          maxFrames: 72,
          stableFrames: 3,
        }),
      );
    }

    if (scrollContainerRef.current) {
      cleanupFns.push(
        restoreScrollTopWithRetries(scrollContainerRef.current, readSessionNumber(GALLERY_MAIN_SCROLL_KEY, 0), {
          maxFrames: 180,
          stableFrames: 4,
        }),
      );
    }

    return () => {
      cleanupFns.forEach((cleanup) => cleanup());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (scrollContainerRef.current) {
        writeSessionNumber(GALLERY_MAIN_SCROLL_KEY, scrollContainerRef.current.scrollTop);
      }
      if (chordListRef.current) {
        writeSessionNumber(GALLERY_LIST_SCROLL_KEY, chordListRef.current.scrollTop);
      }
    };
  }, []);

  useEffect(() => {
    const handleUrlState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab')?.toLowerCase();
      if (tab !== 'gallery') {
        return;
      }

      const key = params.get('key');
      if (key && KEY_CONSTRAINT_OPTIONS.includes(key)) {
        setKeyConstraint(key);
      }

      const scrollTo = params.get('scrollTo');
      if (scrollTo) {
        scrollToQuality(scrollTo);
        params.delete('scrollTo');
        window.history.replaceState({}, '', `?${params.toString()}`);
      }
    };

    handleUrlState();
    window.addEventListener('popstate', handleUrlState);
    return () => {
      window.removeEventListener('popstate', handleUrlState);
    };
  }, [setKeyConstraint]);

  const handleMainScroll = (e: React.UIEvent<HTMLElement>) => {
    writeSessionNumber(GALLERY_MAIN_SCROLL_KEY, e.currentTarget.scrollTop);
  };

  const handleChordListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    writeSessionNumber(GALLERY_LIST_SCROLL_KEY, e.currentTarget.scrollTop);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-white text-slate-900 font-sans select-none">
      <aside className="w-full lg:w-72 h-full overflow-y-auto bg-slate-50 border-r border-slate-200 flex flex-col p-6 gap-8 shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">
            Chord<span className="text-slate-400">Gallery</span>
          </h1>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Visual Matrix
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <label className="text-xs font-bold uppercase text-slate-500 tracking-wider cursor-pointer select-none" htmlFor="diatonicToggle">
            Show Available Diatonic Chords
          </label>
          <input
            type="checkbox"
            id="diatonicToggle"
            checked={showDiatonic}
            onChange={(e) => setShowDiatonic(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer"
          />
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Chord List</div>
          <div
            ref={chordListRef}
            onScroll={handleChordListScroll}
            className="max-h-[420px] overflow-y-auto border border-slate-200 rounded bg-white p-1 flex flex-col gap-1"
          >
            {orderedChordDefs.map((def) => (
              <button
                key={def.quality}
                onClick={() => scrollToQuality(def.quality)}
                className="text-left text-xs font-bold px-2 py-1 rounded hover:bg-blue-50 text-slate-700"
              >
                {def.quality}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main
        ref={scrollContainerRef}
        onScroll={handleMainScroll}
        className="flex-1 h-full overflow-y-auto py-1 p-4 lg:p-8 min-w-0 bg-slate-100/50"
      >
        {/*
          IMPORTANT: keep vertical scrolling on <main> only.
          MDN overflow behavior: when overflow-x is not visible/clip, overflow-y:visible
          computes to auto, so this wrapper can become an unintended vertical scroll container.
          Also keep this wrapper non-shrinking; in flex layouts, shrink+overflow-y:hidden can
          clip rows and make the expected gallery scrollbar appear "gone".
        */}
        <div className="w-full overflow-x-auto overflow-y-hidden flex-none bg-white rounded border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 shadow-[1px_0_0_rgba(226,232,240,1)]">Quality</th>
                {stringShapes.map((str) => (
                  <th key={str} className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                    Str {str + 1} Root
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orderedChordDefs.map((def) => {
                const diatonicOptions = CHORD_QUALITY_DIATONIC_MAP[def.quality] || [];
                const hasDiatonic = diatonicOptions.length > 0;
                const activeDiatonic = selectedDiatonic[def.quality] || diatonicOptions[0];
                const offsetFromKey = showDiatonic && hasDiatonic && DIATONIC_INTERVALS[activeDiatonic] !== undefined
                  ? DIATONIC_INTERVALS[activeDiatonic]
                  : 0;

                const actualRootPitch = (rootObj.pitchClass + offsetFromKey) % 12;
                const actualRootName = getNoteNameFromPitchClass(actualRootPitch, notationUsesFlats);

                return (
                  <tr key={def.quality} data-quality={def.quality} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-700 sticky left-0 z-10 shadow-[1px_0_0_rgba(226,232,240,1)] bg-white align-middle">
                      <div className="flex flex-col gap-1">
                        <span className="whitespace-nowrap">
                          {showDiatonic && hasDiatonic ? <span className="text-blue-600 mr-1">{actualRootName}</span> : null}
                          {def.quality}
                        </span>

                        {showDiatonic && (
                          diatonicOptions.length > 1 ? (
                            <div className="flex flex-col gap-1 mt-1">
                              {diatonicOptions.map((d) => (
                                <button
                                  key={d}
                                  onClick={() => setSelectedDiatonic((prev) => ({ ...prev, [def.quality]: d }))}
                                  className={`text-[10px] font-bold tracking-widest px-2 py-1 rounded border transition-colors ${activeDiatonic === d ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-blue-50'}`}
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
                          ) : diatonicOptions.length === 1 ? (
                            <span className="text-[10px] tracking-widest text-slate-500 font-bold border border-slate-200 bg-slate-50 px-2 flex items-center justify-center py-1 rounded mt-1">
                              {diatonicOptions[0]}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic mt-1 py-1 flex items-center">Non-diatonic</span>
                          )
                        )}
                      </div>
                    </td>
                    {stringShapes.map((str) => {
                      const shape = def.shapes.find((s) => s.rootString === str);
                      if (!shape) {
                        return <td key={str} className="p-4 text-center text-slate-300">-</td>;
                      }

                      const stringOpenPitch = TUNING[shape.rootString];
                      let rootFret = (actualRootPitch - (stringOpenPitch % 12) + 12) % 12;

                      let minFretInShape = Math.min(...shape.offsets.map((o) => rootFret + o.offset));
                      while (minFretInShape < 0) {
                        rootFret += 12;
                        minFretInShape += 12;
                      }

                      if (rootFret <= 2) {
                        rootFret += 12;
                      }

                      const pitches = shape.offsets.map((o) => TUNING[o.string] + rootFret + o.offset);
                      const colors = shape.offsets.map((o) => useGalleryColors ? getIntervalHexColor(o.interval || '1') : '#111111');

                      const highestPitch = pitches.length > 0 ? Math.max(...pitches) : 0;
                      const zoomSemitones = highestPitch > 77 ? highestPitch - 77 : 0;

                      const sandboxSearch = buildSearchWithUpdates({
                        tab: 'sandbox',
                        quality: def.quality,
                        rootString: str.toString(),
                        fretOffset: rootFret.toString(),
                        key: null,
                      });

                      const handleCellClick = (event: React.MouseEvent<HTMLButtonElement>) => {
                        navigateFromClick(event, sandboxSearch);
                      };

                      return (
                        <td key={str} className="p-2 text-center align-middle transform scale-90 origin-center">
                          <button
                            type="button"
                            onClick={handleCellClick}
                            className="w-full cursor-pointer border border-transparent hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm rounded-lg p-2 transition-all"
                            title={`Open ${actualRootName} ${def.quality} (String ${str + 1}) in Sandbox`}
                          >
                            <SheetMusic
                              notes={pitches}
                              colors={colors}
                              gameMode="SANDBOX"
                              useFlats={notationUsesFlats}
                              keySignature={rootObj.renderableKeyName}
                              suppressDiatonicAccidentals
                              zoomSemitones={zoomSemitones}
                            />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      <aside className="w-full lg:w-72 h-full overflow-y-auto bg-slate-50 border-l border-slate-200 flex flex-col shrink-0 p-6">
        <LegendPanel variant="large" />
      </aside>
    </div>
  );
};

export default GalleryMode;