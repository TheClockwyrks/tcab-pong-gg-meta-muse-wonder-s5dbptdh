# Carom

Carom is a top-down paddle duel that runs entirely in the browser. Two paddles
face each other across a dark 1280×720 field while a ball ricochets between
them, off the top and bottom walls, and off a pair of fixed amber obstacles in
the middle of the field. Score by sending the ball past the far edge behind
your opponent's paddle. First to 11 points, ahead by at least 2, wins.

Carom's signature mechanic is **spin**: strike the ball while your paddle is
moving and its flight curves afterward — downward motion bends it down,
upward motion bends it up, and the curve fades over about a second. Combined
with the two obstacles, that turns every rally into a bank-shot puzzle: spin a
shot around a block, or bounce it off a block and a wall to beat a guard who
is reading the straight line.

Play **Solo** against an AI that tracks incoming balls and returns to center
when play goes the other way, or **Versus** with two players sharing one
keyboard.

## Install

```sh
npm ci
```

## Run in development

```sh
npm run dev
```

Then open the URL Vite prints. Use `npm run preview` to serve a production
build locally.

## Production build

```sh
npm ci
npm run build
```

This type-checks the project and emits the complete static site into `dist/`,
with `index.html` at its root. Serve that directory as-is from any static
file server — no backend, accounts, or API keys are needed. Everything is
drawn in code on a canvas and all sound is synthesized; the build ships no
art or audio files and fetches nothing at runtime.

## Controls

| Action                 | Keys                          |
| ---------------------- | ----------------------------- |
| Player 1 (left) up     | `W` (or `↑` in Solo)          |
| Player 1 (left) down   | `S` (or `↓` in Solo)          |
| Player 2 (right) up    | `↑` (Versus)                  |
| Player 2 (right) down  | `↓` (Versus)                  |
| Confirm menu item      | `Enter` or `Space`            |
| Back                   | `Esc`                         |
| Pause / resume         | `P` or `Esc`                  |
| Mute                   | `M`                           |

Menus also work with a mouse (move to highlight, click to confirm) and with
touch. On touchscreens the engine shows a vertical slider for each paddle and
on-screen menu buttons. Backtick (`` ` ``) toggles the engine's debug overlay.

## Developing

- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint
- `npm run format` — Prettier, in check mode
- `npm test` — Vitest unit tests over `src/`, with coverage

The game is implemented in `src/game.ts` on the Simple 2D engine; see
`specs/` for the full specification and `showcase/` for the store-page
presentation.
