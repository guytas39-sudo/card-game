// Ember & Oath — entry program, Node 22, standard library only.
//
// The game lives in game/ beside this file: plain static files (an
// index.html plus ES modules, no build step, no network request) that a
// desktop browser opens and plays. This program hands the game in: it
// copies game/ and screenshots/ into the output directory and writes
// dossier.json there, the summary the judge reads, built with the vendored
// make.fun library.
//
// To run it outside the grader, point MAKEFUN_OUTPUT_DIR at a folder:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(from, to) {
  if (existsSync(from)) cpSync(from, to, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(root, 'game'), join(outputDir, 'game'));
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
copyTree(join(root, 'screenshots'), join(outputDir, 'screenshots'));

// The scorer's caps, as the starter's main.ts records them from
// reference/gate.json: at most 4 screenshots of 256 KiB each, at most 993
// files in game/ totalling 48 MiB, and no game/ path longer than 1000
// bytes. An entry past any of those is refused before it is judged.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
