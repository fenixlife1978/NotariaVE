const { assertRoleAllowed } = require('./access-policy.cjs');

function assertAiDraftRole(role) {
  assertRoleAllowed(role, ['admin', 'abogado']);
}

function validateAiClauseRequest(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) input = {};
  if (input.consent !== true) {
    throw new Error('Confirma expresamente el envío de este texto al proveedor externo.');
  }
  const prompt = String(input.prompt || '').trim();
  const prior = String(input.currentClause || '').trim();
  if (!prompt || prompt.length > 12000 || prior.length > 20000) {
    throw new Error('El texto solicitado excede el límite permitido.');
  }
  return {
    prompt,
    prior,
    auditDetails: {
      provider: 'gemini',
      promptLength: prompt.length,
      priorTextLength: prior.length,
    },
  };
}

module.exports = { validateAiClauseRequest, assertAiDraftRole };
