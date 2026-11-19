const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { buildSync } = require('esbuild');

// Bundle the real TypeScript calculator so these tests exercise production logic,
// including the tax tables, rather than a duplicated test implementation.
const entry = path.resolve(__dirname, '../src/utils/feeCalculator.ts');
const bundled = buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  write: false,
});
const loaded = new Module(entry, module);
loaded.filename = entry;
loaded.paths = Module._nodeModulePaths(path.dirname(entry));
loaded._compile(bundled.outputFiles[0].text, entry);
const { calculateVenezuelanFees } = loaded.exports;

const base = {
  stateId: 'distrito-capital',
  municipalityId: 'mun-libertador-dc',
  operationType: 'venta-inmueble',
  amountCurrency: 'USD',
  amountValue: 1000,
  bcvRate: 40,
  pageCount: 1,
  grantorCount: 1,
  expressExpedited: false,
};

function lawyerFee(result) {
  return result.items.find((item) => item.category === 'honorarios_abogado');
}

test('applies the selected 3 percent lawyer fee to every operation type', () => {
  for (const operationType of [
    'venta-vehiculo', 'venta-inmueble', 'constitucion-ca', 'firma-personal',
    'poder-especial', 'poder-general', 'declaracion', 'arrendamiento',
  ]) {
    const result = calculateVenezuelanFees({ ...base, operationType, vehicleLawyerFeeMode: 'percentage' });
    assert.equal(lawyerFee(result).amountUsd, 30, operationType);
    assert.equal(result.subtotalHonorariosUsd, 30, operationType);
    assert.equal(result.totalUsd, result.items.reduce((sum, item) => sum + item.amountUsd, 0), operationType);
  }
});

test('uses exactly the selected US$60 minimum without percentage override', () => {
  const result = calculateVenezuelanFees({ ...base, amountValue: 100000, vehicleLawyerFeeMode: 'minimum' });
  assert.equal(lawyerFee(result).amountUsd, 60);
  assert.equal(result.subtotalHonorariosUsd, 60);
  assert.equal(lawyerFee(result).basis, 'Importe fijo de referencia seleccionado por el abogado: US$ 60');
});

test('uses a custom fee exactly, including a deliberate zero amount', () => {
  const custom = calculateVenezuelanFees({
    ...base, vehicleLawyerFeeMode: 'custom', customVehicleLawyerFeeUsd: 125.75,
  });
  assert.equal(lawyerFee(custom).amountUsd, 125.75);
  assert.equal(custom.subtotalHonorariosBs, 5030);

  const zero = calculateVenezuelanFees({
    ...base, vehicleLawyerFeeMode: 'custom', customVehicleLawyerFeeUsd: 0,
  });
  assert.equal(lawyerFee(zero).amountUsd, 0);
  assert.equal(zero.subtotalHonorariosUsd, 0);
});

test('converts percentage fees from a declared amount entered in bolivars', () => {
  const result = calculateVenezuelanFees({
    ...base, amountCurrency: 'BS', amountValue: 40000, bcvRate: 40,
    vehicleLawyerFeeMode: 'percentage',
  });
  assert.equal(result.declaredAmountUsd, 1000);
  assert.equal(lawyerFee(result).amountUsd, 30);
  assert.equal(lawyerFee(result).amountBs, 1200);
});

test('rejects negative and non-finite custom lawyer fees', () => {
  for (const customVehicleLawyerFeeUsd of [-0.01, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(
      () => calculateVenezuelanFees({
        ...base, vehicleLawyerFeeMode: 'custom', customVehicleLawyerFeeUsd,
      }),
      /monto libre de honorarios/i,
    );
  }
});


test('rejects missing or invalid BCV rates and invalid declared amounts before calculating', () => {
  for (const bcvRate of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => calculateVenezuelanFees({ ...base, bcvRate }), /tasa BCV/i);
  }
  for (const amountValue of [-0.01, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => calculateVenezuelanFees({ ...base, amountValue }), /cuantía declarada/i);
  }
});

test('rejects invalid page and grantor counts rather than silently substituting defaults', () => {
  for (const patch of [{ pageCount: 0 }, { pageCount: 1.5 }, { grantorCount: 0 }, { grantorCount: 2.5 }]) {
    assert.throws(() => calculateVenezuelanFees({ ...base, ...patch }), /páginas y los otorgantes/i);
  }
});
