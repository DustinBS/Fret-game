TODO
- Add chord recognition for most common chords. Main challenge is identifying what common chords are that are useful to memorize (if any)
- https://www.youtube.com/watch?v=s0IBmISlXOQ

# Fretboard Game

https://dustinbs.github.io/Fret-game/

**Goal:** A webapp to gamify sight-reading and fretboard visualization.

**Stack:** React, TypeScript, Tailwind CSS, VexFlow (Music Notation)

## Native App Mode Coverage

- The native app now runs all primary product modes as native React Native components:
    - `Trainer`
    - `Sandbox`
    - `Quiz`
    - `Gallery`
    - `Visual Archetype`
- Tabs are lazily mounted and then kept alive in-memory after first open so mode state is retained while switching tabs.
- Cross-mode deep links are handled natively (e.g. Gallery/Visual -> Sandbox shape open, Sandbox -> Gallery quality jump).
- Shared logic is deduplicated in cross-platform hooks/utilities where possible:
    - state helpers in `src/utils/viewState.ts`
    - chord-shape preview math in `src/utils/chordShapeRendering.ts`

## Landscape Tool UX Decisions

- Primary-content-first layout: persistent top navigation was removed from native shell so working surfaces (especially fretboards) keep maximum vertical space.
- Secondary controls moved to an on-demand menu panel instead of always-visible chrome.
- Fretboard-first ordering in interactive modes: Sandbox and Quiz place notation + fretboard before metadata/history sections.
- Compact control bands in Trainer: target/controls were reduced in height so fretboard remains the dominant visual region.
- Mode and key controls remain available but are intentionally de-emphasized while practicing.

## Local APK Build + Install (No Cloud)

- Local debug APK install (fast iteration):
    - `npm run android_local_debug`
- Local release APK install (standalone app behavior, still local):
    - `npm run android_local_release`
- Optional wireless pairing helper (then run one of the commands above):
    - `npm run android_wireless_setup`

Notes:
- These scripts build locally with Gradle and install directly with `adb`; they do not use EAS cloud build.
- On first run, if `android/` does not exist, the script auto-runs Expo prebuild to generate native Android files.
- Local release signing uses debug-keystore fallback so release APK can be installed directly on your phone.
- If multiple devices are connected, you can force a target serial:
    - `npm run android_local_debug -- RFCX41PENZW`
    - `npm run android_local_release -- RFCX41PENZW`
- If install fails with `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, the script automatically uninstalls the conflicting app and retries install.
- Build speed tuning is set for real phones by default:
    - Gradle cache and parallel execution are enabled.
    - Default Android ABIs are arm-only (`armeabi-v7a,arm64-v8a`).
    - If you need emulator ABIs, temporarily set `reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64` in `android/gradle.properties`.

## 1\. Game Concept & Mission

**Fretboard Focus** is a simple webapp to gamify sight-reading training for guitar. You can toggle between **Relative Position (Position Mode)** or **Absolute Navigation (Octave Mode)** to train either fixed-hand position for improv-related skills (12 pitch classes only) or fretboard memorization (~45 unique pitches) by adding specificity between octaves (e.g., Low E vs. High E is different) across the entire neck.

There are other toggles to increase the difficulty, such as:
- **Visual Inputs**: Note Names (e.g. C4, A#2) vs. Sheet Music
- **Cognitive Load**: Visible Notes (pitches you have found remain visible) vs. Hidden Notes

## 2\. Core Mechanics

  * **Dual Modality:**
      * **Window Mode (Position):** Logic relies on **Pitch Classes** (0-11). The playable area is restricted to `[Anchor - 3, Anchor + 3]`.
      * **Octave Mode (Absolute):** Logic relies on **MIDI Integers**. The entire fretboard is active, and the user must find the exact pitch frequency requested (e.g., finding MIDI 40 vs MIDI 52).
  * **Cognitive Load Toggles:**
      * **Sheet Music:** Renders a dynamic VexFlow Stave (Treble Clef 8vb), forcing the user to translate standard notation to fretboard positions.
      * **Conditional Disclosure (Hidden Mode):** Hides user guesses until "Check Answer" is pressed. This prevents "brute-forcing" intervals and forces the user to visualize the solution mentally before committing.
  * **Feedback Loop:**
      * **Hit:** Solid color dot (matches target color).
      * **Miss (Ghost):** Semi-transparent filled dot (shows what you missed).
      * **False Positive:** Dark Grey dot (indicates error).

## 3\. Codebase Structure

### `src/hooks/useFretboardGame.ts`

This hook is the single source of truth. It exports `roundData` and `gameState`.

  * **Round Generation (`createRoundData`):**
      * **Constraint - Unique Letters:** To prevent reading confusion on the staff, the generator strictly prevents collision of letter names. (e.g., A round cannot contain both `C` and `C#` simultaneously).
      * **Accidental Resolution:** If `accidentalMode` is set to 'BOTH', this function resolves a boolean `useFlats` for the specific round to ensure consistency (all sharps or all flats per round).
  * **State Management:**
      * `gameState`: 'GUESSING' | 'REVEALED'
      * `clickedFrets`: Array of `{ stringIndex, fret }`.
      * `history/streak`: Persists win streaks.

### `src/components/FretboardGame.tsx`

The main container. It implements a **Sidebar Layout** (Left nav on desktop, Top block on mobile).

  * **Grid Rendering:** Renders a 6x15 grid.
      * **Strings:** Rendered as absolute positioned divs with varying height (`1px` to `6px`) to simulate gauge.
      * **Interactive Zones:** Each fret intersection is a clickable zone.
  * **Visual Logic:**
      * Handles the mapping of `clickedFrets` to visual styles (Opacity/Color).
      * Implements the "Ghost" logic (showing where the user *should* have clicked after the round ends).

### `src/components/SheetMusic.tsx`

A wrapper around **VexFlow**.

  * **Rendering Strategy:** Uses a `useEffect` hook to clear and redraw the canvas whenever `notes` props change.
  * **Guitar Transposition:** The guitar is a transposing instrument.
      * *Sounding* Middle C = MIDI 60.
      * *Written* Middle C = MIDI 72.
      * This component automatically applies a **+12 Semitone offset** to incoming MIDI data so it appears correctly on the Treble 8vb clef.
  * **Chord Stacking:** Notes are sorted by pitch and rendered as a single "Chord" (`StaveNote`) to ensure they share a stem, but color styles are applied to individual note heads.

## 4\. Key Data Structures

**Tuning Array**
We map array indices `0-5` to visual rows `Top-Bottom`.

```typescript
// Index 0 is High E (MIDI 64) -> Top visual string
// Index 5 is Low E (MIDI 40) -> Bottom visual string
const TUNING = [64, 59, 55, 50, 45, 40];
```

**Note Data**
Game logic uses standard MIDI numbers.

  * **Low E (Open):** 40
  * **Middle C:** 60
  * **High E (12th Fret):** 76
