import { NESGraphics } from './nes_graphics.js';
import { BLOCK_TYPES } from './rdc.js';

export class Z1M1Importer {
    static parse(xmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlString, "text/xml");
        const asset = doc.querySelector("Asset");

        if (!asset) {
            throw new Error("Invalid asset file: No <Asset> tag found.");
        }

        const type = asset.getAttribute("Type") || "";
        const author = asset.getAttribute("Creator") || "Unknown";

        let block = null;
        if (type.includes("Zelda") || type.includes("LinkAsset")) {
            block = this.parseZelda(doc);
        } else if (type.includes("Metroid")) {
            // Placeholder for Metroid support
            throw new Error("Metroid asset import not yet fully implemented.");
        } else {
            throw new Error("Unknown asset type: " + type);
        }

        return {
            author: author,
            blocks: [block]
        };
    }

    static parseZelda(doc) {
        const tiles = Array.from(doc.querySelectorAll("Data > Tiles > Tile"));
        const normalColors = this.parseColors(doc.querySelector("NormalColors")?.textContent);
        const blueRingColors = this.parseColors(doc.querySelector("BlueRingColors")?.textContent);
        const redRingColors = this.parseColors(doc.querySelector("RedRingColors")?.textContent);

        // Zelda 1 Segment Layout (from metadata.js / asset-import.md)
        // 0: Lifting (32 bytes, 2 tiles)
        // 1: Walk1 (32 bytes, 2 tiles)
        // 2: 7 poses (448 bytes, 28 tiles)
        // 3: Walk2 (32 bytes, 2 tiles)
        // 4: Walk1 Down (64 bytes, 4 tiles)
        // 5: Facing Down (32 bytes, 2 tiles)
        // Total Graphics: 40 tiles (640 bytes)

        const GRAPHICS_TILES = 40;
        if (tiles.length < GRAPHICS_TILES) {
            console.warn(`Asset has fewer tiles (${tiles.length}) than expected (${GRAPHICS_TILES}). Padding with empty tiles.`);
        }

        const graphicsSize = 640;
        const colorsSize = 3 * 4; // 4 palettes of 3 bytes
        const payload = new Uint8Array(graphicsSize + colorsSize);

        // Process Graphics
        let offset = 0;
        for (let i = 0; i < GRAPHICS_TILES; i++) {
            const tileStr = tiles[i] ? tiles[i].textContent : "";
            const tileData = this.decodeTileString(tileStr);
            payload.set(tileData, offset);
            offset += 16;
        }

        // Process Colors
        // 6: Base Colors (Normal)
        // 7: Level 2 (Blue Ring)
        // 8: Level 3 (Red Ring)
        // 9: Tunic (Normal)

        const base = normalColors || [0x29, 0x27, 0x17]; // Default fallback
        const l2 = blueRingColors || [0x32, 0x27, 0x17];
        const l3 = redRingColors || [0x16, 0x27, 0x17];
        const tunic = base; // Use base for tunic

        payload.set(base, offset); offset += 3;
        payload.set(l2, offset); offset += 3;
        payload.set(l3, offset); offset += 3;
        payload.set(tunic, offset); offset += 3;

        return {
            type: BLOCK_TYPES.ZELDA1_SPRITE,
            payload: payload
        };
    }

    static decodeTileString(str) {
        // String is 64 chars of '0','1','2','3'
        // Convert to 64 integers
        const pixels = new Uint8Array(64);
        for (let i = 0; i < 64; i++) {
            const char = str.charCodeAt(i);
            // '0' is 48. 
            let val = 0;
            if (char >= 48 && char <= 51) {
                val = char - 48;
            }
            pixels[i] = val;
        }
        return NESGraphics.encode2bpp(pixels);
    }

    static parseColors(str) {
        if (!str) return null;
        // "41 39 23" -> decimal values
        const parts = str.trim().split(/\s+/);
        return parts.map(p => parseInt(p, 10));
    }
}
