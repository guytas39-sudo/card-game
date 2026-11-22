// Ember & Oath — input.js: mouse and keyboard. Click a card to play it,
// click End Turn (or press Space) to hand the table to the Queen.

import { LAYOUT, VIEW } from './config.js';

export class Input {
  constructor(canvas, game, audio, onAction) {
    this.canvas = canvas;
    this.game = game;
    this.audio = audio;
    this.onAction = onAction; // called after any action that may change state
    this.keys = new Set();
    this.paused = false;
    canvas.addEventListener('mousemove', (e) => this.onMove(e));
    canvas.addEventListener('click', (e) => this.onClick(e));
    window.addEventListener('keydown', (e) => this.onKey(e));
  }

  pos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = VIEW.width / rect.width;
    const scaleY = VIEW.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  handCardAt(x, y) {
    const hand = this.game.player.hand;
    const totalW = hand.length * (LAYOUT.cardW + LAYOUT.cardGap) - LAYOUT.cardGap;
    let cx = (VIEW.width - totalW) / 2;
    // Left to right, in step with cx: the card at index i sits at
    // x0 + i * (cardW + gap), so the check and the position must advance
    // together (checking from the other end would play the wrong card).
    for (let i = 0; i < hand.length; i += 1) {
      const card = hand[i];
      const lift = this.game.hoverKey === card.key ? 26 : 0;
      if (x >= cx && x <= cx + LAYOUT.cardW && y >= LAYOUT.handY - lift && y <= LAYOUT.handY + LAYOUT.cardH) {
        return card;
      }
      cx += LAYOUT.cardW + LAYOUT.cardGap;
    }
    return null;
  }

  onMove(e) {
    if (this.game.state !== 'playing') {
      this.game.hoverKey = null;
      return;
    }
    const { x, y } = this.pos(e);
    const card = this.handCardAt(x, y);
    this.game.hoverKey = card ? card.key : null;
  }

  onClick(e) {
    const { x, y } = this.pos(e);
    this.audio.unlock();
    const game = this.game;
    if (game.state === 'title') {
      game.start(game.seed);
      this.onAction();
      return;
    }
    if (game.state === 'won' || game.state === 'lost') {
      game.start(game.seed + 1);
      this.onAction();
      return;
    }
    if (this.paused) return;
    const b = LAYOUT.endTurn;
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      game.endTurn();
      this.onAction();
      return;
    }
    const card = this.handCardAt(x, y);
    if (card) {
      game.playCard(card);
      this.onAction();
    }
  }

  onKey(e) {
    const game = this.game;
    if (e.key === 'm' || e.key === 'M') {
      const muted = this.audio.toggleMute();
      game.log.push(muted ? 'Sound muted.' : 'Sound on.');
      return;
    }
    if (e.key === 'p' || e.key === 'P') {
      this.paused = !this.paused;
      game.log.push(this.paused ? 'Paused. Press P to resume.' : 'Resumed.');
      return;
    }
    if (e.key === 'r' || e.key === 'R') {
      if (game.state !== 'title') {
        game.start(game.seed + 1);
        this.onAction();
      }
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (game.state === 'title') {
        game.start(game.seed);
        this.onAction();
      } else if (game.state === 'won' || game.state === 'lost') {
        game.start(game.seed + 1);
        this.onAction();
      } else if (!this.paused) {
        game.endTurn();
        this.onAction();
      }
    }
  }
}
