// The Velvet Vault — configuration: field, speeds, and the three heist levels.
// Levels are described as wall/crate/shadow rectangles plus placed things; the
// world module turns each description into a tile grid. Tile coordinates run
// x 0..39, y 0..24; the border is always wall.
export const TILE = 32;
export const FIELD = { width: 1280, height: 800, cols: 40, rows: 25 };

export const PLAYER = {
  radius: 11,
  walkSpeed: 132,
  sneakSpeed: 66,
  dashSpeed: 330,
  dashTime: 0.18,
  dashCooldown: 0.9,
  noiseDash: 240,
};

export const GUARD = {
  radius: 12,
  patrolSpeed: 56,
  chaseSpeed: 112,
  searchSpeed: 70,
  visionRange: 205,
  visionHalfAngle: 0.6,
  catchRadius: 26,
  pauseTime: 1.4,
  searchTime: 3.5,
};

export const CAMERA = {
  range: 255,
  halfAngle: 0.5,
  sweepSpeed: 0.55,
  sweepAmp: 0.65,
};

export const ALARM = {
  guardRate: 55,
  cameraRate: 72,
  decay: 18,
  trigger: 100,
  release: 35,
  sneakFactor: 0.45,
};

export const LOOT_GEM = 500;
export const LOOT_VAULT = 1000;
export const LEVEL_BONUS = 1000;
export const GHOST_BONUS = 1500;
export const DEATH_PENALTY = 250;
export const BEST_KEY = 'velvet-vault-best';

export const LEVELS = [
  {
    name: 'The Gallery',
    walls: [
      [13, 2, 1, 9], [13, 13, 1, 10],
      [27, 2, 1, 9], [27, 13, 1, 10],
      [2, 12, 10, 1], [28, 6, 11, 1],
    ],
    crates: [[18, 8, 2, 2], [22, 16, 2, 2], [6, 18, 2, 1]],
    shadows: [[2, 2, 6, 4], [30, 18, 7, 4]],
    loot: [
      { x: 20, y: 4, kind: 'gem' },
      { x: 10, y: 10, kind: 'gem' },
      { x: 24, y: 10, kind: 'gem' },
      { x: 10, y: 21, kind: 'vault' },
    ],
    player: { x: 3, y: 22 },
    exit: { x: 37, y: 3 },
    guards: [
      { waypoints: [[16, 4], [16, 20], [24, 20], [24, 4]] },
      { waypoints: [[5, 6], [10, 6], [10, 18], [5, 18]] },
    ],
    cameras: [
      { x: 13, y: 2, angle: Math.PI / 2, sweep: 0.6 },
      { x: 27, y: 22, angle: -Math.PI / 2, sweep: 0.6 },
    ],
  },
  {
    name: 'The Vault Hall',
    walls: [
      [10, 3, 1, 18], [20, 3, 1, 8], [20, 14, 1, 8],
      [30, 3, 1, 18], [3, 12, 7, 1], [33, 12, 6, 1],
    ],
    crates: [[15, 6, 2, 2], [24, 18, 2, 2], [5, 20, 3, 1]],
    shadows: [[33, 3, 5, 5], [3, 18, 5, 4]],
    loot: [
      { x: 5, y: 5, kind: 'gem' },
      { x: 17, y: 5, kind: 'gem' },
      { x: 25, y: 10, kind: 'gem' },
      { x: 35, y: 20, kind: 'gem' },
      { x: 35, y: 5, kind: 'vault' },
    ],
    player: { x: 2, y: 22 },
    exit: { x: 37, y: 2 },
    guards: [
      { waypoints: [[14, 5], [14, 20], [18, 20], [18, 5]] },
      { waypoints: [[23, 4], [28, 4], [28, 20], [23, 20]] },
      { waypoints: [[5, 10], [8, 10], [8, 14], [5, 14]] },
    ],
    cameras: [
      { x: 10, y: 2, angle: Math.PI / 2, sweep: 0.6 },
      { x: 30, y: 22, angle: -Math.PI / 2, sweep: 0.6 },
    ],
  },
  {
    name: 'The Rooftop Vault',
    walls: [
      [8, 2, 1, 10], [8, 14, 1, 9],
      [16, 2, 1, 9], [16, 13, 1, 10],
      [24, 2, 1, 10], [24, 14, 1, 9],
      [32, 2, 1, 9], [32, 13, 1, 10],
    ],
    crates: [[12, 10, 2, 2], [20, 6, 2, 1], [28, 18, 2, 2]],
    shadows: [[2, 2, 4, 6], [35, 17, 4, 5], [18, 20, 4, 3]],
    loot: [
      { x: 4, y: 12, kind: 'gem' },
      { x: 12, y: 4, kind: 'gem' },
      { x: 20, y: 12, kind: 'gem' },
      { x: 28, y: 4, kind: 'gem' },
      { x: 36, y: 12, kind: 'gem' },
      { x: 20, y: 21, kind: 'vault' },
    ],
    player: { x: 2, y: 23 },
    exit: { x: 37, y: 1 },
    guards: [
      { waypoints: [[5, 5], [5, 18]] },
      { waypoints: [[12, 20], [12, 3]] },
      { waypoints: [[20, 5], [28, 5], [28, 20], [20, 20]] },
      { waypoints: [[35, 5], [35, 18]] },
    ],
    cameras: [
      { x: 8, y: 1, angle: Math.PI / 2, sweep: 0.6 },
      { x: 24, y: 1, angle: Math.PI / 2, sweep: 0.6 },
      { x: 32, y: 23, angle: -Math.PI / 2, sweep: 0.6 },
    ],
  },
];
