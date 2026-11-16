const BCV_HISTORY_URL = 'https://bcv.today/api/v1/history/';

function isValidIsoDate(value) {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(String(value || ''))) return false;
  const parsed = new Date(String(value) + 'T00:00:00.000Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function getBcvRateUrl(date) {
  if (!isValidIsoDate(date)) {
    throw new Error('La fecha de consulta BCV no es válida.');
  }
  return BCV_HISTORY_URL + encodeURIComponent(date) + '.json';
}

function parseBcvRatePayload(payload, requestedDate, retrievedAt = new Date().toISOString()) {
  const rate = Number(payload?.USD);
  const responseDate = String(payload?.date || '');
  const effectiveDate = String(payload?.effective_date || responseDate);
  const publishedAt = payload?.updated_at ? String(payload.updated_at) : null;
  if (!Number.isFinite(rate) || rate <= 0 || rate > 1_000_000) {
    throw new Error('La fuente BCV no devolvió una tasa USD válida.');
  }
  if (!isValidIsoDate(requestedDate) || !isValidIsoDate(responseDate) || responseDate !== requestedDate) {
    throw new Error('La fuente BCV no confirmó la fecha solicitada.');
  }
  if (!isValidIsoDate(effectiveDate) || effectiveDate > requestedDate) {
    throw new Error('La fuente BCV no devolvió una fecha de vigencia válida.');
  }
  if (publishedAt && Number.isNaN(Date.parse(publishedAt))) {
    throw new Error('La fuente BCV devolvió una fecha de actualización inválida.');
  }
  return {
    rate,
    source: 'BCV Today · réplica pública de datos BCV',
    sourceType: 'automatic',
    requestedDate,
    effectiveDate,
    publishedAt,
    retrievedAt,
  };
}

function getCaracasDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return values.year + '-' + values.month + '-' + values.day;
}

function validateManualBcvRate(value) {
  const rate = Number(value);
  if (!Number.isFinite(rate) || rate <= 0 || rate > 1_000_000) {
    throw new Error('Introduzca una tasa BCV mayor que cero y válida.');
  }
  return rate;
}

module.exports = { BCV_HISTORY_URL, isValidIsoDate, getBcvRateUrl, parseBcvRatePayload, getCaracasDate, validateManualBcvRate };
