// Ember & Oath — a turn-based card duel.
// config.js: every number and colour the game uses, in one place.

export const VIEW = { width: 1280, height: 800 };

export const RULES = {
  startHp: 24,
  handSize: 5,
  manaPerTurn: 3,
  deckSize: 20,
  resonanceBonus: 2, // +2 on a card played right after the same element
  maxBlock: 99,
};

// The table layout: opponent across the top, the played-card row in the
// middle, the player's hand fanned along the bottom.
export const LAYOUT = {
  opponentY: 96,
  opponentCardW: 96,
  opponentCardH: 132,
  tableY: 300,
  handY: 560,
  cardW: 150,
  cardH: 210,
  cardGap: 14,
  endTurn: { x: 1090, y: 660, w: 150, h: 56 },
};

export const ELEMENTS = {
  fire: { name: 'Fire', color: '#e2483a', dark: '#8f1f16', light: '#ffd9a8' },
  frost: { name: 'Frost', color: '#3a9be2', dark: '#174a73', light: '#cfeaff' },
  verdant: { name: 'Verdant', color: '#4da34d', dark: '#1f4d24', light: '#d8f2c8' },
  stone: { name: 'Stone', color: '#8d8578', dark: '#4a443c', light: '#e8e2d4' },
};

export const COLORS = {
  table: '#1d3a2a',
  tableEdge: '#0f241a',
  felt: '#27543a',
  gold: '#e8b64c',
  cream: '#f4ead2',
  ink: '#221a12',
  muted: '#9a8f7a',
  red: '#d64541',
  blue: '#4a90d9',
  panel: 'rgba(12, 20, 14, 0.82)',
};
