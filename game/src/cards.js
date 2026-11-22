// Ember & Oath — cards.js: the whole card pool. Every card names its
// element, its mana cost, and what it does, in plain words the player can
// read on the card itself. Effects are resolved in game.js.
//
// Elements matter: playing two cards of the same element in one turn wakes
// Resonance — the second card gains +2 to its damage or block.

export const CARD_DEFS = [
  { id: 'ember', name: 'Ember Strike', element: 'fire', cost: 1, damage: 4, text: 'Deal 4 damage.' },
  { id: 'slash', name: 'Heavy Slash', element: 'stone', cost: 2, damage: 7, text: 'Deal 7 damage.' },
  { id: 'wildfire', name: 'Wildfire', element: 'fire', cost: 3, damage: 9, text: 'Deal 9 damage.' },
  { id: 'frostbite', name: 'Frostbite', element: 'frost', cost: 2, damage: 3, weaken: 3, text: 'Deal 3. Weaken the foe: its next attack deals 3 less.' },
  { id: 'spark', name: 'Spark Draw', element: 'fire', cost: 1, damage: 2, draw: 1, text: 'Deal 2 damage. Draw a card.' },
  { id: 'thorn', name: 'Thorn Volley', element: 'verdant', cost: 1, damage: 3, text: 'Deal 3 damage.' },
  { id: 'aegis', name: 'Aegis', element: 'stone', cost: 1, block: 5, text: 'Gain 5 block.' },
  { id: 'wall', name: 'Iron Wall', element: 'stone', cost: 2, block: 9, text: 'Gain 9 block.' },
  { id: 'mend', name: 'Mend', element: 'verdant', cost: 2, heal: 6, text: 'Restore 6 health.' },
  { id: 'bloom', name: 'Bloom', element: 'verdant', cost: 1, block: 3, heal: 2, text: 'Gain 3 block. Restore 2 health.' },
  { id: 'glacier', name: 'Glacier Guard', element: 'frost', cost: 2, block: 7, draw: 1, text: 'Gain 7 block. Draw a card.' },
  { id: 'hail', name: 'Hailstorm', element: 'frost', cost: 3, damage: 6, draw: 1, text: 'Deal 6 damage. Draw a card.' },
];

// The player's starting deck: 20 cards, two of each kind.
export const STARTING_DECK = [
  'ember', 'ember', 'slash', 'slash', 'wildfire', 'frostbite', 'frostbite',
  'spark', 'spark', 'thorn', 'thorn', 'aegis', 'aegis', 'wall', 'mend',
  'mend', 'bloom', 'bloom', 'glacier', 'hail',
];

export function defOf(id) {
  return CARD_DEFS.find((card) => card.id === id);
}

// A fresh card instance: a unique key so the same kind can sit in a hand
// twice and still be told apart when it is clicked or animated.
let nextKey = 1;
export function makeCard(id) {
  const def = defOf(id);
  return { key: nextKey++, id: def.id, def };
}

export function resetCardKeys() {
  nextKey = 1;
}
