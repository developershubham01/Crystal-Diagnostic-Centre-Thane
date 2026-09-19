/**
 * Generates the Midnight Showroom image set (dark, gold-accented) for every
 * image path referenced by the seed data and pages. Outputs JPG to public/images.
 * Run: bun scripts/generate-images.mjs
 */
import ZAI from "z-ai-web-dev-sdk";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const OUT = path.resolve(process.cwd(), "public/images");
fs.mkdirSync(OUT, { recursive: true });

const STYLE =
  "cinematic dark editorial photography, deep black background, dramatic single-source warm golden rim lighting, subtle amber highlights, luxurious high-contrast moody atmosphere, professional, photorealistic, high quality, detailed";

const JOBS = [
  { file: "hero-fallback.jpg", size: "1024x1024", prompt: `Abstract translucent dark crystal polyhedron floating in pure black void, glowing golden molecular lattice of spheres and bonds suspended inside, fine gold particles drifting around, ${STYLE}` },
  { file: "og-image.jpg", size: "1440x704", prompt: `Wide dark luxury medical laboratory stage, precise microscope and glass diagnostics equipment lit by warm golden accent light against absolute black, elegant minimal composition with negative space, ${STYLE}` },
  { file: "about-centre.jpg", size: "1344x768", prompt: `Modern premium diagnostic centre reception interior at night, black architectural surfaces, warm golden linear cove lighting, clean minimalist reception desk, polished dark floor reflections, ${STYLE}` },
  { file: "cat-blood.jpg", size: "1024x1024", prompt: `Elegant blood collection tubes in a dark laboratory rack, amber golden backlight glow through the tubes, macro detail, black background, ${STYLE}` },
  { file: "cat-pathology.jpg", size: "1024x1024", prompt: `High-end laboratory microscope on black reflective surface, warm golden edge lighting on metal, dark premium laboratory, ${STYLE}` },
  { file: "cat-radiology.jpg", size: "1024x1024", prompt: `Abstract radiology imaging concept, glowing golden X-ray silhouette of human chest on pure black background, futuristic medical scan, ${STYLE}` },
  { file: "cat-packages.jpg", size: "1024x1024", prompt: `Premium black gift box with golden ribbon containing medical report cards and stethoscope, luxury health checkup package concept, dark background, ${STYLE}` },
  { file: "cat-other.jpg", size: "1024x1024", prompt: `Sterile medical sample containers and test tubes arranged precisely on dark slate surface, warm golden accent light, black background, ${STYLE}` },
  { file: "gallery-reception.jpg", size: "1152x864", prompt: `Upscale clinic reception and waiting area at night, black marble desk, golden accent lighting strips, dark luxurious interior design, ${STYLE}` },
  { file: "gallery-lab.jpg", size: "1152x864", prompt: `Modern pathology laboratory workspace at night, black benches, analyser machines with golden indicator lights, immaculate dark interior, ${STYLE}` },
  { file: "gallery-collection.jpg", size: "1152x864", prompt: `Phlebotomy sample collection room with dark upholstered chair, golden warm lamp light, premium clinic interior on black tones, ${STYLE}` },
  { file: "gallery-equipment.jpg", size: "1152x864", prompt: `Close-up of advanced diagnostic laboratory analyser, black metal housing with glowing amber golden status lights, dark laboratory, ${STYLE}` },
  { file: "gallery-lounge.jpg", size: "1152x864", prompt: `Comfortable patient waiting lounge in dark luxury style, black leather chairs, warm golden floor lamps, moody premium interior, ${STYLE}` },
  { file: "gallery-consult.jpg", size: "1152x864", prompt: `Front desk consultation counter in a premium diagnostic centre, dark wood and black stone, golden pendant lights, night ambience, ${STYLE}` },
];

async function main() {
  const zai = await ZAI.create();
  let done = 0;
  for (const job of JOBS) {
    const outPath = path.join(OUT, job.file);
    if (fs.existsSync(outPath)) {
      console.log(`skip (exists): ${job.file}`);
      done++;
      continue;
    }
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        const res = await zai.images.generations.create({ prompt: job.prompt, size: job.size });
        const b64 = res?.data?.[0]?.base64;
        if (!b64) throw new Error("empty base64");
        const buf = Buffer.from(b64, "base64");
        await sharp(buf).jpeg({ quality: 82, mozjpeg: true }).toFile(outPath);
        console.log(`✓ ${job.file} (${job.size})`);
        ok = true;
      } catch (e) {
        console.error(`attempt ${attempt} failed for ${job.file}: ${e.message}`);
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
    if (ok) done++;
  }
  console.log(`generated ${done}/${JOBS.length} images`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
