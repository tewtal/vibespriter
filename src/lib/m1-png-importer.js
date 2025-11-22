import { BLOCK_TYPES } from './rdc.js';
import { NESGraphics } from './nes_graphics.js';

export class M1PNGImporter {
    static async parse(file) {
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Layout: segments in specific order
        const layout = [
            [0, 1, null, 2, 13, 17],
            [15, null, 11, 4, 14, 12, 3],
            [null, 9, 8, 7, 10, 16, 6, 5]
        ];

        //  Segment lengths in bytes
        const segmentLengths = [64, 80, 64, 16, 96, 64, 48, 96, 96, 16, 32, 96, 48, 112, 112, 16, 32, 64];

        let palettes = {
            base: [0x0F, 0x30, 0x27],
            normal: [0x30, 0x27],
            missile: [0x30, 0x27],
            varia: [0x30, 0x27],
            variaMissile: [0x30, 0x27]
        };

        // Extract palettes if PNG is 25px tall (new format) or 32px tall (old format)
        if (canvas.height === 25 || canvas.height === 32) {
            const paletteY = 24; // Palette row

            // Base palette has 4 colors (indices 0-3)
            palettes.base = [
                this.sampleNESColor(imageData, 0, paletteY),
                this.sampleNESColor(imageData, 1, paletteY),
                this.sampleNESColor(imageData, 2, paletteY),
                this.sampleNESColor(imageData, 3, paletteY)
            ].slice(1); // Remove background color for storage

            // Other palettes have 4 colors displayed (0, 1, 2, 3) but only store 2, 3
            palettes.normal = [
                this.sampleNESColor(imageData, 6, paletteY),   // index 2
                this.sampleNESColor(imageData, 7, paletteY)    // index 3
            ];
            palettes.missile = [
                this.sampleNESColor(imageData, 10, paletteY),  // index 2
                this.sampleNESColor(imageData, 11, paletteY)   // index 3
            ];
            palettes.varia = [
                this.sampleNESColor(imageData, 14, paletteY),  // index 2
                this.sampleNESColor(imageData, 15, paletteY)   // index 3
            ];
            palettes.variaMissile = [
                this.sampleNESColor(imageData, 18, paletteY),  // index 2
                this.sampleNESColor(imageData, 19, paletteY)   // index 3
            ];
        }

        // Build color map for decoding
        const fullBasePalette = [0x0F, ...palettes.base];
        const colorMap = new Map();
        fullBasePalette.forEach((nesColor, idx) => {
            const rgb = NESGraphics.nesPaletteToRGB(nesColor);
            const key = `${rgb[0]},${rgb[1]},${rgb[2]}`;
            colorMap.set(key, idx);
        });

        // Extract segments
        const segmentData = new Array(18).fill(null).map((_, i) => new Uint8Array(segmentLengths[i]));

        layout.forEach((row, rowIndex) => {
            let currentX = 0;
            const y = rowIndex * 8;

            row.forEach(segmentId => {
                if (segmentId === null) {
                    currentX += 8; // Skip blank
                    return;
                }

                const numTiles = segmentLengths[segmentId] / 16;
                const pixels = new Uint8Array(numTiles * 64);

                for (let t = 0; t < numTiles; t++) {
                    const tileX = currentX + t * 8;

                    for (let py = 0; py < 8; py++) {
                        for (let px = 0; px < 8; px++) {
                            const pixelIndex = ((y + py) * canvas.width + (tileX + px)) * 4;
                            const r = imageData.data[pixelIndex];
                            const g = imageData.data[pixelIndex + 1];
                            const b = imageData.data[pixelIndex + 2];
                            const a = imageData.data[pixelIndex + 3];

                            let colorIdx = 0;
                            if (a > 128) {
                                const key = `${r},${g},${b}`;
                                colorIdx = colorMap.get(key) || 0;
                            }

                            pixels[t * 64 + py * 8 + px] = colorIdx;
                        }
                    }
                }

                const encoded = NESGraphics.encode2bpp(pixels);
                segmentData[segmentId] = encoded;
                currentX += numTiles * 8;
            });
        });

        // Build payload
        const totalLength = segmentLengths.reduce((a, b) => a + b, 0) +
            3 + // Base palette
            2 + 2 + 2 + 2; // Other palettes

        const payload = new Uint8Array(totalLength);
        let offset = 0;

        // Copy segments
        for (let i = 0; i < 18; i++) {
            payload.set(segmentData[i], offset);
            offset += segmentLengths[i];
        }

        // Copy palettes
        payload.set(new Uint8Array(palettes.base), offset);
        offset += 3;
        payload.set(new Uint8Array(palettes.normal), offset);
        offset += 2;
        payload.set(new Uint8Array(palettes.missile), offset);
        offset += 2;
        payload.set(new Uint8Array(palettes.varia), offset);
        offset += 2;
        payload.set(new Uint8Array(palettes.variaMissile), offset);

        return {
            author: 'PNG Import',
            blocks: [{
                type: BLOCK_TYPES.METROID1_SPRITE,
                payload
            }]
        };
    }

    static sampleNESColor(imageData, x, y) {
        const pixelIndex = (y * imageData.width + x) * 4;
        const r = imageData.data[pixelIndex];
        const g = imageData.data[pixelIndex + 1];
        const b = imageData.data[pixelIndex + 2];
        return NESGraphics.findClosestNESColor(r, g, b);
    }
}
