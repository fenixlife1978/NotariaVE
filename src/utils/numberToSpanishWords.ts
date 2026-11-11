/**
 * Utility to convert numbers into formal legal words in Spanish (Venezuela legal standard).
 * Example: 15450.00 -> "QUINCE MIL CUATROCIENTOS CINCUENTA"
 */

const UNIDADES: string[] = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
const DECENAS: string[] = [
  '',
  'DIEZ',
  'VEINTE',
  'TREINTA',
  'CUARENTA',
  'CINCUENTA',
  'SESENTA',
  'SETENTA',
  'OCHENTA',
  'NOVENTA',
];
const DIEZ_A_DIECINUEVE: string[] = [
  'DIEZ',
  'ONCE',
  'DOCE',
  'TRECE',
  'CATORCE',
  'QUINCE',
  'DIECISÉIS',
  'DIECISIETE',
  'DIECIOCHO',
  'DIECINUEVE',
];
const VEINTI: string[] = [
  'VEINTE',
  'VEINTIUNO',
  'VEINTIDÓS',
  'VEINTITRÉS',
  'VEINTICUATRO',
  'VEINTICINCO',
  'VEINTISÉIS',
  'VEINTISIETE',
  'VEINTIOCHO',
  'VEINTINUEVE',
];
const CENTENAS: string[] = [
  '',
  'CIENTO',
  'DOSCIENTOS',
  'TRESCIENTOS',
  'CUATROCIENTOS',
  'QUINIENTOS',
  'SEISCIENTOS',
  'SETECIENTOS',
  'OCHOCIENTOS',
  'NOVECIENTOS',
];

function convertirCentenas(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';

  const c = Math.floor(n / 100);
  const d = Math.floor((n % 100) / 10);
  const u = n % 10;

  let resultado = CENTENAS[c] ? CENTENAS[c] + ' ' : '';

  if (d === 1) {
    resultado += DIEZ_A_DIECINUEVE[u];
  } else if (d === 2) {
    resultado += VEINTI[u];
  } else if (d > 2) {
    resultado += DECENAS[d];
    if (u > 0) {
      resultado += ' Y ' + UNIDADES[u];
    }
  } else if (u > 0) {
    resultado += UNIDADES[u];
  }

  return resultado.trim();
}

export function numberToSpanishWords(n: number): string {
  if (n === 0) return 'CERO';

  const absN = Math.floor(Math.abs(n));
  if (absN === 0) return 'CERO';

  const millones = Math.floor(absN / 1000000);
  const miles = Math.floor((absN % 1000000) / 1000);
  const resto = absN % 1000;

  let partes: string[] = [];

  if (millones > 0) {
    if (millones === 1) {
      partes.push('UN MILLÓN');
    } else {
      partes.push(`${convertirCentenas(millones)} MILLONES`);
    }
  }

  if (miles > 0) {
    if (miles === 1) {
      partes.push('MIL');
    } else {
      partes.push(`${convertirCentenas(miles)} MIL`);
    }
  }

  if (resto > 0) {
    partes.push(convertirCentenas(resto));
  }

  return partes.join(' ').trim();
}

/**
 * Formats full monetary amount into legal wording
 * Example: 5000.50, 'USD' ->
 * "CINCO MIL DÓLARES DE LOS ESTADOS UNIDOS DE AMÉRICA CON CINCUENTA CÉNTIMOS (US$ 5.000,00)"
 */
export function formatLegalCurrency(amount: number, currency: 'USD' | 'BS'): string {
  const rounded = Math.round(amount * 100) / 100;
  const entero = Math.floor(rounded);
  const centimos = Math.round((rounded - entero) * 100);

  const letrasEntero = numberToSpanishWords(entero);
  const centimosTexto =
    centimos === 0
      ? 'SIN CÉNTIMOS'
      : centimos === 1
      ? 'CON UN CÉNTIMO'
      : `CON ${numberToSpanishWords(centimos)} CÉNTIMOS`;

  const formattedNum = new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);

  if (currency === 'USD') {
    const unidadMoneda = entero === 1 ? 'DÓLAR DE LOS ESTADOS UNIDOS DE AMÉRICA' : 'DÓLARES DE LOS ESTADOS UNIDOS DE AMÉRICA';
    return `${letrasEntero} ${unidadMoneda} ${centimosTexto} (US$ ${formattedNum})`;
  } else {
    const unidadMoneda = entero === 1 ? 'BOLÍVAR' : 'BOLÍVARES';
    return `${letrasEntero} ${unidadMoneda} ${centimosTexto} (Bs. ${formattedNum})`;
  }
}
