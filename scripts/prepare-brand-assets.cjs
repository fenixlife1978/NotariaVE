const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const archive = path.join(root, 'assets', 'original-brand', 'EFAS_Identidad_576cdc6b.zip');

function main() {
  if (!fs.existsSync(archive)) {
    throw new Error('No se encontró el ZIP original EFAS_Identidad_576cdc6b.zip. Se cancela el build para evitar usar branding genérico.');
  }

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'notariave-brand-'));
  try {
    if (process.platform === 'win32') {
      const quote = (value) => String(value).replace(/'/g, "''");
      execFileSync('powershell.exe', [
        '-NoProfile', '-Command',
        `Expand-Archive -LiteralPath '${quote(archive)}' -DestinationPath '${quote(temp)}' -Force`,
      ], { stdio: 'inherit' });
    } else {
      execFileSync('unzip', ['-q', archive, '-d', temp], { stdio: 'inherit' });
    }
    const identity = path.join(temp, 'EFAS_Identidad');
    const assets = {
      logoLight: path.join(identity, 'logo_horizontal_transparente.png'),
      logoDark: path.join(identity, 'logo_horizontal_blanco_para_fondo_oscuro.png'),
      icon: path.join(identity, 'iconos', 'icono_azul_512.png'),
      favicon: path.join(identity, 'iconos', 'favicon.ico'),
    };
    for (const [label, file] of Object.entries(assets)) {
      if (!fs.existsSync(file) || fs.statSync(file).size === 0) {
        throw new Error(`Falta el recurso original requerido en el ZIP de identidad: ${label}`);
      }
    }

    fs.copyFileSync(assets.logoLight, path.join(root, 'public', 'notariave-logo-horizontal.png'));
    fs.copyFileSync(assets.logoDark, path.join(root, 'public', 'notariave-logo-horizontal-dark.png'));
    fs.copyFileSync(assets.icon, path.join(root, 'public', 'notariave-icon.png'));
    fs.copyFileSync(assets.favicon, path.join(root, 'public', 'favicon.ico'));

    const favicon = fs.readFileSync(path.join(root, 'public', 'favicon.ico'));
    if (favicon.length < 6 || favicon.readUInt16LE(0) !== 0 || favicon.readUInt16LE(2) !== 1) {
      throw new Error('El favicon original no tiene una cabecera ICO válida.');
    }
    console.log('Identidad original aplicada: logotipo horizontal para fondo claro y oscuro, icono azul 512px y favicon ICO original.');
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
