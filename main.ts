import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// CRC32 (IEEE 802.3, polynomial 0xedb88320) over a chunk's type + data.
// The table is built here at startup so no dependency is needed.
const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const MAX_SIZE = 1048576; // 1 MiB
const EXPECTED_WIDTH = 1024;
const EXPECTED_HEIGHT = 1024;

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const inputPath = join(here, "entry.png");

let png: Buffer;
try {
  png = readFileSync(inputPath);
} catch {
  fail(`cannot read entry.png at ${inputPath}`);
}

if (png.length > MAX_SIZE) {
  fail(`entry.png is ${png.length} bytes, over the 1048576 byte limit`);
}

if (png.length < 8 || !png.subarray(0, 8).equals(PNG_SIGNATURE)) {
  fail("entry.png does not start with the PNG signature");
}

// Walk the chunk chain, checking every chunk's CRC32 against the
// value stored after its data, and that chunks join up exactly.
let offset = 8;
let first = true;
let lastType = "";
let lastDataLength = -1;
let width = 0;
let height = 0;

while (true) {
  if (offset + 8 > png.length) {
    fail("truncated PNG: chunk header runs past end of file");
  }
  const dataLength = png.readUInt32BE(offset);
  const type = png.toString("ascii", offset + 4, offset + 8);
  const dataStart = offset + 8;
  const dataEnd = dataStart + dataLength;
  if (dataEnd + 4 > png.length) {
    fail(`truncated PNG: ${type} chunk data runs past end of file`);
  }
  const storedCrc = png.readUInt32BE(dataEnd);
  const actualCrc = crc32(png.subarray(offset + 4, dataEnd));
  if (storedCrc !== actualCrc) {
    fail(
      `CRC32 mismatch in ${type} chunk (stored ${storedCrc.toString(16)}, computed ${actualCrc.toString(16)})`,
    );
  }
  if (first) {
    if (type !== "IHDR" || dataLength !== 13) {
      fail("first chunk must be IHDR with 13 bytes of data");
    }
    width = png.readUInt32BE(dataStart);
    height = png.readUInt32BE(dataStart + 4);
    first = false;
  }
  lastType = type;
  lastDataLength = dataLength;
  offset = dataEnd + 4;
  if (type === "IEND") break;
}

if (lastType !== "IEND") {
  fail("PNG does not end with an IEND chunk");
}
if (lastDataLength !== 0) {
  fail("IEND chunk must have 0 bytes of data");
}
if (offset !== png.length) {
  fail("trailing bytes after IEND chunk");
}
if (width !== EXPECTED_WIDTH || height !== EXPECTED_HEIGHT) {
  fail(`entry.png is ${width}x${height}, expected 1024x1024`);
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const outPath = join(outDir, "entry.png");
try {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, png);
} catch (err) {
  fail(`cannot write ${outPath}: ${(err as Error).message}`);
}

let back: Buffer;
try {
  back = readFileSync(outPath);
} catch {
  fail(`cannot read back ${outPath}`);
}
if (!back.equals(png)) {
  fail(`${outPath} differs from entry.png after copy`);
}

console.log(
  `ok: entry.png 1024x1024, ${png.length} bytes, copied unchanged to ${outPath} (verified by read-back)`,
);
