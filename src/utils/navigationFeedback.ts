// Centralized timing knobs for cross-tab pan and outline feedback.
// Fine-tune these values to make navigation feedback faster/slower globally.
export const NAVIGATION_SCROLL_SETTLE_IDLE_MS = 120;
export const NAVIGATION_SCROLL_POST_SETTLE_BUFFER_MS = 60;

// Native does not use DOM settle observers, so we use an idle window after scroll events.
export const NATIVE_SCROLL_IDLE_HIGHLIGHT_MS = 90;

// Keep focus highlights visible long enough to be noticeable without feeling sticky.
export const NAVIGATION_FOCUS_HIGHLIGHT_HOLD_MS = 1800;

// Shared outline visual tokens so web/native outline aesthetics stay aligned.
export const NAVIGATION_OUTLINE_ACCENT_RGB = '245, 158, 11';
export const NAVIGATION_OUTLINE_ACCENT_HEX = '#f59e0b';
export const NAVIGATION_OUTLINE_SOFT_BACKGROUND_HEX = '#fffbeb';

// Shared outline timing lifecycle used by settle-complete flash feedback.
export const NAVIGATION_OUTLINE_HOLD_MS = 500;
export const NAVIGATION_OUTLINE_FADE_MS = 640;
export const NAVIGATION_OUTLINE_CLEANUP_BUFFER_MS = 80;
export const NAVIGATION_OUTLINE_TOTAL_MS =
	NAVIGATION_OUTLINE_HOLD_MS
	+ NAVIGATION_OUTLINE_FADE_MS
	+ NAVIGATION_OUTLINE_CLEANUP_BUFFER_MS;
