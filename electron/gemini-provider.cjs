const GEMINI_MODEL = 'gemini-3.8-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function generateGeminiClause({ apiKey, prompt, currentClause = '', context = '', fetchImpl = globalThis.fetch }) {
  if (typeof fetchImpl !== 'function') throw new Error('El cliente HTTP no está disponible en este entorno.');
  const userPrompt = [
    `Contexto de documento: ${String(context || '').slice(0, 2000) || 'Documento notarial venezolano'}`,
    `Solicitud: ${String(prompt || '').trim()}`,
    currentClause ? `Texto previo a adaptar: ${String(currentClause).trim()}` : 'No se suministró texto previo.',
    'Redacta una propuesta en español jurídico claro. No inventes citas normativas, artículos, precedentes ni requisitos. Señala brevemente los aspectos que requieren verificación profesional, fuera del texto de cláusula.',
  ].join('\n\n');

  const response = await fetchImpl(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2500 },
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(response.status === 429
      ? 'Cuota gratuita agotada o límite temporal. Intenta más tarde.'
      : `Gemini respondió ${response.status}: ${errorText.slice(0, 300)}`);
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  if (!text) throw new Error('Gemini no devolvió texto. Reintenta.');
  return text;
}

module.exports = { GEMINI_MODEL, GEMINI_ENDPOINT, generateGeminiClause };
