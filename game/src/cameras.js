// Wall cameras: a sweeping cone that watches one arc of the room. A camera
// that has the thief in its cone raises the alarm fast and flashes red.
import { CAMERA } from './config.js';
import { hasLineOfSight } from './guards.js';

export function createCamera(def) {
  return {
    x: (def.x + 0.5) * 32,
    y: (def.y + 0.5) * 32,
    base: def.angle,
    sweep: def.sweep ?? 0.6,
    angle: def.angle,
    phase: ((def.x * 7 + def.y * 13) % 6) - 3,
    spotting: 0,
  };
}

export function stepCamera(camera, dt, time) {
  camera.angle = camera.base + Math.sin(time * CAMERA.sweepSpeed + camera.phase) * camera.sweep;
}

/** 0..1 how clearly this camera sees the player (0 = not in the cone). */
export function cameraSees(camera, player, grid, shadow) {
  const dx = player.x - camera.x;
  const dy = player.y - camera.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CAMERA.range) return 0;
  let diff = Math.atan2(dy, dx) - camera.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > CAMERA.halfAngle) return 0;
  if (!hasLineOfSight(grid, camera.x, camera.y, player.x, player.y)) return 0;
  if (shadow && dist > 80) return 0;
  return 1 - dist / (CAMERA.range * 1.5);
}
