const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, drawFn) {
  // RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // PNG Filter scanlines
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    scanlines[y * (width * 4 + 1)] = 0; // Filter None
    buffer.copy(scanlines, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const idatData = zlib.deflateSync(scanlines, { level: 9 });

  function crc32(buf) {
    let table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', idatData);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Brand Icon Drawer: Dark luxury indigo background with rounded inner card, cyan/indigo gradient symbol
function drawBrandIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  const cx = 0.5;
  const cy = 0.5;

  // Rounded rectangle background radius
  const r = 0.22;
  const dx = Math.max(Math.abs(nx - cx) - (0.5 - r), 0);
  const dy = Math.max(Math.abs(ny - cy) - (0.5 - r), 0);
  const cornerDist = Math.sqrt(dx * dx + dy * dy);

  if (cornerDist > r) {
    return [0, 0, 0, 0]; // Transparent outside squircle
  }

  // Dark gradient background (#050814 -> #0f172a)
  let bgR = 10 + Math.floor(nx * 12);
  let bgG = 15 + Math.floor(ny * 18);
  let bgB = 30 + Math.floor(nx * 35);

  // Border glow
  if (cornerDist > r - 0.02) {
    return [56, 189, 248, 240]; // Sky blue border
  }

  // Symbol in center: Stylized hanger / diamond 'O' logo
  const sx = (nx - cx) * 2; // -1 to 1
  const sy = (ny - cy) * 2; // -1 to 1

  // Outer diamond
  const d1 = Math.abs(sx) + Math.abs(sy);
  // Sparkle / Hanger Top hook
  const hookDist = Math.sqrt(sx * sx + (sy + 0.45) * (sy + 0.45));

  const isDiamond = d1 <= 0.65 && d1 >= 0.42 && sy > -0.35 && sy < 0.6;
  const isHook = hookDist <= 0.18 && hookDist >= 0.08 && sy < -0.2;
  const isCenterDot = Math.sqrt(sx * sx + sy * sy) <= 0.12;

  if (isDiamond || isHook || isCenterDot) {
    // Gradient from Cyan (#38bdf8) to Indigo (#6366f1)
    const grad = (sx + 1) / 2;
    const sr = Math.floor(56 + grad * 43);   // 56 -> 99
    const sg = Math.floor(189 - grad * 87); // 189 -> 102
    const sb = Math.floor(248 - grad * 7);  // 248 -> 241
    return [sr, sg, sb, 255];
  }

  return [bgR, bgG, bgB, 255];
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate 192x192
const png192 = createPng(192, 192, drawBrandIcon);
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), png192);

// Generate 512x512
const png512 = createPng(512, 512, drawBrandIcon);
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), png512);

// Generate apple-touch-icon 180x180 (no transparent corners for iOS)
function drawAppleIcon(x, y, w, h) {
  const [r, g, b, a] = drawBrandIcon(x, y, w, h);
  if (a === 0) return [10, 15, 30, 255]; // Fill black/dark for iOS
  return [r, g, b, 255];
}
const pngApple = createPng(180, 180, drawAppleIcon);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), pngApple);

// Maskable icon 512x512 (with safe-zone background)
const pngMaskable = createPng(512, 512, drawAppleIcon);
fs.writeFileSync(path.join(iconsDir, 'icon-maskable.png'), pngMaskable);

console.log('✅ PWA Icons generated successfully in public/icons/');
