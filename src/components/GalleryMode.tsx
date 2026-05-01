import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { CHORD_DICTIONARY } from '../utils/chordLibrary';
import { getNoteNameFromPitchClass, getKeySignatureInfo, KEY_CONSTRAINT_OPTIONS, keySignatureUsesFlats } from '../utils/musicTheory';
import { DIATONIC_INTERVALS, CHORD_QUALITY_DIATONIC_MAP } from '../utils/diatonic';
import { flashElementOutline, flashTableRowOverlay, scrollToTargetsAndFlashTogether } from '../utils/scrollFeedback';
import { buildSearchWithUpdates, navigateFromClick, preventMiddleMouseDefault } from '../utils/queryNavigation';
import { buildShapeSheetPreview } from '../utils/chordShapeRendering';
import {
  buildShapeSelectionStateKey,
  getRootStringShapeOptions,
} from '../utils/chordVoicing';
import { buildOrderedChordEntries, buildQualityDisplayLabelMap } from '../utils/chordEntries';
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
const GALLERY_SELECTED_VOICING_KEY = 'fret-gallery-selected-voicing';

interface GalleryModeProps {
  keyConstraint: string;
  setKeyConstraint: (k: string) => void;
  useGalleryColors: boolean;
}

interface GalleryDeepLinkTarget {
  quality: string;
  chordId?: string;
  rootString?: number;
  rootVoicing?: string;
  shapeIndex?: number;
}

export const GalleryMode: React.FC<GalleryModeProps> = ({ keyConstraint, setKeyConstraint, useGalleryColors }) => {
  const [showDiatonic, setShowDiatonic] = useState(() => readSessionBoolean(GALLERY_SHOW_DIATONIC_KEY, true));
  const [selectedDiatonic, setSelectedDiatonic] = useState<Record<string, string>>(
    () => readSessionJson<Record<string, string>>(GALLERY_SELECTED_DIATONIC_KEY, {}),
  );
  const [selectedVoicingByRoot, setSelectedVoicingByRoot] = useState<Record<string, string>>(
    () => readSessionJson<Record<string, string>>(GALLERY_SELECTED_VOICING_KEY, {}),
  );
  const [pendingDeepLinkTarget, setPendingDeepLinkTarget] = useState<GalleryDeepLinkTarget | null>(null);
  const scrollContainerRef = useRef<HTMLElement>(null);
  const chordListRef = useRef<HTMLDivElement>(null);

  const orderedChordEntries = useMemo(() => buildOrderedChordEntries(CHORD_DICTIONARY), []);
  const qualityDisplayLabelMap = useMemo(() => buildQualityDisplayLabelMap(orderedChordEntries), [orderedChordEntries]);
  const rootObj = useMemo(() => getKeySignatureInfo(keyConstraint), [keyConstraint]);
  const notationUsesFlats = useMemo(() => keySignatureUsesFlats(rootObj.renderableKeyName), [rootObj.renderableKeyName]);
  const stringShapes = [5, 4, 3];

  const getDisplayQuality = (chordId: string, quality: string): string => {
    return qualityDisplayLabelMap.get(chordId) ?? quality;
  };

  const scrollToQuality = useMemo(() => {
    return (target: GalleryDeepLinkTarget): boolean => {
      if (!scrollContainerRef.current) {
        return false;
      }

      const { quality, chordId, rootString, rootVoicing, shapeIndex } = target;
      const listContainer = chordListRef.current;
      const listTargetButton = listContainer
        ? Array.from(
          listContainer.querySelectorAll<HTMLButtonElement>('button[data-chord-list-entry="gallery"]'),
        ).find((button) => {
          if (chordId) {
            return button.dataset.chordId === chordId;
          }

          return button.dataset.quality === quality;
        }) ?? null
        : null;

      const buildSynchronizedFlashTargets = (
        mainTarget: HTMLElement,
        mainFlashTarget: (targetElement: HTMLElement) => void,
      ) => {
        const flashTargets = [{
          container: scrollContainerRef.current as HTMLElement,
          target: mainTarget,
          flashTarget: mainFlashTarget,
        }];

        if (listContainer && listTargetButton) {
          flashTargets.push({
            container: listContainer,
            target: listTargetButton,
            flashTarget: (listTarget: HTMLElement) =>
              flashElementOutline(listTarget, { thicknessPx: 3, holdMs: 160 }),
          });
        }

        return flashTargets;
      };

      if (chordId && (rootString !== undefined || rootVoicing || shapeIndex !== undefined)) {
        const cellButtons = Array.from(
          scrollContainerRef.current.querySelectorAll<HTMLButtonElement>('button[data-scroll-cell="gallery"]'),
        );
        const targetCell = cellButtons.find((button) => {
          if (button.dataset.chordId !== chordId) {
            return false;
          }

          if (rootString !== undefined && Number(button.dataset.rootString) !== rootString) {
            return false;
          }

          if (rootVoicing && button.dataset.rootVoicing !== rootVoicing) {
            return false;
          }

          if (shapeIndex !== undefined && Number(button.dataset.shapeIndex) !== shapeIndex) {
            return false;
          }

          return true;
        });

        if (targetCell) {
          scrollToTargetsAndFlashTogether({
            targets: buildSynchronizedFlashTargets(targetCell, (flashTarget) =>
              flashElementOutline(flashTarget, { thicknessPx: 4 }),
            ),
          });
          return true;
        }
      }

      const rows = Array.from(scrollContainerRef.current.querySelectorAll('tr[data-quality]'));
      const targetRow = rows.find((row) => {
        const element = row as HTMLElement;
        if (chordId) {
          return element.dataset.chordId === chordId;
        }

        return element.dataset.quality === quality;
      });

      if (!targetRow) {
        return false;
      }

      scrollToTargetsAndFlashTogether({
        targets: buildSynchronizedFlashTargets(
          targetRow as HTMLElement,
          (rowTarget) => flashTableRowOverlay(rowTarget, { thicknessPx: 5, holdMs: 240 }),
        ),
      });

      return true;
    };
  }, []);

  useEffect(() => {
    if (!pendingDeepLinkTarget) {
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 24;

    // Deep links can arrive before the heavy table fully mounts/measures. Retry for a short
    // RAF window so we don't drop the request and silently fail navigation.
    const tryScroll = () => {
      if (cancelled) {
        return;
      }

      const didScroll = scrollToQuality(pendingDeepLinkTarget);
      if (didScroll) {
        setPendingDeepLinkTarget(null);
        return;
      }

      attempts += 1;
      if (attempts < maxAttempts) {
        window.requestAnimationFrame(tryScroll);
      }
    };

    tryScroll();

    return () => {
      cancelled = true;
    };
  }, [pendingDeepLinkTarget, scrollToQuality]);

  useEffect(() => {
    writeSessionBoolean(GALLERY_SHOW_DIATONIC_KEY, showDiatonic);
  }, [showDiatonic]);

  useEffect(() => {
    writeSessionJson(GALLERY_SELECTED_DIATONIC_KEY, selectedDiatonic);
  }, [selectedDiatonic]);

  useEffect(() => {
    writeSessionJson(GALLERY_SELECTED_VOICING_KEY, selectedVoicingByRoot);
  }, [selectedVoicingByRoot]);

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

  // Keep a final snapshot on unmount so fast tab changes do not lose latest offsets.
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
      const scrollToId = params.get('scrollToId');
      const scrollToRootStringToken = params.get('scrollToRootString');
      const parsedScrollToRootString = Number.parseInt(scrollToRootStringToken ?? '', 10);
      const scrollToRootString = Number.isFinite(parsedScrollToRootString)
        ? parsedScrollToRootString
        : undefined;
      const scrollToShapeIndexToken = params.get('scrollToShapeIndex');
      const parsedScrollToShapeIndex = Number.parseInt(scrollToShapeIndexToken ?? '', 10);
      const scrollToShapeIndex = Number.isFinite(parsedScrollToShapeIndex)
        ? parsedScrollToShapeIndex
        : undefined;
      const scrollToRootVoicing = params.get('scrollToRootVoicing') ?? undefined;
      if (scrollTo || scrollToId) {
        setPendingDeepLinkTarget({
          quality: scrollTo ?? '',
          chordId: scrollToId ?? undefined,
          rootString: scrollToRootString,
          rootVoicing: scrollToRootVoicing,
          shapeIndex: scrollToShapeIndex,
        });
        params.delete('scrollTo');
        params.delete('scrollToId');
        params.delete('scrollToRootString');
        params.delete('scrollToRootVoicing');
        params.delete('scrollToShapeIndex');
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
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-white text-slate-900 font-sans">
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
          <label className="text-xs font-bold uppercase text-slate-500 tracking-wider cursor-pointer" htmlFor="diatonicToggle">
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
            {orderedChordEntries.map(({ definition, chordId }) => (
              <button
                key={chordId}
                data-chord-list-entry="gallery"
                data-chord-id={chordId}
                data-quality={definition.quality}
                onClick={() => scrollToQuality({ quality: definition.quality, chordId })}
                className="text-left text-xs font-bold px-2 py-1 rounded hover:bg-blue-50 text-slate-700"
              >
                {getDisplayQuality(chordId, definition.quality)}
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
         CHORD GALLERY SPECIAL CASE (read before changing layout):
         1) Vertical scroll ownership must stay on <main>. If another ancestor/wrapper starts
           scrolling vertically, restore keys will target the wrong surface and appear broken.
         2) With overflow-x enabled, CSS can implicitly compute overflow-y to auto when left as
           visible; explicitly constrain y-overflow here to prevent accidental second scroller.
         3) This wrapper must be non-shrinking in a column flex layout. Shrinking plus hidden
           y-overflow can clip table rows and make the gallery scrollbar look "gone".
         4) Restore uses retry logic because row heights settle after first paint (sticky cells +
           notation rendering). One-shot timeout restore regresses on slower/colder renders.
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
              {orderedChordEntries.map(({ definition, chordId }) => {
                const diatonicOptions = CHORD_QUALITY_DIATONIC_MAP[definition.quality] || [];
                const hasDiatonic = diatonicOptions.length > 0;
                const activeDiatonic = selectedDiatonic[chordId] || diatonicOptions[0];
                const offsetFromKey = showDiatonic && hasDiatonic && DIATONIC_INTERVALS[activeDiatonic] !== undefined
                  ? DIATONIC_INTERVALS[activeDiatonic]
                  : 0;

                const actualRootPitch = (rootObj.pitchClass + offsetFromKey) % 12;
                const actualRootName = getNoteNameFromPitchClass(actualRootPitch, notationUsesFlats);

                return (
                  <tr key={chordId} data-quality={definition.quality} data-chord-id={chordId} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-700 sticky left-0 z-10 shadow-[1px_0_0_rgba(226,232,240,1)] bg-white align-middle">
                      <div className="flex flex-col gap-1">
                        <span className="whitespace-nowrap">
                          {showDiatonic && hasDiatonic ? <span className="text-blue-600 mr-1">{actualRootName}</span> : null}
                          {getDisplayQuality(chordId, definition.quality)}
                        </span>

                        {showDiatonic && (
                          diatonicOptions.length > 1 ? (
                            <div className="flex flex-col gap-1 mt-1">
                              {diatonicOptions.map((d) => (
                                <button
                                  key={d}
                                  onClick={() => setSelectedDiatonic((prev) => ({ ...prev, [chordId]: d }))}
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
                    {stringShapes.map((rootString) => {
                      const rootStringOptions = getRootStringShapeOptions(definition, rootString);
                      if (rootStringOptions.length === 0) {
                        return <td key={rootString} className="p-4 text-center text-slate-300">-</td>;
                      }

                      const voicingSelectionKey = buildShapeSelectionStateKey(chordId, rootString);
                      const selectedRootVoicing = selectedVoicingByRoot[voicingSelectionKey];
                      const activeOption = rootStringOptions.find((option) => option.rootVoicing === selectedRootVoicing) ?? rootStringOptions[0];
                      const preview = buildShapeSheetPreview(activeOption.shape, actualRootPitch, useGalleryColors);

                      const sandboxSearch = buildSearchWithUpdates({
                        tab: 'sandbox',
                        chordId,
                        quality: definition.quality,
                        scrollTo: definition.quality,
                        scrollToId: chordId,
                        focusLibrary: '1',
                        rootString: rootString.toString(),
                        rootVoicing: activeOption.rootVoicing,
                        shapeIndex: activeOption.shapeIndex.toString(),
                        fretOffset: preview.rootFret.toString(),
                        key: null,
                      });

                      const handleCellClick = (event: React.MouseEvent<HTMLButtonElement>) => {
                        navigateFromClick(event, sandboxSearch);
                      };

                      return (
                        <td key={rootString} className="p-2 text-center align-middle transform scale-90 origin-center">
                          {rootStringOptions.length > 1 ? (
                            <div className="mb-2 flex flex-wrap justify-center gap-1">
                              {rootStringOptions.map((option) => (
                                <button
                                  key={`${chordId}-${rootString}-${option.rootVoicing}-${option.shapeIndex}`}
                                  type="button"
                                  onClick={() => {
                                    setSelectedVoicingByRoot((prev) => ({
                                      ...prev,
                                      [voicingSelectionKey]: option.rootVoicing,
                                    }));
                                  }}
                                  className={`px-2 py-1 rounded border text-[10px] font-bold tracking-wider ${activeOption.rootVoicing === option.rootVoicing ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                                >
                                  {option.rootVoicing}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="mb-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                              {activeOption.rootVoicing}
                            </div>
                          )}

                          <button
                            type="button"
                            data-scroll-cell="gallery"
                            data-chord-id={chordId}
                            data-root-string={rootString.toString()}
                            data-root-voicing={activeOption.rootVoicing}
                            data-shape-index={activeOption.shapeIndex.toString()}
                            onClick={handleCellClick}
                            onAuxClick={handleCellClick}
                            onMouseDown={preventMiddleMouseDefault}
                            className="w-full cursor-pointer border border-transparent hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm rounded-lg p-2 transition-all"
                            title={`Open ${actualRootName} ${definition.quality} (${activeOption.rootVoicing}) on string ${rootString + 1} in Sandbox`}
                          >
                            <SheetMusic
                              notes={preview.notes}
                              colors={preview.colors}
                              gameMode="SANDBOX"
                              useFlats={notationUsesFlats}
                              keySignature={rootObj.renderableKeyName}
                              suppressDiatonicAccidentals
                              zoomSemitones={preview.zoomSemitones}
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