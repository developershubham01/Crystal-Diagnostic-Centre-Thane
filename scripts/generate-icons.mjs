/**
 * Generates the full brand icon set from src/app/icon.svg (official probe badge):
 *  - public/brand/crystal-logo{-192,.webp}.png  brand tile exports
 *  - favicon.ico (16/32/48)                      -> src/app + public
 *  - pwa-icon-{192,512}.png                      black tile, "any" purpose
 *  - pwa-icon-maskable-{192,512}.png             badge in maskable safe zone
 *  - public/images/og-image.jpg                  brand badge composited bottom-left
 * Run: bun scripts/generate-icons.mjs   (or node)
 */
import sharp from "sharp";
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";

const root = process.cwd();
const svgPath = path.join(root, "src/app/icon.svg");
const brandDir = path.join(root, "public/brand");
const imgDir = path.join(root, "public/images");
await mkdir(brandDir, { recursive: true });

const svg = await readFile(svgPath);

/* ---------------- brand tile exports ---------------- */
const png512 = await sharp(svg, { density: 300 }).resize(512, 512).png().toBuffer();
await writeFile(path.join(brandDir, "crystal-logo.png"), png512);
await sharp(svg, { density: 300 }).resize(192, 192).png().toFile(path.join(brandDir, "crystal-logo-192.png"));
await sharp(svg, { density: 300 }).resize(512, 512).webp({ quality: 90 }).toFile(path.join(brandDir, "crystal-logo.webp"));
console.log("OK PNG/WebP logo exports -> public/brand/");

/* ---------------- favicon.ico ---------------- */
function pngOf(size) {
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
const ico = buildIco([
  { size: 16, buffer: await pngOf(16) },
  { size: 32, buffer: await pngOf(32) },
  { size: 48, buffer: await pngOf(48) },
]);
await writeFile(path.join(root, "src/app/favicon.ico"), ico);
await writeFile(path.join(root, "public/favicon.ico"), ico);
console.log("OK favicon.ico generated (16/32/48 px)");

/* ---------------- PWA icons ---------------- */
// "any": the black tile fills the canvas (matches site identity)
for (const size of [192, 512]) {
  await sharp(svg, { density: 400 }).resize(size, size).png().toFile(path.join(root, `public/pwa-icon-${size}.png`));
}
// "maskable": badge scaled into the safe zone (inner ~80% circle) on black
async function maskable(size) {
  const inner = Math.round(size * 0.62);
  const badge = await sharp(svg, { density: 400 }).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: "#050505" } })
    .composite([{ input: badge, left: Math.round((size - inner) / 2), top: Math.round((size - inner) / 2) }])
    .png()
    .toFile(path.join(root, `public/pwa-icon-maskable-${size}.png`));
}
await maskable(192);
await maskable(512);
console.log("OK PWA icons (any + maskable, 192/512)");

/* ---------------- OG image brand overlay ---------------- */
try {
  const ogPath = path.join(imgDir, "og-image.jpg");
  const og = sharp(ogPath);
  const meta = await og.metadata();
  if (meta.width && meta.height) {
    const tile = Math.round(meta.height * 0.19); // ~134px on 704
    const margin = Math.round(meta.height * 0.07);
    const badge = await sharp(svg, { density: 400 }).resize(tile, tile).png().toBuffer();
    const ogBrand = sharp(imgDir + "/og-image.jpg").composite([
      { input: badge, left: margin, top: meta.height - tile - margin },
    ]);
    await ogBrand.jpeg({ quality: 88 }).toFile(path.join(imgDir, "og-image.tmp.jpg"));
    // keep an unbranded backup once
    try {
      await readFile(path.join(imgDir, "og-image-plain.jpg"));
    } catch {
      const plain = await sharp(ogPath).jpeg({ quality: 90 }).toBuffer();
      await writeFile(path.join(imgDir, "og-image-plain.jpg"), plain);
    }
    const { renameSync } = await import("fs");
    renameSync(path.join(imgDir, "og-image.tmp.jpg"), ogPath);
    console.log(`OK og-image.jpg branded (${meta.width}x${meta.height}, tile ${tile}px @ bottom-left)`);
  }
} catch (e) {
  console.warn("OG overlay skipped:", e.message);
}
