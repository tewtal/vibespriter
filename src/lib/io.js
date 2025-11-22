import { RDCParser, BLOCK_TYPES, RDCWriter } from './rdc.js';
import { GAMES } from './games.js';
import { NESGraphics } from './nes_graphics.js';

export async function importFile(file) {
    let rdc;
    if (file.name.endsWith('.asset')) {
        const text = await file.text();
        const { Z1M1Importer } = await import('./z1m1-importer.js');
        rdc = Z1M1Importer.parse(text);
    } else if (file.name.endsWith('.png')) {
        // Detect PNG type by dimensions
        const bitmap = await createImageBitmap(file);
        const width = bitmap.width;
        const height = bitmap.height;

        if (width === 200 && (height === 32 || height === 24)) {
            // Metroid PNG
            const { M1PNGImporter } = await import('./m1-png-importer.js');
            rdc = await M1PNGImporter.parse(file);
        } else {
            // Default to Zelda PNG (160x24 or 160x16)
            const { Z1PNGImporter } = await import('./z1-png-importer.js');
            rdc = await Z1PNGImporter.parse(file);
        }
    } else {
        const buffer = await file.arrayBuffer();
        const parser = new RDCParser(buffer);
        rdc = parser.parse();
    }
    return rdc;
}

export function loadPalettes(block, game) {
    const palettes = [];

    // Add default palette
    palettes.push({ name: 'Default', colors: [...game.defaultPalette] });

    // Find palette segments
    game.segments.forEach((seg, index) => {
        if (seg.type === 'palette') {
            let offset = 0;
            for (let i = 0; i < index; i++) {
                offset += game.segments[i].length;
            }
            const data = block.payload.subarray(offset, offset + seg.length);
            const colors = [0x0F, ...data];

            // Special handling for 3-color palettes (Background + 2 colors)
            // Map to slots 0, 2, 3 (insert padding at slot 1)
            if (colors.length === 3) {
                colors.splice(1, 0, 0x0F);
            }

            // Pad to 4 colors if needed
            while (colors.length < 4) {
                colors.push(0x0F);
            }
            if (colors.length > 4) colors.length = 4;

            palettes.push({ name: seg.label, colors, segmentIndex: index });
        }
    });

    return palettes;
}

export function exportRDC(state) {
    if (!state.currentRDC || !state.currentBlock) return null;

    const writer = new RDCWriter();
    writer.setAuthor(state.currentRDC.author || 'VibeSpriter');

    // Add Metadata Block if exists
    const metaBlock = state.currentRDC.blocks.find(b => b.type === BLOCK_TYPES.METADATA);
    if (metaBlock) {
        writer.addBlock(BLOCK_TYPES.METADATA, metaBlock.payload);
    }

    // Add Sprite Block
    writer.addBlock(state.currentBlock.type, state.currentBlock.payload);

    return writer.build();
}

export function exportPNG(state) {
    if (!state.currentBlock || !state.currentGame) return null;

    if (state.currentBlock.type === BLOCK_TYPES.ZELDA1_SPRITE) {
        return exportZeldaPNG(state);
    } else if (state.currentBlock.type === BLOCK_TYPES.METROID1_SPRITE) {
        return exportMetroidPNG(state);
    }

    return null;
}

function exportZeldaPNG(state) {
    const width = 160;
    const height = 24;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Use palettes for rendering
    const basePalette = state.loadedPalettes.find(p => p.name === 'Base Colors')?.colors || [0x0F, 0x29, 0x27, 0x17];
    const l2Palette = state.loadedPalettes.find(p => p.name === 'Level 2 Colors')?.colors || [0x0F, 0x32, 0x27, 0x17];
    const l3Palette = state.loadedPalettes.find(p => p.name === 'Level 3 Colors')?.colors || [0x0F, 0x16, 0x27, 0x17];
    const tunicPalette = state.loadedPalettes.find(p => p.name === 'Tunic Colors')?.colors || [0x0F, 0x29, 0x27, 0x17];

    const renderPalette = basePalette.map(idx => NESGraphics.nesPaletteToRGB(idx));

    let currentX = 0;
    let offset = 0;

    state.currentGame.segments.forEach(seg => {
        if (seg.type !== 'graphics') {
            offset += seg.length;
            return;
        }

        const numTiles = seg.length / 16;
        const data = state.currentBlock.payload.subarray(offset, offset + seg.length);
        const pixels = NESGraphics.decode2bpp(data, numTiles);
        const cols = Math.ceil(numTiles / 2);

        for (let col = 0; col < cols; col++) {
            for (let row = 0; row < 2; row++) {
                const tileIndex = col * 2 + row;
                if (tileIndex >= numTiles) continue;

                const tileX = currentX + col * 8;
                const tileY = row * 8;
                const tilePixels = pixels.subarray(tileIndex * 64, (tileIndex + 1) * 64);

                const imgData = ctx.createImageData(8, 8);
                for (let i = 0; i < 64; i++) {
                    const colorIdx = tilePixels[i];
                    const rgb = renderPalette[colorIdx];
                    imgData.data[i * 4] = rgb[0];
                    imgData.data[i * 4 + 1] = rgb[1];
                    imgData.data[i * 4 + 2] = rgb[2];
                    imgData.data[i * 4 + 3] = 255;
                }
                ctx.putImageData(imgData, tileX, tileY);
            }
        }

        currentX += cols * 8;
        offset += seg.length;
    });

    // Draw Palettes (Row 16-23)
    const palettesToDraw = [basePalette, l2Palette, l3Palette, tunicPalette];
    let palX = 0;
    const palY = 16;

    palettesToDraw.forEach(pal => {
        pal.forEach(colorIdx => {
            const rgb = NESGraphics.nesPaletteToRGB(colorIdx);
            ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
            ctx.fillRect(palX, palY, 8, 8);
            palX += 8;
        });
    });

    return canvas.toDataURL('image/png');
}

function exportMetroidPNG(state) {
    const width = 200;
    const height = 32;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Get palettes
    const basePalette = state.loadedPalettes.find(p => p.name === 'Base Colors')?.colors || [0x0F, 0x30, 0x27, 0x16];
    const normalPalette = state.loadedPalettes.find(p => p.name === 'Normal Colors')?.colors || [0x0F, 0x30, 0x27, 0x16];
    const missilePalette = state.loadedPalettes.find(p => p.name === 'Missile Colors')?.colors || [0x0F, 0x30, 0x27, 0x16];
    const variaPalette = state.loadedPalettes.find(p => p.name === 'Varia Colors')?.colors || [0x0F, 0x30, 0x27, 0x16];
    const variaMissilePalette = state.loadedPalettes.find(p => p.name === 'Varia Missile Colors')?.colors || [0x0F, 0x30, 0x27, 0x16];

    const renderPalette = basePalette.map(idx => NESGraphics.nesPaletteToRGB(idx));

    // Layout: 3 rows, each with specific segments
    // null = blank 8x8 tile
    const layout = [
        [0, 1, null, 2, 13, 17],           // Row 1 (y=0)
        [15, null, 11, 4, 14, 12, 3],      // Row 2 (y=8)
        [null, 9, 8, 7, 10, 16, 6, 5]      // Row 3 (y=16)
    ];

    layout.forEach((row, rowIndex) => {
        let currentX = 0;
        const y = rowIndex * 8;

        row.forEach(segmentId => {
            if (segmentId === null) {
                // Blank tile - fill with black
                ctx.fillStyle = 'rgb(15, 15, 15)'; // NES black
                ctx.fillRect(currentX, y, 8, 8);
                currentX += 8;
                return;
            }

            // Find segment offset
            let offset = 0;
            for (let i = 0; i < segmentId; i++) {
                offset += state.currentGame.segments[i].length;
            }

            const seg = state.currentGame.segments[segmentId];
            const numTiles = seg.length / 16;
            const data = state.currentBlock.payload.subarray(offset, offset + seg.length);
            const pixels = NESGraphics.decode2bpp(data, numTiles);

            // Render tiles horizontally
            for (let t = 0; t < numTiles; t++) {
                const tilePixels = pixels.subarray(t * 64, (t + 1) * 64);
                const imgData = ctx.createImageData(8, 8);

                for (let i = 0; i < 64; i++) {
                    const colorIdx = tilePixels[i];
                    const rgb = renderPalette[colorIdx];
                    imgData.data[i * 4] = rgb[0];
                    imgData.data[i * 4 + 1] = rgb[1];
                    imgData.data[i * 4 + 2] = rgb[2];
                    imgData.data[i * 4 + 3] = 255;
                }

                ctx.putImageData(imgData, currentX, y);
                currentX += 8;
            }
        });
    });

    // Draw Palettes (Row 24-31)
    const palettesToDraw = [basePalette, normalPalette, missilePalette, variaPalette, variaMissilePalette];
    let palX = 0;
    const palY = 24;

    palettesToDraw.forEach(pal => {
        pal.forEach(colorIdx => {
            const rgb = NESGraphics.nesPaletteToRGB(colorIdx);
            ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
            ctx.fillRect(palX, palY, 8, 8);
            palX += 8;
        });
    });

    return canvas.toDataURL('image/png');
}

export async function patchROM(file, state) {
    const romBuffer = await file.arrayBuffer();

    // Reconstruct RDC buffer from current state
    const writer = new RDCWriter();
    writer.setAuthor(state.currentRDC.author || 'VibeSpriter');

    // Add Metadata Block if exists
    const metaBlock = state.currentRDC.blocks.find(b => b.type === BLOCK_TYPES.METADATA);
    if (metaBlock) {
        writer.addBlock(BLOCK_TYPES.METADATA, metaBlock.payload);
    }

    writer.addBlock(state.currentBlock.type, state.currentBlock.payload);
    const rdcBuffer = writer.build();

    // Apply Patch
    const { applyNesRdc } = await import('./patcher.js');

    // Determine game ID based on current block type
    let gameId = null;
    if (state.currentBlock.type === 2) gameId = 'zelda1';
    if (state.currentBlock.type === 3) gameId = 'metroid';

    if (!gameId) {
        throw new Error('Unsupported game type for patching.');
    }

    return await applyNesRdc(romBuffer, rdcBuffer, gameId);
}
