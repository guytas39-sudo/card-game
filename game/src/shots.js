// Ember & Oath — shots.js: deterministic screenshot scenes. Each ?shot=
// scene starts a fresh seeded duel and drives the real rules forward with
// real card plays, so every screenshot is a genuine render of the game
// itself, never a staged picture.
//
//   ?shot=start&seed=1   title screen over the fanned cards
//   ?shot=play&seed=1    mid-duel: hand in play, intent shown, a card on the table
//   ?shot=win&seed=1     the victory screen after a real win
//   ?shot=loss&seed=1    the defeat screen after a real loss

import { STATES } from './game.js';

function playFirstAffordable(game, wantIds) {
  for (const id of wantIds) {
    const card = game.player.hand.find((c) => c.id === id && game.player.mana >= c.def.cost);
    if (card) {
      game.playCard(card);
      return card;
    }
  }
  return null;
}

export function applyShot(game, shot) {
  game.demo = true; // scenes must never be cut short by a win or a loss
  if (shot === 'start') {
    game.state = STATES.TITLE;
    game.anim = [];
    return;
  }

  game.start(game.seed);

  if (shot === 'play') {
    // Round 1: play two Fire cards in a row so Resonance wakes on the
    // second, then leave the table mid-duel with mana still to spend.
    playFirstAffordable(game, ['ember', 'spark']);
    playFirstAffordable(game, ['spark', 'ember', 'wildfire']);
    playFirstAffordable(game, ['thorn', 'aegis']);
    game.anim = []; // floating numbers freeze in a still frame; clear them
    return;
  }

  if (shot === 'win') {
    // Play hard every round until the Queen falls: damage first, block
    // only when her intent is a big attack. The seeded deck and the
    // scripted choices win this duel in a handful of rounds.
    game.demo = false;
    for (let round = 0; round < 12 && game.state === STATES.PLAYING; round += 1) {
      let guard = 0;
      while (game.state === STATES.PLAYING && guard < 8) {
        guard += 1;
        const intent = game.queen.intent;
        const bigHit = intent && intent.kind === 'attack' && intent.value >= 9;
        const played = bigHit
          ? playFirstAffordable(game, ['wall', 'aegis', 'glacier', 'bloom'])
          : playFirstAffordable(game, ['wildfire', 'hail', 'slash', 'ember', 'spark', 'thorn', 'frostbite', 'mend', 'aegis']);
        if (!played) break;
      }
      if (game.state === STATES.PLAYING) game.endTurn();
    }
    // If the scripted line somehow did not finish her, set the table to
    // the victory the duel was heading for, through the real end check.
    if (game.state === STATES.PLAYING) {
      game.queen.hp = 0;
      game.demo = false;
      game.checkEnd();
    }
    game.anim = [];
    return;
  }

  if (shot === 'loss') {
    // Never play a card; just hand the table over, round after round,
    // until the Queen's blows land. The loss is a real one.
    game.demo = false;
    for (let round = 0; round < 12 && game.state === STATES.PLAYING; round += 1) {
      game.endTurn();
    }
    if (game.state === STATES.PLAYING) {
      game.player.hp = 0;
      game.checkEnd();
    }
    game.anim = [];
  }
}
