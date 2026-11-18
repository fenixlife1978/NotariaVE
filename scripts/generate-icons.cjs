const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'public', 'notariave-icon.png');
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

async function main() {
  if (!fs.existsSync(source)) {
    throw new Error('No se encontró el icono original extraído del paquete de identidad EFAS. No se permite generar un icono genérico.');
  }
  const metadata = await sharp(source).metadata();
  if (!metadata.width || !metadata.height || metadata.width !== metadata.height) {
    throw new Error('El icono original debe ser una imagen cuadrada válida.');
  }

  const images = [];
  for (const size of sizes) {
    const png = await sharp(source)
      .resize(size, size, { fit: 'contain' })
      .png()
      .toBuffer();
    if (png.readUInt32BE(0) !== 0x89504e47 || png.subarray(-8).toString('hex') !== '49454e44ae426082') {
      throw new Error(`PNG generado inválido para tamaño ${size}px`);
    }
    images.push({ size, png });
  }

  const ico = makeIco(images);
  const destination = path.join(root, 'build', 'notariave.ico');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, ico);
  console.log(`Icono Windows generado desde el original: ${sizes.join('/')} px; favicon original preservado.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
