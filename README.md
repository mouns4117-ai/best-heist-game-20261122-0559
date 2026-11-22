# The Velvet Vault — Make the best heist game

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/mouns4117-ai/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/mouns4117-ai/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

An original top-down heist game that plays offline in a desktop browser from its own files — an entry for the [make.fun bounty](https://make.fun/bounty/best-heist-game-20261122-0559).

You are the thief in the Velvet Vault museum. Lift every gem, crack the vault, slip past the guards and their sweeping cameras — then reach the green getaway before the alarm brings the whole building down on you.

## How it plays

- **Move** — WASD or arrow keys. **Sneak** — hold Shift (slow, silent, harder to spot). **Dash** — Space (fast, but loud: every guard in earshot comes to look). **Pause** — P or Esc. **Mute** — M. Click or press Enter to start.
- **Guards patrol** fixed routes with raycast vision cones. Walls and crates block sight; a guard only sees you inside the cone with a clear line of sight. Seen too long and the guard gives chase; break line of sight and they search, then go back to patrol.
- **Cameras sweep** their arcs from the walls. Their pale cones are just as dangerous as a guard's — get caught in one and the alarm climbs fast.
- **Alarm meter** — the HUD fills while any guard or camera has eyes on you (faster up close, slower while you sneak, frozen while you hide in the shadows). Fill it and the alarm sounds: every guard converges on you. Slip away and the meter drains.
- **Noise** — a dash rings out across the room. Guards investigate the sound, then look around and return to their route.
- **Cover** — dark shadow zones hide you completely while you stand in them. Learn the patrols, wait for the cone to pass, and move between cover.
- **Objectives** — lift every gem and the vault in the room, then reach the green ESCAPE. Three rooms (The Gallery, The Vault Hall, The Rooftop Vault), three lives, a score for loot, speed, and a ghost bonus if the alarm never sounds.

## Files

- `main.ts` — the hand-in program (Node 22, standard library only): copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the kit's `vendor/makefun-game.ts`.
- `game/index.html` + `game/src/` — the game itself, plain static files, no network: `config.js` (levels), `world.js` (simulation), `guards.js` (patrol/chase/search), `cameras.js` (sweeping cones), `player.js` (movement, sneak, dash), `render.js` (canvas), `audio.js` (procedural WebAudio), `shots.js` (screenshot scenes), `input.js`, `main.js` (boot and loop).
- `screenshots/` — four real renders of the game's own code: title, mid-heist, alarm raised, victory.
- `serve.ts` — a tiny local static server: `node serve.ts`, then open http://localhost:8080.

## Play it

```sh
node serve.ts
# open http://localhost:8080 in a desktop browser
```

Hand it in:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

