
import { RDCWriter, BLOCK_TYPES } from './src/lib/rdc.js';
import { GAMES } from './src/lib/games.js';
import fs from 'fs';

const writer = new RDCWriter();
writer.setAuthor('TestBot');

// Create a Zelda 1 block
const z1Def = GAMES[BLOCK_TYPES.ZELDA1_SPRITE];
let totalSize = 0;
z1Def.segments.forEach(seg => totalSize += seg.length);

const payload = new Uint8Array(totalSize);
// Fill with some pattern
for (let i = 0; i < totalSize; i++) {
    payload[i] = i % 255;
}

writer.addBlock(BLOCK_TYPES.ZELDA1_SPRITE, payload);

const buffer = writer.build();
fs.writeFileSync('test.rdc', Buffer.from(buffer));
console.log('Created test.rdc');
