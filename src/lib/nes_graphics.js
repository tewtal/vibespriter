
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
     * This is a simplified palette map.
     */
    static nesPaletteToRGB(nesColorByte) {
        // Basic NES palette mapping (simplified)
        // Source: http://www.firebrandx.com/nespalette.html (approximate)
        const palette = [
            [84, 84, 84], [0, 30, 116], [8, 16, 144], [48, 0, 136], [68, 0, 100], [92, 0, 48], [84, 4, 0], [60, 24, 0], [32, 42, 0], [8, 58, 0], [0, 64, 0], [0, 60, 0], [0, 50, 60], [0, 0, 0], [0, 0, 0], [0, 0, 0],
            [152, 150, 152], [8, 76, 196], [48, 50, 236], [92, 30, 228], [136, 20, 176], [160, 20, 100], [152, 34, 32], [120, 60, 0], [84, 90, 0], [40, 114, 0], [8, 124, 0], [0, 118, 40], [0, 102, 120], [0, 0, 0], [0, 0, 0], [0, 0, 0],
            [236, 238, 236], [76, 154, 236], [120, 124, 236], [176, 98, 236], [228, 84, 236], [236, 88, 180], [236, 106, 100], [212, 136, 32], [160, 170, 0], [116, 196, 0], [76, 208, 32], [56, 204, 108], [56, 180, 204], [60, 60, 60], [0, 0, 0], [0, 0, 0],
            [236, 238, 236], [168, 204, 236], [188, 188, 236], [212, 178, 236], [236, 174, 236], [236, 174, 212], [236, 180, 176], [228, 196, 144], [204, 210, 120], [180, 222, 120], [168, 226, 144], [152, 226, 180], [160, 214, 228], [160, 162, 160], [0, 0, 0], [0, 0, 0]
        ];

        return palette[nesColorByte & 0x3F] || [0, 0, 0];
    }
}
