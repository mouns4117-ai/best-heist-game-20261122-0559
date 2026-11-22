// Guards: patrol waypoints, look around at pauses, chase what they see,
// investigate loud noises, and search a last-seen spot before giving up.
import { FIELD, GUARD, TILE } from './config.js';

export function createGuard(waypoints) {
  const pts = waypoints.map(([tx, ty]) => ({ x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE }));
  return {
    waypoints: pts,
    leg: 0,
    x: pts[0].x,
    y: pts[0].y,
    facing: 0,
    state: 'patrol',
    pauseLeft: 0,
    pauseBase: 0,
    searchLeft: 0,
    lastSeen: null,
    investigate: null,
    chaseLost: 0,
  };
}

export function tileAt(grid, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= FIELD.cols || ty >= FIELD.rows) return '#';
  return grid[ty][tx];
}

function blocksSight(grid, tx, ty) {
  const t = tileAt(grid, tx, ty);
  return t === '#' || t === 'B';
}

/** Sample the line from (x0,y0) to (x1,y1); false when a wall or crate cuts it. */
export function hasLineOfSight(grid, x0, y0, x1, y1) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / 7));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const tx = Math.floor((x0 + (x1 - x0) * t) / TILE);
    const ty = Math.floor((y0 + (y1 - y0) * t) / TILE);
    if (blocksSight(grid, tx, ty)) return false;
  }
  return true;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Can this guard see the player right now? `shadow` hides unless very close. */
export function guardSees(guard, player, grid, shadow) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD.visionRange) return 0;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), guard.facing)) > GUARD.visionHalfAngle) return 0;
  if (!hasLineOfSight(grid, guard.x, guard.y, player.x, player.y)) return 0;
  if (shadow && dist > 70) return 0;
  return 1 - dist / (GUARD.visionRange * 1.6);
}

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.facing = Math.atan2(dy, dx);
  return dist - step < 2;
}

export function stepGuard(guard, dt, grid, player, seesPlayer, alarmActive, noise) {
  if (noise && guard.state !== 'chase') {
    const d = Math.hypot(noise.x - guard.x, noise.y - guard.y);
    if (d < noise.radius) {
      guard.state = 'investigate';
      guard.investigate = { x: noise.x, y: noise.y };
    }
  }
  if (seesPlayer > 0) {
    guard.lastSeen = { x: player.x, y: player.y };
    guard.chaseLost = 0;
    if (alarmActive || seesPlayer > 0.35) guard.state = 'chase';
    else if (guard.state === 'patrol') guard.state = 'suspicious';
  }

  if (guard.state === 'chase') {
    if (seesPlayer > 0) {
      moveToward(guard, player.x, player.y, GUARD.chaseSpeed, dt);
    } else if (guard.lastSeen) {
      if (moveToward(guard, guard.lastSeen.x, guard.lastSeen.y, GUARD.chaseSpeed, dt)) {
        guard.state = 'search';
        guard.searchLeft = GUARD.searchTime;
      }
    } else {
      guard.state = 'search';
      guard.searchLeft = GUARD.searchTime;
    }
    if (seesPlayer <= 0) {
      guard.chaseLost += dt;
      if (guard.chaseLost > 4) { guard.state = 'search'; guard.searchLeft = GUARD.searchTime; }
    }
    return;
  }

  if (guard.state === 'suspicious') {
    if (seesPlayer <= 0) {
      guard.state = 'patrol';
    }
    return;
  }

  if (guard.state === 'investigate' && guard.investigate) {
    if (moveToward(guard, guard.investigate.x, guard.investigate.y, GUARD.patrolSpeed * 1.4, dt)) {
      guard.state = 'search';
      guard.searchLeft = 1.6;
      guard.investigate = null;
    }
    return;
  }

  if (guard.state === 'search') {
    guard.searchLeft -= dt;
    guard.facing += Math.sin(guard.searchLeft * 2.2) * dt * 1.2;
    if (guard.searchLeft <= 0) guard.state = 'patrol';
    return;
  }

  // Patrol: walk the waypoints, pausing at each to look around.
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    guard.facing = guard.pauseBase + Math.sin((1 - guard.pauseLeft / GUARD.pauseTime) * Math.PI * 2) * 0.15;
    return;
  }
  const target = guard.waypoints[guard.leg];
  if (moveToward(guard, target.x, target.y, GUARD.patrolSpeed, dt)) {
    guard.leg = (guard.leg + 1) % guard.waypoints.length;
    guard.pauseLeft = GUARD.pauseTime;
    guard.pauseBase = guard.facing;
  }
}
