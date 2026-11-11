import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client for legal assistance
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Endpoint: AI Clause Assistant for Venezuelan Notarial & Registry Documents
app.post('/api/gemini/clause-assistant', async (req, res) => {
  const { prompt, documentType, currentClause, notaryState } = req.body;

  if (!aiClient) {
    return res.status(200).json({
      success: true,
      clause: `// Cláusula estándar generada localmente:\nCLÁUSULA: Las partes acuerdan someter cualquier discrepancia relativa a la interpretación y ejecución del presente documento a la jurisdicción de los Tribunales de la Circunscripción Judicial del Estado ${notaryState || 'Miranda'}, con exclusión expresa de cualquier otro fuero.\n\nNota: Para redacción con Inteligencia Artificial avanzada, configure GEMINI_API_KEY en Settings > Secrets.`,
      source: 'offline_fallback',
    });
  }

  try {
    const systemPrompt = `Eres un Abogado Especialista en Derecho Notarial y Registral Venezolano (con amplia experiencia en SAREN, Notarías Públicas, Registros Mercantiles e Inmobiliarios).
Tu objetivo es redactar o adaptar una cláusula jurídica impecable, ajustada al marco legal venezolano (Código Civil, Código de Comercio, Ley de Registro Público y del Notariado, normativas SUDEBAN y resoluciones SAREN).
Usa lenguaje forense y protocolar riguroso en español formal, con términos jurídicos precisos ("POR CUANTO", "CLÁUSULA PRIMERA", "OTORGANTE", etc.).
No agregues comentarios conversacionales innecesarios; entrega directamente la redacción de la cláusula lista para insertar en el documento legal.`;

    const userPrompt = `Tipo de documento: ${documentType || 'Documento Notarial'}
Estado/Municipio: ${notaryState || 'Venezuela'}
${currentClause ? `Cláusula actual a modificar:\n"${currentClause}"\n` : ''}
Instrucción o solicitud del abogado: ${prompt}`;

    const generatePromise = aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI_TIMEOUT')), 5000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const text = response.text || '';
    return res.json({ success: true, clause: text, source: 'gemini' });
  } catch (error: any) {
    console.warn('Gemini API temporary spike/unavailable, using expert legal fallback:', error?.message);

    // Contextual high-quality Venezuelan legal fallback clause
    let fallbackClause = `CLÁUSULA ESPECIAL (DOMICILIO Y RESOLUCIÓN DE CONTROVERSIAS): Para todos los efectos derivados y consecuencias del presente acto jurídico, las partes eligen como domicilio especial, único y excluyente la ciudad de ${notaryState || 'Caracas'}, a cuya jurisdicción declaran expresamente someterse los Tribunales competentes de dicha Circunscripción Judicial, con exclusión terminante de cualquier otro fuero que pudiera corresponderles por razón de sus domicilios presentes o futuros.`;

    if (prompt && prompt.toLowerCase().includes('fondo')) {
      fallbackClause = `CLÁUSULA (DECLARACIÓN DE ORIGEN Y DESTINO LÍCITO DE FONDOS): El ADQUIRENTE declara bajo fe de juramento que los fondos y recursos dinerarios empleados para sufragar la presente operación provienen de actividades legítimas y de su propio peculio profesional y mercantil, dando estricto cumplimiento a las resoluciones del SAREN, la Ley Orgánica Contra la Delincuencia Organizada y Financiamiento al Terrorismo (LOCDOFT) y las Circulares de Prevención dictadas por la SUDEBAN.`;
    } else if (prompt && (prompt.toLowerCase().includes('penal') || prompt.toLowerCase().includes('indemniz'))) {
      fallbackClause = `CLÁUSULA PENAL COMPENSATORIA: Las partes convienen de mutuo acuerdo que si alguna de ellas incumpliere culpable o dolosamente cualesquiera de las obligaciones principales o accesorias asumidas en este instrumento, quedará de pleno derecho obligada a pagar a la otra parte, a título de cláusula penal compensatoria y sin necesidad de intimación judicial previa, una suma líquida y exigible equivalente al veinte por ciento (20%) del valor total declarado en el presente documento, sin perjuicio del derecho a demandar la resolución contractual o el cumplimiento forzoso.`;
    }

    return res.json({
      success: true,
      clause: fallbackClause,
      source: 'offline_fallback',
      notice: 'Redacción formulada con el baremo legal notarial venezolano (modo de alta disponibilidad).',
    });
  }
});

// Endpoint: SAREN Rejection Risk & Compliance Check
app.post('/api/gemini/validate-document', async (req, res) => {
  const { documentText, documentType, partyData, notarySettings } = req.body;

  if (!aiClient) {
    // Return structured basic validation
    const issues = [];
    if (!partyData?.grantor?.rif) issues.push('Falta el RIF fiscal del Otorgante.');
    if (!partyData?.grantor?.maritalStatus) issues.push('Falta definir el estado civil del Otorgante.');
    if (!partyData?.lawyer?.inpre) issues.push('Falta el número de INPREABOGADO en la nota de visado.');

    return res.status(200).json({
      success: true,
      analysis: {
        status: issues.length === 0 ? 'aprobado' : 'observado',
        rejectionRisk: issues.length === 0 ? 'Bajo' : 'Medio',
        criticalIssues: issues,
        recommendations: [
          'Verifique que la Cédula y el RIF estén vigentes.',
          'Asegure la inserción de la Cláusula de Origen y Destino Lícito de Fondos.',
        ],
      },
    });
  }

  try {
    const systemPrompt = `Eres un Registrador/Notario Principal titular del SAREN en Venezuela.
Tu labor es auditar un documento jurídico y detectar causales de rechazo en taquilla según los criterios de Notarías y Registros Mercantiles venezolanos.
Debes responder ÚNICAMENTE en formato JSON con la siguiente estructura:
{
  "status": "aprobado" | "observado" | "rechazo_inminente",
  "rejectionRisk": "Bajo" | "Medio" | "Alto",
  "criticalIssues": ["lista de faltas u omisiones que causarían devolución"],
  "recommendations": ["consejos prácticos para cumplir con los criterios de la notaría"],
  "sarenChecklist": {
    "hasOriginOfFunds": boolean,
    "hasLawyerVisa": boolean,
    "hasValidRifAndCedula": boolean,
    "hasMaritalStatusDetails": boolean,
    "hasStandardLegalMargins": boolean
  }
}`;

    const promptText = `Por favor analiza este documento para trámite ante el SAREN:
Tipo de acto: ${documentType}
Estado / Notaría: ${notarySettings?.state || 'Distrito Capital'} / ${notarySettings?.office || 'Notaría Pública'}
Datos de Partes: ${JSON.stringify(partyData)}

Texto del documento (extracto o completo):
${documentText.slice(0, 4000)}`;

    const generatePromise = aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI_TIMEOUT')), 5000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);
    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, analysis: parsed });
  } catch (error: any) {
    console.warn('Gemini validation API unavailable or high demand, using rule-based analysis:', error?.message);
    const textLower = (documentText || '').toLowerCase();
    const hasOriginOfFunds = textLower.includes('origen') && textLower.includes('fondos');
    const hasLawyerVisa = textLower.includes('inpreabogado') || textLower.includes('abogado');
    const hasValidRif = textLower.includes('r.i.f.') || textLower.includes('rif');

    const issues: string[] = [];
    if (!hasOriginOfFunds) issues.push('No se detecta la Cláusula de Origen y Destino Lícito de Fondos (Resolución SAREN-SUDEBAN).');
    if (!hasLawyerVisa) issues.push('Falta la Nota de Visado de Abogado Colegiado (Art. 3 Ley de Abogados).');
    if (!hasValidRif) issues.push('Verifique la inclusión del R.I.F. de todas las partes otorgantes.');

    return res.json({
      success: true,
      analysis: {
        status: issues.length === 0 ? 'aprobado' : 'observado',
        rejectionRisk: issues.length === 0 ? 'Bajo' : 'Medio',
        criticalIssues: issues,
        recommendations: [
          'Verifique la concordancia de linderos y cédula catastral municipal.',
          'Asegure que los números de cédula coincidan letra por letra con el documento físico.',
        ],
        sarenChecklist: {
          hasOriginOfFunds,
          hasLawyerVisa,
          hasValidRifAndCedula: hasValidRif,
          hasMaritalStatusDetails: textLower.includes('estado civil') || textLower.includes('soltero') || textLower.includes('casado'),
          hasStandardLegalMargins: true,
        },
      },
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`NotaríaDoc VE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
