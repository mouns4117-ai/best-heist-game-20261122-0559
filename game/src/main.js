// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps, and the renderer paints what is there. The game moves
// between title, play, paused, level-clear, game-over and victory screens.
//
// ?seed=N fixes the camera phases. ?shot=start|play|alert|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY } from './config.js';
import { createAudio } from './audio.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_CLEAR, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY } from './render.js';
import { stageShot } from './shots.js';
import { createWorld, EVENT_CAUGHT, EVENT_GAME_OVER, EVENT_LEVEL_CLEAR, EVENT_VICTORY, resetWorld, stepWorld } from './world.js';

const STEP = 1 / 60;
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld();
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

let screen = SCREEN_TITLE;
let best = readBest();
let clearTimer = 0;
let lastStep = 0;
let lastStride = -1;

function runShot(name) {
  const scene = stageShot(name, world);
  best = Math.max(best, scene.best);
  screen = scene.screen;
  let painted = 0;
  function paint() {
    renderer.draw(world, screen, best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

const input = createInput(canvas, (action) => {
  audio.unlock();
  if (action === ACTION_MUTE) {
    status.textContent = audio.toggleMute() ? 'Muted — press M to unmute' : 'Sound on';
    return;
  }
  if (action === ACTION_PAUSE) {
    if (screen === SCREEN_PLAY) screen = SCREEN_PAUSED;
    else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
    return;
  }
  if (action !== ACTION_CONFIRM) return;
  if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_VICTORY) {
    resetWorld(world);
    screen = SCREEN_PLAY;
  } else if (screen === SCREEN_CLEAR) {
    screen = SCREEN_PLAY;
  }
});

function frame(now) {
  const elapsed = Math.min(MAX_FRAME, (now - lastStep) / 1000 || 0);
  lastStep = now;
  if (screen === SCREEN_PLAY) {
    let acc = elapsed;
    while (acc > 0) {
      const dt = Math.min(STEP, acc);
      acc -= dt;
      const events = stepWorld(world, input.read(), dt);
      if (events & EVENT_CAUGHT) audio.caught();
      if (events & EVENT_LEVEL_CLEAR) {
        audio.clear();
        if (events & EVENT_VICTORY) {
          audio.win();
          screen = SCREEN_VICTORY;
          if (world.score > best) { best = world.score; saveBest(best); }
        } else {
          screen = SCREEN_CLEAR;
          clearTimer = 1.6;
        }
      }
      if (events & EVENT_GAME_OVER) {
        screen = SCREEN_OVER;
        if (world.score > best) { best = world.score; saveBest(best); }
      }
      if (screen !== SCREEN_PLAY) break;
    }
    if (world.alarmActive) audio.startAlarm();
    else audio.stopAlarm();
    // Footsteps tick once per stride while the thief is moving.
    if (world.player.moving) {
      const stride = Math.floor(world.player.stepPhase / Math.PI);
      if (stride !== lastStride) { lastStride = stride; audio.step(world.player.sneaking); }
    }
    status.textContent = world.exitOpen
      ? 'All loot lifted — reach the green getaway!'
      : `Lift the loot (${world.lootTaken}/${world.loot.length}), then escape.`;
  } else if (screen === SCREEN_CLEAR) {
    clearTimer -= elapsed;
    if (clearTimer <= 0) screen = SCREEN_PLAY;
  }
  renderer.draw(world, screen, best);
  requestAnimationFrame(frame);
}

if (shot) {
  runShot(shot);
} else {
  lastStep = performance.now();
  requestAnimationFrame(frame);
}

// Debug hook for automated play-tests (harmless in normal play).
window.__heist = { world, get screen() { return screen; }, get best() { return best; } };
