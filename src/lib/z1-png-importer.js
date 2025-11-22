import { BLOCK_TYPES } from './rdc.js';
import { NESGraphics } from './nes_graphics.js';

export class Z1PNGImporter {
    static async parse(file) {
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Z1 Segment Layout (Tiles per segment)
        const SEGMENTS = [2, 2, 28, 2, 4, 2];

        let palettes = [];
        let colorMap = new Map(); // "r,g,b,a" -> nesIndex (0-3) for the sprite decoding

        if (canvas.height === 24) {
            // Extract Palettes from bottom row
            const paletteBytes = [];
            const y = 20; // Center of bottom row (16 + 4)

            for (let i = 0; i < 16; i++) {
                const x = i * 8 + 4; // Center of each 8x8 block
                const idx = (y * canvas.width + x) * 4;
                const r = imageData.data[idx];
                const g = imageData.data[idx + 1];
                const b = imageData.data[idx + 2];
                const a = imageData.data[idx + 3];

                const key = `${r},${g},${b},${a}`;

                // Find NES Color
                const nesIndex = this.findClosestNESColor(r, g, b);
                paletteBytes.push(nesIndex);

                // If this is the first palette (i < 4), add to colorMap for sprite decoding
                if (i < 4) {
                    colorMap.set(key, i); // Map color to index 0-3
                }
            }

            // Construct the 4 palettes for RDC (indices 1, 2, 3)
            for (let p = 0; p < 4; p++) {
                palettes.push(paletteBytes[p * 4 + 1]);
                palettes.push(paletteBytes[p * 4 + 2]);
                palettes.push(paletteBytes[p * 4 + 3]);
            }

        } else {
            if (canvas.height !== 16) {
                console.warn(`Unexpected PNG height: ${canvas.height}. Expected 16 or 24.`);
            }
            // Legacy Smart Mapping
            const smart = this.extractSmartColorMap(imageData);
            colorMap = smart.colorMap;
            palettes = [
                ...smart.paletteBytes,
                ...smart.paletteBytes,
                ...smart.paletteBytes,
                ...smart.paletteBytes
            ];
        }

        const payload = new Uint8Array(640 + 12);
        let payloadOffset = 0;
        let currentX = 0;

        for (const numTiles of SEGMENTS) {
            const cols = Math.ceil(numTiles / 2);
            const segmentWidth = cols * 8;

            for (let col = 0; col < cols; col++) {
                for (let row = 0; row < 2; row++) {
                    const tileX = currentX + col * 8;
                    const tileY = row * 8;

                    const tilePixels = this.extractTilePixels(imageData, tileX, tileY, colorMap);
                    const tileData = NESGraphics.encode2bpp(tilePixels);
                    payload.set(tileData, payloadOffset);
                    payloadOffset += 16;
                }
            }
            currentX += segmentWidth;
        }

        payload.set(palettes, 640);

        return {
            author: "Imported PNG",
            blocks: [{
                type: BLOCK_TYPES.ZELDA1_SPRITE,
                payload: payload
            }]
        };
    }

    static extractSmartColorMap(imageData) {
        const colors = new Map(); // "r,g,b,a" -> count
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const key = `${data[i]},${data[i + 1]},${data[i + 2]},${data[i + 3]}`;
            colors.set(key, (colors.get(key) || 0) + 1);
        }

        // 1. Identify Background (Index 0)
        let bgKey = null;
        let maxCount = -1;

        for (const [key, count] of colors.entries()) {
            const [r, g, b, a] = key.split(',').map(Number);
            if (a < 128) {
                bgKey = key;
                break; // Found transparency, use it immediately
            }
            if (count > maxCount) {
                maxCount = count;
                bgKey = key;
            }
        }

        // 2. Identify Top 3 other colors
        const otherColors = [];
        for (const [key, count] of colors.entries()) {
            if (key !== bgKey) {
                otherColors.push({ key, count });
            }
        }
        otherColors.sort((a, b) => b.count - a.count);

        // Take top 3
        const top3 = otherColors.slice(0, 3).map(c => c.key);

        // 3. Map these top 3 to NES Palette Indices
        const paletteBytes = [];
        const colorMap = new Map();

        colorMap.set(bgKey, 0);

        top3.forEach((key, i) => {
            const [r, g, b] = key.split(',').map(Number);
            const nesIndex = this.findClosestNESColor(r, g, b);
            paletteBytes.push(nesIndex);
            colorMap.set(key, i + 1); // Map to 1, 2, 3
        });

        // Fill remaining palette bytes if less than 3 colors found
        while (paletteBytes.length < 3) {
            paletteBytes.push(0x0F); // Black padding
        }

        // 4. Handle remaining less frequent colors
        const targetKeys = [bgKey, ...top3];

        for (const [key] of colors.entries()) {
            if (colorMap.has(key)) continue;

            const [r, g, b, a] = key.split(',').map(Number);

            // If transparent, map to 0
            if (a < 128) {
                colorMap.set(key, 0);
                continue;
            }

            // Find closest target
            let minDist = Infinity;
            let bestIdx = 0;

            targetKeys.forEach((tKey, idx) => {
                const [tr, tg, tb] = tKey.split(',').map(Number);
                const dist = (r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2;
                if (dist < minDist) {
                    minDist = dist;
                    bestIdx = idx;
                }
            });

            colorMap.set(key, bestIdx);
        }

        return { colorMap, paletteBytes };
    }

    static findClosestNESColor(r, g, b) {
        let minDist = Infinity;
        let bestIdx = 0x0F;

        // Iterate all 64 NES colors
        for (let i = 0; i < 64; i++) {
            const [nr, ng, nb] = NESGraphics.nesPaletteToRGB(i);
            const dist = (r - nr) ** 2 + (g - ng) ** 2 + (b - nb) ** 2;
            if (dist < minDist) {
                minDist = dist;
                bestIdx = i;
            }
        }
        return bestIdx;
    }

    static extractTilePixels(imageData, x, y, colorMap) {
        const pixels = new Uint8Array(64);
        const data = imageData.data;
        const width = imageData.width;

        for (let py = 0; py < 8; py++) {
            for (let px = 0; px < 8; px++) {
                const idx = ((y + py) * width + (x + px)) * 4;
                const key = `${data[idx]},${data[idx + 1]},${data[idx + 2]},${data[idx + 3]}`;

                // Use map
                pixels[py * 8 + px] = colorMap.has(key) ? colorMap.get(key) : 0;
            }
        }
        return pixels;
    }
}
