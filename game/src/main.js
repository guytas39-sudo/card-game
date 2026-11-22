// Ember & Oath — main.js: boots the game, runs the loop, and applies the
// ?shot= scene when one is asked for.

import { Game } from './game.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { Audio } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const audio = new Audio();
const game = new Game(audio);
const renderer = new Renderer(canvas);

function render() {
  renderer.draw(game);
}

const input = new Input(canvas, game, audio, render);
render();

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '1');
game.seed = Number.isFinite(seed) && seed > 0 ? seed : 1;
if (shot) {
  applyShot(game, shot);
  render();
} else {
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!input.paused) game.update(dt);
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

// Expose the game for play-testing from the console.
window.__game = game;
