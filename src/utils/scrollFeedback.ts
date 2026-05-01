import {
  NAVIGATION_OUTLINE_ACCENT_RGB,
  NAVIGATION_OUTLINE_CLEANUP_BUFFER_MS,
  NAVIGATION_OUTLINE_FADE_MS,
  NAVIGATION_OUTLINE_HOLD_MS,
  NAVIGATION_SCROLL_POST_SETTLE_BUFFER_MS,
  NAVIGATION_SCROLL_SETTLE_IDLE_MS,
} from './navigationFeedback';

type ScrollFlashFn = (target: HTMLElement) => void;

interface ScrollAndFlashOptions {
  container: HTMLElement;
  target: HTMLElement;
  flashTarget: ScrollFlashFn;
  postSettleBufferMs?: number;
  postSettleDelayMs?: number;
  settleIdleMs?: number;
  settleTimeoutMs?: number;
}

interface MultiTargetScrollAndFlashOptions {
  targets: Array<{
    container: HTMLElement;
    target: HTMLElement;
    flashTarget: ScrollFlashFn;
  }>;
  postSettleBufferMs?: number;
  postSettleDelayMs?: number;
  settleIdleMs?: number;
  settleTimeoutMs?: number;
  onReadyToFlash?: () => void;
}

interface OutlineFlashOptions {
  thicknessPx?: number;
  holdMs?: number;
  fadeMs?: number;
}

interface InsetRingFlashOptions {
  thicknessPx?: number;
  holdMs?: number;
  fadeMs?: number;
}

interface TableRowFlashOptions {
  thicknessPx?: number;
  holdMs?: number;
  fadeMs?: number;
}

interface OutlineFlashState {
  prevOutline: string;
  prevOutlineOffset: string;
  prevTransition: string;
  fadeTimer?: number;
  cleanupTimer?: number;
}

interface OverlayFlashState {
  overlay: HTMLDivElement;
  fadeTimer?: number;
  cleanupTimer?: number;
}

interface InsetRingFlashState {
  prevBoxShadow: string;
  prevTransition: string;
  fadeTimer?: number;
  cleanupTimer?: number;
}

const DEFAULT_POST_SETTLE_BUFFER_MS = NAVIGATION_SCROLL_POST_SETTLE_BUFFER_MS;
const DEFAULT_SETTLE_IDLE_MS = NAVIGATION_SCROLL_SETTLE_IDLE_MS;
const DEFAULT_SETTLE_TIMEOUT_MS = 3200;
const DEFAULT_NO_MOVEMENT_GRACE_MS = 220;
const NO_MOVEMENT_VISIBILITY_RATIO = 0.55;
const TARGET_MOTION_EPSILON_PX = 0.1;

const containerSequenceMap = new WeakMap<HTMLElement, number>();
const outlineFlashStateMap = new WeakMap<HTMLElement, OutlineFlashState>();
const overlayFlashStateMap = new WeakMap<HTMLElement, OverlayFlashState>();
const insetRingFlashStateMap = new WeakMap<HTMLElement, InsetRingFlashState>();

function waitForScrollSettled(
  container: HTMLElement,
  target: HTMLElement,
  idleMs: number,
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    let lastChangeAt = start;
    let lastTop = container.scrollTop;
    let lastLeft = container.scrollLeft;
    let hadMotion = false;
    let lastTargetRect = target.getBoundingClientRect();

    const getTargetVerticalVisibilityRatio = () => {
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const targetHeight = Math.max(1, targetRect.height);
      const visibleTop = Math.max(containerRect.top, targetRect.top);
      const visibleBottom = Math.min(containerRect.bottom, targetRect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      return visibleHeight / targetHeight;
    };

    const tick = (now: number) => {
      if (!target.isConnected) {
        resolve();
        return;
      }

      const top = container.scrollTop;
      const left = container.scrollLeft;
      const targetRect = target.getBoundingClientRect();

      const containerMoved = top !== lastTop || left !== lastLeft;
      const targetMoved =
        Math.abs(targetRect.top - lastTargetRect.top) > TARGET_MOTION_EPSILON_PX ||
        Math.abs(targetRect.left - lastTargetRect.left) > TARGET_MOTION_EPSILON_PX;

      if (containerMoved || targetMoved) {
        hadMotion = true;
        lastChangeAt = now;
      }

      lastTop = top;
      lastLeft = left;
      lastTargetRect = targetRect;

      if (hadMotion && now - lastChangeAt >= idleMs) {
        resolve();
        return;
      }

      if (!hadMotion && now - start >= DEFAULT_NO_MOVEMENT_GRACE_MS) {
        if (getTargetVerticalVisibilityRatio() >= NO_MOVEMENT_VISIBILITY_RATIO) {
          resolve();
          return;
        }
      }

      if (now - start >= timeoutMs) {
        resolve();
        return;
      }

      window.requestAnimationFrame(tick);
    };

    window.requestAnimationFrame(tick);
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function clearTimer(timer: number | undefined): void {
  if (timer !== undefined) {
    window.clearTimeout(timer);
  }
}

function isLatestSequence(container: HTMLElement, sequence: number): boolean {
  return containerSequenceMap.get(container) === sequence;
}

function areContainerSequencesLatest(sequenceByContainer: Map<HTMLElement, number>): boolean {
  for (const [container, sequence] of sequenceByContainer.entries()) {
    if (!isLatestSequence(container, sequence)) {
      return false;
    }
  }

  return true;
}

function clearOutlineFlashState(target: HTMLElement): void {
  const state = outlineFlashStateMap.get(target);
  if (!state) {
    return;
  }

  clearTimer(state.fadeTimer);
  clearTimer(state.cleanupTimer);

  target.style.outline = state.prevOutline;
  target.style.outlineOffset = state.prevOutlineOffset;
  target.style.transition = state.prevTransition;
  target.style.outlineColor = '';
  outlineFlashStateMap.delete(target);
}

function clearOverlayFlashState(row: HTMLElement): void {
  const state = overlayFlashStateMap.get(row);
  if (!state) {
    return;
  }

  clearTimer(state.fadeTimer);
  clearTimer(state.cleanupTimer);
  if (state.overlay.parentNode) {
    state.overlay.parentNode.removeChild(state.overlay);
  }

  overlayFlashStateMap.delete(row);
}

function clearInsetRingFlashState(target: HTMLElement): void {
  const state = insetRingFlashStateMap.get(target);
  if (!state) {
    return;
  }

  clearTimer(state.fadeTimer);
  clearTimer(state.cleanupTimer);

  target.style.boxShadow = state.prevBoxShadow;
  target.style.transition = state.prevTransition;
  insetRingFlashStateMap.delete(target);
}

export function scrollToTargetsAndFlashTogether({
  targets,
  postSettleBufferMs,
  postSettleDelayMs,
  settleIdleMs = DEFAULT_SETTLE_IDLE_MS,
  settleTimeoutMs = DEFAULT_SETTLE_TIMEOUT_MS,
  onReadyToFlash,
}: MultiTargetScrollAndFlashOptions): void {
  if (targets.length === 0) {
    return;
  }

  // One scroll target per container keeps this utility deterministic and
  // allows us to synchronize flashing by waiting on all involved containers.
  const uniqueByContainer = new Map<HTMLElement, MultiTargetScrollAndFlashOptions['targets'][number]>();
  targets.forEach((entry) => {
    uniqueByContainer.set(entry.container, entry);
  });

  const activeTargets = Array.from(uniqueByContainer.values()).filter(
    (entry) => entry.container.isConnected && entry.target.isConnected,
  );

  if (activeTargets.length === 0) {
    return;
  }

  const settleBufferMs = Math.max(
    0,
    postSettleBufferMs ?? postSettleDelayMs ?? DEFAULT_POST_SETTLE_BUFFER_MS,
  );
  const sequenceByContainer = new Map<HTMLElement, number>();

  activeTargets.forEach(({ container, target }) => {
    const nextSequence = (containerSequenceMap.get(container) ?? 0) + 1;
    containerSequenceMap.set(container, nextSequence);
    sequenceByContainer.set(container, nextSequence);
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  void Promise.all(
    activeTargets.map(({ container, target }) =>
      waitForScrollSettled(container, target, settleIdleMs, settleTimeoutMs),
    ),
  ).then(async () => {
    if (!areContainerSequencesLatest(sequenceByContainer)) {
      return;
    }

    if (settleBufferMs > 0) {
      await wait(settleBufferMs);
    }

    if (!areContainerSequencesLatest(sequenceByContainer)) {
      return;
    }

    onReadyToFlash?.();

    activeTargets.forEach(({ target, flashTarget }) => {
      if (!target.isConnected) {
        return;
      }

      flashTarget(target);
    });
  });
}

export function scrollToTargetAndFlash({
  container,
  target,
  flashTarget,
  postSettleBufferMs,
  postSettleDelayMs,
  settleIdleMs,
  settleTimeoutMs,
}: ScrollAndFlashOptions): void {
  scrollToTargetsAndFlashTogether({
    targets: [{ container, target, flashTarget }],
    postSettleBufferMs,
    postSettleDelayMs,
    settleIdleMs,
    settleTimeoutMs,
  });
}

export function flashElementOutline(target: HTMLElement, options: OutlineFlashOptions = {}): void {
  clearOutlineFlashState(target);

  const state: OutlineFlashState = {
    prevOutline: target.style.outline,
    prevOutlineOffset: target.style.outlineOffset,
    prevTransition: target.style.transition,
  };
  outlineFlashStateMap.set(target, state);

  const thicknessPx = options.thicknessPx ?? 6;
  const holdMs = options.holdMs ?? NAVIGATION_OUTLINE_HOLD_MS;
  const fadeMs = options.fadeMs ?? NAVIGATION_OUTLINE_FADE_MS;

  target.style.transition = 'outline-color 0ms linear';
  target.style.outline = `${thicknessPx}px solid rgba(${NAVIGATION_OUTLINE_ACCENT_RGB}, 0.95)`;
  target.style.outlineOffset = '2px';

  state.fadeTimer = window.setTimeout(() => {
    target.style.transition = `outline-color ${fadeMs}ms ease-out`;
    target.style.outlineColor = `rgba(${NAVIGATION_OUTLINE_ACCENT_RGB}, 0)`;
  }, holdMs);

  state.cleanupTimer = window.setTimeout(() => {
    clearOutlineFlashState(target);
  }, holdMs + fadeMs + NAVIGATION_OUTLINE_CLEANUP_BUFFER_MS);
}

export function flashElementInsetRing(target: HTMLElement, options: InsetRingFlashOptions = {}): void {
  clearInsetRingFlashState(target);

  const state: InsetRingFlashState = {
    prevBoxShadow: target.style.boxShadow,
    prevTransition: target.style.transition,
  };
  insetRingFlashStateMap.set(target, state);

  const thicknessPx = options.thicknessPx ?? 2;
  const holdMs = options.holdMs ?? NAVIGATION_OUTLINE_HOLD_MS;
  const fadeMs = options.fadeMs ?? NAVIGATION_OUTLINE_FADE_MS;

  target.style.transition = 'box-shadow 0ms linear';
  target.style.boxShadow = `inset 0 0 0 ${thicknessPx}px rgba(${NAVIGATION_OUTLINE_ACCENT_RGB}, 0.95)`;

  state.fadeTimer = window.setTimeout(() => {
    target.style.transition = `box-shadow ${fadeMs}ms ease-out`;
    target.style.boxShadow = `inset 0 0 0 ${thicknessPx}px rgba(${NAVIGATION_OUTLINE_ACCENT_RGB}, 0)`;
  }, holdMs);

  state.cleanupTimer = window.setTimeout(() => {
    clearInsetRingFlashState(target);
  }, holdMs + fadeMs + NAVIGATION_OUTLINE_CLEANUP_BUFFER_MS);
}

export function flashTableRowOverlay(row: HTMLElement, options: TableRowFlashOptions = {}): void {
  clearOverlayFlashState(row);

  const thicknessPx = options.thicknessPx ?? 5;
  const holdMs = options.holdMs ?? NAVIGATION_OUTLINE_HOLD_MS;
  const fadeMs = options.fadeMs ?? NAVIGATION_OUTLINE_FADE_MS;

  const firstCell = row.querySelector<HTMLElement>('td:first-child');
  if (!firstCell) return;

  const rowRect = row.getBoundingClientRect();
  const firstRect = firstCell.getBoundingClientRect();

  const left = firstRect.right + window.scrollX;
  const top = rowRect.top + window.scrollY;
  const width = Math.max(0, rowRect.right - firstRect.right);
  const height = rowRect.height;

  if (width <= 2) return;

  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.left = `${left}px`;
  overlay.style.top = `${top}px`;
  overlay.style.width = `${width}px`;
  overlay.style.height = `${height}px`;
  overlay.style.pointerEvents = 'none';
  overlay.style.boxSizing = 'border-box';
  overlay.style.border = `${thicknessPx}px solid rgba(${NAVIGATION_OUTLINE_ACCENT_RGB}, 0.95)`;
  overlay.style.borderRadius = '6px';
  overlay.style.zIndex = '99999';
  overlay.style.transition = `opacity ${fadeMs}ms ease-out`;
  overlay.style.opacity = '1';

  document.body.appendChild(overlay);

  const state: OverlayFlashState = { overlay };
  overlayFlashStateMap.set(row, state);

  state.fadeTimer = window.setTimeout(() => {
    overlay.style.opacity = '0';
  }, holdMs);

  state.cleanupTimer = window.setTimeout(() => {
    clearOverlayFlashState(row);
  }, holdMs + fadeMs + NAVIGATION_OUTLINE_CLEANUP_BUFFER_MS);
}