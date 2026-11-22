# Ember & Oath — a card duel

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/guytas39-sudo/card-game/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/guytas39-sudo/card-game/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

A turn-based card duel against the Hollow Queen, played offline in a desktop browser from static files — no network requests, no build step.

**The duel.** You are the Ember Knight, 24 health against the Queen's 24. Each round you draw to five cards and gain 3 mana. Click a card to play it: strikes and wildfire for damage, aegis and iron walls for block, mend and bloom to heal, frostbite to weaken her next blow. The Queen shows her intent before you commit — a raised blade, a cold ward, a drink from the hollow cup — so block, healing and weakening are real answers to it.

**Resonance.** Play two cards of the same element in one turn and the second gains +2 damage or block. Fire, Frost, Verdant and Stone each have their own way to win a round, and chaining them is how a duel turns.

**The game.** A 20-card deck that reshuffles from the discard, a hand that lifts on hover, cards that cost mana and snap onto the table, WebAudio sounds, pause/restart/mute, and a win screen and a loss screen that both tell you how the duel went. The Queen's hand sits face down across the table; her intent banner is the tell you play around.

## Play it

Serve the game folder with any static server and open `game/index.html`, or run `node serve.ts` from the kit's starter layout. Click to play a card, Space or the End Turn button to hand the table to the Queen, P to pause, M to mute, R to deal a new duel.

## Files

- `game/` — the playable game: `index.html` and `src/` (config, cards, game, render, input, audio, shots, random, main)
- `screenshots/` — real renders of the game: title, mid-duel, victory, defeat
- `main.ts` — the entry program (Node 22, standard library only)
- `vendor/makefun-game.ts` — the make.fun library, copied from the kit unchanged

Built for the [make.fun](https://make.fun/?ref=g2zdh0s8) best-card-game bounty.
