import { useEffect, useState } from 'react';

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
}

export function getCorrectMissHistoryLabelClass<T>(item: HistoryItem<T>): string {
    if (item.label.includes('(Correct)')) {
        return 'text-emerald-600';
    }

    if (item.label.includes('(Miss)')) {
        return 'text-red-600';
    }

    return '';
}

export const HistoryPanel = <T,>({ history, onClear, onRestore, getLabelClassName }: HistoryPanelProps<T>) => {
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
                        onClick={() => onRestore && item.state && onRestore(item.state)}
                    >
                        <span className={`font-bold select-none ${getLabelClassName ? getLabelClassName(item) : 'text-slate-700'}`}>{item.label}</span>
                        <span className="text-[10px] text-slate-400 select-none ml-2">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};