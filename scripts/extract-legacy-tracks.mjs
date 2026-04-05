#!/usr/bin/env node
// One-shot: parse legacy/index.html, extract the track array,
// write normalized JSON to data/tracks-seed.json.
import fs from 'node:fs';
import path from 'node:path';

const HTML_PATH = 'legacy/index.html';
const OUT_PATH = 'data/tracks-seed.json';
const AUDIO_DIR = 'legacy/audio';

const html = fs.readFileSync(HTML_PATH, 'utf-8');

// Match each track object literal: {era:N,eraName:"...",label:"...",ytId:"...",start:N,audioSrc:"audio/X.mp3"}
const trackRegex = /\{era:(\d+),eraName:"([^"]+)",label:"((?:[^"\\]|\\.)*)",ytId:"([^"]*)",start:(\d+),audioSrc:"([^"]+)"\}/g;

const tracks = [];
let m;
while ((m = trackRegex.exec(html)) !== null) {
  const [, era, eraName, labelRaw, ytId, start, audioSrc] = m;
  const label = labelRaw.replace(/\\"/g, '"');
  const audioFilename = path.basename(audioSrc);
  const audioExists = fs.existsSync(path.join(AUDIO_DIR, audioFilename));
  tracks.push({
    era: Number(era),
    eraName,
    title: label,
    correctAnswer: label,
    ytId,
    ytStart: Number(start),
    audioFilename,
    audioExists,
  });
}

console.log(`Extracted ${tracks.length} tracks.`);
const missing = tracks.filter((t) => !t.audioExists);
if (missing.length) {
  console.warn(`Warning: ${missing.length} track(s) missing audio file:`);
  missing.forEach((t) => console.warn(`  - ${t.audioFilename} (${t.title})`));
}

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(tracks, null, 2) + '\n');
console.log(`Wrote ${OUT_PATH}`);
