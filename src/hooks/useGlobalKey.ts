import { useState, useEffect } from 'react';

export function useGlobalKeyConstraint(defaultKey = 'C') {
  const [keyConstraint, setKeyConstraint] = useState(() => {
    return localStorage.getItem('fret-key-constraint') || defaultKey;
  });

  useEffect(() => {
    localStorage.setItem('fret-key-constraint', keyConstraint);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'fret-key-constraint' && e.newValue) {
        setKeyConstraint(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [keyConstraint]);

  // also dispatch custom event for same-window sync
  const setKey = (k: string) => {
    setKeyConstraint(k);
    localStorage.setItem('fret-key-constraint', k);
    window.dispatchEvent(new Event('fret-key-update'));
  };

  useEffect(() => {
    const handleCustom = () => {
      setKeyConstraint(localStorage.getItem('fret-key-constraint') || defaultKey);
    };
    window.addEventListener('fret-key-update', handleCustom);
    return () => window.removeEventListener('fret-key-update', handleCustom);
  }, []);

  return [keyConstraint, setKey] as const;
}
