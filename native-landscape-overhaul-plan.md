# Native Landscape Overhaul Plan

## Scope
Implement the finalized native UX architecture for landscape-first operation:
- Left collapsible side navbar with chevron.
- Trainer, Sandbox, and Quiz with horizontal split: sheet music pane | fretboard pane.
- Independent sheet-pane chevron collapse for Trainer, Sandbox, and Quiz.
- Shared fretboard aesthetic centralized from commit 13800ae7e3bb2a4eaa79cbb3f8a3b32c5d0dd14b.
- Tiny top action headers per mode with requested controls.
- Remove history and streak from app layout.

## Confirmed Decisions (via VS Code questions)
- Default panel states: Remember last state per mode.
- Gallery and Visual chord list control: Header opens full chord list modal.
- Trainer hamburger includes: note count, game mode, accidentals, hide guesses, clear guesses.
- Sandbox hamburger includes: open chord library, one note per string, clear selection, see in gallery.
- Quiz submit flow: popup modal opened by header button.

## Goals
1. Replace floating modal shell nav with fixed left side navbar and collapse chevron.
2. Add reusable split-pane layout for Trainer/Sandbox/Quiz with persisted collapse state per mode.
3. Update shared native fretboard visuals to match legacy aesthetic and reuse in all three modes.
4. Rebuild Trainer tiny header: Check Answer, Sheet Music, hamburger menu with selected items.
5. Rebuild Sandbox tiny header: Detected Chord, NoteSequence, hamburger menu with selected items.
6. Rebuild Quiz tiny header: Actual Answer, Submit Answer button (popup form), hamburger for root string constraints.
7. Rebuild Gallery tiny header: chord list modal trigger, gallery colors toggle, gallery key selector, hamburger for diatonic toggle.
8. Rebuild Visual Archetype tiny header: chord list modal trigger, gallery colors toggle, gallery key selector, root strings filter, no hamburger.
9. Remove history and streak UI sections from app layout.
10. Keep deploy script functionality intact and run validation checks.

## Execution Order
1. Shared layout + visual primitives.
2. App shell/nav refactor.
3. Trainer, Sandbox, Quiz refactors.
4. Gallery and Visual action-strip refactors.
5. Validation + goal audit.

## Audit Checklist
- [x] Goal 1 passed
- [x] Goal 2 passed
- [x] Goal 3 passed
- [x] Goal 4 passed
- [x] Goal 5 passed
- [x] Goal 6 passed
- [x] Goal 7 passed
- [x] Goal 8 passed
- [x] Goal 9 passed
- [x] Goal 10 passed
