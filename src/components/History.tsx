import { type ReactNode, useEffect, useState } from 'react';

export interface HistoryItem<T = any> {
    label: string;
    timestamp: number;
    state?: T;
}

export const useHistory = <T = any>(storageKey: string) => {
    const [history, setHistory] = useState<HistoryItem<T>[]>([]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                setHistory(JSON.parse(saved));
            }
        } catch (e) {
            console.error("Failed to load history", e);
        }
    }, [storageKey]);

    const addHistory = (label: string, state?: T) => {
        setHistory(prev => {
            const newHistory = [{ label, timestamp: Date.now(), state }, ...prev].slice(0, 50);
            localStorage.setItem(storageKey, JSON.stringify(newHistory));
            return newHistory;
        });
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem(storageKey);
    };

    return { history, addHistory, clearHistory };
};

interface HistoryPanelProps<T = any> {
    history: HistoryItem<T>[];
    onClear: () => void;
    onRestore?: (state: T) => void;
    getLabelClassName?: (item: HistoryItem<T>) => string;
    renderLabel?: (item: HistoryItem<T>) => ReactNode;
}

export function getCorrectMissHistoryLabelClass<T>(item: HistoryItem<T>): string {
    const stateCandidate = item.state as { wasCorrect?: unknown } | undefined;
    if (typeof stateCandidate?.wasCorrect === 'boolean') {
        return stateCandidate.wasCorrect ? 'text-emerald-600' : 'text-red-600';
    }

    if (item.label.includes('(Correct)')) {
        return 'text-emerald-600';
    }

    if (item.label.includes('(Miss)')) {
        return 'text-red-600';
    }

    return '';
}

export const HistoryPanel = <T,>({ history, onClear, onRestore, getLabelClassName, renderLabel }: HistoryPanelProps<T>) => {
    if (history.length === 0) return null;

    return (
        <div className="flex flex-col flex-1  overflow-hidden">
            <div className="flex justify-between items-center py-4 border-b border-slate-200">
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">History</h3>
                <button onClick={onClear} className="text-[10px] text-red-500 font-bold uppercase tracking-widest hover:text-red-600 transition">Clear</button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 py-4 pr-2">
                {history.map(item => (
                    <div
                        key={item.timestamp}
                        className={`text-sm bg-slate-100 p-2 rounded flex justify-between items-center ${item.state ? 'cursor-pointer hover:bg-slate-200 active:bg-slate-300 transition' : ''}`}
                        onClick={() => {
                            if (!onRestore || !item.state) {
                                return;
                            }

                            const selectedText = window.getSelection?.()?.toString() ?? '';
                            if (selectedText.length > 0) {
                                return;
                            }

                            onRestore(item.state);
                        }}
                    >
                        <span className={`font-bold ${getLabelClassName ? getLabelClassName(item) : 'text-slate-700'}`}>
                            {renderLabel ? renderLabel(item) : item.label}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-2">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};