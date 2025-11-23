import { NESGraphics } from './nes_graphics.js';
import { BLOCK_TYPES } from './rdc.js';

function getLayoutStorageKey(state) {
    const base = state.layoutKey || `layout_${state.currentGame?.type || 'unknown'}`;
    return base;
}

export function initWorkspace(state, forceDefault = false) {
    state.workspaceSegments = [];
    state.selectedSegmentIndices.clear();

    // Load saved layout if available (unless forcing default)
    const savedLayoutKey = getLayoutStorageKey(state);
    const savedLayout = forceDefault ? null : localStorage.getItem(savedLayoutKey);
    let savedConfig = {};
    if (savedLayout) {
        try {
            savedConfig = JSON.parse(savedLayout);
        } catch (e) { console.error('Failed to load saved layout', e); }
    }

    // Get default layout based on game type
    const hasCustomLayout = Object.keys(savedConfig).length > 0;
    const defaultLayout = hasCustomLayout ? null : getDefaultLayout(state.currentBlock.type);

    state.currentGame.segments.forEach((seg, index) => {
        if (seg.type === 'graphics') {
            const saved = savedConfig[index];
            const def = defaultLayout ? defaultLayout[index] : null;

            const wsSeg = {
                segmentIndex: index,
                x: saved?.x ?? (def?.x || 0),
                y: saved?.y ?? (def?.y || 0),
                visible: saved?.visible ?? (def?.visible ?? (index === 0)),
                width: saved?.width ?? (def?.width || 8),
                height: saved?.height ?? (def?.height || 1),
                paletteIndex: saved?.paletteIndex ?? 0,
                flipX: saved?.flipX ?? false,
                flipY: saved?.flipY ?? false
            };
            state.workspaceSegments.push(wsSeg);
        }
    });

    // Select first visible segment
    const firstVisible = state.workspaceSegments.findIndex(s => s.visible);
    if (firstVisible !== -1) selectSingleSegment(firstVisible, state);
}

function getDefaultLayout(blockType) {
    if (blockType === BLOCK_TYPES.ZELDA1_SPRITE) {
        return getZeldaDefaultLayout();
    } else if (blockType === BLOCK_TYPES.METROID1_SPRITE) {
        return getMetroidDefaultLayout();
    }
    return null;
}

function getZeldaDefaultLayout() {
    // Z1: horizontal flow with 2-tile stacks (matches PNG export 160x24)
    const layout = {};
    let currentX = 0;
    const segmentLengths = [32, 32, 448, 32, 64, 32]; // Graphics segments

    [0, 1, 2, 3, 4, 5].forEach((segId, idx) => {
        const numTiles = segmentLengths[idx] / 16;
        const cols = Math.ceil(numTiles / 2);

        layout[segId] = {
            x: currentX,
            y: 0,
            visible: true,
            width: cols,
            height: 2
        };

        currentX += cols * 8;
    });

    return layout;
}

function getMetroidDefaultLayout() {
    // M1: 3-row layout matching PNG export
    const segmentLayout = [
        { row: 0, segments: [0, 1, 2, 13, 17] },      // Row 1 (skipping blank)
        { row: 1, segments: [15, 11, 4, 14, 12, 3] },  // Row 2 (skipping blank)
        { row: 2, segments: [9, 8, 7, 10, 16, 6, 5] } // Row 3 (skipping blank)
    ];

    const layout = {};
    const segmentLengths = [64, 80, 64, 16, 96, 64, 48, 96, 96, 16, 32, 96, 48, 112, 112, 16, 32, 64];

    segmentLayout.forEach(({ row, segments }) => {
        let currentX = 0;
        const y = row * 8;

        // Add blank space at start of row 3
        if (row === 2) currentX += 8;
        // Add blank space after segment 1 in row 1
        // Add blank space after segment 15 in row 2

        segments.forEach((segId, idx) => {
            // Add blank before segment 2 (row 0, after segment 1)
            if (row === 0 && segId === 2) currentX += 8;
            // Add blank before segment 11 (row 1, after segment 15)
            if (row === 1 && segId === 11) currentX += 8;

            const numTiles = segmentLengths[segId] / 16;

            layout[segId] = {
                x: currentX,
                y: y,
                visible: true,
                width: numTiles,
                height: 1
            };

            currentX += numTiles * 8;
        });
    });

    return layout;
}

export function selectSingleSegment(wsIndex, state) {
    state.selectedSegmentIndices.clear();
    state.selectedSegmentIndices.add(wsIndex);
}

export function toggleSegmentSelection(wsIndex, state) {
    if (state.selectedSegmentIndices.has(wsIndex)) {
        state.selectedSegmentIndices.delete(wsIndex);
    } else {
        state.selectedSegmentIndices.add(wsIndex);
    }
}

export function saveLayout(state) {
    const storageKey = getLayoutStorageKey(state);
    const config = {};
    state.workspaceSegments.forEach(wsSeg => {
        config[wsSeg.segmentIndex] = {
            x: wsSeg.x,
            y: wsSeg.y,
            visible: wsSeg.visible,
            width: wsSeg.width,
            height: wsSeg.height,
            paletteIndex: wsSeg.paletteIndex,
            flipX: wsSeg.flipX,
            flipY: wsSeg.flipY
        };
    });
    localStorage.setItem(storageKey, JSON.stringify(config));
}

export function handleDraw(e, canvas, state) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / state.canvasScale;
    const y = (e.clientY - rect.top) / state.canvasScale;

    let targetSegmentId = -1;
    for (let idx of state.selectedSegmentIndices) {
        const wsSeg = state.workspaceSegments[idx];
        if (!wsSeg.visible) continue;

        const segDef = state.currentGame.segments[wsSeg.segmentIndex];
        const numTiles = segDef.length / 16;
        const totalCols = Math.ceil(numTiles / wsSeg.height);
        const w = Math.min(totalCols, wsSeg.width) * 8;
        const h = Math.ceil(totalCols / wsSeg.width) * (wsSeg.height * 8);

        if (x >= wsSeg.x && x < wsSeg.x + w && y >= wsSeg.y && y < wsSeg.y + h) {
            targetSegmentId = idx;
            break;
        }
    }

    if (targetSegmentId === -1) return;

    const wsSeg = state.workspaceSegments[targetSegmentId];
    let localX = x - wsSeg.x;
    let localY = y - wsSeg.y;

    // Adjust for Flip
    const segDef = state.currentGame.segments[wsSeg.segmentIndex];
    const numTiles = segDef.length / 16;
    const totalCols = Math.ceil(numTiles / wsSeg.height);
    const w = Math.min(totalCols, wsSeg.width) * 8;
    const h = Math.ceil(totalCols / wsSeg.width) * (wsSeg.height * 8);

    if (wsSeg.flipX) localX = w - localX;
    if (wsSeg.flipY) localY = h - localY;

    const row = Math.floor(localY / (wsSeg.height * 8));
    const stackY = Math.floor((localY % (wsSeg.height * 8)) / 8);
    const col = Math.floor(localX / 8);

    if (col >= wsSeg.width) return;

    const stackIndex = row * wsSeg.width + col;
    const t = stackIndex * wsSeg.height + stackY;

    if (t >= numTiles) return;

    const pixelX = Math.floor(localX % 8);
    const pixelY = Math.floor(localY % 8);
    const pixelIndex = t * 64 + pixelY * 8 + pixelX;

    let offset = 0;
    for (let i = 0; i < wsSeg.segmentIndex; i++) offset += state.currentGame.segments[i].length;
    const segmentData = state.currentBlock.payload.subarray(offset, offset + segDef.length);
    const pixels = NESGraphics.decode2bpp(segmentData, numTiles);

    if (pixelIndex < pixels.length) {
        pixels[pixelIndex] = state.selectedColorIndex;
        const newData = NESGraphics.encode2bpp(pixels);
        segmentData.set(newData);
    }
}
