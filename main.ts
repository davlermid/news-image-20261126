// World News — 26 November 2026 (make.fun news-image-20261126).
//
// The poster is pre-rendered from stories.json by generate.py and stored
// in this repo as entry.png. This program does NOT draw anything: it
// validates the PNG, then copies its bytes unchanged to the output
// directory and reads them back to prove the copy is identical.
//
// Usage:
//   MAKEFUN_OUTPUT_DIR=/output node main.ts
//   (default output dir is /output; the file is written as entry.png)

import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_BYTES = 1024 * 1024; // competition limit: at most 1 MiB
const PNG_MAGIC = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

function readChunkType(buf: Buffer, offset: number): string {
  return buf.toString("latin1", offset + 4, offset + 8);
}

function main(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const sourcePath = join(here, "entry.png");
  const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");
  const outPath = join(outDir, "entry.png");

  let bytes: Buffer;
  try {
    bytes = readFileSync(sourcePath);
  } catch {
    fail(`cannot read ${sourcePath}`);
  }

  // 1. File size: the competition caps the poster at 1 MiB.
  const size = statSync(sourcePath).size;
  if (size !== bytes.length) fail("stat size does not match bytes read");
  if (size > MAX_BYTES) {
    fail(`entry.png is ${size} bytes, over the 1 MiB limit`);
  }

  // 2. PNG signature (first 8 bytes).
  if (!bytes.subarray(0, 8).equals(PNG_MAGIC)) {
    fail("entry.png does not start with the PNG signature");
  }

  // 3. Walk the chunk structure: first chunk must be IHDR (13 bytes of
  // data), chunks must chain exactly to the end, and the last one must
  // be IEND with zero data length. This catches truncated or appended
  // files that a first/last-chunk check alone would miss.
  let offset = 8;
  let seenIHDR = false;
  let seenIEND = false;
  while (offset + 8 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = readChunkType(bytes, offset);
    if (offset + 12 + length > bytes.length) {
      fail(`chunk ${type} at offset ${offset} runs past end of file`);
    }
    if (!seenIHDR) {
      if (type !== "IHDR" || length !== 13) {
        fail("first PNG chunk is not a 13-byte IHDR");
      }
      seenIHDR = true;
    }
    if (type === "IEND") {
      if (length !== 0) fail("IEND chunk must have zero data length");
      if (offset + 12 !== bytes.length) {
        fail("trailing bytes after IEND");
      }
      seenIEND = true;
      break;
    }
    offset += 12 + length;
  }
  if (!seenIHDR) fail("no IHDR chunk found");
  if (!seenIEND) fail("no IEND chunk found; file looks truncated");
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== 1024 || height !== 1024) {
    fail(`poster is ${width}x${height}, expected 1024x1024`);
  }

  // 4. Copy the bytes unchanged and verify the copy by reading it back.
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, bytes);
  const back = readFileSync(outPath);
  if (!back.equals(bytes)) {
    fail("read-back of the written file differs from entry.png");
  }

  console.log(
    `ok: entry.png ${width}x${height}, ${size} bytes, ` +
      `copied unchanged to ${outPath} (verified by read-back)`,
  );
}

main();
