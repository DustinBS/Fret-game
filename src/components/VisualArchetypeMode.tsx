import React, { useMemo, useState, useRef } from 'react';
import SheetMusic from './SheetMusic';
import { LegendPanel } from './LegendPanel';
import { CHORD_DICTIONARY } from '../utils/chordLibrary';
import { CHORD_QUALITY_DIATONIC_MAP, DIATONIC_INTERVALS } from '../utils/diatonic';
import { TUNING, getIntervalHexColor, getKeySignatureInfo, getNoteNameFromPitchClass, keySignatureUsesFlats } from '../utils/musicTheory';
import { getGalleryOrderedChordDefinitions } from '../utils/chordOrdering';
import { flashElementOutline, scrollToTargetAndFlash } from '../utils/scrollFeedback';
import type { ChordShape } from '../utils/chordLibrary.types';
import { buildVisualArchetypeGroups, type VisualArchetypeGroup, type VisualArchetypeMember } from '../utils/visualArchetypes';

const SHEET_MAX_PITCH = 77;
const DIATONIC_DISPLAY_ORDER = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'viio'];

interface VisualArchetypeModeProps {
  keyConstraint: string;
  useGalleryColors: boolean;
}

function resolveRootFretForShape(rootPitchClass: number, shape: ChordShape): number {
  const stringOpenPitch = TUNING[shape.rootString];
  let rootFret = (rootPitchClass - (stringOpenPitch % 12) + 12) % 12;

  let minFretInShape = Math.min(...shape.offsets.map((offsetDef) => rootFret + offsetDef.offset));
  while (minFretInShape < 0) {
    rootFret += 12;
    minFretInShape += 12;
  }

  if (rootFret <= 2) {
    rootFret += 12;
  }

  return rootFret;
}

function buildCanonicalPreview(member: VisualArchetypeMember, rootPitchClass: number, useGalleryColors: boolean) {
  const rootFret = resolveRootFretForShape(rootPitchClass, member.shape);
  const notes = member.shape.offsets.map((offsetDef) => TUNING[offsetDef.string] + rootFret + offsetDef.offset);
  const colors = member.shape.offsets.map((offsetDef) => useGalleryColors ? getIntervalHexColor(offsetDef.interval || '1') : '#111111');
  const highestPitch = notes.length > 0 ? Math.max(...notes) : 0;
  const zoomSemitones = highestPitch > SHEET_MAX_PITCH ? highestPitch - SHEET_MAX_PITCH : 0;

  return { notes, colors, zoomSemitones, rootFret };
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
  qualityOrderMap: Map<string, number>,
) {
  let candidates = [...group.members];

  if (activeDiatonic) {
    const matched = candidates.filter((member) => (CHORD_QUALITY_DIATONIC_MAP[member.quality] || []).includes(activeDiatonic));
    if (matched.length > 0) {
      candidates = matched;
    }
  }

  candidates.sort((a, b) => {
    const aRank = qualityOrderMap.get(a.quality) ?? Number.MAX_SAFE_INTEGER;
    const bRank = qualityOrderMap.get(b.quality) ?? Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) {
      return aRank - bRank;
    }
    if (a.quality !== b.quality) {
      return a.quality.localeCompare(b.quality);
    }
    return a.shapeIndex - b.shapeIndex;
  });

  return candidates[0];
}

const VisualArchetypeMode: React.FC<VisualArchetypeModeProps> = ({ keyConstraint, useGalleryColors }) => {
  const [rootStringFilter, setRootStringFilter] = useState<'ALL' | 5 | 4 | 3 | 2>('ALL');
  const [selectedDiatonicByGroup, setSelectedDiatonicByGroup] = useState<Record<string, string>>({});
  const [chordSearch, setChordSearch] = useState('');
  const scrollContainerRef = useRef<HTMLElement>(null);

  const rootObj = useMemo(() => getKeySignatureInfo(keyConstraint), [keyConstraint]);
  const notationUsesFlats = useMemo(() => keySignatureUsesFlats(rootObj.renderableKeyName), [rootObj.renderableKeyName]);
  const groups = useMemo(() => buildVisualArchetypeGroups(CHORD_DICTIONARY), []);
  const orderedChordDefs = useMemo(() => getGalleryOrderedChordDefinitions(CHORD_DICTIONARY), []);

  const qualityOrderMap = useMemo(() => {
    return new Map(orderedChordDefs.map((def, index) => [def.quality, index]));
  }, [orderedChordDefs]);

  const filteredChordList = useMemo(() => {
    const query = chordSearch.trim().toLowerCase();
    if (!query) {
      return orderedChordDefs;
    }
    return orderedChordDefs.filter((def) => def.quality.toLowerCase().includes(query));
  }, [orderedChordDefs, chordSearch]);

  const filteredGroups = useMemo(() => {
    if (rootStringFilter === 'ALL') {
      return groups;
    }
    return groups.filter((group) => group.rootString === rootStringFilter);
  }, [groups, rootStringFilter]);

  const scrollToQuality = (quality: string) => {
    if (!scrollContainerRef.current) {
      return;
    }

    const rows = Array.from(scrollContainerRef.current.querySelectorAll('section[data-qualities]'));
    const targetRow = rows.find((row) => {
      const value = (row as HTMLElement).dataset.qualities || '';
      return value.split(' ').includes(quality);
    });

    if (targetRow) {
      scrollToTargetAndFlash({
        container: scrollContainerRef.current,
        target: targetRow as HTMLElement,
        flashTarget: (target) => flashElementOutline(target, { thicknessPx: 4 }),
        postSettleDelayMs: 180,
      });
    }
  };

  const openInSandbox = (member: VisualArchetypeMember, rootPitchClass: number) => {
    const fretOffset = resolveRootFretForShape(rootPitchClass, member.shape);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'sandbox');
    params.set('quality', member.quality);
    params.set('rootString', member.rootString.toString());
    params.set('fretOffset', fretOffset.toString());
    window.history.pushState({}, '', `?${params.toString()}`);
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-white text-slate-900 font-sans select-none">
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
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Overview</div>
          <div className="text-[11px] text-slate-500">Archetype Groups: {filteredGroups.length}</div>
        </div>

        <div className="space-y-2 border-t border-slate-200 pt-4">
          <label htmlFor="visual-root-string" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Root String Filter
          </label>
          <select
            id="visual-root-string"
            value={String(rootStringFilter)}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'ALL') {
                setRootStringFilter('ALL');
              } else {
                setRootStringFilter(Number(value) as 5 | 4 | 3 | 2);
              }
            }}
            className="w-full p-2 border border-slate-300 rounded text-sm bg-white"
          >
            <option value="ALL">All Root Strings</option>
            <option value="5">String 6 (E)</option>
            <option value="4">String 5 (A)</option>
            <option value="3">String 4 (D)</option>
            <option value="2">String 3 (G)</option>
          </select>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Chord Search</div>
          <input
            type="text"
            value={chordSearch}
            onChange={(e) => setChordSearch(e.target.value)}
            placeholder="e.g. min9"
            className="w-full p-2 border border-slate-300 rounded text-sm bg-white"
          />
          <div className="mt-2 max-h-[280px] overflow-y-auto border border-slate-200 rounded bg-white p-1 flex flex-col gap-1">
            {filteredChordList.map((def) => (
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

      <main ref={scrollContainerRef} className="flex-1 h-full overflow-y-auto p-4 lg:p-8 bg-slate-100/50">
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

              const activeMember = getActiveMemberForDiatonic(group, activeDiatonic, qualityOrderMap);
              const preview = buildCanonicalPreview(activeMember, previewRootPitchClass, useGalleryColors);
              const previewRootLabel = getNoteNameFromPitchClass(previewRootPitchClass, notationUsesFlats);
              const groupQualities = Array.from(new Set(group.members.map((member) => member.quality))).join(' ');

              return (
                <section
                  key={group.impliedVisualKey}
                  data-qualities={groupQualities}
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
                          const sandboxFret = resolveRootFretForShape(previewRootPitchClass, member.shape);
                          const diatonic = CHORD_QUALITY_DIATONIC_MAP[member.quality] || [];
                          const isActive = member.quality === activeMember.quality && member.shapeIndex === activeMember.shapeIndex;

                          return (
                            <button
                              key={`${member.quality}-${member.rootString}-${member.shapeIndex}`}
                              onClick={() => openInSandbox(member, previewRootPitchClass)}
                              className={`text-left border rounded px-3 py-2 transition-colors ${isActive ? 'border-blue-600 ring-2 ring-blue-500/30 bg-white' : 'border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300'}`}
                              title={`Open ${member.quality} on string ${member.rootString + 1} in Sandbox`}
                            >
                              <div className="text-sm font-bold text-slate-800">{member.quality}</div>
                              <div className="text-[11px] text-slate-500">Raw: {member.rawIntervalSignature}</div>
                              <div className="text-[11px] text-slate-500">Diatonic: {diatonic.length > 0 ? diatonic.join(', ') : 'none'}</div>
                              <div className="text-[11px] text-blue-700 font-semibold">Sandbox fret: {sandboxFret}</div>
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
