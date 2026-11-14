const VALID_ROLES = Object.freeze(['admin', 'abogado', 'asistente', 'consulta']);

function assertRoleAllowed(role, allowedRoles) {
  if (!allowedRoles.includes(role)) {
    throw new Error('Su perfil no tiene permiso para realizar esta operación.');
  }
}

function assertValidRole(role) {
  if (!VALID_ROLES.includes(role)) throw new Error('Perfil de usuario no permitido.');
}

function assertAdminRemainsActive({ actorId, targetId, targetRole, nextRole, nextActive, otherActiveAdmins }) {
  assertValidRole(nextRole);
  if (actorId === targetId && (nextActive !== 1 || nextRole !== 'admin')) {
    throw new Error('No puede desactivar ni quitarse el perfil administrador durante su propia sesión.');
  }
  if (targetRole === 'admin' && (nextActive !== 1 || nextRole !== 'admin') && otherActiveAdmins === 0) {
    throw new Error('Debe existir al menos un administrador local activo.');
  }
}

module.exports = { VALID_ROLES, assertRoleAllowed, assertValidRole, assertAdminRemainsActive };
