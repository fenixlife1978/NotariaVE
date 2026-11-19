const GEMINI_MODEL = 'gemini-3.8-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function providerErrorMessage(status) {
  if (status === 401 || status === 403) return 'Google rechazó la API key o no tiene habilitado el acceso a Gemini. Verifica la clave en Google AI Studio.';
  if (status === 404) return 'El modelo de Gemini configurado no está disponible para esta API key o región.';
  if (status === 429) return 'Cuota gratuita agotada o límite temporal. Intenta más tarde.';
  if (status >= 500) return 'El servicio de Gemini presenta una interrupción temporal. Intenta más tarde.';
  return `Gemini rechazó la solicitud (HTTP ${status}). Revisa el texto e inténtalo nuevamente.`;
}

async function generateGeminiClause({ apiKey, prompt, currentClause = '', context = '', fetchImpl = globalThis.fetch }) {
  if (typeof fetchImpl !== 'function') throw new Error('El cliente HTTP no está disponible en este entorno.');
  const userPrompt = [
    `Contexto de documento: ${String(context || '').slice(0, 2000) || 'Documento notarial venezolano'}`,
    `Solicitud: ${String(prompt || '').trim()}`,
    currentClause ? `Texto previo a adaptar: ${String(currentClause).trim()}` : 'No se suministró texto previo.',
    'Redacta una propuesta en español jurídico claro. No inventes citas normativas, artículos, precedentes ni requisitos. Señala brevemente los aspectos que requieren verificación profesional, fuera del texto de cláusula.',
  ].join('\n\n');

  let response;
  try {
    response = await fetchImpl(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2500 },
      }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw new Error('La solicitud a Gemini agotó el tiempo de espera. Verifica la conexión e inténtalo nuevamente.');
    }
    throw new Error('No fue posible conectar con Gemini. Verifica tu conexión a Internet e inténtalo nuevamente.');
  }

  if (!response.ok) {
    // Never forward provider response bodies: they may contain submitted text or sensitive diagnostics.
    throw new Error(providerErrorMessage(response.status));
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Gemini devolvió una respuesta ilegible. Inténtalo nuevamente.');
  }
  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  if (!text) throw new Error('Gemini no devolvió texto. Reintenta.');
  return text;
}

module.exports = { GEMINI_MODEL, GEMINI_ENDPOINT, generateGeminiClause, providerErrorMessage };
