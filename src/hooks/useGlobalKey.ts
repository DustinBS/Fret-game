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
    const handleCustom = () => {
      const val = localStorage.getItem('fret-key-constraint');
      if (val && val !== keyConstraint) {
        setKeyConstraint(val);
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('fret-key-update', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('fret-key-update', handleCustom);
    };
  }, [keyConstraint]);

  const setKey = (k: string) => {
    if (k === keyConstraint) return;
    setKeyConstraint(k);
    localStorage.setItem('fret-key-constraint', k);
    window.dispatchEvent(new Event('fret-key-update'));
  };

  return [keyConstraint, setKey] as const;
}
