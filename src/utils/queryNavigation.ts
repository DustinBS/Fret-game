export interface QueryNavigationClickEvent {
  ctrlKey: boolean;
  metaKey: boolean;
  button?: number;
  preventDefault?: () => void;
}

export interface QueryNavigationMouseDownEvent {
  button?: number;
  preventDefault?: () => void;
}

export type QueryParamUpdates = Record<string, string | null | undefined>;

function isUnsupportedAuxButton(event: QueryNavigationClickEvent): boolean {
  return typeof event.button === 'number' && event.button > 1;
}

function wantsNewTab(event: QueryNavigationClickEvent): boolean {
  return event.ctrlKey || event.metaKey || event.button === 1;
}

function toRelativeUrl(search: string): string {
  const normalizedSearch = search.startsWith('?') || search === '' ? search : `?${search}`;
  return `${window.location.pathname}${normalizedSearch}${window.location.hash}`;
}

export function preventMiddleMouseDefault(event: QueryNavigationMouseDownEvent): void {
  if (event.button === 1) {
    event.preventDefault?.();
  }
}

export function buildSearchWithUpdates(
  updates: QueryParamUpdates,
  baseSearch: string = window.location.search,
): string {
  const params = new URLSearchParams(baseSearch);

  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    if (value === null || value === '') {
      params.delete(key);
      return;
    }

    params.set(key, value);
  });

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export function navigateToSearch(search: string, options: { replace?: boolean } = {}): void {
  const targetUrl = search ? search : `${window.location.pathname}${window.location.hash}`;
  if (options.replace) {
    window.history.replaceState({}, '', targetUrl);
  } else {
    window.history.pushState({}, '', targetUrl);
  }

  window.dispatchEvent(new Event('popstate'));
}

export function navigateFromClick(
  event: QueryNavigationClickEvent,
  search: string,
  options: { replace?: boolean } = {},
): void {
  if (isUnsupportedAuxButton(event)) {
    return;
  }

  if (wantsNewTab(event)) {
    event.preventDefault?.();
    window.open(toRelativeUrl(search), '_blank', 'noopener,noreferrer');
    return;
  }

  navigateToSearch(search, options);
}
