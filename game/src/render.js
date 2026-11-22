// Canvas rendering: the museum floor, walls, loot, the thief, guards and
// their vision cones, cameras and their sweeps, the HUD, and every screen.
import { FIELD, GUARD, TILE } from './config.js';
import { tileAt } from './guards.js';

const SCREEN_TITLE = 'title';
const SCREEN_PLAY = 'play';
const SCREEN_PAUSED = 'paused';
const SCREEN_CLEAR = 'clear';
const SCREEN_OVER = 'over';
const SCREEN_VICTORY = 'victory';
export { SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_CLEAR, SCREEN_OVER, SCREEN_VICTORY };

function castRay(grid, x, y, angle, maxDist) {
  const step = 6;
  for (let d = step; d <= maxDist; d += step) {
    const px = x + Math.cos(angle) * d;
    const py = y + Math.sin(angle) * d;
    const t = tileAt(grid, Math.floor(px / TILE), Math.floor(py / TILE));
    if (t === '#' || t === 'B') return d - step;
  }
  return maxDist;
}

function drawCone(ctx, grid, x, y, facing, halfAngle, range, color) {
  const rays = 14;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i <= rays; i += 1) {
    const a = facing - halfAngle + (2 * halfAngle * i) / rays;
    const d = castRay(grid, x, y, a, range);
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function drawFloor(state) {
    for (let ty = 0; ty < FIELD.rows; ty += 1) {
      for (let tx = 0; tx < FIELD.cols; tx += 1) {
        const t = state.grid[ty][tx];
        const px = tx * TILE;
        const py = ty * TILE;
        if (t === '#') {
          ctx.fillStyle = '#2b3350';
          ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = '#3d4a70';
          ctx.fillRect(px, py, TILE, 5);
          ctx.fillStyle = '#232a42';
          ctx.fillRect(px, py + TILE - 4, TILE, 4);
        } else if (t === 'B') {
          ctx.fillStyle = '#4a3421';
          ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
          ctx.fillStyle = '#6b4a2c';
          ctx.fillRect(px + 2, py + 2, TILE - 4, 5);
          ctx.strokeStyle = '#2e2013';
          ctx.strokeRect(px + 5, py + 5, TILE - 10, TILE - 10);
        } else if (t === ',') {
          ctx.fillStyle = (tx + ty) % 2 === 0 ? '#171a2e' : '#1a1d33';
          ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = 'rgba(120,110,200,0.10)';
          ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
        } else {
          ctx.fillStyle = (tx + ty) % 2 === 0 ? '#3a2f28' : '#40342b';
          ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          ctx.fillRect(px, py + TILE - 2, TILE, 2);
        }
      }
    }
  }

  function drawLoot(state) {
    for (const item of state.loot) {
      if (item.taken) continue;
      const pulse = 0.6 + 0.4 * Math.sin(item.sparkle * 4);
      ctx.save();
      ctx.translate(item.x, item.y);
      if (item.kind === 'vault') {
        ctx.fillStyle = 'rgba(255,215,0,0.25)';
        ctx.beginPath();
        ctx.arc(0, 0, 24 + pulse * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8a6d1f';
        roundRect(ctx, -13, -13, 26, 26, 4);
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff3b0';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = `rgba(90,200,255,${0.35 + pulse * 0.3})`;
        ctx.fillRect(-11, -11, 22, 22);
        ctx.fillStyle = '#5ac8ff';
        ctx.fillRect(-7, -7, 14, 14);
        ctx.fillStyle = '#d8f4ff';
        ctx.fillRect(-3, -3, 6, 6);
      }
      ctx.restore();
    }
  }

  function drawExit(state) {
    const { x, y } = state.exit;
    ctx.save();
    ctx.translate(x, y);
    if (state.exitOpen) {
      ctx.fillStyle = 'rgba(60,220,120,0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = state.exitOpen ? '#2fae5f' : '#5a5f6e';
    roundRect(ctx, -16, -11, 32, 22, 4);
    ctx.fill();
    ctx.fillStyle = state.exitOpen ? '#b8ffce' : '#9aa0b0';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.exitOpen ? 'ESCAPE' : 'LOCKED', 0, 3);
    ctx.restore();
  }

  function drawGuards(state) {
    for (const guard of state.guards) {
      const chasing = guard.state === 'chase' || state.alarmActive;
      const suspicious = guard.state === 'suspicious' || guard.state === 'investigate';
      const coneColor = chasing
        ? 'rgba(255,60,60,0.30)'
        : suspicious ? 'rgba(255,170,40,0.28)' : 'rgba(255,220,90,0.22)';
      drawCone(ctx, state.grid, guard.x, guard.y, guard.facing, 0.6, 205, coneColor);
    }
    for (const guard of state.guards) {
      const chasing = guard.state === 'chase' || state.alarmActive;
      ctx.save();
      ctx.translate(guard.x, guard.y);
      ctx.fillStyle = chasing ? '#8c1f28' : '#2c2f3a';
      ctx.beginPath();
      ctx.arc(0, 0, GUARD.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = chasing ? '#ff5a5a' : '#c8cdd8';
      ctx.beginPath();
      ctx.arc(Math.cos(guard.facing) * 5, Math.sin(guard.facing) * 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0c0e14';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, GUARD.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawCameras(state) {
    for (const camera of state.cameras) {
      const color = camera.spotting > 0 ? 'rgba(255,70,70,0.32)' : 'rgba(140,190,255,0.20)';
      drawCone(ctx, state.grid, camera.x, camera.y, camera.angle, 0.5, 255, color);
    }
    for (const camera of state.cameras) {
      ctx.save();
      ctx.translate(camera.x, camera.y);
      ctx.rotate(camera.angle);
      ctx.fillStyle = '#1c2030';
      roundRect(ctx, -8, -6, 16, 12, 3);
      ctx.fill();
      ctx.fillStyle = camera.spotting > 0 ? '#ff4040' : '#7fd4ff';
      ctx.beginPath();
      ctx.arc(8, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPlayer(state) {
    const p = state.player;
    if (p.noise) {
      ctx.strokeStyle = `rgba(255,255,255,${0.5 * (p.noise.ttl / 0.5)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.noise.radius * (1 - p.noise.ttl / 0.5) + 10, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(p.x, p.y);
    const bob = p.moving ? Math.sin(p.stepPhase) * 1.5 : 0;
    ctx.translate(0, bob);
    ctx.fillStyle = '#12141f';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8b64c';
    ctx.beginPath();
    ctx.arc(Math.cos(p.facing) * 4, Math.sin(p.facing) * 4, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#12141f';
    ctx.fillRect(Math.cos(p.facing) * 4 - 5, Math.sin(p.facing) * 4 - 1.5, 10, 3);
    ctx.restore();
  }

  function drawHud(state) {
    ctx.fillStyle = 'rgba(8,10,20,0.82)';
    ctx.fillRect(0, 0, FIELD.width, 44);
    ctx.fillStyle = '#e8e4d8';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`LEVEL ${state.levelIndex + 1} — ${state.level.name}`, 14, 28);
    ctx.fillText(`LOOT ${state.lootTaken}/${state.loot.length}`, 330, 28);
    ctx.fillStyle = '#ff5a6e';
    let hearts = '';
    for (let i = 0; i < 3; i += 1) hearts += i < state.lives ? '♥ ' : '♡ ';
    ctx.fillText(hearts, 470, 28);
    const alarmW = 190;
    const ax = 620;
    ctx.fillStyle = '#22263a';
    ctx.fillRect(ax, 14, alarmW, 16);
    const frac = Math.min(1, state.alarm / 100);
    ctx.fillStyle = state.alarmActive ? '#ff3030' : frac > 0.6 ? '#ff9a30' : '#ffd23f';
    ctx.fillRect(ax, 14, alarmW * frac, 16);
    ctx.strokeStyle = '#e8e4d8';
    ctx.strokeRect(ax, 14, alarmW, 16);
    ctx.fillStyle = '#e8e4d8';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('ALARM', ax + alarmW + 10, 27);
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE ${state.score}`, FIELD.width - 150, 28);
    const mm = Math.floor(state.levelTime / 60);
    const ss = String(Math.floor(state.levelTime % 60)).padStart(2, '0');
    ctx.fillText(`${mm}:${ss}`, FIELD.width - 14, 28);
    if (state.alarmActive) {
      ctx.fillStyle = 'rgba(255,30,30,0.9)';
      ctx.fillRect(0, 44, FIELD.width, 26);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!! ALARM — THE GUARDS ARE COMING !!', FIELD.width / 2, 62);
    }
  }

  function overlay(title, lines, accent) {
    ctx.fillStyle = 'rgba(5,7,14,0.78)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = accent;
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, FIELD.width / 2, 250);
    ctx.fillStyle = '#e8e4d8';
    ctx.font = '20px sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, FIELD.width / 2, 310 + i * 34));
  }

  function draw(state, screen, best) {
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    drawFloor(state);
    drawExit(state);
    drawLoot(state);
    drawGuards(state);
    drawCameras(state);
    drawPlayer(state);
    if (state.caughtFlash > 0) {
      ctx.fillStyle = `rgba(255,40,40,${state.caughtFlash})`;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    }
    drawHud(state);
    if (screen === SCREEN_TITLE) {
      overlay('THE VELVET VAULT', [
        'A museum heist in three rooms. Lift every gem, crack the vault,',
        'slip past the guards and their cameras — then reach the getaway.',
        '',
        'Move: WASD / arrows    Sneak: Shift    Dash: Space (loud!)',
        'Pause: P    Mute: M',
        '',
        'Press Enter or click to start',
        best > 0 ? `Best score: ${best}` : '',
      ], '#ffd700');
    } else if (screen === SCREEN_PAUSED) {
      overlay('PAUSED', ['Take a breath. The guards are waiting.', '', 'Press P to keep stealing'], '#9fc4ff');
    } else if (screen === SCREEN_CLEAR) {
      overlay('CLEAN GETAWAY!', [
        `Level ${state.levelIndex + 1} cleared — loot secured.`,
        `Score: ${state.score}`,
        '',
        'Press Enter for the next room',
      ], '#5aff8a');
    } else if (screen === SCREEN_OVER) {
      overlay('CAUGHT!', [
        'The museum keeps its gold tonight.',
        `Score: ${state.score}    Best: ${Math.max(best, state.score)}`,
        '',
        'Press Enter to try again',
      ], '#ff5a5a');
    } else if (screen === SCREEN_VICTORY) {
      overlay('THE PERFECT HEIST', [
        'Every gem, every vault, every room — and nobody saw a thing.',
        `Final score: ${state.score}    Best: ${Math.max(best, state.score)}`,
        '',
        'Press Enter to play again',
      ], '#ffd700');
    }
  }

  return { draw };
}
