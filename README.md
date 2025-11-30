# Fretboard Game

**Goal:** Webapp to gamify learning the fretboard
**Stack:** React, TypeScript, Tailwind CSS

## 1\. Game Concept

"Fretboard Focus" is a sight-reading trainer that simulates the cognitive constraints of reading sheet music. Unlike standard trainers that ask for notes anywhere on the neck, this game restricts the player to a **"Hand Window"** (a 7-fret span).

The goal is to identify notes relative to a fixed hand position practically rather than memorizing the whole fretboard at once.

## 2\. Core Mechanics

  * **The Window:** Every round generates a random **Anchor Fret**. The playable area is restricted to the fret range: `[Anchor - 3, Anchor + 3]`.
  * **The Anchor Constraint:** The "Index Finger" position (Fret `N` on the 1st String) is visually marked with a **Red Dot**. This simulates the physical hand anchor.
  * **Target Notes:** The player must find **all** instances of specific pitch classes (e.g., "C" and "F\#") within the active window.
  * **Feedback Loop:**
      * **Hit:** Solid color dot (matches target color).
      * **Miss (Ghost):** Semi-transparent filled dot (shows what you missed).
      * **False Positive:** Dark Grey dot (indicates error).

## 3\. Codebase Structure

### `src/hooks/useFretboardGame.ts`

Contains all game logic, state management, and separation of side effects.

  * **State:** Manages `gameState` ('GUESSING' vs 'REVEALED'), `streak`, and `clickedFrets`.
  * **Round Generation:**
      * `createRoundData`: A pure helper function that generates random target notes, a random anchor fret, and shuffles color indices to ensure the visual state is consistent with the logical state.
  * **Validation Logic:** `submitGuess` calculates all correct coordinates in the window (using the Tuning array) and compares them against user clicks to determine win/loss.
  * **State Updates:** Handles the "Note Count" stepper logic, ensuring immediate round regeneration when parameters change.

### `src/components/FretboardGame.tsx`

standard HTML/CSS borders to simulate a fretboard diagram.

  * **Visual Configuration:** Defines the `SAFE_PALETTE` (Blue, Orange, Purple, etc.) excluding Red (reserved for Anchor).
  * **Grid Rendering:** Renders a 6x15 grid (fret 0-14 x 6 strings).
      * **Strings:** Rendered as `divs` with varying heights (1px to 6px) to represent string gauge (High E to Low E).
      * **Frets:** Rendered using `border-right` on flex items.
  * **Color Mapping:** Consumes `colorIndices` from the hook to assign a consistent color to a specific target note (e.g., "A" is always Blue for the duration of that round).
  * **Interaction:** Handles clicks, visual "dimming" of inactive frets, and displaying the HUD.

### `src/App.tsx`

A lightweight wrapper.

  * Sets the global container styles (Background White, Full Height).
  * Mounts `FretboardGame`.

## 4\. Other Implementation Details

**Tuning Array (Visual Orientation)**
We map the array indices `0-5` to the visual rows `Top-Bottom`. Since the top string on a guitar chart is the **High E**:

```typescript
// Index 0 is High E (MIDI 64), Index 5 is Low E (MIDI 40)
const TUNING = [64, 59, 55, 50, 45, 40];
```

**Pure Rendering & Colors**
To avoid React "impure render" warnings, we do **not** randomize colors inside the component render cycle. Color indices are generated once in the hook during `createRoundData` and passed down as props. This ensures the UI is deterministic.
