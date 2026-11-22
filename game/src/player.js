// The thief: movement, sneaking, dashing, and the noise a dash makes.
import { FIELD, PLAYER, TILE } from './config.js';

export function createPlayer(startTile) {
  return {
    x: (startTile.x + 0.5) * TILE,
    y: (startTile.y + 0.5) * TILE,
    facing: 0,
    sneaking: false,
    dashing: 0,
    dashLeft: 0,
    moving: false,
    stepPhase: 0,
    noise: null,
  };
}

function tileAt(grid, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= FIELD.cols || ty >= FIELD.rows) return '#';
  return grid[ty][tx];
}

function blockedAt(grid, x, y, radius) {
  const corners = [
    [x - radius, y - radius],
    [x + radius, y - radius],
    [x - radius, y + radius],
    [x + radius, y + radius],
  ];
  for (const [cx, cy] of corners) {
    const t = tileAt(grid, Math.floor(cx / TILE), Math.floor(cy / TILE));
    if (t === '#' || t === 'B') return true;
  }
  return false;
}

/** Move the player one step from `input` ({x, y} -1..1, sneak, dash). */
export function stepPlayer(player, input, dt, grid, onDash) {
  const mag = Math.hypot(input.x, input.y);
  player.moving = mag > 0.1;
  if (player.moving) player.facing = Math.atan2(input.y, input.x);
  player.sneaking = !!input.sneak && !player.dashing;

  if (player.dashLeft > 0) player.dashLeft -= dt;
  if (input.dash && player.dashLeft <= 0 && player.dashing <= 0 && player.moving) {
    player.dashing = PLAYER.dashTime;
    player.dashLeft = PLAYER.dashCooldown;
    player.noise = { x: player.x, y: player.y, radius: PLAYER.noiseDash, ttl: 0.5 };
    if (onDash) onDash();
  }
  if (player.dashing > 0) player.dashing -= dt;

  const speed = player.dashing > 0
    ? PLAYER.dashSpeed
    : player.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  if (player.moving) {
    const nx = input.x / (mag || 1);
    const ny = input.y / (mag || 1);
    const step = speed * dt;
    const tryX = player.x + nx * step;
    if (!blockedAt(grid, tryX, player.y, PLAYER.radius)) player.x = tryX;
    const tryY = player.y + ny * step;
    if (!blockedAt(grid, player.x, tryY, PLAYER.radius)) player.y = tryY;
    player.x = Math.min(FIELD.width - PLAYER.radius - 1, Math.max(PLAYER.radius + 1, player.x));
    player.y = Math.min(FIELD.height - PLAYER.radius - 1, Math.max(PLAYER.radius + 1, player.y));
    player.stepPhase += dt * (player.sneaking ? 5 : 9);
  }
  if (player.noise) {
    player.noise.ttl -= dt;
    if (player.noise.ttl <= 0) player.noise = null;
  }
}

/** True when the player stands on a shadow tile (hard to spot). */
export function inShadow(grid, player) {
  const tx = Math.floor(player.x / TILE);
  const ty = Math.floor(player.y / TILE);
  return tileAt(grid, tx, ty) === ',';
}
