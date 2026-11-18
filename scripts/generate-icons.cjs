const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'public', 'notariave-logo.webp');
const sizes = [256, 128, 64, 48, 32, 16];

function makeIco(images) {
  const headerSize = 6 + images.length * 16;
  let offset = headerSize;
  const directory = Buffer.alloc(headerSize);
  directory.writeUInt16LE(0, 0);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(images.length, 4);

  images.forEach((image, index) => {
    const entry = 6 + index * 16;
    directory.writeUInt8(image.size === 256 ? 0 : image.size, entry);
    directory.writeUInt8(image.size === 256 ? 0 : image.size, entry + 1);
    directory.writeUInt8(0, entry + 2);
    directory.writeUInt8(0, entry + 3);
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(image.png.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += image.png.length;
  });
  return Buffer.concat([directory, ...images.map((image) => image.png)]);
}

// Temporary brand-neutral vector shield, used only if the provided logo file is invalid.
const fallbackSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
 <rect width="512" height="512" rx="88" fill="#071b35"/>
 <path d="M256 72 394 126v116c0 96-58 158-138 198-80-40-138-102-138-198V126z" fill="none" stroke="#d4af62" stroke-width="20" stroke-linejoin="round"/>
 <path d="M166 352V180h40l100 118V180h40v172h-40l-100-118v118z" fill="#d4af62"/>
</svg>`);

async function main() {
  let input = source;
  try {
    if (!fs.existsSync(source)) throw new Error('Logo file missing');
    await sharp(source).metadata();
  } catch {
    console.warn('Logo WebP inválido o ausente; se usará escudo vectorial provisional para los iconos del paquete.');
    input = fallbackSvg;
  }

  const images = [];
  for (const size of sizes) {
    const png = await sharp(input)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 7, g: 27, b: 53, alpha: 1 }
      })
      .png()
      .toBuffer();
    if (png.readUInt32BE(0) !== 0x89504e47 || png.subarray(-8).toString('hex') !== '49454e44ae426082') {
      throw new Error(`PNG generado inválido para tamaño ${size}px`);
    }
    images.push({ size, png });
  }

  const ico = makeIco(images);
  const destinations = [
    path.join(root, 'build', 'notariave.ico'),
    path.join(root, 'public', 'favicon.ico')
  ];
  for (const destination of destinations) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, ico);
  }
  console.log(`Iconos generados y verificados: ${destinations.length} ICO, ${sizes.join('/')} px`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
