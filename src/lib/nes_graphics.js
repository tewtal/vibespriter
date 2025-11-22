
// Mesen NTSC palette (matches the emulator default; keep entries unique except reserved blacks)
const NES_PALETTE = [
    [102, 102, 102], [0, 42, 136], [20, 18, 167], [59, 0, 164], [92, 0, 126], [110, 0, 64], [108, 6, 0], [86, 29, 0],
    [51, 53, 0], [11, 72, 0], [0, 82, 0], [0, 79, 10], [0, 64, 77], [0, 0, 0], [0, 0, 0], [0, 0, 0],
    [173, 173, 173], [21, 95, 217], [66, 64, 255], [117, 39, 254], [160, 26, 204], [183, 30, 123], [181, 49, 32], [153, 78, 0],
    [107, 109, 0], [56, 135, 0], [11, 148, 0], [0, 143, 50], [0, 124, 141], [0, 0, 0], [0, 0, 0], [0, 0, 0],
    [255, 254, 255], [100, 176, 255], [146, 144, 255], [198, 118, 255], [243, 106, 255], [255, 110, 204], [255, 129, 112], [234, 158, 34],
    [188, 190, 0], [136, 216, 0], [92, 228, 48], [69, 224, 130], [72, 206, 222], [79, 79, 79], [0, 0, 0], [0, 0, 0],
    [255, 254, 255], [192, 223, 255], [211, 210, 255], [232, 200, 255], [255, 194, 255], [255, 196, 234], [255, 201, 201], [255, 215, 168],
    [255, 230, 158], [226, 240, 144], [203, 246, 111], [184, 248, 184], [179, 255, 240], [169, 169, 169], [0, 0, 0], [0, 0, 0]
];

export class NESGraphics {
    /**
     * Decodes NES 2bpp planar data into an array of color indices (0-3).
     * @param {Uint8Array} data - Raw tile data (16 bytes per tile)
     * @param {number} numTiles - Number of tiles to decode
     * @returns {Uint8Array} Array of color indices (one byte per pixel)
     */
    static decode2bpp(data, numTiles) {
        const pixels = new Uint8Array(numTiles * 8 * 8);

        for (let t = 0; t < numTiles; t++) {
            const tileOffset = t * 16;
            const pixelOffset = t * 64;

            for (let y = 0; y < 8; y++) {
                const plane0 = data[tileOffset + y];
                const plane1 = data[tileOffset + y + 8];

                for (let x = 0; x < 8; x++) {
                    const bit = 7 - x;
                    const p0 = (plane0 >> bit) & 1;
                    const p1 = (plane1 >> bit) & 1;
                    const val = (p1 << 1) | p0;

                    pixels[pixelOffset + y * 8 + x] = val;
                }
            }
        }

        return pixels;
    }

    /**
     * Encodes an array of color indices (0-3) into NES 2bpp planar data.
     * @param {Uint8Array} pixels - Array of color indices
     * @returns {Uint8Array} Raw tile data
     */
    static encode2bpp(pixels) {
        const numTiles = pixels.length / 64;
        const data = new Uint8Array(numTiles * 16);

        for (let t = 0; t < numTiles; t++) {
            const tileOffset = t * 16;
            const pixelOffset = t * 64;

            for (let y = 0; y < 8; y++) {
                let plane0 = 0;
                let plane1 = 0;

                for (let x = 0; x < 8; x++) {
                    const val = pixels[pixelOffset + y * 8 + x] & 3;
                    const p0 = val & 1;
                    const p1 = (val >> 1) & 1;

                    plane0 |= (p0 << (7 - x));
                    plane1 |= (p1 << (7 - x));
                }

                data[tileOffset + y] = plane0;
                data[tileOffset + y + 8] = plane1;
            }
        }

        return data;
    }

    /**
     * Converts indexed pixels to RGBA image data using a palette.
     * @param {Uint8Array} indexedPixels - Array of color indices
     * @param {Array<Array<number>>} palette - Array of 4 [r, g, b] arrays
     * @returns {Uint8ClampedArray} RGBA data suitable for ImageData
     */
    static renderToRGBA(indexedPixels, palette) {
        const rgba = new Uint8ClampedArray(indexedPixels.length * 4);

        for (let i = 0; i < indexedPixels.length; i++) {
            const colorIndex = indexedPixels[i];
            const color = palette[colorIndex] || [0, 0, 0];

            rgba[i * 4] = color[0];
            rgba[i * 4 + 1] = color[1];
            rgba[i * 4 + 2] = color[2];
            rgba[i * 4 + 3] = 255; // Alpha
        }

        return rgba;
    }

    /**
     * Converts a standard NES palette byte to RGB.
     * This uses a Nestopia/FBX palette to keep RGB values unique for import/export.
     */
    static nesPaletteToRGB(nesColorByte) {
        return NES_PALETTE[nesColorByte & 0x3F] || [0, 0, 0];
    }

    /**
     * Finds the NES palette index that best matches the given RGB color.
     * Prefers 0x0F for pure black to stabilise palette round-trips.
     */
    static findClosestNESColor(r, g, b) {
        let minDist = Infinity;
        let bestIdx = 0;

        for (let i = 0; i < NES_PALETTE.length; i++) {
            const [nr, ng, nb] = NES_PALETTE[i];
            const dist = (r - nr) ** 2 + (g - ng) ** 2 + (b - nb) ** 2;

            if (dist < minDist) {
                minDist = dist;
                bestIdx = i;

                if (dist === 0 && !(r === 0 && g === 0 && b === 0)) {
                    return bestIdx; // Exact non-black match
                }
            }
        }

        // For black, always prefer the universal background colour slot.
        if (r === 0 && g === 0 && b === 0) {
            return 0x0F;
        }

        return bestIdx;
    }
}
