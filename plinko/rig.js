// Shared "fair play" rig state. The Fair Play button arms the rig for one game;
// each game consumes it at round/session start, or is flagged live via onArm
// when a round/session is already in progress.
const ALIAS = {
  'mines-game': 'mines', 'rock-paper-scissors': 'rps', 'chicken-cross': 'chicken',
  'towers': 'tower', 'hi-lo': 'hilo',
};

const norm = (g) => {
  g = String(g || '').toLowerCase().trim();
  return ALIAS[g] || g;
};

const state = { game: null, at: 0 };
const listeners = {};
const activeFns = {};

module.exports = {
  norm,
  // fn() => true while a rigged session/round/window for this game is live.
  onActive(game, fn) {
    const g = norm(game);
    (activeFns[g] = activeFns[g] || []).push(fn);
  },
  // True if armed-and-unconsumed, or a live session/window for the game is rigged.
  isActive(game) {
    const g = norm(game);
    if (!g) return false;
    if (state.game === g) return true;
    return (activeFns[g] || []).some((fn) => { try { return fn() === true; } catch (e) { return false; } });
  },
  arm(game) {
    const g = norm(game);
    if (!g) return false;
    state.game = g;
    state.at = Date.now();
    (listeners[g] || []).forEach((fn) => {
      try { if (fn() === true) state.game = null; } catch (e) { /* ignore */ }
    });
    return true;
  },
  // Returns true (and clears the arm) if the rig was armed for this game.
  consume(game) {
    if (state.game && state.game === norm(game)) { state.game = null; return true; }
    return false;
  },
  peek(game) { return state.game === norm(game); },
  // fn() is called on arm; return true if it consumed the rig (e.g. flagged the active session).
  onArm(game, fn) {
    const g = norm(game);
    (listeners[g] = listeners[g] || []).push(fn);
  },
};
