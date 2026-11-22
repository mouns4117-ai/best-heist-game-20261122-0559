// Screenshot scenes behind ?shot=start|play|alert|end. Each one stages a real
// game state and paints it with the game's own renderer, so the frame is what
// a short game really looks like — and the same seed always gives the same frame.
import { TILE } from './config.js';
import { loadLevelForShot } from './world.js';
import {
  SCREEN_CLEAR, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY,
} from './render.js';

function placePlayer(state, tx, ty, facing) {
  state.player.x = (tx + 0.5) * TILE;
  state.player.y = (ty + 0.5) * TILE;
  state.player.facing = facing;
}

function placeGuard(state, index, tx, ty, facing, guardState) {
  const g = state.guards[index];
  if (!g) return;
  g.x = (tx + 0.5) * TILE;
  g.y = (ty + 0.5) * TILE;
  g.facing = facing;
  g.state = guardState;
  g.pauseLeft = 0;
}

/**
 * Stage the named scene on `world` and return the screen to draw over it and
 * the best score to show. Any other name stages the title.
 */
export function stageShot(name, world) {
  if (name === 'play') {
    loadLevelForShot(world, 0);
    placePlayer(world, 19, 9, -Math.PI / 2);
    placeGuard(world, 0, 17, 5, Math.PI / 2, 'patrol');
    placeGuard(world, 1, 6, 12, 0, 'patrol');
    world.cameras[0].angle = Math.PI / 2 + 0.4;
    world.loot[0].taken = true;
    world.lootTaken = 1;
    world.alarm = 38;
    world.score = 500;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'alert') {
    loadLevelForShot(world, 1);
    placePlayer(world, 16, 12, Math.PI);
    placeGuard(world, 0, 14, 10, Math.atan2(12 - 10, 16 - 14), 'chase');
    placeGuard(world, 1, 18, 14, Math.atan2(12 - 14, 16 - 18), 'chase');
    placeGuard(world, 2, 7, 12, 0, 'chase');
    world.cameras[0].spotting = 0.8;
    world.alarm = 100;
    world.alarmActive = true;
    world.alarmTripped = true;
    world.loot[0].taken = true;
    world.loot[1].taken = true;
    world.lootTaken = 2;
    world.score = 1000;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'end') {
    loadLevelForShot(world, 2);
    for (const item of world.loot) item.taken = true;
    world.lootTaken = world.loot.length;
    world.exitOpen = true;
    world.score = 9200;
    return { screen: SCREEN_VICTORY, best: 9200 };
  }
  loadLevelForShot(world, 0);
  return { screen: SCREEN_TITLE, best: 0 };
}

export { SCREEN_CLEAR, SCREEN_OVER };
