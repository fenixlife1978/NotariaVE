const BCV_RATE_URL = 'https://bcv.today/api/v1/rate.json';

function parseBcvRatePayload(payload, retrievedAt = new Date().toISOString()) {
  const rate = Number(payload?.USD);
  const effectiveDate = String(payload?.effective_date || payload?.date || '');
  const publishedAt = payload?.updated_at ? String(payload.updated_at) : null;
  if (!Number.isFinite(rate) || rate <= 0 || rate > 1_000_000) {
    throw new Error('La fuente BCV no devolvió una tasa USD válida.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate) || Number.isNaN(Date.parse(effectiveDate))) {
    throw new Error('La fuente BCV no devolvió una fecha de vigencia válida.');
  }
  if (publishedAt && Number.isNaN(Date.parse(publishedAt))) {
    throw new Error('La fuente BCV devolvió una fecha de actualización inválida.');
  }
  return {
    rate,
    source: 'BCV Today · réplica pública de datos BCV',
    sourceType: 'automatic',
    effectiveDate,
    publishedAt,
    retrievedAt,
  };
}

function validateManualBcvRate(value) {
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate <= 0 || rate > 1_000_000) {
    throw new Error('Introduzca una tasa BCV mayor que cero y válida.');
  }
  return rate;
}

module.exports = { BCV_RATE_URL, parseBcvRatePayload, validateManualBcvRate };
