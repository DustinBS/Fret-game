// React Native has no `window.sessionStorage`; keep a process-local fallback so
// existing sync read/write call sites remain platform-agnostic.
const memorySessionStore = new Map<string, string>();

function getWebSessionStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage;
    }
  } catch {
    // Ignore and use memory fallback.
  }

  return null;
}

function safeSessionGet(key: string): string | null {
  const storage = getWebSessionStorage();
  if (storage) {
    try {
      return storage.getItem(key);
    } catch {
      // Fall through to memory fallback.
    }
  }

  return memorySessionStore.get(key) ?? null;
}

function safeSessionSet(key: string, value: string): void {
  const storage = getWebSessionStorage();
  if (storage) {
    try {
      storage.setItem(key, value);
      return;
    } catch {
      // Fall through to memory fallback.
    }
  }

  memorySessionStore.set(key, value);
}

export function readSessionString(key: string, fallback: string): string {
  const raw = safeSessionGet(key);
  return raw ?? fallback;
}

export function writeSessionString(key: string, value: string): void {
  safeSessionSet(key, value);
}

export function readSessionNumber(key: string, fallback = 0): number {
  const raw = safeSessionGet(key);
  if (raw === null) {
    return fallback;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function writeSessionNumber(key: string, value: number): void {
  safeSessionSet(key, String(value));
}

export function readSessionBoolean(key: string, fallback: boolean): boolean {
  const raw = safeSessionGet(key);
  if (raw === null) {
    return fallback;
  }

  return raw === 'true';
}

export function writeSessionBoolean(key: string, value: boolean): void {
  safeSessionSet(key, value ? 'true' : 'false');
}

export function readSessionJson<T>(key: string, fallback: T): T {
  const raw = safeSessionGet(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeSessionJson<T>(key: string, value: T): void {
  safeSessionSet(key, JSON.stringify(value));
}

interface ScrollRestoreOptions {
  maxFrames?: number;
  stableFrames?: number;
  epsilonPx?: number;
  requireObservedScrollableRangeForNonZeroTarget?: boolean;
}

export function restoreScrollTopWithRetries(
  element: HTMLElement,
  targetTop: number,
  options: ScrollRestoreOptions = {},
): () => void {
  const maxFrames = options.maxFrames ?? 36;
  const stableFrames = options.stableFrames ?? 3;
  const epsilonPx = options.epsilonPx ?? 1;
  const requireObservedScrollableRangeForNonZeroTarget =
    options.requireObservedScrollableRangeForNonZeroTarget ?? true;
  const desiredTop = Math.max(0, targetTop);
  const needsObservedScrollableRange =
    requireObservedScrollableRangeForNonZeroTarget && desiredTop > epsilonPx;

  let rafId = 0;
  let frameCount = 0;
  let stableCount = 0;
  let lastMaxScrollTop = -1;
  let observedScrollableRange = !needsObservedScrollableRange;

  const tick = () => {
    if (!element.isConnected) {
      return;
    }

    const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);
    if (maxScrollTop > epsilonPx) {
      observedScrollableRange = true;
    }

    const clampedTarget = Math.min(desiredTop, maxScrollTop);

    if (Math.abs(element.scrollTop - clampedTarget) > epsilonPx) {
      element.scrollTop = clampedTarget;
    }

    const reachedTarget = Math.abs(element.scrollTop - clampedTarget) <= epsilonPx;
    const stableScrollRange = Math.abs(maxScrollTop - lastMaxScrollTop) <= epsilonPx;
    const waitingForScrollableRange = needsObservedScrollableRange && !observedScrollableRange;

    if (reachedTarget && stableScrollRange && !waitingForScrollableRange) {
      stableCount += 1;
    } else {
      stableCount = 0;
    }

    lastMaxScrollTop = maxScrollTop;
    frameCount += 1;

    if (stableCount >= stableFrames || frameCount >= maxFrames) {
      return;
    }

    rafId = window.requestAnimationFrame(tick);
  };

  tick();

  return () => {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }
  };
}