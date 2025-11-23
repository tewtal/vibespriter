import { NESGraphics } from './nes_graphics.js';

export function renderWorkspace(canvas, ctx, state) {
    // Determine canvas size
    let maxX = 0;
    let maxY = 0;

    state.workspaceSegments.forEach(wsSeg => {
        if (!wsSeg.visible) return;
        const segDef = state.currentGame.segments[wsSeg.segmentIndex];
        const numTiles = segDef.length / 16;

        const totalCols = Math.ceil(numTiles / wsSeg.height);
        const displayWidth = Math.min(totalCols, wsSeg.width) * 8;
        const displayHeight = Math.ceil(totalCols / wsSeg.width) * (wsSeg.height * 8);

        maxX = Math.max(maxX, wsSeg.x + displayWidth);
        maxY = Math.max(maxY, wsSeg.y + displayHeight);
    });

    const { availableWidth, availableHeight } = getCanvasAvailableSpace(canvas);

    const desiredWidth = Math.max(maxX + 64, 256) * state.canvasScale;
    const desiredHeight = Math.max(maxY + 64, 256) * state.canvasScale;
    const minimumContentWidth = Math.max((maxX || 0) + 1, 1) * state.canvasScale;
    const minimumContentHeight = Math.max((maxY || 0) + 1, 1) * state.canvasScale;

    // Clamp size to available viewport space when possible (keep zoom scale intact, but allow margins to shrink).
    const boundedWidth = Number.isFinite(availableWidth) && availableWidth > 0 && availableWidth < desiredWidth
        ? Math.max(minimumContentWidth, availableWidth)
        : desiredWidth;

    const boundedHeight = Number.isFinite(availableHeight) && availableHeight > 0 && availableHeight < desiredHeight
        ? Math.max(minimumContentHeight, availableHeight)
        : desiredHeight;

    // Only apply when size meaningfully changes to avoid rapid reflows/jitter from minor measurements.
    if (Math.abs(canvas.width - boundedWidth) >= 0.5) {
        canvas.width = boundedWidth;
    }
    if (Math.abs(canvas.height - boundedHeight) >= 0.5) {
        canvas.height = boundedHeight;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    state.workspaceSegments.forEach((wsSeg, index) => {
        if (!wsSeg.visible) return;
        renderWorkspaceSegment(ctx, wsSeg, index, state);
    });

    if (state.showGrid) drawGrid(ctx, canvas.width / state.canvasScale, canvas.height / state.canvasScale, state.canvasScale);

    // Draw Selection Box
    if (state.isSelecting) {
        ctx.save();
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(
            state.selectionRect.x * state.canvasScale,
            state.selectionRect.y * state.canvasScale,
            state.selectionRect.w * state.canvasScale,
            state.selectionRect.h * state.canvasScale
        );
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        ctx.fillRect(
            state.selectionRect.x * state.canvasScale,
            state.selectionRect.y * state.canvasScale,
            state.selectionRect.w * state.canvasScale,
            state.selectionRect.h * state.canvasScale
        );
        ctx.restore();
    }
}

export function renderWorkspaceSegment(ctx, wsSeg, index, state) {
    const segDef = state.currentGame.segments[wsSeg.segmentIndex];
    let offset = 0;
    for (let i = 0; i < wsSeg.segmentIndex; i++) offset += state.currentGame.segments[i].length;

    const data = state.currentBlock.payload.subarray(offset, offset + segDef.length);
    const numTiles = segDef.length / 16;
    const pixels = NESGraphics.decode2bpp(data, numTiles);

    const palette = state.loadedPalettes[wsSeg.paletteIndex].colors.map(idx => NESGraphics.nesPaletteToRGB(idx));

    const totalCols = Math.ceil(numTiles / wsSeg.height);
    const displayWidth = Math.min(totalCols, wsSeg.width) * 8;
    const displayHeight = Math.ceil(totalCols / wsSeg.width) * (wsSeg.height * 8);

    const buffer = document.createElement('canvas');
    buffer.width = displayWidth;
    buffer.height = displayHeight;
    const bCtx = buffer.getContext('2d');
    const bData = bCtx.createImageData(displayWidth, displayHeight);

    for (let t = 0; t < numTiles; t++) {
        const stackIndex = Math.floor(t / wsSeg.height);
        const stackY = t % wsSeg.height;
        const col = stackIndex % wsSeg.width;
        const row = Math.floor(stackIndex / wsSeg.width);
        const tileX = col * 8;
        const tileY = row * (wsSeg.height * 8) + (stackY * 8);

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const pixelIndex = t * 64 + y * 8 + x;
                const colorIndex = pixels[pixelIndex];
                const color = palette[colorIndex];

                const destIndex = ((tileY + y) * displayWidth + (tileX + x)) * 4;
                bData.data[destIndex] = color[0];
                bData.data[destIndex + 1] = color[1];
                bData.data[destIndex + 2] = color[2];
                bData.data[destIndex + 3] = 255;
            }
        }
    }

    bCtx.putImageData(bData, 0, 0);

    ctx.save();

    // Apply transformations
    let x = wsSeg.x * state.canvasScale;
    let y = wsSeg.y * state.canvasScale;
    let w = displayWidth * state.canvasScale;
    let h = displayHeight * state.canvasScale;

    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(wsSeg.flipX ? -1 : 1, wsSeg.flipY ? -1 : 1);
    ctx.translate(-(x + w / 2), -(y + h / 2));

    ctx.drawImage(buffer, x, y, w, h);

    // Draw selection border (transformed)
    if (state.selectedSegmentIndices.has(index)) {
        ctx.strokeStyle = '#3a7bd5';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
    } else {
        // Draw faint border for unselected
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
    }

    ctx.restore();
}

export function drawGrid(ctx, width, height, scale) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x * scale, 0);
        ctx.lineTo(x * scale, height * scale);
        ctx.stroke();
    }

    for (let y = 0; y <= height; y += 8) {
        ctx.beginPath();
        ctx.moveTo(0, y * scale);
        ctx.lineTo(width * scale, y * scale);
        ctx.stroke();
    }
}

function getCanvasAvailableSpace(canvas) {
    const container = canvas?.parentElement;
    if (!container) return { availableWidth: Infinity, availableHeight: Infinity };

    const computed = getComputedStyle(container);
    const paddingX = (parseFloat(computed.paddingLeft) || 0) + (parseFloat(computed.paddingRight) || 0);
    const paddingY = (parseFloat(computed.paddingTop) || 0) + (parseFloat(computed.paddingBottom) || 0);

    const rect = container.getBoundingClientRect();

    return {
        // Use the container box size (independent of scrollbar appearance) to prevent oscillation.
        availableWidth: Math.max(rect.width - paddingX, 0),
        availableHeight: Math.max(rect.height - paddingY, 0)
    };
}
