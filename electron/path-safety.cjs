const fs = require('node:fs');
const path = require('node:path');

function resolveComparablePath(value) {
  const resolved = path.resolve(String(value));
  try {
    return fs.realpathSync(resolved);
  } catch {
    return resolved;
  }
}

function assertNotActiveDatabasePath(candidatePath, activePath, platform = process.platform) {
  if (!candidatePath || !activePath) throw new Error('No fue posible validar la ruta de la base de datos activa.');
  let candidate = resolveComparablePath(candidatePath);
  let active = resolveComparablePath(activePath);
  if (platform === 'win32') {
    candidate = candidate.toLowerCase();
    active = active.toLowerCase();
  }
  if (candidate === active) {
    throw new Error('Seleccione una ubicación distinta de la base de datos activa de NotariaVE.');
  }

  // realpath no distingue dos hardlinks al mismo archivo: comparar identidad del inode
  // evita que un destino alternativo sobrescriba o restaure sobre la base activa.
  try {
    const candidateStat = fs.statSync(candidatePath);
    const activeStat = fs.statSync(activePath);
    if (candidateStat.dev === activeStat.dev && candidateStat.ino === activeStat.ino) {
      throw new Error('Seleccione una ubicación distinta de la base de datos activa de NotariaVE.');
    }
  } catch (error) {
    if (error?.message?.includes('Seleccione una ubicación distinta')) throw error;
    // La ruta de destino de un respaldo puede no existir todavía.
  }
}

module.exports = { assertNotActiveDatabasePath };
