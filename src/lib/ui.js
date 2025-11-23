import { BLOCK_TYPES } from './rdc.js';
import { GAMES } from './games.js';
import { NESGraphics } from './nes_graphics.js';
import { renderWorkspace } from './renderer.js';
import { initWorkspace, selectSingleSegment, toggleSegmentSelection, saveLayout, handleDraw } from './editor.js';
import { importFile, loadPalettes, exportRDC, exportPNG, patchROM } from './io.js';

const SYSTEM_PALETTE = [];
for (let i = 0; i < 64; i++) SYSTEM_PALETTE.push(i);

export function initUI(state, canvas, ctx) {
    // Elements
    const fileInput = document.getElementById('file-input');
    const importBtn = document.getElementById('import-btn');
    const exportBtn = document.getElementById('export-btn');
    const exportPngBtn = document.getElementById('export-png-btn');
    const patchBtn = document.getElementById('patch-btn');
    const patchInput = document.getElementById('patch-input');
    const layersList = document.getElementById('layers-list');
    const paletteEditor = document.getElementById('palette-editor');
    const systemPaletteContainer = document.getElementById('system-palette');
    const statusText = document.getElementById('status-text');
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomLevelSpan = document.getElementById('zoom-level');
    const gridToggle = document.getElementById('grid-toggle');
    const resetLayoutBtn = document.getElementById('reset-layout-btn');
    const layoutWidthInput = document.getElementById('layout-width');
    const layoutWidthDisplay = document.getElementById('layout-width-display');
    const layoutHeightInput = document.getElementById('layout-height');
    const layoutHeightDisplay = document.getElementById('layout-height-display');
    const paletteSelect = document.getElementById('palette-select');
    const toolLayoutBtn = document.getElementById('tool-layout');
    const toolDrawBtn = document.getElementById('tool-draw');
    const flipXCheckbox = document.getElementById('flip-x');
    const flipYCheckbox = document.getElementById('flip-y');
    const metaNameInput = document.getElementById('meta-name');
    const metaAuthorInput = document.getElementById('meta-author');
    const sampleSelect = document.getElementById('sample-select');

    // Initialize System Palette
    function initSystemPalette() {
        if (!systemPaletteContainer) return;
        systemPaletteContainer.innerHTML = '';
        SYSTEM_PALETTE.forEach(idx => {
            const color = NESGraphics.nesPaletteToRGB(idx);
            const div = document.createElement('div');
            div.className = 'system-swatch';
            div.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            div.title = `0x${idx.toString(16).toUpperCase().padStart(2, '0')}`;

            div.onclick = () => {
                applyColorToPalette(idx);
            };

            systemPaletteContainer.appendChild(div);
        });
    }

    function applyColorToPalette(nesColorIndex) {
        if (!state.currentBlock) return;

        state.currentPalette[state.selectedColorIndex] = nesColorIndex;
        initPaletteEditor();

        const activePaletteIndex = paletteSelect.selectedIndex;
        if (activePaletteIndex !== -1) {
            const paletteInfo = state.loadedPalettes[activePaletteIndex];
            if (paletteInfo.segmentIndex !== undefined) {
                let offset = 0;
                for (let i = 0; i < paletteInfo.segmentIndex; i++) {
                    offset += state.currentGame.segments[i].length;
                }
                if (state.selectedColorIndex > 0) {
                    const byteOffset = state.selectedColorIndex - 1;
                    if (byteOffset < paletteInfo.colors.length - 1) {
                        state.currentBlock.payload[offset + byteOffset] = nesColorIndex;
                        paletteInfo.colors[state.selectedColorIndex] = nesColorIndex;
                    }
                }

                // Handle linked editing of index 1 color
                const isBaseColors = paletteInfo.name === 'Base Colors';
                const is3ColorPalette = paletteInfo.is3Color;

                // If editing index 1 of Base Colors or a 3-color palette, sync across all
                if (state.selectedColorIndex === 1 && (isBaseColors || is3ColorPalette)) {
                    // Update Base Colors palette if editing from a 3-color palette
                    if (is3ColorPalette) {
                        const baseColorsPalette = state.loadedPalettes.find(p => p.name === 'Base Colors');
                        if (baseColorsPalette && baseColorsPalette.segmentIndex !== undefined) {
                            let baseOffset = 0;
                            for (let i = 0; i < baseColorsPalette.segmentIndex; i++) {
                                baseOffset += state.currentGame.segments[i].length;
                            }
                            // Update Base Colors palette data (index 1 maps to byte 0 in the palette data)
                            state.currentBlock.payload[baseOffset] = nesColorIndex;
                            baseColorsPalette.colors[1] = nesColorIndex;
                        }
                    }

                    // Update all 3-color palettes (whether editing from Base Colors or another 3-color palette)
                    state.loadedPalettes.forEach(pal => {
                        if (pal.is3Color && pal !== paletteInfo) {
                            pal.colors[1] = nesColorIndex;
                        }
                    });
                }
            }
        }

        renderWorkspace(canvas, ctx, state);
    }

    function initPaletteEditor() {
        paletteEditor.innerHTML = '';
        state.currentPalette.forEach((colorIdx, i) => {
            const color = NESGraphics.nesPaletteToRGB(colorIdx);
            const div = document.createElement('div');
            div.className = 'palette-swatch';
            div.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            if (i === state.selectedColorIndex) div.classList.add('active');

            div.onclick = () => {
                state.selectedColorIndex = i;
                document.querySelectorAll('.palette-swatch').forEach(s => s.classList.remove('active'));
                div.classList.add('active');
            };
            paletteEditor.appendChild(div);
        });
    }

    function updateSelectionUI() {
        document.querySelectorAll('.layer-item').forEach(el => {
            const idx = parseInt(el.dataset.index);
            if (state.selectedSegmentIndices.has(idx)) {
                el.classList.add('selected');
            } else {
                el.classList.remove('selected');
            }
        });

        if (state.selectedSegmentIndices.size > 0) {
            const firstIdx = state.selectedSegmentIndices.values().next().value;
            const wsSeg = state.workspaceSegments[firstIdx];

            layoutWidthInput.value = wsSeg.width;
            layoutWidthDisplay.textContent = wsSeg.width;
            layoutHeightInput.value = wsSeg.height;
            layoutHeightDisplay.textContent = wsSeg.height;
            paletteSelect.selectedIndex = wsSeg.paletteIndex;
            state.currentPalette = [...state.loadedPalettes[wsSeg.paletteIndex].colors];

            flipXCheckbox.checked = wsSeg.flipX;
            flipYCheckbox.checked = wsSeg.flipY;

            statusText.textContent = `Selected: ${state.selectedSegmentIndices.size} segment(s)`;
        } else {
            statusText.textContent = 'No selection';
            flipXCheckbox.checked = false;
            flipYCheckbox.checked = false;
        }

        initPaletteEditor();
        renderWorkspace(canvas, ctx, state);
    }

    function populateLayersList() {
        layersList.innerHTML = '';
        state.workspaceSegments.forEach((wsSeg, wsIndex) => {
            const seg = state.currentGame.segments[wsSeg.segmentIndex];
            const item = document.createElement('div');
            item.className = 'layer-item';
            item.dataset.index = wsIndex;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = wsSeg.visible;
            checkbox.addEventListener('change', (e) => {
                wsSeg.visible = e.target.checked;
                saveLayout(state);
                renderWorkspace(canvas, ctx, state);
            });

            const label = document.createElement('span');
            label.textContent = `${wsSeg.segmentIndex}: ${seg.label}`;

            item.appendChild(checkbox);
            item.appendChild(label);

            item.addEventListener('click', (e) => {
                if (e.target !== checkbox) {
                    const idx = parseInt(item.dataset.index);
                    if (e.ctrlKey || e.metaKey) {
                        toggleSegmentSelection(idx, state);
                    } else {
                        selectSingleSegment(idx, state);
                    }
                    updateSelectionUI();
                }
            });

            layersList.appendChild(item);
        });
    }

    function buildLayoutKey(gameType, fileName, metaTitle) {
        const namePart = (fileName || metaTitle || 'default')
            .toString()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        return `layout_${gameType}_${namePart || 'default'}`;
    }

    function loadRDC(rdc, options = {}) {
        const { forceDefault = false, resetIfNoSaved = false, fileName = '' } = options;
        state.currentRDC = rdc;

        // Metadata
        if (metaAuthorInput) metaAuthorInput.value = rdc.author || '';

        if (metaNameInput) {
            const metaBlock = rdc.blocks.find(b => b.type === BLOCK_TYPES.METADATA);
            if (metaBlock) {
                try {
                    const jsonBytes = metaBlock.payload.subarray(4);
                    const decoder = new TextDecoder();
                    const jsonStr = decoder.decode(jsonBytes);
                    const meta = JSON.parse(jsonStr);
                    metaNameInput.value = meta.title || '';
                } catch (e) {
                    console.warn('Failed to parse metadata block', e);
                    metaNameInput.value = '';
                }
            } else {
                metaNameInput.value = '';
            }
        }

        // Find supported block
        const supportedTypes = [BLOCK_TYPES.ZELDA1_SPRITE, BLOCK_TYPES.METROID1_SPRITE];
        const block = rdc.blocks.find(b => supportedTypes.includes(b.type));

        if (!block) {
            alert('No supported sprite block found in this RDC file.');
            return;
        }

        state.currentBlock = block;
        state.currentGame = GAMES[block.type];

        // Determine layout key per sprite/file
        const metaTitle = metaNameInput?.value?.trim();
        state.layoutKey = buildLayoutKey(state.currentGame.type, fileName, metaTitle);

        // Load Palettes
        state.loadedPalettes = loadPalettes(block, state.currentGame);

        // Populate dropdown
        paletteSelect.innerHTML = '';
        state.loadedPalettes.forEach((pal, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = pal.name;
            paletteSelect.appendChild(option);
        });

        // Prefer Base Colors palette when available
        const basePaletteIndex = state.loadedPalettes.findIndex(p => p.name === 'Base Colors');
        const selectedPaletteIndex = basePaletteIndex !== -1 ? basePaletteIndex : 0;

        paletteSelect.selectedIndex = selectedPaletteIndex;

        // Set current palette based on selection
        state.currentPalette = [...state.loadedPalettes[selectedPaletteIndex].colors];

        // Initialize Workspace (fallback to saved layout for this sprite/file if present)
        const hasSavedLayout = localStorage.getItem(state.layoutKey);
        const useDefaultLayout = forceDefault || (resetIfNoSaved && !hasSavedLayout);
        initWorkspace(state, useDefaultLayout);

        // If loading sample, update all segments to use Base Colors palette
        if (forceDefault && selectedPaletteIndex > 0) {
            state.workspaceSegments.forEach(wsSeg => {
                wsSeg.paletteIndex = selectedPaletteIndex;
            });
        }

        populateLayersList();
        updateSelectionUI();
        renderWorkspace(canvas, ctx, state);
    }

    // Event Listeners
    importBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const rdc = await importFile(file);
            console.log('Parsed RDC:', rdc);

            const ext = file.name.toLowerCase();
            const isPng = ext.endsWith('.png');
            const isRdc = ext.endsWith('.rdc') || ext.endsWith('.asset');

            // For imported files, prefer the default layout (PNG layout for sprites) to avoid stale custom layouts.
            const forceDefaultLayout = isPng || isRdc;

            loadRDC(rdc, { forceDefault: forceDefaultLayout, fileName: file.name });
            statusText.textContent = `Loaded ${file.name} by ${rdc.author}`;
        } catch (err) {
            console.error(err);
            alert('Failed to load file: ' + err.message);
        } finally {
            // Reset input so importing the same file again still triggers change
            e.target.value = '';
        }
    });

    metaNameInput.addEventListener('input', (e) => {
        if (state.currentRDC) {
            let metaBlock = state.currentRDC.blocks.find(b => b.type === BLOCK_TYPES.METADATA);
            if (!metaBlock) {
                metaBlock = { type: BLOCK_TYPES.METADATA, payload: new Uint8Array(0) };
                state.currentRDC.blocks.unshift(metaBlock);
            }

            const meta = { title: e.target.value };
            const json = JSON.stringify(meta);
            const encoder = new TextEncoder();
            const raw = encoder.encode(json);

            const buffer = new ArrayBuffer(4 + raw.length);
            const view = new DataView(buffer);
            view.setUint32(0, raw.length, true);
            new Uint8Array(buffer, 4).set(raw);

            metaBlock.payload = new Uint8Array(buffer);
        }
    });

    metaAuthorInput.addEventListener('input', (e) => {
        if (state.currentRDC) {
            state.currentRDC.author = e.target.value;
        }
    });

    sampleSelect.addEventListener('change', async (e) => {
        const value = e.target.value;
        if (!value) return;

        try {
            const response = await fetch(`./default/${value}.rdc`);
            if (!response.ok) throw new Error(`Failed to load ${value}.rdc`);

            const buffer = await response.arrayBuffer();
            const parser = new (await import('./rdc.js')).RDCParser(buffer);
            const rdc = parser.parse();

            console.log('Loaded sample RDC:', rdc);
            loadRDC(rdc, { forceDefault: true, fileName: `${value}.rdc` }); // Force default layout for samples
            statusText.textContent = `Loaded ${value}.rdc by ${rdc.author}`;
        } catch (err) {
            console.error(err);
            alert('Failed to load sample: ' + err.message);
        }

        // Reset select
        sampleSelect.value = '';
    });

    exportBtn.addEventListener('click', () => {
        const buffer = exportRDC(state);
        if (!buffer) return;

        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const filename = (metaNameInput?.value || 'sprite') + '.rdc';

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
    });

    exportPngBtn.addEventListener('click', () => {
        const dataUrl = exportPNG(state);
        if (!dataUrl) return;

        // Determine filename based on game type
        const gamePrefix = state.currentBlock.type === BLOCK_TYPES.ZELDA1_SPRITE ? 'z1' : 'm1';
        const filename = `${gamePrefix}_sprite_sheet.png`;

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        a.click();
    });

    patchBtn.addEventListener('click', () => {
        if (!state.currentGame) {
            alert('Please load a sprite first.');
            return;
        }
        patchInput.click();
    });

    patchInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const patchedRom = await patchROM(file, state);

            const blob = new Blob([patchedRom], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `patched_${file.name}`;
            a.click();
            URL.revokeObjectURL(url);

            statusText.textContent = 'ROM Patched Successfully!';
        } catch (err) {
            console.error(err);
            alert('Failed to patch ROM: ' + err.message);
        }

        patchInput.value = '';
    });

    toolLayoutBtn.addEventListener('click', () => {
        state.editMode = 'layout';
        toolLayoutBtn.classList.add('active');
        toolDrawBtn.classList.remove('active');
        statusText.textContent = 'Layout Mode: Click to select, Drag to move, Drag empty space to box select';
    });

    toolDrawBtn.addEventListener('click', () => {
        state.editMode = 'draw';
        toolDrawBtn.classList.add('active');
        toolLayoutBtn.classList.remove('active');
        statusText.textContent = 'Draw Mode: Click to draw on selected segments';
    });

    paletteSelect.addEventListener('change', (e) => {
        const index = parseInt(e.target.value);
        state.currentPalette = [...state.loadedPalettes[index].colors];
        initPaletteEditor();

        state.selectedSegmentIndices.forEach(idx => {
            state.workspaceSegments[idx].paletteIndex = index;
        });
        saveLayout(state);
        renderWorkspace(canvas, ctx, state);
    });

    layoutWidthInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value) || 8;
        layoutWidthDisplay.textContent = val;

        state.selectedSegmentIndices.forEach(idx => {
            state.workspaceSegments[idx].width = val;
        });
        saveLayout(state);
        renderWorkspace(canvas, ctx, state);
    });

    layoutHeightInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value) || 1;
        layoutHeightDisplay.textContent = val;

        state.selectedSegmentIndices.forEach(idx => {
            state.workspaceSegments[idx].height = val;
        });
        saveLayout(state);
        renderWorkspace(canvas, ctx, state);
    });

    flipXCheckbox.addEventListener('change', (e) => {
        const checked = e.target.checked;
        state.selectedSegmentIndices.forEach(idx => {
            state.workspaceSegments[idx].flipX = checked;
        });
        saveLayout(state);
        renderWorkspace(canvas, ctx, state);
    });

    flipYCheckbox.addEventListener('change', (e) => {
        const checked = e.target.checked;
        state.selectedSegmentIndices.forEach(idx => {
            state.workspaceSegments[idx].flipY = checked;
        });
        saveLayout(state);
        renderWorkspace(canvas, ctx, state);
    });

    zoomInBtn.addEventListener('click', () => {
        state.canvasScale++;
        zoomLevelSpan.textContent = `${state.canvasScale * 100}%`;
        renderWorkspace(canvas, ctx, state);
    });

    zoomOutBtn.addEventListener('click', () => {
        if (state.canvasScale > 1) state.canvasScale--;
        zoomLevelSpan.textContent = `${state.canvasScale * 100}%`;
        renderWorkspace(canvas, ctx, state);
    });

    gridToggle.addEventListener('change', (e) => {
        state.showGrid = e.target.checked;
        renderWorkspace(canvas, ctx, state);
    });

    resetLayoutBtn?.addEventListener('click', () => {
        initWorkspace(state, true);
        populateLayersList();
        updateSelectionUI();
        saveLayout(state);
    });

    // Canvas interactions
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / state.canvasScale;
        const y = (e.clientY - rect.top) / state.canvasScale;

        let clickedSegmentId = -1;
        for (let i = state.workspaceSegments.length - 1; i >= 0; i--) {
            const wsSeg = state.workspaceSegments[i];
            if (!wsSeg.visible) continue;

            const segDef = state.currentGame.segments[wsSeg.segmentIndex];
            const numTiles = segDef.length / 16;
            const totalCols = Math.ceil(numTiles / wsSeg.height);
            const w = Math.min(totalCols, wsSeg.width) * 8;
            const h = Math.ceil(totalCols / wsSeg.width) * (wsSeg.height * 8);

            if (x >= wsSeg.x && x < wsSeg.x + w && y >= wsSeg.y && y < wsSeg.y + h) {
                clickedSegmentId = i;
                break;
            }
        }

        if (state.editMode === 'layout') {
            if (clickedSegmentId !== -1) {
                if (e.ctrlKey || e.metaKey) {
                    toggleSegmentSelection(clickedSegmentId, state);
                } else {
                    if (!state.selectedSegmentIndices.has(clickedSegmentId)) {
                        selectSingleSegment(clickedSegmentId, state);
                    }
                }
                updateSelectionUI();

                state.isDragging = true;
                state.dragStartX = x;
                state.dragStartY = y;
                state.dragSegmentInitialPositions.clear();
                state.selectedSegmentIndices.forEach(idx => {
                    state.dragSegmentInitialPositions.set(idx, {
                        x: state.workspaceSegments[idx].x,
                        y: state.workspaceSegments[idx].y
                    });
                });
            } else {
                if (!e.ctrlKey && !e.metaKey) {
                    state.selectedSegmentIndices.clear();
                    updateSelectionUI();
                }

                state.isSelecting = true;
                state.selectionStart = { x, y };
                state.selectionRect = { x, y, w: 0, h: 0 };
            }
        } else if (state.editMode === 'draw') {
            if (clickedSegmentId !== -1) {
                if (!state.selectedSegmentIndices.has(clickedSegmentId)) {
                    selectSingleSegment(clickedSegmentId, state);
                    updateSelectionUI();
                }
                state.isDrawing = true;
                handleDraw(e, canvas, state);
                renderWorkspace(canvas, ctx, state);
            }
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / state.canvasScale;
        const y = (e.clientY - rect.top) / state.canvasScale;

        if (state.isDragging && state.editMode === 'layout') {
            const dx = x - state.dragStartX;
            const dy = y - state.dragStartY;

            state.dragSegmentInitialPositions.forEach((pos, idx) => {
                const wsSeg = state.workspaceSegments[idx];
                wsSeg.x = Math.round((pos.x + dx) / 8) * 8;
                wsSeg.y = Math.round((pos.y + dy) / 8) * 8;
            });

            renderWorkspace(canvas, ctx, state);
        } else if (state.isSelecting && state.editMode === 'layout') {
            const w = x - state.selectionStart.x;
            const h = y - state.selectionStart.y;

            state.selectionRect = {
                x: w < 0 ? x : state.selectionStart.x,
                y: h < 0 ? y : state.selectionStart.y,
                w: Math.abs(w),
                h: Math.abs(h)
            };

            state.selectedSegmentIndices.clear();
            state.workspaceSegments.forEach((wsSeg, idx) => {
                if (!wsSeg.visible) return;

                const segDef = state.currentGame.segments[wsSeg.segmentIndex];
                const numTiles = segDef.length / 16;
                const totalCols = Math.ceil(numTiles / wsSeg.height);
                const segW = Math.min(totalCols, wsSeg.width) * 8;
                const segH = Math.ceil(totalCols / wsSeg.width) * (wsSeg.height * 8);

                if (state.selectionRect.x < wsSeg.x + segW &&
                    state.selectionRect.x + state.selectionRect.w > wsSeg.x &&
                    state.selectionRect.y < wsSeg.y + segH &&
                    state.selectionRect.y + state.selectionRect.h > wsSeg.y) {
                    state.selectedSegmentIndices.add(idx);
                }
            });

            renderWorkspace(canvas, ctx, state);
        } else if (state.isDrawing && state.editMode === 'draw') {
            handleDraw(e, canvas, state);
            renderWorkspace(canvas, ctx, state);
        }
    });

    canvas.addEventListener('mouseup', () => {
        if (state.isDragging) {
            state.isDragging = false;
            saveLayout(state);
        }
        if (state.isSelecting) {
            state.isSelecting = false;
            updateSelectionUI();
        }
        state.isDrawing = false;
    });

    canvas.addEventListener('mouseleave', () => {
        state.isDragging = false;
        state.isDrawing = false;
        state.isSelecting = false;
        renderWorkspace(canvas, ctx, state);
    });

    initSystemPalette();
}
