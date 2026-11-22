// The heist world: builds each level's tile grid, runs the simulation step
// (player, guards, cameras, alarm, loot, exit) and reports game events.
import {
  ALARM, DEATH_PENALTY, FIELD, GHOST_BONUS, GUARD, LEVEL_BONUS,
  LEVELS, LOOT_GEM, LOOT_VAULT, TILE,
} from './config.js';
import { createCamera, cameraSees, stepCamera } from './cameras.js';
import { createGuard, guardSees, stepGuard } from './guards.js';
import { createPlayer, inShadow, stepPlayer } from './player.js';

export const EVENT_CAUGHT = 1;
export const EVENT_LEVEL_CLEAR = 2;
export const EVENT_GAME_OVER = 4;
export const EVENT_VICTORY = 8;

export function buildGrid(level) {
  const grid = [];
  for (let y = 0; y < FIELD.rows; y += 1) {
    const row = [];
    for (let x = 0; x < FIELD.cols; x += 1) {
      row.push(x === 0 || y === 0 || x === FIELD.cols - 1 || y === FIELD.rows - 1 ? '#' : '.');
    }
    grid.push(row);
  }
  const paint = (rects, ch) => {
    for (const [x, y, w, h] of rects) {
      for (let ty = y; ty < y + h; ty += 1) {
        for (let tx = x; tx < x + w; tx += 1) grid[ty][tx] = ch;
      }
    }
  };
  paint(level.walls, '#');
  paint(level.crates, 'B');
  paint(level.shadows, ',');
  return grid;
}

export function createWorld() {
  return {
    levelIndex: 0,
    level: LEVELS[0],
    grid: buildGrid(LEVELS[0]),
    player: createPlayer(LEVELS[0].player),
    guards: LEVELS[0].guards.map((g) => createGuard(g.waypoints)),
    cameras: LEVELS[0].cameras.map((c) => createCamera(c)),
    loot: LEVELS[0].loot.map((l) => ({
      x: (l.x + 0.5) * TILE,
      y: (l.y + 0.5) * TILE,
      kind: l.kind,
      value: l.kind === 'vault' ? LOOT_VAULT : LOOT_GEM,
      taken: false,
      sparkle: 0,
    })),
    exit: { x: (LEVELS[0].exit.x + 0.5) * TILE, y: (LEVELS[0].exit.y + 0.5) * TILE },
    alarm: 0,
    alarmActive: false,
    alarmTripped: false,
    lives: 3,
    score: 0,
    levelTime: 0,
    time: 0,
    lootTaken: 0,
    exitOpen: false,
    caughtFlash: 0,
    events: 0,
  };
}

function loadLevel(world, index) {
  const level = LEVELS[index];
  world.levelIndex = index;
  world.level = level;
  world.grid = buildGrid(level);
  world.player = createPlayer(level.player);
  world.guards = level.guards.map((g) => createGuard(g.waypoints));
  world.cameras = level.cameras.map((c) => createCamera(c));
  world.loot = level.loot.map((l) => ({
    x: (l.x + 0.5) * TILE,
    y: (l.y + 0.5) * TILE,
    kind: l.kind,
    value: l.kind === 'vault' ? LOOT_VAULT : LOOT_GEM,
    taken: false,
    sparkle: 0,
  }));
  world.exit = { x: (level.exit.x + 0.5) * TILE, y: (level.exit.y + 0.5) * TILE };
  world.alarm = 0;
  world.alarmActive = false;
  world.alarmTripped = false;
  world.levelTime = 0;
  world.lootTaken = 0;
  world.exitOpen = false;
  world.caughtFlash = 0;
}

export function resetWorld(world) {
  world.lives = 3;
  world.score = 0;
  world.time = 0;
  loadLevel(world, 0);
}

/** Load a level for a staged screenshot without touching lives or score. */
export function loadLevelForShot(world, index) {
  loadLevel(world, index);
}

/** Advance the world one fixed step. Returns a bitmask of EVENT_* flags. */
export function stepWorld(world, input, dt) {
  let events = 0;
  world.time += dt;
  world.levelTime += dt;
  if (world.caughtFlash > 0) world.caughtFlash -= dt;

  stepPlayer(world.player, input, dt, world.grid, () => {
    for (const g of world.guards) {
      if (g.state !== 'chase') {
        const d = Math.hypot(world.player.x - g.x, world.player.y - g.y);
        if (d < 240) { g.state = 'investigate'; g.investigate = { x: world.player.x, y: world.player.y }; }
      }
    }
  });

  const shadow = inShadow(world.grid, world.player);
  const sneak = world.player.sneaking ? ALARM.sneakFactor : 1;
  let seen = 0;
  for (const guard of world.guards) {
    const s = guardSees(guard, world.player, world.grid, shadow);
    seen = Math.max(seen, s);
    stepGuard(guard, dt, world.grid, world.player, s, world.alarmActive, world.player.noise);
  }
  for (const camera of world.cameras) {
    stepCamera(camera, dt, world.time);
    const s = cameraSees(camera, world.player, world.grid, shadow);
    camera.spotting = s;
    seen = Math.max(seen, s * 1.15);
    if (s > 0) world.alarm += ALARM.cameraRate * s * sneak * dt;
  }
  if (seen > 0) world.alarm += ALARM.guardRate * seen * sneak * dt;
  else world.alarm = Math.max(0, world.alarm - ALARM.decay * dt);

  if (world.alarm >= ALARM.trigger && !world.alarmActive) {
    world.alarmActive = true;
    world.alarmTripped = true;
  }
  if (world.alarmActive && world.alarm < ALARM.release) world.alarmActive = false;
  world.alarm = Math.min(120, world.alarm);

  for (const item of world.loot) {
    item.sparkle += dt;
    if (!item.taken && Math.hypot(item.x - world.player.x, item.y - world.player.y) < 22) {
      item.taken = true;
      world.lootTaken += 1;
      world.score += item.value;
      if (world.lootTaken === world.loot.length) world.exitOpen = true;
    }
  }

  for (const guard of world.guards) {
    if (Math.hypot(guard.x - world.player.x, guard.y - world.player.y) < GUARD.catchRadius) {
      world.lives -= 1;
      world.score = Math.max(0, world.score - DEATH_PENALTY);
      world.caughtFlash = 0.6;
      events |= EVENT_CAUGHT;
      if (world.lives <= 0) {
        events |= EVENT_GAME_OVER;
      } else {
        loadLevel(world, world.levelIndex);
      }
      return events;
    }
  }

  if (world.exitOpen && Math.hypot(world.exit.x - world.player.x, world.exit.y - world.player.y) < 30) {
    const timeBonus = Math.max(0, 600 - Math.floor(world.levelTime) * 10);
    world.score += LEVEL_BONUS + timeBonus;
    if (!world.alarmTripped) world.score += GHOST_BONUS;
    events |= EVENT_LEVEL_CLEAR;
    if (world.levelIndex + 1 >= LEVELS.length) {
      events |= EVENT_VICTORY;
    } else {
      loadLevel(world, world.levelIndex + 1);
    }
  }
  return events;
}
