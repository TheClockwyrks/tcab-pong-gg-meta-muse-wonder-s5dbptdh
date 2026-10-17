// Carom — a top-down paddle duel. See specs/ for the full specification.

import type {
  Game,
  InitApi,
  RenderApi,
  UpdateApi,
} from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import {
  AI_DEADZONE,
  AI_HOME_DEADZONE,
  AI_HOME_Y,
  AI_REACT,
  AI_SPEED,
  ACTIONS,
  BALL_R,
  BINDINGS,
  CAROM_DEBUG_VERSION,
  CUES,
  FIELD_CX,
  FIELD_CY,
  FIELD_H,
  FIELD_W,
  HOLD_TIME,
  MATCHOVER_ITEMS,
  MAX_BOUNCE_ANGLE,
  MAX_SUBSTEP,
  NET_X,
  OBSTACLE_CENTERS,
  OBSTACLES,
  P1_X0,
  P1_X1,
  P2_X0,
  P2_X1,
  PADDLE_HALF,
  PADDLE_MAX_CY,
  PADDLE_MIN_CY,
  PADDLE_SPEED,
  PAUSE_ITEMS,
  SERVE_ANGLE,
  SERVE_SPEED,
  SPEED_CAP,
  SPEED_MULT,
  SPIN_CLAMP,
  SPIN_FROM_PADDLE,
  SPIN_HALFLIFE,
  TITLE_ITEMS,
  TITLE_TEXT,
  TRAIL_TIME,
  WIN_LEAD,
  WIN_SCORE,
} from "./constants";

export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";

export type Mode = "solo" | "versus";

export type Side = "left" | "right";

export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}

export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}

export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}

export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}

export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
}

export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";

  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;

  readonly paddles: { readonly left: PaddleState; readonly right: PaddleState };
  readonly ai: AiState;

  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];

  readonly simTime: number;
  readonly muted: boolean;
}

export interface Snapshot {
  version: number;
  screen: Screen;
  mode: Mode;
  menuIndex: number;
  titleIndex: number;
  resumeScreen: "countdown" | "playing";
  score: { p1: number; p2: number };
  winner: Side | null;
  muted: boolean;
  paddles: {
    left: { cy: number; vy: number; drivenVy: number; driven: boolean };
    right: { cy: number; vy: number; drivenVy: number; driven: boolean };
  };
  ai: { tracking: boolean; movement: boolean };
  receiver: Side;
  ball: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    speed: number;
    spin: number;
    held: boolean;
    holdTimer: number;
    serveSign: 1 | -1;
    trail: { x: number; y: number; t: number }[];
  } | null;
  obstacles: { index: number; cx: number; cy: number }[];
  simTime: number;
}

export interface MenuRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CaromDebugApi {
  version: number;
  clearWorld(state: DeepReadonly<CaromState>): CaromState;
  spawnBall(state: DeepReadonly<CaromState>): CaromState;
  spawnObstacle(state: DeepReadonly<CaromState>, index: number): CaromState;
  reset(state: DeepReadonly<CaromState>): CaromState;
  reconcile(state: DeepReadonly<CaromState>): CaromState;
  setScreen(state: DeepReadonly<CaromState>, screen: Screen): CaromState;
  setMode(state: DeepReadonly<CaromState>, mode: Mode): CaromState;
  setMenuIndex(state: DeepReadonly<CaromState>, index: number): CaromState;
  setTitleIndex(state: DeepReadonly<CaromState>, index: number): CaromState;
  setResumeScreen(
    state: DeepReadonly<CaromState>,
    screen: "countdown" | "playing",
  ): CaromState;
  setScore(state: DeepReadonly<CaromState>, p1: number, p2: number): CaromState;
  setWinner(state: DeepReadonly<CaromState>, side: Side | null): CaromState;
  setReceiver(state: DeepReadonly<CaromState>, side: Side): CaromState;
  setPaddleCy(
    state: DeepReadonly<CaromState>,
    side: Side,
    cy: number,
  ): CaromState;
  setPaddleVy(
    state: DeepReadonly<CaromState>,
    side: Side,
    vy: number,
  ): CaromState;
  setPaddleDriven(
    state: DeepReadonly<CaromState>,
    side: Side,
    driven: boolean,
  ): CaromState;
  setBallPosition(
    state: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallVelocity(
    state: DeepReadonly<CaromState>,
    vx: number,
    vy: number,
  ): CaromState;
  setBallSpin(state: DeepReadonly<CaromState>, spin: number): CaromState;
  setBallHeld(state: DeepReadonly<CaromState>, held: boolean): CaromState;
  setBallHoldTimer(
    state: DeepReadonly<CaromState>,
    seconds: number,
  ): CaromState;
  setBallServeSign(state: DeepReadonly<CaromState>, sign: 1 | -1): CaromState;
  drawBallServeSign(state: DeepReadonly<CaromState>): CaromState;
  setAiTracking(state: DeepReadonly<CaromState>, enabled: boolean): CaromState;
  setAiMovement(state: DeepReadonly<CaromState>, enabled: boolean): CaromState;
  setMuted(state: DeepReadonly<CaromState>, muted: boolean): CaromState;
  snapshot(state: DeepReadonly<CaromState>): Snapshot;
  menuItemRect(state: DeepReadonly<CaromState>, index: number): MenuRect | null;
}

export const BACKGROUND = "#0a0e1e";

const P1_COLOR = "#22d3ee";
const P2_COLOR = "#fb7185";
const OBSTACLE_COLOR = "#f59e0b";
const BALL_COLOR = "#fef08a";
const TEXT_COLOR = "#e2e8f0";
const DIM_COLOR = "#94a3b8";

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type Draft = Mutable<CaromState>;

function drawServeSign(): 1 | -1 {
  return Math.random() < 0.5 ? -1 : 1;
}

function parkedBall(): BallState {
  return {
    x: FIELD_CX,
    y: FIELD_CY,
    vx: 0,
    vy: 0,
    spin: 0,
    held: true,
    holdTimer: HOLD_TIME,
    serveSign: drawServeSign(),
    trail: [],
  };
}

function allObstacles(): ObstacleState[] {
  return OBSTACLE_CENTERS.map((c, index) => ({ index, cx: c.x, cy: c.y }));
}

function initialState(muted: boolean): CaromState {
  return {
    screen: "title",
    mode: "solo",
    menuIndex: 0,
    titleIndex: 0,
    resumeScreen: "playing",
    score: { p1: 0, p2: 0 },
    winner: null,
    paddles: {
      left: { cy: FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
      right: { cy: FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
    },
    ai: { tracking: true, movement: true },
    receiver: "left",
    ball: parkedBall(),
    obstacles: allObstacles(),
    simTime: 0,
    muted,
  };
}

function menuCount(screen: Screen): number {
  switch (screen) {
    case "title":
      return TITLE_ITEMS.length;
    case "howto":
      return 1;
    case "paused":
      return PAUSE_ITEMS.length;
    case "matchover":
      return MATCHOVER_ITEMS.length;
    default:
      return 0;
  }
}

function menuItems(screen: Screen): readonly string[] {
  switch (screen) {
    case "title":
      return TITLE_ITEMS;
    case "howto":
      return ["BACK"];
    case "paused":
      return PAUSE_ITEMS;
    case "matchover":
      return MATCHOVER_ITEMS;
    default:
      return [];
  }
}

/** The one layout render, the debug surface, and pointer input all share. */
export function menuRectFor(screen: Screen, index: number): MenuRect | null {
  const count = menuCount(screen);
  if (count === 0 || index < 0 || index >= count) return null;
  const starts: Record<string, number> = {
    title: 396,
    howto: 584,
    paused: 308,
    matchover: 392,
  };
  const startY = starts[screen] ?? 320;
  return { x: 440, y: startY + index * 70, w: 400, h: 56 };
}

function requireBall(state: DeepReadonly<CaromState>): BallState {
  if (!state.ball) throw new Error("Carom: no ball on the field");
  return state.ball as BallState;
}

function withBall(
  state: DeepReadonly<CaromState>,
  patch: Partial<BallState>,
): CaromState {
  const ball = requireBall(state);
  return { ...(state as CaromState), ball: { ...ball, ...patch } };
}

function withPaddle(
  state: DeepReadonly<CaromState>,
  side: Side,
  patch: Partial<PaddleState>,
): CaromState {
  const s = state as CaromState;
  return {
    ...s,
    paddles: { ...s.paddles, [side]: { ...s.paddles[side], ...patch } },
  };
}

const debug: CaromDebugApi = {
  version: CAROM_DEBUG_VERSION,
  clearWorld: (s) => ({ ...(s as CaromState), ball: null, obstacles: [] }),
  spawnBall: (s) => ({ ...(s as CaromState), ball: parkedBall() }),
  spawnObstacle: (s, index) => {
    if (index !== 0 && index !== 1) {
      throw new Error(`Carom: no obstacle with index ${index}`);
    }
    const center = OBSTACLE_CENTERS[index];
    if (!center) throw new Error(`Carom: no obstacle with index ${index}`);
    const rest = (s.obstacles as ObstacleState[]).filter(
      (o) => o.index !== index,
    );
    return {
      ...(s as CaromState),
      obstacles: [...rest, { index, cx: center.x, cy: center.y }].sort(
        (a, b) => a.index - b.index,
      ),
    };
  },
  reset: (s) => initialState(s.muted),
  reconcile: (s) => ({ ...(s as CaromState) }),
  setScreen: (s, screen) => ({ ...(s as CaromState), screen }),
  setMode: (s, mode) => ({ ...(s as CaromState), mode }),
  setMenuIndex: (s, index) => ({ ...(s as CaromState), menuIndex: index }),
  setTitleIndex: (s, index) => ({ ...(s as CaromState), titleIndex: index }),
  setResumeScreen: (s, resumeScreen) => ({
    ...(s as CaromState),
    resumeScreen,
  }),
  setScore: (s, p1, p2) => ({ ...(s as CaromState), score: { p1, p2 } }),
  setWinner: (s, winner) => ({ ...(s as CaromState), winner }),
  setReceiver: (s, receiver) => ({ ...(s as CaromState), receiver }),
  setPaddleCy: (s, side, cy) => withPaddle(s, side, { cy }),
  setPaddleVy: (s, side, vy) => withPaddle(s, side, { drivenVy: vy }),
  setPaddleDriven: (s, side, driven) => withPaddle(s, side, { driven }),
  setBallPosition: (s, x, y) => withBall(s, { x, y }),
  setBallVelocity: (s, vx, vy) => withBall(s, { vx, vy }),
  setBallSpin: (s, spin) => withBall(s, { spin }),
  setBallHeld: (s, held) => withBall(s, { held }),
  setBallHoldTimer: (s, holdTimer) => withBall(s, { holdTimer }),
  setBallServeSign: (s, serveSign) => withBall(s, { serveSign }),
  drawBallServeSign: (s) => withBall(s, { serveSign: drawServeSign() }),
  setAiTracking: (s, tracking) => ({
    ...(s as CaromState),
    ai: { ...(s.ai as AiState), tracking },
  }),
  setAiMovement: (s, movement) => ({
    ...(s as CaromState),
    ai: { ...(s.ai as AiState), movement },
  }),
  setMuted: (s, muted) => ({ ...(s as CaromState), muted }),
  snapshot: (s) => ({
    version: CAROM_DEBUG_VERSION,
    screen: s.screen,
    mode: s.mode,
    menuIndex: s.menuIndex,
    titleIndex: s.titleIndex,
    resumeScreen: s.resumeScreen,
    score: { p1: s.score.p1, p2: s.score.p2 },
    winner: s.winner,
    muted: s.muted,
    paddles: {
      left: { ...s.paddles.left },
      right: { ...s.paddles.right },
    },
    ai: { ...s.ai },
    receiver: s.receiver,
    ball: s.ball
      ? {
          x: s.ball.x,
          y: s.ball.y,
          vx: s.ball.vx,
          vy: s.ball.vy,
          speed: Math.hypot(s.ball.vx, s.ball.vy),
          spin: s.ball.spin,
          held: s.ball.held,
          holdTimer: s.ball.holdTimer,
          serveSign: s.ball.serveSign,
          trail: s.ball.trail.map((t) => ({ x: t.x, y: t.y, t: t.t })),
        }
      : null,
    obstacles: s.obstacles.map((o) => ({ index: o.index, cx: o.cx, cy: o.cy })),
    simTime: s.simTime,
  }),
  menuItemRect: (s, index) => menuRectFor(s.screen, index),
};

// Pending pointer/touch press regions, keyed by the state value they were
// recorded against so no game value lives outside the state chain. A press
// and its release may land on different frames; the region the press landed
// in is needed to tell a confirm from a drag between two items.
const pendingPresses = new WeakMap<object, Map<number, number | null>>();

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function integratePaddle(
  p: PaddleState,
  desiredVy: number,
  dt: number,
): PaddleState {
  const unclamped = p.cy + desiredVy * dt;
  const next = clamp(unclamped, PADDLE_MIN_CY, PADDLE_MAX_CY);
  let vy = desiredVy;
  if (next !== unclamped && dt > 0) vy = (next - p.cy) / dt;
  return { ...p, cy: next, vy };
}

function startMatch(draft: Draft, mode: Mode): void {
  draft.mode = mode;
  draft.screen = "countdown";
  draft.resumeScreen = "playing";
  draft.menuIndex = 0;
  draft.score = { p1: 0, p2: 0 };
  draft.winner = null;
  draft.receiver = "left";
  draft.ball = parkedBall();
  draft.paddles = {
    left: { ...draft.paddles.left, cy: FIELD_CY, vy: 0 },
    right: { ...draft.paddles.right, cy: FIELD_CY, vy: 0 },
  };
}

function returnToTitle(draft: Draft): void {
  const fresh = initialState(draft.muted);
  const titleIndex = draft.titleIndex;
  draft.screen = fresh.screen;
  draft.mode = fresh.mode;
  draft.resumeScreen = fresh.resumeScreen;
  draft.score = fresh.score;
  draft.winner = fresh.winner;
  draft.paddles = fresh.paddles;
  draft.ai = fresh.ai;
  draft.receiver = fresh.receiver;
  draft.ball = fresh.ball;
  draft.obstacles = fresh.obstacles;
  draft.menuIndex = titleIndex;
  // titleIndex, simTime, and muted keep their values.
}

/** Confirm the item at menuIndex, exactly as the keyboard table states. */
function confirmMenuItem(draft: Draft): void {
  const index = draft.menuIndex;
  if (draft.screen === "title") {
    draft.titleIndex = index;
    if (index === 0) startMatch(draft, "solo");
    else if (index === 1) startMatch(draft, "versus");
    else if (index === 2) {
      draft.screen = "howto";
      draft.menuIndex = 0;
    }
  } else if (draft.screen === "howto") {
    returnToTitle(draft);
  } else if (draft.screen === "paused") {
    if (index === 0) draft.screen = draft.resumeScreen;
    else if (index === 1) startMatch(draft, draft.mode);
    else if (index === 2) returnToTitle(draft);
  } else if (draft.screen === "matchover") {
    if (index === 0) startMatch(draft, draft.mode);
    else if (index === 1) returnToTitle(draft);
  }
}

interface CueFlags {
  paddle: boolean;
  wall: boolean;
  obstacle: boolean;
  score: boolean;
}

function movePaddles(draft: Draft, api: UpdateApi, dt: number): void {
  // Left paddle.
  const left = draft.paddles.left;
  let leftVy: number;
  if (left.driven) leftVy = left.drivenVy;
  else {
    const up =
      draft.mode === "solo"
        ? Math.max(api.input.value("p1-up"), api.input.value("p2-up"))
        : api.input.value("p1-up");
    const down =
      draft.mode === "solo"
        ? Math.max(api.input.value("p1-down"), api.input.value("p2-down"))
        : api.input.value("p1-down");
    leftVy = (down - up) * PADDLE_SPEED;
  }
  draft.paddles = { ...draft.paddles, left: integratePaddle(left, leftVy, dt) };

  // Right paddle.
  const right = draft.paddles.right;
  let rightVy: number;
  if (right.driven) rightVy = right.drivenVy;
  else if (draft.mode === "versus") {
    const up = api.input.value("p2-up");
    const down = api.input.value("p2-down");
    rightVy = (down - up) * PADDLE_SPEED;
  } else if (!draft.ai.movement) {
    rightVy = 0;
  } else {
    let target = AI_HOME_Y;
    let deadzone = AI_HOME_DEADZONE;
    const ball = draft.ball;
    if (
      draft.ai.tracking &&
      draft.screen === "playing" &&
      ball &&
      ball.vx > 0
    ) {
      target = ball.y - ball.vy * AI_REACT;
      deadzone = AI_DEADZONE;
    }
    const diff = target - right.cy;
    if (Math.abs(diff) <= deadzone) rightVy = 0;
    else if (dt > 0)
      rightVy = Math.sign(diff) * Math.min(AI_SPEED, Math.abs(diff) / dt);
    else rightVy = Math.sign(diff) * AI_SPEED;
  }
  draft.paddles = {
    ...draft.paddles,
    right: integratePaddle(right, rightVy, dt),
  };
}

function appendTrail(draft: Draft): void {
  const ball = draft.ball;
  if (!ball) return;
  const now = draft.simTime;
  const trail = [
    ...ball.trail.filter((t) => now - t.t <= TRAIL_TIME),
    { x: ball.x, y: ball.y, t: now },
  ];
  draft.ball = { ...ball, trail };
}

interface RectHit {
  face: "left" | "right" | "top" | "bottom";
}

/** Circle against an expanded axis-aligned rectangle; see specs/balls.md. */
function rectFace(
  x: number,
  y: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): RectHit | null {
  if (!(
    x > x0 - BALL_R &&
    x < x1 + BALL_R &&
    y > y0 - BALL_R &&
    y < y1 + BALL_R
  ))
    return null;
  const depths = [
    { face: "left" as const, d: x - (x0 - BALL_R) },
    { face: "right" as const, d: x1 + BALL_R - x },
    { face: "top" as const, d: y - (y0 - BALL_R) },
    { face: "bottom" as const, d: y1 + BALL_R - y },
  ];
  let best = depths[0] as (typeof depths)[number];
  for (const entry of depths) if (entry.d < best.d) best = entry;
  return { face: best.face };
}

function advanceBall(draft: Draft, dt: number, cues: CueFlags): void {
  const startBall = draft.ball;
  if (!startBall) return;
  const ball: Mutable<BallState> = { ...startBall, trail: startBall.trail };
  const startSpeed = Math.hypot(ball.vx, ball.vy);
  const n = Math.max(1, Math.ceil((startSpeed * dt) / MAX_SUBSTEP));
  const h = dt / n;

  for (let step = 0; step < n; step++) {
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed > 0) {
      const angle = (ball.spin / speed) * h;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const vx = ball.vx * cos - ball.vy * sin;
      const vy = ball.vx * sin + ball.vy * cos;
      ball.vx = vx;
      ball.vy = vy;
    }
    ball.spin *= Math.pow(0.5, h / SPIN_HALFLIFE);
    ball.x += ball.vx * h;
    ball.y += ball.vy * h;

    // Walls.
    if (ball.y - BALL_R < 0 && ball.vy < 0) {
      ball.y = BALL_R;
      ball.vy = -ball.vy;
      cues.wall = true;
    } else if (ball.y + BALL_R > FIELD_H && ball.vy > 0) {
      ball.y = FIELD_H - BALL_R;
      ball.vy = -ball.vy;
      cues.wall = true;
    }

    // Paddles.
    const paddleSpecs = [
      {
        side: "left" as Side,
        x0: P1_X0,
        x1: P1_X1,
        cy: draft.paddles.left.cy,
        vy: draft.paddles.left.vy,
        dir: 1,
        frontX: P1_X1 + BALL_R,
      },
      {
        side: "right" as Side,
        x0: P2_X0,
        x1: P2_X1,
        cy: draft.paddles.right.cy,
        vy: draft.paddles.right.vy,
        dir: -1,
        frontX: P2_X0 - BALL_R,
      },
    ];
    for (const p of paddleSpecs) {
      const hit = rectFace(
        ball.x,
        ball.y,
        p.x0,
        p.cy - PADDLE_HALF,
        p.x1,
        p.cy + PADDLE_HALF,
      );
      if (!hit) continue;
      if (hit.face === "left" || hit.face === "right") {
        const into =
          (hit.face === "left" && ball.vx > 0) ||
          (hit.face === "right" && ball.vx < 0);
        // Placement off the struck face happens either way.
        ball.x = hit.face === "left" ? p.x0 - BALL_R : p.x1 + BALL_R;
        if (!into) continue;
        const offset = clamp((ball.y - p.cy) / PADDLE_HALF, -1, 1);
        const theta = offset * MAX_BOUNCE_ANGLE;
        const newSpeed = Math.min(
          Math.hypot(ball.vx, ball.vy) * SPEED_MULT,
          SPEED_CAP,
        );
        ball.vx = p.dir * newSpeed * Math.cos(theta);
        ball.vy = newSpeed * Math.sin(theta);
        ball.spin = clamp(
          ball.spin + p.vy * SPIN_FROM_PADDLE,
          -SPIN_CLAMP,
          SPIN_CLAMP,
        );
        ball.x = p.frontX;
        cues.paddle = true;
      } else {
        const into =
          (hit.face === "top" && ball.vy > 0) ||
          (hit.face === "bottom" && ball.vy < 0);
        ball.y =
          hit.face === "top"
            ? p.cy - PADDLE_HALF - BALL_R
            : p.cy + PADDLE_HALF + BALL_R;
        if (into) {
          ball.vy = -ball.vy;
          cues.wall = true;
        }
      }
    }

    // Obstacles, in the order they are carried (index 0, then 1).
    const ordered = [...draft.obstacles].sort((a, b) => a.index - b.index);
    for (const obstacle of ordered) {
      const rect = OBSTACLES[obstacle.index];
      if (!rect) continue;
      const hit = rectFace(ball.x, ball.y, rect.x0, rect.y0, rect.x1, rect.y1);
      if (!hit) continue;
      if (hit.face === "left") {
        ball.x = rect.x0 - BALL_R;
        if (ball.vx > 0) {
          ball.vx = -ball.vx;
          cues.obstacle = true;
        }
      } else if (hit.face === "right") {
        ball.x = rect.x1 + BALL_R;
        if (ball.vx < 0) {
          ball.vx = -ball.vx;
          cues.obstacle = true;
        }
      } else if (hit.face === "top") {
        ball.y = rect.y0 - BALL_R;
        if (ball.vy > 0) {
          ball.vy = -ball.vy;
          cues.obstacle = true;
        }
      } else {
        ball.y = rect.y1 + BALL_R;
        if (ball.vy < 0) {
          ball.vy = -ball.vy;
          cues.obstacle = true;
        }
      }
    }
  }

  draft.ball = ball;
  appendTrail(draft);

  // Scoring.
  const scored = draft.ball;
  if (!scored) return;
  let scorer: Side | null = null;
  if (scored.x - BALL_R > FIELD_W) scorer = "left";
  else if (scored.x + BALL_R < 0) scorer = "right";
  if (!scorer) return;
  cues.score = true;
  const score = {
    p1: draft.score.p1 + (scorer === "left" ? 1 : 0),
    p2: draft.score.p2 + (scorer === "right" ? 1 : 0),
  };
  draft.score = score;
  const won =
    scorer === "left"
      ? score.p1 >= WIN_SCORE && score.p1 - score.p2 >= WIN_LEAD
      : score.p2 >= WIN_SCORE && score.p2 - score.p1 >= WIN_LEAD;
  if (won) {
    draft.winner = scorer;
    draft.screen = "matchover";
    draft.menuIndex = 0;
    // The ball is left where it is.
  } else {
    draft.receiver = scorer === "left" ? "right" : "left";
    draft.ball = parkedBall();
    draft.screen = "countdown";
  }
}

export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api: InitApi<CaromState>): [CaromState, CaromDebugApi] {
    for (const name of ACTIONS) {
      api.input.register(name, { keys: [...BINDINGS[name]] });
    }
    api.audio.define(CUES.paddleHit, {
      wave: "square",
      freq: 880,
      freqTo: 620,
      durationMs: 70,
      gain: 0.18,
    });
    api.audio.define(CUES.wallBounce, {
      wave: "sine",
      freq: 440,
      freqTo: 320,
      durationMs: 60,
      gain: 0.16,
    });
    api.audio.define(CUES.obstacleBounce, {
      wave: "triangle",
      freq: 300,
      freqTo: 190,
      durationMs: 85,
      gain: 0.2,
    });
    api.audio.define(CUES.score, {
      wave: "square",
      freq: 620,
      freqTo: 990,
      durationMs: 160,
      gain: 0.18,
    });
    api.diagnostics.register("screen", (s) => s.screen);
    api.diagnostics.register("mode", (s) => s.mode);
    api.diagnostics.register("score-p1", (s) => s.score.p1);
    api.diagnostics.register("score-p2", (s) => s.score.p2);
    api.diagnostics.register("ball-position", (s) =>
      s.ball ? `${s.ball.x.toFixed(1)}, ${s.ball.y.toFixed(1)}` : "none",
    );
    api.diagnostics.register("ball-velocity", (s) =>
      s.ball ? `${s.ball.vx.toFixed(1)}, ${s.ball.vy.toFixed(1)}` : "none",
    );
    api.diagnostics.register("ball-speed", (s) =>
      s.ball ? Math.hypot(s.ball.vx, s.ball.vy) : 0,
    );
    api.diagnostics.register("ball-spin", (s) => (s.ball ? s.ball.spin : 0));
    api.diagnostics.register("left-cy", (s) => s.paddles.left.cy);
    api.diagnostics.register("left-vy", (s) => s.paddles.left.vy);
    api.diagnostics.register("right-cy", (s) => s.paddles.right.cy);
    api.diagnostics.register("right-vy", (s) => s.paddles.right.vy);
    return [initialState(false), debug];
  },

  update(state, api, dt): CaromState {
    const draft: Draft = {
      ...(state as CaromState),
      score: { ...state.score },
      paddles: {
        left: { ...state.paddles.left },
        right: { ...state.paddles.right },
      },
      ai: { ...state.ai },
      obstacles: state.obstacles.map((o) => ({ ...o })),
      ball: state.ball ? { ...state.ball, trail: [...state.ball.trail] } : null,
    };
    draft.simTime = state.simTime + dt;

    // Mute is read on every screen.
    if (api.input.pressed("mute")) {
      api.audio.setMuted(!api.audio.muted());
      draft.muted = api.audio.muted();
    } else if (draft.muted !== api.audio.muted()) {
      // A debug pose moved the state's copy; push it to the runtime bit.
      api.audio.setMuted(draft.muted);
    }

    const startScreen = state.screen;
    const isMenu =
      startScreen === "title" ||
      startScreen === "howto" ||
      startScreen === "paused" ||
      startScreen === "matchover";

    // Pending pointer presses carried over from earlier frames.
    const presses = new Map(pendingPresses.get(state) ?? []);

    let keyboardConfirmed = false;
    let skipPointer = false;

    if (startScreen === "countdown" || startScreen === "playing") {
      if (api.input.pressed("pause")) {
        draft.resumeScreen = startScreen;
        draft.screen = "paused";
        draft.menuIndex = 0;
        skipPointer = true;
      }
      // `back` is not read on these screens; consume nothing for it.
    } else if (startScreen === "paused") {
      const pauseEdge = api.input.pressed("pause");
      const backEdge = api.input.pressed("back");
      if (pauseEdge || backEdge) {
        draft.screen = draft.resumeScreen;
        skipPointer = true;
      } else {
        const up = api.input.pressed("p1-up") || api.input.pressed("p2-up");
        const down =
          api.input.pressed("p1-down") || api.input.pressed("p2-down");
        const confirm = api.input.pressed("confirm");
        const count = menuCount("paused");
        if (up) draft.menuIndex = (draft.menuIndex - 1 + count) % count;
        else if (down) draft.menuIndex = (draft.menuIndex + 1) % count;
        else if (confirm) {
          confirmMenuItem(draft);
          keyboardConfirmed = true;
        }
      }
    } else if (startScreen === "title") {
      const up = api.input.pressed("p1-up") || api.input.pressed("p2-up");
      const down = api.input.pressed("p1-down") || api.input.pressed("p2-down");
      const confirm = api.input.pressed("confirm");
      api.input.pressed("back"); // read, and does nothing, on the title
      const count = menuCount("title");
      if (up) draft.menuIndex = (draft.menuIndex - 1 + count) % count;
      else if (down) draft.menuIndex = (draft.menuIndex + 1) % count;
      else if (confirm) {
        confirmMenuItem(draft);
        keyboardConfirmed = true;
      }
    } else if (startScreen === "howto") {
      const confirm = api.input.pressed("confirm");
      const back = api.input.pressed("back");
      if (confirm || back) {
        returnToTitle(draft);
        keyboardConfirmed = true;
      }
    } else if (startScreen === "matchover") {
      const up = api.input.pressed("p1-up") || api.input.pressed("p2-up");
      const down = api.input.pressed("p1-down") || api.input.pressed("p2-down");
      const confirm = api.input.pressed("confirm");
      const back = api.input.pressed("back");
      if (back) {
        returnToTitle(draft);
        skipPointer = true;
      } else {
        const count = menuCount("matchover");
        if (up) draft.menuIndex = (draft.menuIndex - 1 + count) % count;
        else if (down) draft.menuIndex = (draft.menuIndex + 1) % count;
        else if (confirm) {
          confirmMenuItem(draft);
          keyboardConfirmed = true;
        }
      }
    }

    // Pointer and touch, applied after the keyboard edges.
    if (isMenu && !skipPointer && !keyboardConfirmed) {
      const rectIndexAt = (x: number, y: number): number | null => {
        const count = menuCount(startScreen);
        for (let i = 0; i < count; i++) {
          const r = menuRectFor(startScreen, i);
          if (r && x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h)
            return i;
        }
        return null;
      };
      let selection: number | null = null;
      let pointerConfirm: number | null = null;
      for (const sample of api.input.pointerSamples()) {
        const at = rectIndexAt(sample.x, sample.y);
        if (sample.type === "down") {
          presses.set(sample.id, at);
          if (at !== null) selection = at;
        } else if (sample.type === "move") {
          if (at !== null) selection = at;
        } else {
          // up
          const started = presses.get(sample.id);
          presses.delete(sample.id);
          if (at !== null && started === at) pointerConfirm = at;
          if (at !== null) selection = at;
        }
      }
      for (const contact of api.input.pointerContacts()) {
        const at = rectIndexAt(contact.x, contact.y);
        if (at !== null) selection = at;
      }
      if (selection !== null) draft.menuIndex = selection;
      if (pointerConfirm !== null) {
        draft.menuIndex = pointerConfirm;
        confirmMenuItem(draft);
      }
    } else if (!isMenu) {
      // Track presses outside menus only to keep the map from going stale.
      for (const sample of api.input.pointerSamples()) {
        if (sample.type === "down") presses.set(sample.id, null);
        else if (sample.type === "up") presses.delete(sample.id);
      }
    }

    // Advance the screen the input left us on.
    const cues: CueFlags = {
      paddle: false,
      wall: false,
      obstacle: false,
      score: false,
    };
    if (draft.screen === "countdown") {
      movePaddles(draft, api, dt);
      const ball = draft.ball;
      if (ball) {
        const timer = ball.holdTimer - dt;
        if (timer <= 0) {
          const dir = draft.receiver === "left" ? -1 : 1;
          draft.ball = {
            ...ball,
            holdTimer: 0,
            held: false,
            trail: [],
            vx: dir * SERVE_SPEED * Math.cos(SERVE_ANGLE),
            vy: ball.serveSign * SERVE_SPEED * Math.sin(SERVE_ANGLE),
          };
          draft.screen = "playing";
        } else {
          draft.ball = { ...ball, holdTimer: timer };
          appendTrail(draft);
        }
      }
    } else if (draft.screen === "playing") {
      movePaddles(draft, api, dt);
      advanceBall(draft, dt, cues);
    }

    if (cues.paddle) api.audio.play(CUES.paddleHit);
    if (cues.wall) api.audio.play(CUES.wallBounce);
    if (cues.obstacle) api.audio.play(CUES.obstacleBounce);
    if (cues.score) api.audio.play(CUES.score);

    const result: CaromState = {
      screen: draft.screen,
      mode: draft.mode,
      menuIndex: draft.menuIndex,
      titleIndex: draft.titleIndex,
      resumeScreen: draft.resumeScreen,
      score: draft.score,
      winner: draft.winner,
      paddles: draft.paddles,
      ai: draft.ai,
      receiver: draft.receiver,
      ball: draft.ball,
      obstacles: draft.obstacles,
      simTime: draft.simTime,
      muted: draft.muted,
    };
    pendingPresses.set(result, presses);
    return result;
  },

  render(state, api): void {
    drawScene(state as CaromState, api);
  },
};

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function drawField(
  ctx: CanvasRenderingContext2D,
  state: CaromState,
  dim: boolean,
): void {
  ctx.save();
  if (dim) ctx.globalAlpha = 0.45;
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, FIELD_W - 4, FIELD_H - 4);

  // Net.
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 4;
  ctx.setLineDash([18, 16]);
  ctx.beginPath();
  ctx.moveTo(NET_X, 12);
  ctx.lineTo(NET_X, FIELD_H - 12);
  ctx.stroke();
  ctx.setLineDash([]);

  // Obstacles.
  for (const obstacle of state.obstacles) {
    const rect = OBSTACLES[obstacle.index];
    if (!rect) continue;
    ctx.fillStyle = OBSTACLE_COLOR;
    roundRectPath(
      ctx,
      rect.x0,
      rect.y0,
      rect.x1 - rect.x0,
      rect.y1 - rect.y0,
      8,
    );
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    roundRectPath(ctx, rect.x0 + 4, rect.y0 + 6, rect.x1 - rect.x0 - 8, 10, 5);
    ctx.fill();
  }

  // Ball trail.
  const ball = state.ball;
  if (ball && ball.trail.length > 1) {
    for (let i = 1; i < ball.trail.length; i++) {
      const a = ball.trail[i - 1] as TrailSample;
      const b = ball.trail[i] as TrailSample;
      ctx.strokeStyle = `rgba(254, 240, 138, ${(0.12 + 0.5 * (i / ball.trail.length)).toFixed(3)})`;
      ctx.lineWidth = 3 + 5 * (i / ball.trail.length);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  // Paddles.
  ctx.fillStyle = P1_COLOR;
  roundRectPath(
    ctx,
    P1_X0,
    state.paddles.left.cy - PADDLE_HALF,
    P1_X1 - P1_X0,
    PADDLE_HALF * 2,
    8,
  );
  ctx.fill();
  ctx.fillStyle = P2_COLOR;
  roundRectPath(
    ctx,
    P2_X0,
    state.paddles.right.cy - PADDLE_HALF,
    P2_X1 - P2_X0,
    PADDLE_HALF * 2,
    8,
  );
  ctx.fill();

  // Ball.
  if (ball) {
    ctx.save();
    ctx.shadowColor = BALL_COLOR;
    ctx.shadowBlur = 18;
    ctx.fillStyle = BALL_COLOR;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (ball.spin !== 0) {
      ctx.strokeStyle = ball.spin > 0 ? "#f97316" : "#38bdf8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R + 5, -0.6, 0.9);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawHud(ctx: CanvasRenderingContext2D, state: CaromState): void {
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "700 64px system-ui, sans-serif";
  ctx.fillStyle = P1_COLOR;
  ctx.fillText(String(state.score.p1), FIELD_CX - 110, 22);
  ctx.fillStyle = P2_COLOR;
  ctx.fillText(String(state.score.p2), FIELD_CX + 110, 22);
  ctx.font = "600 20px system-ui, sans-serif";
  ctx.fillStyle = DIM_COLOR;
  ctx.fillText(state.mode === "solo" ? "SOLO" : "VERSUS", FIELD_CX, 100);
}

function drawMenuItems(ctx: CanvasRenderingContext2D, state: CaromState): void {
  const items = menuItems(state.screen);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  items.forEach((label, index) => {
    const r = menuRectFor(state.screen, index);
    if (!r) return;
    const selected = index === state.menuIndex;
    ctx.fillStyle = selected ? "#facc15" : "rgba(30, 41, 59, 0.92)";
    roundRectPath(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fill();
    if (selected) {
      ctx.strokeStyle = "#fef08a";
      ctx.lineWidth = 3;
      roundRectPath(ctx, r.x, r.y, r.w, r.h, 12);
      ctx.stroke();
    }
    ctx.fillStyle = selected ? "#111827" : TEXT_COLOR;
    ctx.font = "700 26px system-ui, sans-serif";
    ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 1);
  });
}

function drawCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  font: string,
  color: string,
): void {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, FIELD_CX, y);
}

function drawScene(state: CaromState, api: RenderApi): void {
  const ctx = api.ctx;
  const inMatch =
    state.screen === "playing" ||
    state.screen === "countdown" ||
    state.screen === "paused" ||
    state.screen === "matchover";
  drawField(ctx, state, state.screen === "title" || state.screen === "howto");
  if (inMatch) drawHud(ctx, state);

  if (state.screen === "title") {
    ctx.fillStyle = "rgba(4, 6, 16, 0.45)";
    ctx.fillRect(0, 0, FIELD_W, FIELD_H);
    drawCentered(
      ctx,
      TITLE_TEXT,
      190,
      "900 110px system-ui, sans-serif",
      "#f8fafc",
    );
    drawCentered(
      ctx,
      "Curve the ball. Bank it past the blocks.",
      272,
      "500 26px system-ui, sans-serif",
      "#facc15",
    );
    drawCentered(
      ctx,
      "First to 11, by 2  ·  W/S or ↑/↓  ·  P pause  ·  M mute",
      330,
      "500 19px system-ui, sans-serif",
      DIM_COLOR,
    );
    drawMenuItems(ctx, state);
  } else if (state.screen === "howto") {
    ctx.fillStyle = "rgba(4, 6, 16, 0.82)";
    ctx.fillRect(0, 0, FIELD_W, FIELD_H);
    drawCentered(
      ctx,
      "HOW TO PLAY",
      92,
      "800 52px system-ui, sans-serif",
      "#f8fafc",
    );
    const lines = [
      "SOLO: move the left paddle with W/S (or ↑/↓). The AI guards the right.",
      "VERSUS: left player W/S, right player ↑/↓ — one keyboard, two players.",
      "Score by sending the ball past the far edge. First to 11, ahead by 2.",
      "",
      "SPIN — Carom's signature: strike the ball while your paddle is moving",
      "and its flight curves afterward. Downward motion bends it down,",
      "upward motion bends it up. Spin fades over about a second.",
      "",
      "BANK SHOTS: the two amber blocks never move. Bounce the ball off",
      "them — and off the top and bottom walls — to curve around a guard.",
      "",
      "P or Esc pauses · M mutes · Enter/Space confirms",
    ];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "500 23px system-ui, sans-serif";
    ctx.fillStyle = TEXT_COLOR;
    lines.forEach((line, i) => ctx.fillText(line, FIELD_CX, 160 + i * 30));
    drawMenuItems(ctx, state);
  } else if (state.screen === "countdown") {
    drawCentered(
      ctx,
      "GET READY",
      150,
      "800 34px system-ui, sans-serif",
      "rgba(226, 232, 240, 0.85)",
    );
  } else if (state.screen === "paused") {
    ctx.fillStyle = "rgba(4, 6, 16, 0.62)";
    ctx.fillRect(0, 0, FIELD_W, FIELD_H);
    drawCentered(
      ctx,
      "PAUSED",
      218,
      "800 56px system-ui, sans-serif",
      "#f8fafc",
    );
    drawMenuItems(ctx, state);
  } else if (state.screen === "matchover") {
    ctx.fillStyle = "rgba(4, 6, 16, 0.62)";
    ctx.fillRect(0, 0, FIELD_W, FIELD_H);
    const winnerText =
      state.winner === "left"
        ? state.mode === "solo"
          ? "YOU WIN!"
          : "PLAYER 1 WINS!"
        : state.mode === "solo"
          ? "AI WINS"
          : "PLAYER 2 WINS!";
    drawCentered(
      ctx,
      winnerText,
      218,
      "800 58px system-ui, sans-serif",
      "#facc15",
    );
    drawCentered(
      ctx,
      `${state.score.p1}  —  ${state.score.p2}`,
      292,
      "700 44px system-ui, sans-serif",
      TEXT_COLOR,
    );
    drawMenuItems(ctx, state);
  } else if (state.screen === "playing") {
    if (state.ball && Math.abs(state.ball.spin) > 120) {
      ctx.textAlign = "center";
      ctx.font = "600 17px system-ui, sans-serif";
      ctx.fillStyle = "rgba(248, 250, 252, 0.55)";
      ctx.fillText("SPIN!", FIELD_CX, FIELD_H - 28);
    }
  }
}
