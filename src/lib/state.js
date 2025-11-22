export const state = {
    currentRDC: null,
    currentBlock: null,
    currentGame: null,
    currentPalette: [0x0F, 0x16, 0x27, 0x18], // Default palette indices
    canvasScale: 4,
    isDrawing: false,
    selectedColorIndex: 3, // Default to white
    showGrid: false,
    loadedPalettes: [],
    workspaceSegments: [], // Array of { segmentIndex, x, y, visible, width, height, paletteIndex, flipX, flipY }
    selectedSegmentIndices: new Set(), // Set of indices in workspaceSegments
    isDragging: false,
    isSelecting: false, // Marquee selection
    selectionStart: { x: 0, y: 0 },
    selectionRect: { x: 0, y: 0, w: 0, h: 0 },
    dragStartX: 0,
    dragStartY: 0,
    dragSegmentInitialPositions: new Map(), // Map<index, {x, y}>
    editMode: 'layout' // 'layout' or 'draw'
};
