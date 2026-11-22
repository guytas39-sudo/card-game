// Ember & Oath — game.js: the whole duel. One Game owns the state machine
// (title → playing → won / lost), the decks, the mana, the Resonance rule,
// and the opponent's readable intent.
//
// A round: the player draws to five cards and gains 3 mana, plays as many
// cards as the mana allows, then ends the turn. The Hollow Queen then acts
// out the intent she showed at the start of the round, and a new round
// begins. Block fades at the start of each side's turn; health does not.
//
// Resonance: play two cards of the same element in one turn and the second
// gains +2 damage or +2 block. The Queen's intent is shown before the
// player commits, so block, healing and weakening are real answers to it.

import { RULES } from './config.js';
import { CARD_DEFS, STARTING_DECK, defOf, makeCard, resetCardKeys } from './cards.js';
import { mulberry32, shuffle, pick } from './random.js';

export const STATES = { TITLE: 'title', PLAYING: 'playing', WON: 'won', LOST: 'lost' };

// What the Queen can do. Each entry is an intent she may show: a kind, a
// strength, and the words the player reads before committing cards.
export const QUEEN_MOVES = [
  { kind: 'attack', value: 6, label: 'raises her blade', detail: 'Attack 6' },
  { kind: 'attack', value: 9, label: 'gathers a killing blow', detail: 'Attack 9' },
  { kind: 'attack', value: 4, label: 'flicks a shadow bolt', detail: 'Attack 4' },
  { kind: 'block', value: 8, label: 'raises a cold ward', detail: 'Block 8' },
  { kind: 'heal', value: 5, label: 'drinks from the hollow cup', detail: 'Heal 5' },
  { kind: 'attack', value: 5, label: 'summons thorn wisps', detail: 'Attack 5, then draws' },
];

export class Game {
  constructor(audio) {
    this.audio = audio;
    this.state = STATES.TITLE;
    this.seed = 1;
    this.rand = mulberry32(1);
    this.round = 0;
    this.demo = false; // screenshot scenes: nothing here can end the duel
    this.best = 0;
    this.resetDuel();
    this.log = ['The Hollow Queen waits across the table.'];
    this.lastPlay = null; // { card, resonance, text } shown on the table
    this.anim = []; // floating numbers: { x, y, text, color, t }
    this.hoverKey = null;
    this.selectedKey = null;
    this.stats = { damageDealt: 0, cardsPlayed: 0, rounds: 0 };
    this.endReason = '';
  }

  resetDuel() {
    resetCardKeys();
    this.player = { hp: RULES.startHp, maxHp: RULES.startHp, block: 0, mana: 0, deck: [], hand: [], discard: [] };
    this.queen = { hp: RULES.startHp, maxHp: RULES.startHp, block: 0, weaken: 0, intent: null };
    this.playedThisTurn = [];
    this.lastElement = null;
  }

  start(seed = 1) {
    this.seed = seed;
    this.rand = mulberry32(seed);
    this.resetDuel();
    this.stats = { damageDealt: 0, cardsPlayed: 0, rounds: 0 };
    this.log = ['The duel begins. The Queen shows her intent — answer it.'];
    this.lastPlay = null;
    this.anim = [];
    this.player.deck = shuffle(STARTING_DECK.map((id) => makeCard(id)), this.rand);
    this.beginRound();
    this.state = STATES.PLAYING;
    this.audio.turn();
  }

  beginRound() {
    this.round += 1;
    this.stats.rounds = this.round;
    this.player.block = 0;
    this.player.mana = RULES.manaPerTurn;
    this.playedThisTurn = [];
    this.lastElement = null;
    this.drawToHand();
    this.queen.intent = pick(QUEEN_MOVES, this.rand);
    this.queen.block = 0;
    if (this.queen.weaken > 0) this.queen.weaken = 0;
  }

  drawToHand() {
    while (this.player.hand.length < RULES.handSize) {
      if (this.player.deck.length === 0) {
        if (this.player.discard.length === 0) return;
        this.player.deck = shuffle(this.player.discard.splice(0), this.rand);
        this.log.push('The discard pile is shuffled back into the deck.');
      }
      this.player.hand.push(this.player.deck.pop());
    }
  }

  drawCards(n) {
    for (let i = 0; i < n; i += 1) {
      if (this.player.deck.length === 0) {
        if (this.player.discard.length === 0) return;
        this.player.deck = shuffle(this.player.discard.splice(0), this.rand);
      }
      this.player.hand.push(this.player.deck.pop());
    }
    this.audio.drawCard();
  }

  // Playing a card: pay its mana, resolve it, and move it to the discard.
  // Returns false when the card cannot be played.
  playCard(card) {
    if (this.state !== STATES.PLAYING) return false;
    if (this.player.mana < card.def.cost) {
      this.log.push(`Not enough mana for ${card.def.name}.`);
      return false;
    }
    const def = card.def;
    const resonance = this.lastElement === def.element;
    const bonus = resonance ? RULES.resonanceBonus : 0;
    this.player.mana -= def.cost;
    this.player.hand = this.player.hand.filter((c) => c.key !== card.key);
    this.player.discard.push(card);
    this.playedThisTurn.push(card);
    this.lastElement = def.element;
    this.stats.cardsPlayed += 1;

    let text = def.name;
    if (def.damage) {
      const dmg = def.damage + bonus;
      this.dealDamageToQueen(dmg);
      text += ` deals ${dmg}`;
      if (def.weaken) {
        this.queen.weaken += def.weaken;
        text += ` and weakens the Queen`;
      }
    }
    if (def.block) {
      const blk = def.block + bonus;
      this.player.block = Math.min(RULES.maxBlock, this.player.block + blk);
      text += ` gains ${blk} block`;
      this.audio.block();
    }
    if (def.heal) {
      const healed = Math.min(this.player.maxHp - this.player.hp, def.heal);
      this.player.hp += healed;
      text += ` restores ${healed}`;
      this.audio.heal();
    }
    if (def.draw) this.drawCards(def.draw);
    if (def.damage) this.audio.hit();
    if (resonance) {
      text += ' — Resonance! +2';
      this.audio.resonance();
    } else if (!def.damage && !def.block) {
      this.audio.playCard();
    } else if (def.damage) {
      // hit sound already played
    } else {
      this.audio.playCard();
    }
    this.lastPlay = { card, resonance, text };
    this.log.push(text + '.');
    this.checkEnd();
    return true;
  }

  dealDamageToQueen(amount) {
    let remaining = amount;
    if (this.queen.block > 0) {
      const absorbed = Math.min(this.queen.block, remaining);
      this.queen.block -= absorbed;
      remaining -= absorbed;
    }
    if (remaining > 0) {
      this.queen.hp = Math.max(0, this.queen.hp - remaining);
      this.stats.damageDealt += remaining;
      this.addFloat(640, 150, `-${remaining}`, '#ffb04c');
    }
  }

  dealDamageToPlayer(amount) {
    let remaining = amount;
    if (this.queen.weaken > 0) {
      remaining = Math.max(0, remaining - this.queen.weaken);
      this.queen.weaken = 0;
    }
    if (this.player.block > 0) {
      const absorbed = Math.min(this.player.block, remaining);
      this.player.block -= absorbed;
      remaining -= absorbed;
    }
    if (remaining > 0) {
      this.player.hp = Math.max(0, this.player.hp - remaining);
      this.addFloat(640, 640, `-${remaining}`, '#ff6b5e');
    }
  }

  addFloat(x, y, text, color) {
    this.anim.push({ x, y, text, color, t: 0 });
  }

  // End the player's turn: the Queen acts out the intent she showed.
  endTurn() {
    if (this.state !== STATES.PLAYING) return;
    const move = this.queen.intent;
    if (!move) return;
    if (move.kind === 'attack') {
      this.dealDamageToPlayer(move.value);
      this.log.push(`The Queen ${move.label} — ${move.value} damage.`);
      this.audio.hit();
    } else if (move.kind === 'block') {
      this.queen.block = Math.min(RULES.maxBlock, this.queen.block + move.value);
      this.log.push(`The Queen ${move.label} — gains ${move.value} block.`);
      this.audio.block();
    } else if (move.kind === 'heal') {
      const healed = Math.min(this.queen.maxHp - this.queen.hp, move.value);
      this.queen.hp += healed;
      this.log.push(`The Queen ${move.label} — restores ${healed}.`);
      this.audio.heal();
    }
    this.lastPlay = null;
    this.checkEnd();
    if (this.state === STATES.PLAYING) this.beginRound();
    this.audio.turn();
  }

  checkEnd() {
    if (this.demo) return;
    if (this.queen.hp <= 0) {
      this.state = STATES.WON;
      this.endReason = `The Hollow Queen falls in ${this.round} round${this.round === 1 ? '' : 's'}.`;
      this.best = Math.max(this.best, this.score());
      this.audio.win();
      this.log.push('Victory! The table is yours.');
    } else if (this.player.hp <= 0) {
      this.state = STATES.LOST;
      this.endReason = `The Queen's last blow lands in round ${this.round}.`;
      this.audio.lose();
      this.log.push('Defeat. The Queen keeps her court.');
    }
  }

  score() {
    const raw = this.stats.damageDealt * 10 + this.stats.cardsPlayed * 5 + (this.state === STATES.WON ? 200 : 0) - (this.round - 1) * 5;
    return Math.max(0, raw);
  }

  update(dt) {
    for (let i = this.anim.length - 1; i >= 0; i -= 1) {
      const a = this.anim[i];
      a.t += dt;
      a.y -= 28 * dt;
      if (a.t > 1.1) this.anim.splice(i, 1);
    }
  }

  // The Queen's hand, face down: three backs that stand for the cards she
  // might play, so the table reads as two hands facing each other.
  queenHandCount() {
    return 3;
  }
}
