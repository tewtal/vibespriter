
import { BLOCK_TYPES } from './rdc.js';

export const GAMES = {
    [BLOCK_TYPES.ZELDA1_SPRITE]: {
        name: 'Zelda 1 (NES)',
        segments: [
            { id: 0, length: 32, label: 'Lifting Item', type: 'graphics' },
            { id: 1, length: 32, label: 'Walk 1 Profile (Big Shield)', type: 'graphics' },
            { id: 2, length: 448, label: 'Main Animations', type: 'graphics' }, // Multiple animations packed
            { id: 3, length: 32, label: 'Walk 2 Profile (Big Shield)', type: 'graphics' },
            { id: 4, length: 64, label: 'Walk Down (Small Shield)', type: 'graphics' },
            { id: 5, length: 32, label: 'Facing Down (Big Shield)', type: 'graphics' },
            { id: 6, length: 3, label: 'Base Colors', type: 'palette' },
            { id: 7, length: 3, label: 'Level 2 Colors', type: 'palette' },
            { id: 8, length: 3, label: 'Level 3 Colors', type: 'palette' },
            { id: 9, length: 3, label: 'Tunic Colors', type: 'palette' }
        ],
        // Default palette to use for rendering graphics if none selected
        defaultPalette: [0x0F, 0x16, 0x27, 0x18] // Black, Red, Orange, White (Example)
    },
    [BLOCK_TYPES.METROID1_SPRITE]: {
        name: 'Metroid 1 (NES)',
        segments: [
            { id: 0, length: 64, label: 'Run Head', type: 'graphics' },
            { id: 1, length: 80, label: 'Run/Jump/Face Head', type: 'graphics' },
            { id: 2, length: 64, label: 'Explode/Idle Head', type: 'graphics' },
            { id: 3, length: 16, label: 'Idle Weapon', type: 'graphics' },
            { id: 4, length: 96, label: 'Shoulders', type: 'graphics' },
            { id: 5, length: 64, label: 'Run Torso 1/2', type: 'graphics' },
            { id: 6, length: 48, label: 'Run Torso 3', type: 'graphics' },
            { id: 7, length: 96, label: 'Torso Misc', type: 'graphics' },
            { id: 8, length: 96, label: 'Legs Run', type: 'graphics' },
            { id: 9, length: 16, label: 'Facing Leg', type: 'graphics' },
            { id: 10, length: 32, label: 'Idle Legs', type: 'graphics' },
            { id: 11, length: 96, label: 'Run Shoulders', type: 'graphics' },
            { id: 12, length: 48, label: 'Firing Torso', type: 'graphics' },
            { id: 13, length: 112, label: 'Morph/Jump Top', type: 'graphics' },
            { id: 14, length: 112, label: 'Morph/Jump Bottom', type: 'graphics' },
            { id: 15, length: 16, label: 'Point Up Weapon', type: 'graphics' },
            { id: 16, length: 32, label: 'Spin Jump Bottom', type: 'graphics' },
            { id: 17, length: 64, label: 'Point Up Shoulders/Head', type: 'graphics' },
            { id: 18, length: 3, label: 'Base Colors', type: 'palette' },
            { id: 19, length: 2, label: 'Normal Colors', type: 'palette' },
            { id: 20, length: 2, label: 'Missile Colors', type: 'palette' },
            { id: 21, length: 2, label: 'Varia Colors', type: 'palette' },
            { id: 22, length: 2, label: 'Varia Missile Colors', type: 'palette' }
        ],
        defaultPalette: [0x0F, 0x30, 0x27, 0x16] // Example Metroid palette
    }
};
