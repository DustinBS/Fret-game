import { useCallback, useEffect, useState } from 'react';
import { KEY_CONSTRAINT_OPTIONS } from '../utils/musicTheory';
import { readSessionString, writeSessionString } from '../utils/viewState';

const GLOBAL_KEY_STORAGE_KEY = 'fret-key-constraint';

export function useGlobalKeyConstraint(defaultKey = 'C') {
  const [keyConstraint, setKeyConstraint] = useState(() => {
    const saved = readSessionString(GLOBAL_KEY_STORAGE_KEY, defaultKey);
    return KEY_CONSTRAINT_OPTIONS.includes(saved) ? saved : defaultKey;
  });

  useEffect(() => {
    writeSessionString(GLOBAL_KEY_STORAGE_KEY, keyConstraint);
  }, [keyConstraint]);

  const setKey = useCallback((next: string) => {
    if (!KEY_CONSTRAINT_OPTIONS.includes(next)) {
      return;
    }

    setKeyConstraint(next);
  }, []);

  return [keyConstraint, setKey] as const;
}
