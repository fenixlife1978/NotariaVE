const test = require('node:test');
const assert = require('node:assert/strict');
const { GEMINI_MODEL, GEMINI_ENDPOINT, generateGeminiClause } = require('../electron/gemini-provider.cjs');

test('uses the current Flash model and sends a structured Spanish legal drafting request', async () => {
  let request;
  const result = await generateGeminiClause({
    apiKey: 'test-key',
    prompt: 'Redacta una cláusula de pago.',
    currentClause: 'Texto previo.',
    context: 'Compraventa; jurisdicción Caracas.',
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: '  Cláusula propuesta.  ' }] } }] }) };
    },
  });

  assert.equal(GEMINI_MODEL, 'gemini-3.8-flash');
  assert.equal(request.url, GEMINI_ENDPOINT);
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers['x-goog-api-key'], 'test-key');
  const body = JSON.parse(request.options.body);
  const prompt = body.contents[0].parts[0].text;
  assert.match(prompt, /Contexto de documento: Compraventa; jurisdicción Caracas\./);
  assert.match(prompt, /Solicitud: Redacta una cláusula de pago\./);
  assert.match(prompt, /Texto previo a adaptar: Texto previo\./);
  assert.match(prompt, /No inventes citas normativas/);
  assert.equal(prompt.includes('\\n\\n'), false);
  assert.equal(result, 'Cláusula propuesta.');
});

test('uses a safe message when the free quota is exhausted', async () => {
  await assert.rejects(
    () => generateGeminiClause({
      apiKey: 'test-key', prompt: 'Prueba',
      fetchImpl: async () => ({ ok: false, status: 429, text: async () => 'quota exceeded' }),
    }),
    /Cuota gratuita agotada/,
  );
});

test('limits provider error details', async () => {
  const detail = 'x'.repeat(1000);
  await assert.rejects(
    () => generateGeminiClause({
      apiKey: 'test-key', prompt: 'Prueba',
      fetchImpl: async () => ({ ok: false, status: 400, text: async () => detail }),
    }),
    (error) => {
      assert.match(error.message, /^Gemini respondió 400:/);
      assert.ok(error.message.length < 350);
      return true;
    },
  );
});

test('rejects successful responses that contain no generated text', async () => {
  await assert.rejects(
    () => generateGeminiClause({
      apiKey: 'test-key', prompt: 'Prueba',
      fetchImpl: async () => ({ ok: true, json: async () => ({ candidates: [] }) }),
    }),
    /Gemini no devolvió texto/,
  );
});


test('maps network failures to a safe offline message without exposing request data', async () => {
  await assert.rejects(
    () => generateGeminiClause({
      apiKey: 'never-log-this-key',
      prompt: 'private legal text',
      fetchImpl: async () => { throw new TypeError('fetch failed: never-log-this-key private legal text'); },
    }),
    (error) => {
      assert.match(error.message, /No fue posible conectar con Gemini/);
      assert.equal(error.message.includes('never-log-this-key'), false);
      assert.equal(error.message.includes('private legal text'), false);
      return true;
    },
  );
});

test('maps provider HTTP errors without exposing response bodies or submitted content', async () => {
  for (const [status, expected] of [
    [400, /HTTP 400/], [401, /API key/], [403, /API key/],
    [404, /modelo de Gemini/], [429, /Cuota gratuita/], [503, /interrupción temporal/],
  ]) {
    await assert.rejects(
      () => generateGeminiClause({
        apiKey: 'never-log-this-key',
        prompt: 'private legal text',
        fetchImpl: async () => ({ ok: false, status, text: async () => 'never-log-this-key private legal text' }),
      }),
      (error) => {
        assert.match(error.message, expected);
        assert.equal(error.message.includes('never-log-this-key'), false);
        assert.equal(error.message.includes('private legal text'), false);
        return true;
      },
    );
  }
});


test('maps request timeouts and malformed JSON responses to safe messages', async () => {
  await assert.rejects(
    () => generateGeminiClause({
      apiKey: 'never-log-this-key',
      prompt: 'private legal text',
      fetchImpl: async () => { throw new DOMException('never-log-this-key private legal text', 'TimeoutError'); },
    }),
    (error) => {
      assert.match(error.message, /agotó el tiempo de espera/);
      assert.equal(error.message.includes('never-log-this-key'), false);
      assert.equal(error.message.includes('private legal text'), false);
      return true;
    },
  );

  await assert.rejects(
    () => generateGeminiClause({
      apiKey: 'never-log-this-key',
      prompt: 'private legal text',
      fetchImpl: async () => ({ ok: true, json: async () => { throw new Error('never-log-this-key private legal text'); } }),
    }),
    (error) => {
      assert.match(error.message, /respuesta ilegible/);
      assert.equal(error.message.includes('never-log-this-key'), false);
      assert.equal(error.message.includes('private legal text'), false);
      return true;
    },
  );
});
