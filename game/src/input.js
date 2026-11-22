// Keyboard (and click-to-start) input: arrows/WASD move, Shift sneaks,
// Space dashes, P pauses, M mutes, Enter confirms.
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
  Space: 'dash',
  Enter: ACTION_CONFIRM,
  KeyP: ACTION_PAUSE, Escape: ACTION_PAUSE,
  KeyM: ACTION_MUTE,
};

export function createInput(canvas, onAction) {
  const held = new Set();
  let dashQueued = false;

  function read() {
    const x = (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0);
    const y = (held.has('down') ? 1 : 0) - (held.has('up') ? 1 : 0);
    const out = { x, y, sneak: held.has('sneak'), dash: dashQueued };
    dashQueued = false;
    return out;
  }

  window.addEventListener('keydown', (event) => {
    const action = KEYMAP[event.code];
    if (!action) return;
    event.preventDefault();
    if (action === 'dash') dashQueued = true;
    else if (action === ACTION_CONFIRM || action === ACTION_PAUSE || action === ACTION_MUTE) {
      if (!event.repeat) onAction(action);
    } else {
      held.add(action);
    }
  });
  window.addEventListener('keyup', (event) => {
    const action = KEYMAP[event.code];
    if (action && held.has(action)) held.delete(action);
  });
  window.addEventListener('blur', () => held.clear());
  canvas.addEventListener('pointerdown', () => onAction(ACTION_CONFIRM));

  return { read };
}
