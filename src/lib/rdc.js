
export const RDC_HEADER = 'RETRODATACONTAINER';
export const RDC_VERSION = 0x01;

export const BLOCK_TYPES = {
    METADATA: 0,
    LINK_SPRITE: 1,
    ZELDA1_SPRITE: 2,
    METROID1_SPRITE: 3,
    SAMUS_SPRITE: 4
};

export class RDCParser {
    constructor(arrayBuffer) {
        this.data = new DataView(arrayBuffer);
        this.offset = 0;
    }

    readString(length) {
        let str = '';
        for (let i = 0; i < length; i++) {
            str += String.fromCharCode(this.data.getUint8(this.offset++));
        }
        return str;
    }

    readUint8() {
        return this.data.getUint8(this.offset++);
    }

    readUint32() {
        const val = this.data.getUint32(this.offset, true); // Little endian
        this.offset += 4;
        return val;
    }

    parse() {
        this.offset = 0;

        // 1. Verify Header
        const header = this.readString(18);
        if (header !== RDC_HEADER) {
            throw new Error('Invalid RDC Header');
        }

        // 2. Verify Version
        const version = this.readUint8();
        if (version !== RDC_VERSION) {
            throw new Error(`Unsupported RDC Version: ${version}`);
        }

        // 3. Read Block Count
        const numBlocks = this.readUint32();

        // 4. Read Directory
        const directory = [];
        for (let i = 0; i < numBlocks; i++) {
            const type = this.readUint32();
            const offset = this.readUint32();
            directory.push({ type, offset });
        }

        // 5. Read Author
        let author = '';
        let charCode;
        while ((charCode = this.readUint8()) !== 0) {
            author += String.fromCharCode(charCode);
        }

        // 6. Read Blocks
        const blocks = [];
        const totalSize = this.data.byteLength;

        for (let i = 0; i < numBlocks; i++) {
            const entry = directory[i];
            const nextOffset = (i < numBlocks - 1) ? directory[i + 1].offset : totalSize;
            const size = nextOffset - entry.offset;

            // Seek to block start
            this.offset = entry.offset;

            // Read payload
            const payload = new Uint8Array(this.data.buffer, entry.offset, size);
            blocks.push({
                type: entry.type,
                payload: payload
            });
        }

        return {
            author,
            blocks
        };
    }
}

export class RDCWriter {
    constructor() {
        this.blocks = [];
        this.author = 'VibeSpriter';
    }

    addBlock(type, payload) {
        this.blocks.push({ type, payload });
    }

    setAuthor(author) {
        this.author = author;
    }

    build() {
        // Calculate sizes
        const headerSize = 18;
        const versionSize = 1;
        const countSize = 4;
        const dirEntrySize = 8;
        const dirSize = this.blocks.length * dirEntrySize;
        const authorSize = this.author.length + 1;

        let currentOffset = headerSize + versionSize + countSize + dirSize + authorSize;

        const directory = [];
        let totalPayloadSize = 0;

        for (const block of this.blocks) {
            directory.push({
                type: block.type,
                offset: currentOffset
            });
            currentOffset += block.payload.length;
            totalPayloadSize += block.payload.length;
        }

        const totalSize = currentOffset;
        const buffer = new ArrayBuffer(totalSize);
        const view = new DataView(buffer);
        let offset = 0;

        // Helper to write string
        const writeString = (str) => {
            for (let i = 0; i < str.length; i++) {
                view.setUint8(offset++, str.charCodeAt(i));
            }
        };

        // 1. Header
        writeString(RDC_HEADER);

        // 2. Version
        view.setUint8(offset++, RDC_VERSION);

        // 3. Block Count
        view.setUint32(offset, this.blocks.length, true);
        offset += 4;

        // 4. Directory
        for (const entry of directory) {
            view.setUint32(offset, entry.type, true);
            offset += 4;
            view.setUint32(offset, entry.offset, true);
            offset += 4;
        }

        // 5. Author
        writeString(this.author);
        view.setUint8(offset++, 0); // Null terminator

        // 6. Payloads
        const uint8View = new Uint8Array(buffer);
        for (const block of this.blocks) {
            uint8View.set(block.payload, offset);
            offset += block.payload.length;
        }

        return buffer;
    }
}
