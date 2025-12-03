# Fretboard Game

https://dustinbs.github.io/Fret-game/

**Goal:** Webapp to gamify learning the fretboard
**Stack:** React, TypeScript, Tailwind CSS

Here is the updated **Contributor Guide**. I have rewritten the "Game Concept" to prioritize the multi-modal nature of the app (specifically highlighting Octave Mode) and adjusted the rest of the document to match the current state of the codebase.

-----

# Fretboard Focus - Contributor Guide

**Goal:** A webapp to gamify sight-reading and fretboard visualization.

**Stack:** React, TypeScript, Tailwind CSS, VexFlow (Music Notation)

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