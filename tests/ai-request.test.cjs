const test = require('node:test');
const assert = require('node:assert/strict');
const { validateAiClauseRequest } = require('../electron/ai-request.cjs');

test('requires a fresh explicit consent value for every AI request', () => {
  assert.throws(() => validateAiClauseRequest({ prompt: 'Redactar', consent: false }), /Confirma expresamente/);
  assert.throws(() => validateAiClauseRequest({ prompt: 'Redactar' }), /Confirma expresamente/);
  assert.equal(validateAiClauseRequest({ prompt: 'Redactar', consent: true }).prompt, 'Redactar');
  // A later IPC invocation has no implicit consent inherited from the previous request.
  assert.throws(() => validateAiClauseRequest({ prompt: 'Reformular', consent: false }), /Confirma expresamente/);
});

test('validates request sizes and keeps text and credentials out of audit metadata', () => {
  const request = validateAiClauseRequest({
    consent: true,
    prompt: 'Texto reservado',
    currentClause: 'Cláusula reservada',
  });
  assert.deepEqual(request.auditDetails, {
    provider: 'gemini',
    promptLength: 15,
    priorTextLength: 19,
  });
  assert.equal(JSON.stringify(request.auditDetails).includes('Texto reservado'), false);
  assert.equal(JSON.stringify(request.auditDetails).includes('Cláusula reservada'), false);
  assert.throws(() => validateAiClauseRequest({ consent: true, prompt: 'x'.repeat(12001) }), /excede el límite/);
  assert.throws(() => validateAiClauseRequest({ consent: true, prompt: 'ok', currentClause: 'x'.repeat(20001) }), /excede el límite/);
  assert.throws(() => validateAiClauseRequest({ consent: true, prompt: '   ' }), /excede el límite/);
});
