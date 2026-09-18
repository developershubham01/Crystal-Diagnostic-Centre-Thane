#!/bin/bash
# Generates all site imagery via z-ai CLI (run in background)
set -u
cd /home/z/my-project
mkdir -p public/images
P="professional medical photography, clean bright white and teal blue palette, soft natural lighting, modern Indian diagnostic centre, photorealistic, high quality, no text, no watermark, no logos"

gen () {
  local prompt="$1"; local out="$2"; local size="${3:-1024x1024}"
  if [ -f "public/images/$out" ]; then echo "skip $out"; return; fi
  z-ai image -p "$prompt, $P" -o "public/images/$out.png" -s "$size" && \
  bun -e "const s=require('sharp');s('public/images/$out.png').jpeg({quality:86}).toFile('public/images/$out.jpg').then(()=>require('fs').rmSync('public/images/$out.png'))" && \
  echo "done $out" || echo "FAIL $out"
}

gen "abstract 3D render of a translucent glass crystal orb containing a glowing molecular structure with spheres and connecting bonds, floating particles, deep navy blue and teal gradient background, cinematic studio lighting" "hero-fallback" 1344x768
gen "wide banner for a diagnostic centre website, abstract glowing DNA double helix and crystal lattice on deep navy gradient with teal accents, elegant scientific visualization" "og-image" 1440x720
gen "laboratory bench with neatly arranged blood collection tubes with colorful caps and a precision pipette, shallow depth of field" "cat-blood"
gen "modern clinical microscope on a clean white laboratory bench near a window with soft daylight" "cat-pathology"
gen "modern medical imaging suite with a CT scanner in a softly lit clean room, calm blue tones" "cat-radiology"
gen "preventive health checkup concept, stethoscope on a clipboard with checklist and green tea, top view on white desk, teal accents" "cat-packages"
gen "friendly diagnostic services concept, ECG electrode pads, thermometer and medical report folder neatly arranged on white surface" "cat-other"
gen "bright reception and waiting area of a modern diagnostic centre, curved white reception desk, teal accent wall, indoor plants, empty chairs" "gallery-reception" 1344x768
gen "clean modern medical laboratory interior with analysers, glass partitions and soft blue lighting, no people" "gallery-lab" 1344x768
gen "comfortable blood sample collection room with a phlebotomy chair, medical trolley with sealed tubes and cotton, bright and hygienic" "gallery-collection" 1344x768
gen "close-up of an automated clinical chemistry analyser with sample racks in a bright laboratory" "gallery-equipment" 1344x768
gen "calm patient waiting lounge with cushioned chairs, warm wood panels, potted plants and soft window light" "gallery-lounge" 1344x768
gen "tidy front desk consultation counter of a small clinic with a computer, document trays and a small name plate holder, bright friendly space" "gallery-consult" 1344x768
gen "exterior view of a small modern diagnostic clinic building on a quiet Indian street corner with a blue and white facade, morning light, clean sidewalk" "about-centre" 1344x768

echo "ALL IMAGES COMPLETE"
