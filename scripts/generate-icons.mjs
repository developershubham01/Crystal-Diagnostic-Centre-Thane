/**
 * Generates PNG logo exports + favicon.ico (PNG-in-ICO wrapper) from src/app/icon.svg.
 * Run: bun scripts/generate-icons.mjs
 */
import sharp from "sharp";
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";

const root = process.cwd();
const svgPath = path.join(root, "src/app/icon.svg");
const outDir = path.join(root, "public/brand");
await mkdir(outDir, { recursive: true });

const svg = await readFile(svgPath);

const png512 = await sharp(svg, { density: 300 }).resize(512, 512).png().toBuffer();
await writeFile(path.join(outDir, "crystal-logo.png"), png512);
await sharp(svg, { density: 300 }).resize(192, 192).png().toFile(path.join(outDir, "crystal-logo-192.png"));
await sharp(svg, { density: 300 }).resize(512, 512).webp({ quality: 90 }).toFile(path.join(outDir, "crystal-logo.webp"));
console.log("OK PNG/WebP logo exports -> public/brand/");

async function pngOf(size) {
  return sharp(svg, { density: 400 }).resize(size, size).png().toBuffer();
}
function buildIco(pngs) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  const entries = [];
  let offset = 6 + 16 * count;
  for (const { size, buffer } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(buffer.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += buffer.length;
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.buffer)]);
}
const png16 = await pngOf(16);
const png32 = await pngOf(32);
const png48 = await pngOf(48);
const ico = buildIco([
  { size: 16, buffer: png16 },
  { size: 32, buffer: png32 },
  { size: 48, buffer: png48 },
]);
await writeFile(path.join(root, "src/app/favicon.ico"), ico);
await writeFile(path.join(root, "public/favicon.ico"), ico);
console.log("OK favicon.ico generated (16/32/48 px)");
