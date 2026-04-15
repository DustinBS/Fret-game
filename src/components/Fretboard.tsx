import React from 'react';

const STRING_THICKNESS = [1, 2, 3, 4, 5, 6];

export type FretMarker = {
    stringIndex: number;
    fret: number;
    markerClass?: string;
    label?: string;
    isAnchor?: boolean;
};

interface FretboardProps {
    markers: FretMarker[];
    windowStart?: number;
    windowEnd?: number;
    onFretClick: (stringIndex: number, fret: number) => void;
    // An optional function generating ghost note hover classes per fret/string.
    // If not provided, no hover state is rendered.
    getGhostClass?: (stringIndex: number, fret: number) => string;
}

export const Fretboard: React.FC<FretboardProps> = ({ 
    markers, 
    windowStart = 0, 
    windowEnd = 14, 
    onFretClick,
    getGhostClass 
}) => {
    return (
        <div className="relative w-full max-w-[1000px] overflow-x-auto pb-4 custom-scrollbar px-4">
            {/* Fret Numbers */}
            <div className="flex pl-10 mb-1 min-w-[800px]">
                {Array.from({ length: 15 }).map((_, i) => {
                    const isActive = i >= windowStart && i <= windowEnd;
                    const anchor = markers.find(m => m.fret === i && m.isAnchor);
                    return (
                        <div
                            key={i}
                            className={`flex-1 text-center text-xs font-mono transition-colors duration-300
                                ${anchor ? 'text-red-600 font-bold' : isActive ? 'text-slate-600' : 'text-slate-400'}`}
                        >
                            {i}
                        </div>
                    );
                })}
            </div>

            {/* The Board */}
            <div className="relative border-y-[12px] border-[#5D4037] bg-slate-100 shadow-sm min-w-[800px]">
                {/* Fret Lines */}
                <div className="absolute inset-0 flex pl-10">
                    {Array.from({ length: 15 }).map((_, fret) => {
                        const isActive = fret >= windowStart && fret <= windowEnd;
                        return (
                            <div key={fret} className={`flex-1 border-r border-slate-400 h-full relative ${fret === 0 ? 'border-r-[6px] border-slate-800' : ''} ${isActive ? 'bg-white' : 'bg-slate-100 opacity-60'}`}>
                                {[3, 5, 7, 9].includes(fret) && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-300 rounded-full" />}
                                {fret === 12 && (
                                    <>
                                        <div className="absolute top-[33%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-300 rounded-full" />
                                        <div className="absolute top-[66%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-300 rounded-full" />
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Strings */}
                <div className="relative flex flex-col z-10 py-4">
                    {[0, 1, 2, 3, 4, 5].map((sIdx) => (
                        <div key={sIdx} className="relative h-12 flex items-center">
                            <div className="absolute w-full bg-slate-900 pointer-events-none" style={{ height: `${STRING_THICKNESS[sIdx]}px` }} />
                            <div className="flex w-full h-full pl-10">
                                {Array.from({ length: 15 }).map((_, fIdx) => {
                                    const isActiveWindow = fIdx >= windowStart && fIdx <= windowEnd;
                                    const marker = markers.find(m => m.stringIndex === sIdx && m.fret === fIdx);
                                    
                                    const defaultClass = marker?.markerClass || "scale-0";
                                    const ghostClass = getGhostClass && !marker && isActiveWindow 
                                        ? getGhostClass(sIdx, fIdx) 
                                        : "";
                                    
                                    // Combine visibility rules
                                    // If no marker, allow ghostClass on hover via group.
                                    const visibilityClass = marker ? defaultClass : ghostClass;

                                    return (
                                        <div 
                                            key={fIdx} 
                                            onClick={() => onFretClick(sIdx, fIdx)} 
                                            className={`flex-1 flex items-center justify-center relative group ${isActiveWindow ? 'cursor-pointer hover:bg-slate-900/5' : 'cursor-not-allowed'}`}
                                        >
                                            {marker?.isAnchor && <div className="absolute w-3 h-3 bg-red-600 rounded-sm z-0 opacity-80" />}
                                            <div className={`w-6 h-6 rounded-full transition-all duration-200 z-10 flex items-center justify-center ${visibilityClass}`}>
                                                {marker?.label && <span className="text-white text-[10px] font-bold">{marker.label}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
