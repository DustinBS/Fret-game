type ScrollFlashFn = (target: HTMLElement) => void;

interface ScrollAndFlashOptions {
  container: HTMLElement;
  target: HTMLElement;
  flashTarget: ScrollFlashFn;
  postSettleDelayMs?: number;
  settleIdleMs?: number;
  settleTimeoutMs?: number;
}

interface OutlineFlashOptions {
  thicknessPx?: number;
  holdMs?: number;
  fadeMs?: number;
}

interface TableRowFlashOptions {
  thicknessPx?: number;
  holdMs?: number;
  fadeMs?: number;
}

const containerSequenceMap = new WeakMap<HTMLElement, number>();
const tableRowCleanupTimerMap = new WeakMap<HTMLElement, number>();
const outlineCleanupTimerMap = new WeakMap<HTMLElement, number>();

function waitForScrollSettled(
  container: HTMLElement,
  idleMs: number,
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    let lastChangeAt = start;
    let lastTop = container.scrollTop;
    let lastLeft = container.scrollLeft;

    const tick = (now: number) => {
      const top = container.scrollTop;
      const left = container.scrollLeft;

      if (top !== lastTop || left !== lastLeft) {
        lastTop = top;
        lastLeft = left;
        lastChangeAt = now;
      }

      if (now - lastChangeAt >= idleMs || now - start >= timeoutMs) {
        resolve();
        return;
      }

      window.requestAnimationFrame(tick);
    };

    window.requestAnimationFrame(tick);
  });
}

export function scrollToTargetAndFlash({
  container,
  target,
  flashTarget,
  postSettleDelayMs = 180,
  settleIdleMs = 140,
  settleTimeoutMs = 3200,
}: ScrollAndFlashOptions): void {
  const nextSequence = (containerSequenceMap.get(container) ?? 0) + 1;
  containerSequenceMap.set(container, nextSequence);

  target.scrollIntoView({ behavior: 'smooth', block: 'center' });

  void waitForScrollSettled(container, settleIdleMs, settleTimeoutMs).then(() => {
    window.setTimeout(() => {
      if (containerSequenceMap.get(container) !== nextSequence) {
        return;
      }
      flashTarget(target);
    }, postSettleDelayMs);
  });
}

export function flashElementOutline(target: HTMLElement, options: OutlineFlashOptions = {}): void {
  const thicknessPx = options.thicknessPx ?? 4;
  const holdMs = options.holdMs ?? 180;
  const fadeMs = options.fadeMs ?? 640;

  const prevOutline = target.style.outline;
  const prevOutlineOffset = target.style.outlineOffset;
  const prevTransition = target.style.transition;

  const existingTimer = outlineCleanupTimerMap.get(target);
  if (existingTimer) {
    window.clearTimeout(existingTimer);
  }

  target.style.transition = 'outline-color 0ms linear';
  target.style.outline = `${thicknessPx}px solid rgba(37, 99, 235, 0.95)`;
  target.style.outlineOffset = '2px';

  window.setTimeout(() => {
    target.style.transition = `outline-color ${fadeMs}ms ease-out`;
    target.style.outlineColor = 'rgba(37, 99, 235, 0)';
  }, holdMs);

  const cleanupTimer = window.setTimeout(() => {
    target.style.outline = prevOutline;
    target.style.outlineOffset = prevOutlineOffset;
    target.style.transition = prevTransition;
    target.style.outlineColor = '';
    outlineCleanupTimerMap.delete(target);
  }, holdMs + fadeMs + 80);

  outlineCleanupTimerMap.set(target, cleanupTimer);
}

function getRowCellFlashShadow(
  cellIndex: number,
  cellCount: number,
  thicknessPx: number,
  alpha: number,
): string {
  const color = `rgba(37, 99, 235, ${alpha})`;
  const segments = [
    `inset 0 ${thicknessPx}px 0 ${color}`,
    `inset 0 -${thicknessPx}px 0 ${color}`,
  ];

  if (cellIndex === 0) {
    segments.push(`inset ${thicknessPx}px 0 0 ${color}`);
  }
  if (cellIndex === cellCount - 1) {
    segments.push(`inset -${thicknessPx}px 0 0 ${color}`);
  }

  return segments.join(', ');
}

export function flashTableRowDataCells(row: HTMLElement, options: TableRowFlashOptions = {}): void {
  const thicknessPx = options.thicknessPx ?? 4;
  const holdMs = options.holdMs ?? 180;
  const fadeMs = options.fadeMs ?? 640;
  const dataCells = Array.from(row.querySelectorAll<HTMLElement>('td:not(:first-child)'));

  if (dataCells.length === 0) {
    return;
  }

  const existingTimer = tableRowCleanupTimerMap.get(row);
  if (existingTimer) {
    window.clearTimeout(existingTimer);
  }

  dataCells.forEach((cell, index) => {
    cell.style.transition = 'box-shadow 0ms linear';
    cell.style.boxShadow = getRowCellFlashShadow(index, dataCells.length, thicknessPx, 0.95);
  });

  window.setTimeout(() => {
    dataCells.forEach((cell, index) => {
      cell.style.transition = `box-shadow ${fadeMs}ms ease-out`;
      cell.style.boxShadow = getRowCellFlashShadow(index, dataCells.length, thicknessPx, 0);
    });
  }, holdMs);

  const cleanupTimer = window.setTimeout(() => {
    dataCells.forEach((cell) => {
      cell.style.boxShadow = '';
      cell.style.transition = '';
    });
    tableRowCleanupTimerMap.delete(row);
  }, holdMs + fadeMs + 80);

  tableRowCleanupTimerMap.set(row, cleanupTimer);
}