import { gameStaticInfo } from './metadata.js';
import { RDCParser } from './rdc.js';

function copyBytes(dst, src, dstOffset, srcOffset, length) {
    dst.set(src.subarray(srcOffset, srcOffset + length), dstOffset);
}

function getSpriteTargetVariant(gameId, spriteKind, randomizerId) {
    const info = gameStaticInfo[gameId];
    const variantMap = info?.rdcTargets?.[spriteKind];
    if (!variantMap) return undefined;

    const defaultVariant = variantMap.default ?? {};
    const mergedPointers = { ...(defaultVariant.pointers ?? {}) };
    const randomizerKey = randomizerId?.toLowerCase();
    const specific = randomizerKey ? variantMap[randomizerKey] : undefined;

    if (specific?.pointers) {
        Object.assign(mergedPointers, specific.pointers);
    }

    const manifest = specific?.manifest ?? defaultVariant.manifest;
    const result = {};
    if (Object.keys(mergedPointers).length > 0) {
        result.pointers = mergedPointers;
    }
    if (manifest) {
        result.manifest = manifest;
    }

    return result;
}

export async function applyNesRdc(rom, rdcBuf, gameId, options = { gameId }) {
    const { randomizerId, spriteKind } = options || {};

    // Use RDCParser to get offsets
    const parser = new RDCParser(rdcBuf);
    const rdc = parser.parse();

    // Find block offset based on type
    // Zelda 1 = 2, Metroid 1 = 3
    const typeId = gameId === 'zelda1' ? 2 : 3;
    const block = rdc.blocks.find(b => b.type === typeId);

    if (!block) {
        throw new Error('RDC does not contain NES sprite data for ' + gameId);
    }

    const workingRom = rom.slice(0); // Clone buffer
    const romU8 = new Uint8Array(workingRom);
    const rdcU8 = block.payload; // Payload is already the data we need

    // Resolve manifest
    const spriteKindKey = (spriteKind ?? (gameId === 'zelda1' ? 'rdc/nes-z1' : 'rdc/nes-m1')).toLowerCase();
    const variant = getSpriteTargetVariant(gameId, spriteKindKey, randomizerId);
    const manifest = variant?.manifest;

    if (!manifest) {
        throw new Error(`Missing manifest for NES sprite '${spriteKindKey}' on game '${gameId}'.`);
    }

    let cursor = 0; // Payload starts at 0 relative to the block
    for (const segment of manifest.segments) {
        const segmentLen = segment.length * (segment.entries ?? 1);

        if (cursor + segmentLen > rdcU8.length) {
            throw new Error(`[NESRDC] Segment overruns RDC buffer (need ${segmentLen} at ${cursor}, size=${rdcU8.length}).`);
        }

        const segmentData = rdcU8.subarray(cursor, cursor + segmentLen);
        cursor += segmentLen;

        for (const addressEntry of segment.addresses) {
            const baseAddr = addressEntry.address;
            const entries = segment.entries ?? 1;

            for (let e = 0; e < entries; e++) {
                const entryOffset = segment.entryOffsets
                    ? segment.entryOffsets[Math.min(e, segment.entryOffsets.length - 1)]
                    : (segment.entryStride ?? 0) * e;

                const srcOffset = e * segment.length;
                const destPc = baseAddr + entryOffset;

                if (destPc < 0 || destPc + segment.length > romU8.length) {
                    console.error(`[NESRDC] Target out of bounds (dest=${destPc.toString(16)}, len=${segment.length}, game=${gameId}).`);
                    continue;
                }

                copyBytes(romU8, segmentData, destPc, srcOffset, segment.length);
            }
        }
    }

    return workingRom;
}
