import React, { useEffect, useLayoutEffect, useMemo, useState, useRef } from 'react';
import SheetMusic from './SheetMusic';
import { LegendPanel } from './LegendPanel';
import { CHORD_DICTIONARY } from '../utils/chordLibrary';
import { CHORD_QUALITY_DIATONIC_MAP, DIATONIC_INTERVALS } from '../utils/diatonic';
import { getKeySignatureInfo, getNoteNameFromPitchClass, keySignatureUsesFlats } from '../utils/musicTheory';
import { flashElementOutline, scrollToTargetAndFlash } from '../utils/scrollFeedback';
import { buildSearchWithUpdates, navigateFromClick, preventMiddleMouseDefault } from '../utils/queryNavigation';
import { buildShapeSheetPreview, resolveRootFretForShape } from '../utils/chordShapeRendering';
import { buildFingeringOffsetArray } from '../utils/chordVoicing';
import { buildOrderedChordEntries, buildQualityDisplayLabelMap } from '../utils/chordEntries';
import {
  readSessionJson,
  readSessionNumber,
  readSessionString,
  restoreScrollTopWithRetries,
  writeSessionJson,
  writeSessionNumber,
  writeSessionString,
} from '../utils/viewState';
import { buildVisualArchetypeGroups, type VisualArchetypeGroup, type VisualArchetypeMember } from '../utils/visualArchetypes';

const DIATONIC_DISPLAY_ORDER = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'viio'];
const VISUAL_ROOT_FILTER_KEY = 'fret-visual-root-filter';
const VISUAL_CHORD_SEARCH_KEY = 'fret-visual-chord-search';
const VISUAL_SELECTED_DIATONIC_KEY = 'fret-visual-selected-diatonic';
const VISUAL_LIST_SCROLL_KEY = 'fret-visual-list-scroll';
const VISUAL_CONTENT_SCROLL_KEY = 'fret-visual-content-scroll';

type RootStringFilter = 'ALL' | 5 | 4 | 3 | 2;

function parseRootStringFilter(value: string | null): RootStringFilter {
  if (value === '5' || value === '4' || value === '3' || value === '2') {
    return Number(value) as RootStringFilter;
  }

  return 'ALL';
}

interface VisualArchetypeModeProps {
  keyConstraint: string;
  useGalleryColors: boolean;
}

function getGroupDiatonicOptions(group: VisualArchetypeGroup): string[] {
  const diatonicSet = new Set<string>();
  group.members.forEach((member) => {
    const options = CHORD_QUALITY_DIATONIC_MAP[member.quality] || [];
    options.forEach((option) => diatonicSet.add(option));
  });

  return Array.from(diatonicSet).sort((a, b) => {
    const aIdx = DIATONIC_DISPLAY_ORDER.indexOf(a);
    const bIdx = DIATONIC_DISPLAY_ORDER.indexOf(b);
    const aa = aIdx === -1 ? Number.MAX_SAFE_INTEGER : aIdx;
    const bb = bIdx === -1 ? Number.MAX_SAFE_INTEGER : bIdx;
    return aa - bb;
  });
}

function getActiveMemberForDiatonic(
  group: VisualArchetypeGroup,
  activeDiatonic: string | null,
  chordOrderMap: Map<string, number>,
) {
  let candidates = [...group.members];

  if (activeDiatonic) {
    const matched = candidates.filter((member) => (CHORD_QUALITY_DIATONIC_MAP[member.quality] || []).includes(activeDiatonic));
    if (matched.length > 0) {
      candidates = matched;
    }
  }

  candidates.sort((a, b) => {
    const aRank = chordOrderMap.get(a.chordId) ?? Number.MAX_SAFE_INTEGER;
    const bRank = chordOrderMap.get(b.chordId) ?? Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) {
      return aRank - bRank;
    }
    if (a.quality !== b.quality) {
      return a.quality.localeCompare(b.quality);
    }
    if (a.definitionIndex !== b.definitionIndex) {
      return a.definitionIndex - b.definitionIndex;
    }
    return a.shapeIndex - b.shapeIndex;
  });

  return candidates[0];
}

const VisualArchetypeMode: React.FC<VisualArchetypeModeProps> = ({ keyConstraint, useGalleryColors }) => {
  const [rootStringFilter, setRootStringFilter] = useState<RootStringFilter>(() => {
    return parseRootStringFilter(readSessionString(VISUAL_ROOT_FILTER_KEY, 'ALL'));
  });
  const [selectedDiatonicByGroup, setSelectedDiatonicByGroup] = useState<Record<string, string>>(
    () => readSessionJson<Record<string, string>>(VISUAL_SELECTED_DIATONIC_KEY, {}),
  );
  const [chordSearch, setChordSearch] = useState(() => readSessionString(VISUAL_CHORD_SEARCH_KEY, ''));
  const scrollContainerRef = useRef<HTMLElement>(null);
  const chordListRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const rootObj = useMemo(() => getKeySignatureInfo(keyConstraint), [keyConstraint]);
  const notationUsesFlats = useMemo(() => keySignatureUsesFlats(rootObj.renderableKeyName), [rootObj.renderableKeyName]);
  const groups = useMemo(() => buildVisualArchetypeGroups(CHORD_DICTIONARY), []);
  const orderedChordEntries = useMemo(() => buildOrderedChordEntries(CHORD_DICTIONARY), []);
  const qualityDisplayLabelMap = useMemo(() => buildQualityDisplayLabelMap(orderedChordEntries), [orderedChordEntries]);

  const chordOrderMap = useMemo(() => {
    return new Map(orderedChordEntries.map(({ chordId }, index) => [chordId, index]));
  }, [orderedChordEntries]);

  const getDisplayQuality = (chordId: string, quality: string): string => {
    return qualityDisplayLabelMap.get(chordId) ?? quality;
  };

  const filteredChordList = useMemo(() => {
    const query = chordSearch.trim().toLowerCase();
    if (!query) {
      return orderedChordEntries;
    }
    return orderedChordEntries.filter(({ definition }) => definition.quality.toLowerCase().includes(query));
  }, [orderedChordEntries, chordSearch]);

  const filteredGroups = useMemo(() => {
    if (rootStringFilter === 'ALL') {
      return groups;
    }
    return groups.filter((group) => group.rootString === rootStringFilter);
  }, [groups, rootStringFilter]);

  const availableChordIds = useMemo(() => {
    const chordIdSet = new Set<string>();
    filteredGroups.forEach((group) => {
      group.members.forEach((member) => chordIdSet.add(member.chordId));
    });
    return chordIdSet;
  }, [filteredGroups]);

  useEffect(() => {
    writeSessionString(VISUAL_ROOT_FILTER_KEY, String(rootStringFilter));
  }, [rootStringFilter]);

  useEffect(() => {
    writeSessionString(VISUAL_CHORD_SEARCH_KEY, chordSearch);
  }, [chordSearch]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    writeSessionJson(VISUAL_SELECTED_DIATONIC_KEY, selectedDiatonicByGroup);
  }, [selectedDiatonicByGroup]);

  useLayoutEffect(() => {
    const cleanupFns: Array<() => void> = [];

    if (chordListRef.current) {
      cleanupFns.push(
        restoreScrollTopWithRetries(chordListRef.current, readSessionNumber(VISUAL_LIST_SCROLL_KEY, 0), {
          maxFrames: 72,
          stableFrames: 3,
        }),
      );
    }

    if (scrollContainerRef.current) {
      cleanupFns.push(
        restoreScrollTopWithRetries(scrollContainerRef.current, readSessionNumber(VISUAL_CONTENT_SCROLL_KEY, 0), {
          maxFrames: 90,
          stableFrames: 3,
        }),
      );
    }

    return () => {
      cleanupFns.forEach((cleanup) => cleanup());
    };
  }, []);

  const scrollToQuality = (quality: string, chordId?: string) => {
    if (!scrollContainerRef.current) {
      return;
    }

    const rows = Array.from(scrollContainerRef.current.querySelectorAll('section[data-qualities]'));
    const targetRow = rows.find((row) => {
      const element = row as HTMLElement;
      if (chordId) {
        const chordIds = element.dataset.chordIds || '';
        return chordIds.split(' ').includes(chordId);
      }

      const qualities = element.dataset.qualities || '';
      return qualities.split(' ').includes(quality);
    });

    if (targetRow) {
      scrollToTargetAndFlash({
        container: scrollContainerRef.current,
        target: targetRow as HTMLElement,
        flashTarget: (target) => flashElementOutline(target, { thicknessPx: 4 }),
      });
    }
  };

  const handleContentScroll = (e: React.UIEvent<HTMLElement>) => {
    writeSessionNumber(VISUAL_CONTENT_SCROLL_KEY, e.currentTarget.scrollTop);
  };

  const handleChordListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    writeSessionNumber(VISUAL_LIST_SCROLL_KEY, e.currentTarget.scrollTop);
  };

  const openInSandbox = (
    event: React.MouseEvent<HTMLButtonElement>,
    member: VisualArchetypeMember,
    rootPitchClass: number,
  ) => {
    const fretOffset = resolveRootFretForShape(rootPitchClass, member.shape);
    const sandboxSearch = buildSearchWithUpdates({
      tab: 'sandbox',
      chordId: member.chordId,
      quality: member.quality,
      rootString: member.rootString.toString(),
      rootVoicing: member.rootVoicing,
      shapeIndex: member.shapeIndex.toString(),
      fretOffset: fretOffset.toString(),
    });
    navigateFromClick(event, sandboxSearch);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-white text-slate-900 font-sans">
      <aside className="w-full lg:w-72 h-full overflow-y-auto bg-slate-50 border-r border-slate-200 flex flex-col p-6 gap-8 shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase">
            Visual<span className="text-slate-400">Archetype</span>
          </h1>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Shape Collisions
          </div>
        </div>

        <div className="space-y-2 border-t border-slate-200 pt-4">
          <label htmlFor="visual-root-string" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Root String Filter
          </label>
          <select
            id="visual-root-string"
            value={String(rootStringFilter)}
            onChange={(e) => {
              setRootStringFilter(parseRootStringFilter(e.target.value));
            }}
            className="w-full p-2 border border-slate-300 rounded text-sm bg-white"
          >
            <option value="ALL">All Root Strings</option>
            <option value="5">String 6 (E)</option>
            <option value="4">String 5 (A)</option>
            <option value="3">String 4 (D)</option>
            <option value="2">String 3 (G)</option>
          </select>
          <div className="text-[11px] text-slate-500">
            Archetype Groups: {filteredGroups.length}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Chord Search</div>
          <input
            ref={searchInputRef}
            type="text"
            value={chordSearch}
            onChange={(e) => setChordSearch(e.target.value)}
            placeholder="e.g. min9"
            className="w-full p-2 border border-slate-300 rounded text-sm bg-white"
          />
          <div
            ref={chordListRef}
            onScroll={handleChordListScroll}
            className="mt-2 max-h-[280px] overflow-y-auto border border-slate-200 rounded bg-white p-1 flex flex-col gap-1"
          >
            {filteredChordList.map(({ definition, chordId }) => {
              const isAvailable = availableChordIds.has(chordId);
              const displayQuality = getDisplayQuality(chordId, definition.quality);

              return (
                <button
                  key={chordId}
                  onClick={() => {
                    if (isAvailable) {
                      scrollToQuality(definition.quality, chordId);
                    }
                  }}
                  disabled={!isAvailable}
                  className={`text-left text-xs font-bold px-2 py-1 rounded flex items-center justify-between ${isAvailable ? 'hover:bg-blue-50 text-slate-700 cursor-pointer' : 'bg-slate-50 text-slate-400 cursor-not-allowed'}`}
                  title={isAvailable ? `Scroll to ${displayQuality}` : `No archetype available for ${displayQuality} in this filter`}
                >
                  <span>{displayQuality}</span>
                  {!isAvailable ? <span className="text-[10px] uppercase tracking-wider">N/A</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <main ref={scrollContainerRef} onScroll={handleContentScroll} className="flex-1 h-full overflow-y-auto p-4 lg:p-8 bg-slate-100/50">
        <div className="flex flex-col gap-4">
          {filteredGroups.length === 0 ? (
            <div className="border border-dashed border-slate-300 rounded-lg bg-white p-8 text-center text-slate-500 font-semibold">
              No visual archetype collisions for this filter.
            </div>
          ) : (
            filteredGroups.map((group) => {
              const diatonicOptions = getGroupDiatonicOptions(group);
              const activeDiatonic = diatonicOptions.length > 0
                ? (selectedDiatonicByGroup[group.impliedVisualKey] || diatonicOptions[0])
                : null;

              const previewRootPitchClass = activeDiatonic
                ? (rootObj.pitchClass + DIATONIC_INTERVALS[activeDiatonic]) % 12
                : rootObj.pitchClass;

              const activeMember = getActiveMemberForDiatonic(group, activeDiatonic, chordOrderMap);
              const preview = buildShapeSheetPreview(activeMember.shape, previewRootPitchClass, useGalleryColors);
              const previewRootLabel = getNoteNameFromPitchClass(previewRootPitchClass, notationUsesFlats);
              const groupQualities = Array.from(new Set(group.members.map((member) => member.quality))).join(' ');
              const groupChordIds = Array.from(new Set(group.members.map((member) => member.chordId))).join(' ');

              return (
                <section
                  key={group.impliedVisualKey}
                  data-qualities={groupQualities}
                  data-chord-ids={groupChordIds}
                  className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 lg:p-5"
                >
                  <div className="flex flex-col xl:flex-row gap-4 xl:items-start">
                    <div className="flex justify-center min-w-[200px]">
                      <SheetMusic
                        notes={preview.notes}
                        colors={preview.colors}
                        gameMode="SANDBOX"
                        useFlats={notationUsesFlats}
                        keySignature={rootObj.renderableKeyName}
                        suppressDiatonicAccidentals
                        zoomSemitones={preview.zoomSemitones}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-black uppercase tracking-wide text-slate-800">
                          Visual Degrees: {group.degreeSequence.join(' - ')}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {diatonicOptions.length > 0 ? (
                            <div className="inline-flex rounded border border-slate-300 overflow-hidden bg-white">
                              {diatonicOptions.map((option) => (
                                <button
                                  key={option}
                                  onClick={() => setSelectedDiatonicByGroup((prev) => ({ ...prev, [group.impliedVisualKey]: option }))}
                                  className={`px-2 py-1 text-[11px] font-bold tracking-wider border-r last:border-r-0 ${activeDiatonic === option ? 'bg-blue-600 text-white border-blue-600' : 'text-slate-700 hover:bg-slate-100 border-slate-300'}`}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[11px] px-2 py-1 rounded bg-slate-100 text-slate-600 font-bold inline-flex w-fit">
                              Key Root: {previewRootLabel}
                            </div>
                          )}
                          <div className="text-[11px] px-2 py-1 rounded bg-slate-100 text-slate-600 font-bold inline-flex w-fit">
                            String {group.rootString + 1} Root Archetype
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {group.members.map((member) => {
                          const diatonic = CHORD_QUALITY_DIATONIC_MAP[member.quality] || [];
                          const isActive = member.chordId === activeMember.chordId && member.shapeIndex === activeMember.shapeIndex;
                          const fingeringArray = buildFingeringOffsetArray(member.shape);

                          return (
                            <button
                              key={`${member.chordId}-${member.rootString}-${member.shapeIndex}`}
                              onClick={(event) => openInSandbox(event, member, previewRootPitchClass)}
                              onAuxClick={(event) => openInSandbox(event, member, previewRootPitchClass)}
                              onMouseDown={preventMiddleMouseDefault}
                              className={`text-left border rounded px-3 py-2 transition-colors ${isActive ? 'border-blue-600 ring-2 ring-blue-500/30 bg-white' : 'border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300'}`}
                              title={`Open ${member.quality} ${member.rootVoicing} on string ${member.rootString + 1} in Sandbox`}
                            >
                              <div className="text-sm font-bold text-slate-800">{member.quality}</div>
                              <div className="text-[11px] text-blue-700 font-semibold">Root Voicing: {member.rootVoicing}</div>
                              <div className="text-[11px] text-slate-500">Raw: {member.rawIntervalSignature}</div>
                              <div className="text-[11px] text-slate-500">Diatonic: {diatonic.length > 0 ? diatonic.join(', ') : 'none'}</div>
                              <div className="text-[11px] text-blue-700 font-semibold">Fingering: {fingeringArray}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })
          )}
        </div>
      </main>

      <aside className="w-full lg:w-72 h-full overflow-y-auto bg-slate-50 border-l border-slate-200 flex flex-col shrink-0 p-6">
        <LegendPanel variant="large" />
      </aside>
    </div>
  );
};

export default VisualArchetypeMode;
