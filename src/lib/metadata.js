
// --- NES Manifests (Zelda 1 & Metroid 1) ---
const zelda1ManifestSegments = [
    {
        length: 32,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x608e34 }],
    }, // LIFTING_ITEM
    {
        length: 32,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x608eb4 }],
    }, // WALK1_PROFILE_BIGSHIELD
    {
        length: 448,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x61007f }],
    }, // 7 poses block
    {
        length: 32,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x6105bf }],
    }, // WALK2_PROFILE_BIGSHIELD
    {
        length: 64,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x6105ff }],
    }, // WALK1_DOWN_SMALLSHIELD + WALK2_DOWN_SMALLSHIELD
    {
        length: 32,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x61067f }],
    }, // FACING_DOWN_BIGSHIELD
    {
        length: 3,
        addressType: "pc",
        // Base colors replicated to multiple target addresses (mirrors)
        addresses: [
            { mapping: "default", address: 0x631314 },
            { mapping: "default", address: 0x631410 },
            { mapping: "default", address: 0x63150c },
            { mapping: "default", address: 0x631608 },
            { mapping: "default", address: 0x631704 },
            { mapping: "default", address: 0x631800 },
            { mapping: "default", address: 0x6318fc },
            { mapping: "default", address: 0x6319f8 },
            { mapping: "default", address: 0x631af4 },
            { mapping: "default", address: 0x631bf0 },
            { mapping: "default", address: 0x631cec },
            { mapping: "default", address: 0x3d3804 },
        ],
    },
    {
        length: 3,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x631cf0 }],
    }, // LEVEL2_COLORS
    {
        length: 3,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x631cf4 }],
    }, // LEVEL3_COLORS
    {
        length: 3,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x612287 }],
    }, // TUNIC_COLORS
];

const zelda1ManifestConfig = {
    mapping: "lorom",
    segments: zelda1ManifestSegments,
};

const metroidManifestSegments = [
    {
        length: 64,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x6b0000 }],
    },
    {
        length: 80,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x6b0050 }],
    },
    {
        length: 64,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x6b00b0 }],
    },
    {
        length: 16,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x6b0170 }],
    },
    {
        length: 96,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x6b0190 }],
    },
    {
        length: 64,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x6b0200 }],
    },
    {
        length: 48,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x6b0250 }],
    },
    {
        length: 96,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x6b0290 }],
    },
    {
        length: 96,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x6b0310 }],
    },
    {
        length: 16,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x6b0390 }],
    },
    {
        length: 32,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x6b03b0 }],
    },
    {
        length: 96,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x6b0400 }],
    },
    {
        length: 48,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x6b0490 }],
    },
    {
        length: 112,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x6b0500 }],
    },
    {
        length: 112,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x6b0600 }],
    },
    {
        length: 16,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x6b0690 }],
    },
    {
        length: 32,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x6b0720 }],
    },
    {
        length: 64,
        addressType: "pc",
        addresses: [{ mapping: "default", address: 0x6b0770 }],
    },
    {
        length: 3,
        addressType: "pc",
        addresses: [
            { mapping: "default", address: 0x68a285 },
            { mapping: "default", address: 0x68a2e8 },
            { mapping: "default", address: 0x69218c },
            { mapping: "default", address: 0x6921ef },
            { mapping: "default", address: 0x69a72c },
            { mapping: "default", address: 0x69a7a5 },
            { mapping: "default", address: 0x6a2169 },
            { mapping: "default", address: 0x6a21a9 },
            { mapping: "default", address: 0x6aa0ff },
            { mapping: "default", address: 0x6aa153 },
        ],
    },
    {
        length: 2,
        addressType: "pc",
        addresses: [
            { mapping: "default", address: 0x68a298 },
            { mapping: "default", address: 0x69219f },
            { mapping: "default", address: 0x69a73f },
            { mapping: "default", address: 0x6a217c },
            { mapping: "default", address: 0x6aa112 },
        ],
    },
    {
        length: 2,
        addressType: "pc",
        addresses: [
            { mapping: "default", address: 0x68a29e },
            { mapping: "default", address: 0x6921a5 },
            { mapping: "default", address: 0x69a745 },
            { mapping: "default", address: 0x6a2182 },
            { mapping: "default", address: 0x6aa118 },
        ],
    },
    {
        length: 2,
        addressType: "pc",
        addresses: [
            { mapping: "default", address: 0x68a2a4 },
            { mapping: "default", address: 0x6921ab },
            { mapping: "default", address: 0x69a74b },
            { mapping: "default", address: 0x6a2188 },
            { mapping: "default", address: 0x6aa11e },
        ],
    },
    {
        length: 2,
        addressType: "pc",
        addresses: [
            { mapping: "default", address: 0x68a2aa },
            { mapping: "default", address: 0x6921b1 },
            { mapping: "default", address: 0x69a751 },
            { mapping: "default", address: 0x6a218e },
            { mapping: "default", address: 0x6aa124 },
        ],
    },
];

const metroidManifestConfig = {
    mapping: "lorom",
    segments: metroidManifestSegments,
};

// Exported static info. Zelda1 & Metroid now fully manifest-driven (no pointer constants needed).
export const gameStaticInfo = {
    zelda1: {
        id: "zelda1",
        displayName: "The Legend of Zelda (NES)",
        expectedHash:
            "8f72dc2e98572eb4ba7c3a902bca5f69c448fc4391837e5f8f0d4556280440ac",
        forcedHeaderBytes: new Uint8Array([
            0x4e, 0x45, 0x53, 0x1a, 0x08, 0x00, 0x12, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
        ]),
        fileExtensions: ".nes,.zip",
        targetOffsets: { alttpr: -1, combo: 4_325_392 },
        rdcTargets: {
            "rdc/nes-z1": {
                default: { manifest: zelda1ManifestConfig },
                combo: { manifest: zelda1ManifestConfig },
            },
        },
    },
    metroid: {
        id: "metroid",
        displayName: "Metroid (NES)",
        expectedHash:
            "c5eea06e1e1128b576bd789f1a4f63bb154d6d31579c2f319382fb77a72d34a6",
        forcedHeaderBytes: new Uint8Array([
            0x4e, 0x45, 0x53, 0x1a, 0x08, 0x00, 0x11, 0x00, 0x00, 0x00, 0x4e, 0x49,
            0x20, 0x31, 0x2e, 0x33,
        ]),
        fileExtensions: ".nes,.zip",
        targetOffsets: { alttpr: -1, combo: 4_194_304 },
        rdcTargets: {
            "rdc/nes-m1": {
                default: { manifest: metroidManifestConfig },
                combo: { manifest: metroidManifestConfig },
            },
        },
    },
};
