// Ember & Oath — render.js: everything the player sees, drawn on one
// canvas. Cards slide, lift on hover, and snap into place; the table reads
// at a glance even shrunk to a thumbnail.

import { VIEW, LAYOUT, ELEMENTS, COLORS, RULES } from './config.js';
import { STATES } from './game.js';
import { defOf } from './cards.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WON = 'won';
export const SCREEN_LOST = 'lost';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', bold = false) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? '700' : '400'} ${size}px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function wrapText(ctx, str, x, y, maxWidth, size, color, lineHeight) {
  const words = str.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  ctx.fillStyle = color;
  ctx.font = `400 ${size}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return lines.length;
}

// A small glyph per element, drawn from shapes so no image is needed.
function elementGlyph(ctx, element, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  if (element === 'fire') {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.quadraticCurveTo(cx + size * 0.9, cy - size * 0.2, cx + size * 0.5, cy + size * 0.5);
    ctx.quadraticCurveTo(cx + size * 0.2, cy + size * 0.9, cx - size * 0.4, cy + size * 0.7);
    ctx.quadraticCurveTo(cx - size * 0.9, cy + size * 0.3, cx - size * 0.4, cy - size * 0.5);
    ctx.quadraticCurveTo(cx - size * 0.2, cy - size * 0.9, cx, cy - size);
    ctx.fill();
  } else if (element === 'frost') {
    for (let i = 0; i < 3; i += 1) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(a) * size, cy - Math.sin(a) * size);
      ctx.lineTo(cx + Math.cos(a) * size, cy + Math.sin(a) * size);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
  } else if (element === 'verdant') {
    ctx.beginPath();
    ctx.ellipse(cx, cy, size * 0.55, size, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, cy, size * 0.55, size, -0.6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - size, cy + size * 0.7);
    ctx.lineTo(cx, cy - size);
    ctx.lineTo(cx + size, cy + size * 0.7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawCardFace(ctx, card, x, y, w, h, opts = {}) {
  const el = ELEMENTS[card.def.element];
  const lift = opts.lift || 0;
  const yy = y - lift;
  // All inner positions scale with the card's height, so a mini card on
  // the table and a full card in the hand never let text collide.
  const bandH = Math.max(22, h * 0.16);
  const nameSize = Math.max(11, Math.round(h * 0.075));
  const glyphSize = h * 0.15;
  const glyphY = yy + h * 0.42;
  const elemY = yy + h * 0.56;
  const textY = yy + h * 0.68;
  const statY = yy + h - Math.max(12, h * 0.07);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  rr(ctx, x, yy, w, h, 12);
  ctx.fillStyle = COLORS.cream;
  ctx.fill();
  ctx.restore();
  rr(ctx, x, yy, w, h, 12);
  ctx.strokeStyle = opts.selected ? COLORS.gold : '#6b5b3e';
  ctx.lineWidth = opts.selected ? 4 : 2;
  ctx.stroke();
  // Element band with the card's name.
  rr(ctx, x + 6, yy + 6, w - 12, bandH, 8);
  ctx.fillStyle = el.color;
  ctx.fill();
  text(ctx, card.def.name, x + w / 2, yy + 6 + bandH / 2, nameSize, '#fff', 'center', true);
  // Mana cost, top-left in a gold coin — skipped on a compact card, where
  // the coin would cover the name.
  if (!opts.compact) {
    ctx.beginPath();
    ctx.arc(x + 16, yy + 16, 13, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.gold;
    ctx.fill();
    ctx.strokeStyle = '#7a5a12';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, String(card.def.cost), x + 16, yy + 17, 16, '#221a12', 'center', true);
  }
  // Element glyph in the middle of the card.
  elementGlyph(ctx, card.def.element, x + w / 2, glyphY, glyphSize, el.color);
  text(ctx, el.name, x + w / 2, elemY, Math.max(10, Math.round(h * 0.06)), el.dark, 'center', true);
  // The card's effect, wrapped — skipped on a compact card.
  if (!opts.compact) {
    wrapText(ctx, card.def.text, x + w / 2, textY, w - 20, Math.max(11, Math.round(h * 0.062)), COLORS.ink, Math.max(13, Math.round(h * 0.08)));
  }
  // Big numbers, as plain words — no emoji, which renders as a box on
  // some systems: DMG in red, BLK in blue, HEAL in green.
  const parts = [];
  if (card.def.damage) parts.push(`DMG ${card.def.damage}`);
  if (card.def.block) parts.push(`BLK ${card.def.block}`);
  if (card.def.heal) parts.push(`HEAL ${card.def.heal}`);
  if (parts.length) {
    const color = card.def.damage ? '#b3271e' : card.def.block ? '#2a5fa8' : '#2f7a33';
    text(ctx, parts.join('  '), x + w / 2, statY, Math.max(11, Math.round(h * 0.075)), color, 'center', true);
  }
  if (opts.resonance) {
    text(ctx, 'RESONANCE +2', x + w / 2, yy - 12, 13, COLORS.gold, 'center', true);
  }
}

function drawCardBack(ctx, x, y, w, h) {
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#3a2a4d';
  ctx.fill();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  rr(ctx, x + 8, y + 8, w - 16, h - 16, 7);
  ctx.strokeStyle = 'rgba(232,182,76,0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();
  elementGlyph(ctx, 'fire', x + w / 2, y + h / 2, 20, COLORS.gold);
}

function hpBar(ctx, x, y, w, hp, maxHp, block, label) {
  rr(ctx, x, y, w, 22, 11);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fill();
  const frac = Math.max(0, hp / maxHp);
  rr(ctx, x + 2, y + 2, (w - 4) * frac, 18, 9);
  ctx.fillStyle = frac > 0.35 ? '#c0392b' : '#e74c3c';
  ctx.fill();
  text(ctx, `${label}  ${hp} / ${maxHp}`, x + w / 2, y + 12, 13, '#fff', 'center', true);
  if (block > 0) {
    ctx.beginPath();
    ctx.arc(x + w + 18, y + 11, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#4a90d9';
    ctx.fill();
    ctx.strokeStyle = '#dfe9f5';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, String(block), x + w + 18, y + 12, 13, '#fff', 'center', true);
    text(ctx, 'block', x + w + 18, y + 32, 10, '#cfe0f2', 'center');
  }
}

function manaPips(ctx, x, y, mana, max) {
  text(ctx, 'MANA', x, y - 14, 12, COLORS.gold, 'left', true);
  for (let i = 0; i < max; i += 1) {
    ctx.beginPath();
    ctx.arc(x + 10 + i * 28, y + 8, 10, 0, Math.PI * 2);
    ctx.fillStyle = i < mana ? '#58b7ff' : 'rgba(255,255,255,0.18)';
    ctx.fill();
    ctx.strokeStyle = '#dfe9f5';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw(game) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, VIEW.width, VIEW.height);
    // Felt table with a vignette and a gold rail.
    const grad = ctx.createRadialGradient(640, 380, 120, 640, 400, 780);
    grad.addColorStop(0, COLORS.felt);
    grad.addColorStop(1, COLORS.tableEdge);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, VIEW.width - 20, VIEW.height - 20);

    if (game.state === STATES.TITLE) this.drawTitle(game);
    else this.drawTable(game);
    if (game.state === STATES.WON) this.drawEnd(game, true);
    if (game.state === STATES.LOST) this.drawEnd(game, false);

    // Floating damage numbers.
    for (const a of game.anim) {
      ctx.globalAlpha = Math.max(0, 1 - a.t / 1.1);
      text(ctx, a.text, a.x, a.y, 30, a.color, 'center', true);
    }
    ctx.globalAlpha = 1;
  }

  drawTitle(game) {
    const ctx = this.ctx;
    // A fanned row of cards behind the title, face up.
    const defs = ['ember', 'wildfire', 'aegis', 'hail', 'mend'];
    defs.forEach((id, i) => {
      const card = { key: 100 + i, id, def: defOf(id) };
      const x = 640 - 300 + i * 130;
      ctx.save();
      ctx.translate(x + 65, 470);
      ctx.rotate((i - 2) * 0.09);
      drawCardFace(ctx, card, -65, -105, 130, 182);
      ctx.restore();
    });
    ctx.fillStyle = 'rgba(8, 16, 10, 0.55)';
    ctx.fillRect(0, 180, VIEW.width, 190);
    text(ctx, 'EMBER & OATH', 640, 250, 64, COLORS.gold, 'center', true);
    text(ctx, 'A duel of cards against the Hollow Queen', 640, 305, 22, COLORS.cream, 'center');
    text(ctx, 'Click to begin  •  3 mana a turn  •  match elements for Resonance +2', 640, 345, 17, COLORS.muted, 'center');
    if (game.best > 0) text(ctx, `Best score: ${game.best}`, 640, 640, 18, COLORS.gold, 'center', true);
    text(ctx, 'Play a card by clicking it. End your turn when your mana is spent.', 640, 700, 16, COLORS.cream, 'center');
    text(ctx, 'The Queen shows her intent before you commit — answer it with block, healing, or a harder blow.', 640, 728, 16, COLORS.cream, 'center');
  }

  drawTable(game) {
    const ctx = this.ctx;
    const q = game.queen;
    const p = game.player;
    // Top bar: round and score.
    text(ctx, `ROUND ${game.round}`, 640, 34, 18, COLORS.gold, 'center', true);
    text(ctx, `Score ${game.score()}`, 1180, 34, 16, COLORS.cream, 'right', true);
    text(ctx, 'M mute  •  P pause  •  R restart', 100, 34, 14, COLORS.muted, 'left');

    // Opponent: portrait, name, HP, intent.
    ctx.beginPath();
    ctx.arc(150, 120, 46, 0, Math.PI * 2);
    ctx.fillStyle = '#3a2a4d';
    ctx.fill();
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 3;
    ctx.stroke();
    elementGlyph(ctx, 'frost', 150, 120, 26, '#bcd8ff');
    text(ctx, 'THE HOLLOW QUEEN', 215, 100, 20, COLORS.cream, 'left', true);
    hpBar(ctx, 215, 118, 300, q.hp, q.maxHp, q.block, 'HP');
    if (q.intent) {
      rr(ctx, 560, 92, 340, 56, 10);
      ctx.fillStyle = COLORS.panel;
      ctx.fill();
      ctx.strokeStyle = '#7a5a12';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      text(ctx, 'QUEEN INTENDS', 730, 108, 11, COLORS.gold, 'center', true);
      text(ctx, `${q.intent.label} — ${q.intent.detail}`, 730, 130, 16, COLORS.cream, 'center', true);
    }
    // The Queen's face-down hand.
    for (let i = 0; i < game.queenHandCount(); i += 1) {
      drawCardBack(ctx, 980 + i * 78, 60, 66, 92);
    }
    text(ctx, "the Queen's hand", 1095, 172, 12, COLORS.muted, 'center');

    // The table: the last played card and the log.
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    rr(ctx, 40, 250, 1200, 130, 14);
    ctx.fill();
    if (game.lastPlay) {
      drawCardFace(ctx, game.lastPlay.card, 80, 258, 96, 118, { resonance: game.lastPlay.resonance, compact: true });
      text(ctx, game.lastPlay.text, 420, 320, 18, COLORS.cream, 'center');
    } else {
      text(ctx, 'No card played yet this round.', 640, 300, 18, COLORS.muted, 'center');
    }
    const recent = game.log.slice(-2);
    recent.forEach((line, i) => text(ctx, line, 640, 345 + i * 20, 14, COLORS.muted, 'center'));

    // Player: HP, mana, deck counts.
    text(ctx, 'YOU — THE EMBER KNIGHT', 60, 430, 20, COLORS.cream, 'left', true);
    hpBar(ctx, 60, 452, 300, p.hp, p.maxHp, p.block, 'HP');
    manaPips(ctx, 420, 452, p.mana, RULES.manaPerTurn);
    text(ctx, `Deck ${p.deck.length}   Discard ${p.discard.length}`, 640, 470, 14, COLORS.muted, 'center');

    // Player's hand, fanned and lifted on hover.
    const hand = p.hand;
    const totalW = hand.length * (LAYOUT.cardW + LAYOUT.cardGap) - LAYOUT.cardGap;
    let x = (VIEW.width - totalW) / 2;
    hand.forEach((card) => {
      const lift = game.hoverKey === card.key ? 26 : 0;
      const affordable = p.mana >= card.def.cost;
      if (!affordable) {
        ctx.globalAlpha = 0.55;
      }
      drawCardFace(ctx, card, x, LAYOUT.handY, LAYOUT.cardW, LAYOUT.cardH, {
        lift,
        selected: game.selectedKey === card.key,
        resonance: game.hoverKey === card.key && game.lastElement === card.def.element && game.playedThisTurn.length > 0,
      });
      ctx.globalAlpha = 1;
      x += LAYOUT.cardW + LAYOUT.cardGap;
    });

    // End Turn button.
    const b = LAYOUT.endTurn;
    rr(ctx, b.x, b.y, b.w, b.h, 12);
    ctx.fillStyle = game.state === STATES.PLAYING ? '#b3271e' : '#5a5148';
    ctx.fill();
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, 'END TURN', b.x + b.w / 2, b.y + b.h / 2, 18, '#fff', 'center', true);
    text(ctx, 'Space', b.x + b.w / 2, b.y + b.h + 16, 12, COLORS.muted, 'center');
  }

  drawEnd(game, won) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(6, 12, 8, 0.72)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    text(ctx, won ? 'VICTORY' : 'DEFEAT', 640, 300, 72, won ? COLORS.gold : '#e74c3c', 'center', true);
    text(ctx, game.endReason, 640, 360, 22, COLORS.cream, 'center');
    text(ctx, `Score ${game.score()}   •   Damage dealt ${game.stats.damageDealt}   •   Cards played ${game.stats.cardsPlayed}   •   Rounds ${game.stats.rounds}`, 640, 410, 18, COLORS.cream, 'center');
    text(ctx, won ? 'The court is yours. The Queen bows and deals again.' : 'The Queen keeps her court. Deal again and answer her better.', 640, 450, 17, COLORS.muted, 'center');
    text(ctx, 'Press R or click to play again', 640, 520, 18, COLORS.gold, 'center', true);
  }
}
