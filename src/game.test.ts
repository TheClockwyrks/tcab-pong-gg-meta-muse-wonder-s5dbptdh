import { createCanvas } from "@napi-rs/canvas";
import { ConstantClock, createEngine } from "@clockwyrks/simple-2d";
import type { Engine } from "@clockwyrks/simple-2d";
import { describe, expect, it } from "vitest";
import {
  FIELD_CX,
  FIELD_CY,
  FIELD_W,
  HOLD_TIME,
  TITLE_ITEMS,
} from "./constants";
import { game } from "./game";
import type { CaromDebugApi, CaromState } from "./game";

type TestEngine = Engine<CaromState, CaromDebugApi>;

async function makeEngine(stepMs = 1000 / 60): Promise<TestEngine> {
  const canvas = createCanvas(1280, 720);
  const target = new EventTarget();
  const engine = createEngine({
    canvas: canvas as unknown as HTMLCanvasElement,
    width: FIELD_W,
    height: 720,
    game,
    clock: new ConstantClock(stepMs),
    surface: {
      cssWidth: () => 1280,
      cssHeight: () => 720,
      dpr: () => 1,
      events: () => target,
    },
  });
  await engine.initialize();
  return engine;
}

// Start a solo match and run out the opening countdown.
async function startPlaying(engine: TestEngine): Promise<void> {
  const debug = engine.debug;
  engine.apply((s) => debug.setScreen(s, "title"));
  engine.apply((s) => debug.setMenuIndex(s, 0));
  // Drive through update-free confirm by posing countdown directly, then
  // letting the real hold timer serve the ball.
  engine.apply((s) => {
    const started = debug.setScreen(s, "countdown");
    return { ...started, mode: "solo" as const, receiver: "left" as const };
  });
  await engine.advance(300);
  // By now a point may already have been scored and a new countdown begun;
  // wait (bounded) until a ball is actually in flight.
  for (let i = 0; i < 40; i++) {
    const snap = engine.debug.snapshot(engine.state);
    if (snap.screen === "playing" && snap.ball && !snap.ball.held) break;
    if (snap.screen === "playing" && snap.ball?.held) {
      engine.apply((s) => debug.setBallHoldTimer(s, 0.01));
    }
    await engine.advance(30);
  }
  expect(engine.debug.snapshot(engine.state).screen).toBe("playing");
}

describe("Carom", () => {
  it("opens on the title with the full declared state", async () => {
    const engine = await makeEngine();
    const snap = engine.debug.snapshot(engine.state);
    expect(snap.version).toBe(1);
    expect(snap.screen).toBe("title");
    expect(snap.mode).toBe("solo");
    expect(snap.menuIndex).toBe(0);
    expect(snap.score).toEqual({ p1: 0, p2: 0 });
    expect(snap.winner).toBeNull();
    expect(snap.ball?.x).toBe(FIELD_CX);
    expect(snap.ball?.y).toBe(FIELD_CY);
    expect(snap.ball?.held).toBe(true);
    expect(snap.ball?.holdTimer).toBe(HOLD_TIME);
    expect(snap.obstacles).toHaveLength(2);
    expect(snap.ai).toEqual({ tracking: true, movement: true });
    expect(engine.diagnostics().length).toBeGreaterThanOrEqual(10);
    engine.destroy();
  });

  it("serves after the hold and moves the ball", async () => {
    const engine = await makeEngine();
    await startPlaying(engine);
    const before = engine.debug.snapshot(engine.state);
    await engine.advance(10);
    const after = engine.debug.snapshot(engine.state);
    expect(after.ball?.held).toBe(false);
    expect(after.ball?.speed).toBeGreaterThan(400);
    expect(after.ball?.x).not.toBe(before.ball?.x);
    expect(after.ball?.trail.length).toBeGreaterThan(0);
    engine.destroy();
  });

  it("bounces the ball off a paddle and changes its speed", async () => {
    const engine = await makeEngine();
    await startPlaying(engine);
    const debug = engine.debug;
    // Park both paddles at the ball's height and send the ball left.
    engine.apply((s) => debug.setPaddleCy(s, "left", FIELD_CY));
    engine.apply((s) => debug.setBallPosition(s, 200, FIELD_CY));
    engine.apply((s) => debug.setBallVelocity(s, -520, 0));
    engine.apply((s) => debug.setBallSpin(s, 0));
    await engine.advance(30);
    const snap = engine.debug.snapshot(engine.state);
    expect(snap.ball?.vx).toBeGreaterThan(0);
    expect(snap.ball?.speed).toBeGreaterThan(520);
    engine.destroy();
  });

  it("applies spin from a moving (driven) paddle and curves the ball", async () => {
    const engine = await makeEngine();
    await startPlaying(engine);
    const debug = engine.debug;
    engine.apply((s) => debug.setPaddleCy(s, "left", 310));
    engine.apply((s) => debug.setPaddleVy(s, "left", 600));
    engine.apply((s) => debug.setPaddleDriven(s, "left", true));
    engine.apply((s) => debug.setBallPosition(s, 120, FIELD_CY));
    engine.apply((s) => debug.setBallVelocity(s, -520, 0));
    await engine.advance(30);
    const snap = engine.debug.snapshot(engine.state);
    expect(snap.ball?.spin).toBeGreaterThan(100);
    engine.destroy();
  });

  it("scores when the ball passes an edge and re-serves in countdown", async () => {
    const engine = await makeEngine();
    await startPlaying(engine);
    const debug = engine.debug;
    const beforeScore = engine.debug.snapshot(engine.state).score.p2;
    engine.apply((s) => debug.setPaddleCy(s, "left", 100));
    engine.apply((s) => debug.setBallPosition(s, 60, 600));
    engine.apply((s) => debug.setBallVelocity(s, -600, 0));
    await engine.advance(30);
    const snap = engine.debug.snapshot(engine.state);
    expect(snap.score.p2).toBe(beforeScore + 1);
    expect(snap.screen).toBe("countdown");
    expect(snap.receiver).toBe("left");
    void beforeScore;
    engine.destroy();
  });

  it("ends the match when the win rule is met by a real point", async () => {
    const engine = await makeEngine();
    await startPlaying(engine);
    const debug = engine.debug;
    engine.apply((s) => debug.setScore(s, 10, 0));
    engine.apply((s) => debug.setPaddleCy(s, "right", 100));
    engine.apply((s) => debug.setBallPosition(s, 1200, 600));
    engine.apply((s) => debug.setBallVelocity(s, 600, 0));
    await engine.advance(30);
    const snap = engine.debug.snapshot(engine.state);
    expect(snap.screen).toBe("matchover");
    expect(snap.winner).toBe("left");
    expect(snap.score.p1).toBe(11);
    engine.destroy();
  });

  it("clearWorld, spawn, reset and reconcile behave as specified", async () => {
    const engine = await makeEngine();
    const debug = engine.debug;
    engine.apply((s) => debug.clearWorld(s));
    let snap = engine.debug.snapshot(engine.state);
    expect(snap.ball).toBeNull();
    expect(snap.obstacles).toHaveLength(0);
    expect(() => engine.apply((s) => debug.setBallPosition(s, 1, 2))).toThrow();
    expect(() => engine.apply((s) => debug.spawnObstacle(s, 7))).toThrow();
    engine.apply((s) => debug.spawnBall(s));
    engine.apply((s) => debug.spawnObstacle(s, 1));
    snap = engine.debug.snapshot(engine.state);
    expect(snap.ball?.held).toBe(true);
    expect(snap.obstacles).toEqual([{ index: 1, cx: 790, cy: 500 }]);
    engine.apply((s) => debug.setAiTracking(s, false));
    engine.apply((s) => debug.setMuted(s, true));
    engine.apply((s) => debug.reconcile(s));
    engine.apply((s) => debug.reset(s));
    snap = engine.debug.snapshot(engine.state);
    expect(snap.screen).toBe("title");
    expect(snap.ai.tracking).toBe(true);
    expect(snap.muted).toBe(true); // reset leaves the mute bit alone
    expect(snap.obstacles).toHaveLength(2);
    engine.destroy();
  });

  it("menuItemRect reports regions only on menu screens", async () => {
    const engine = await makeEngine();
    const debug = engine.debug;
    const rect = debug.menuItemRect(engine.state, 0);
    expect(rect).not.toBeNull();
    expect(rect?.w).toBeGreaterThan(0);
    expect(debug.menuItemRect(engine.state, TITLE_ITEMS.length)).toBeNull();
    engine.apply((s) => debug.setScreen(s, "playing"));
    expect(debug.menuItemRect(engine.state, 0)).toBeNull();
    engine.destroy();
  });

  it("is frame-rate tolerant: two step sizes reach the same events", async () => {
    const run = async (stepMs: number): Promise<number> => {
      const engine = await makeEngine(stepMs);
      await startPlaying(engine);
      const debug = engine.debug;
      engine.apply((s) => debug.setBallPosition(s, 640, 360));
      engine.apply((s) => debug.setBallVelocity(s, 700, 120));
      // ~2 seconds of play.
      await engine.advance(Math.round(2000 / stepMs));
      const snap = engine.debug.snapshot(engine.state);
      engine.destroy();
      return snap.score.p1 + snap.score.p2 + (snap.ball?.speed ?? 0);
    };
    const a = await run(8);
    const b = await run(16);
    expect(Math.abs(a - b)).toBeLessThan(60);
  });

  it("pauses and resumes through the debug surface screens", async () => {
    const engine = await makeEngine();
    await startPlaying(engine);
    const debug = engine.debug;
    engine.apply((s) => debug.setScreen(s, "paused"));
    const frozen = engine.debug.snapshot(engine.state);
    await engine.advance(20);
    const after = engine.debug.snapshot(engine.state);
    expect(after.ball?.x).toBe(frozen.ball?.x);
    expect(after.simTime).toBeGreaterThan(frozen.simTime);
    engine.destroy();
  });
});
