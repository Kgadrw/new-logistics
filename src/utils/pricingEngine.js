function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function methodAllowed(method, methods) {
  if (!Array.isArray(methods) || methods.length === 0) return true;
  return methods.includes(method);
}

function normalizeRule(rule) {
  return {
    id: String(rule?.id || ''),
    name: String(rule?.name || 'Custom rule'),
    type: ['fixed', 'percent', 'perKg', 'perCbm'].includes(rule?.type) ? rule.type : 'fixed',
    value: toNumber(rule?.value, 0),
    methods: Array.isArray(rule?.methods) ? rule.methods : [],
    enabled: rule?.enabled !== false,
  };
}

export function estimateCostUsd(globalPricing, shipment, warehousePricing = null) {
  const method = shipment?.dispatch?.method || null;
  const products = Array.isArray(shipment?.products) ? shipment.products : [];

  const totalKg = products.reduce((sum, p) => sum + toNumber(p?.weightKg) * toNumber(p?.quantity, 1), 0);
  const totalCbm = products.reduce((sum, p) => {
    if (toNumber(p?.cbm, 0) > 0) return sum + toNumber(p.cbm) * toNumber(p?.quantity, 1);
    const l = toNumber(p?.lengthCm, 0);
    const w = toNumber(p?.widthCm, 0);
    const h = toNumber(p?.heightCm, 0);
    if (l > 0 && w > 0 && h > 0) return sum + (l * w * h / 1000000) * toNumber(p?.quantity, 1);
    return sum;
  }, 0);

  const pricePerKg = toNumber(warehousePricing?.pricePerKgUsd, toNumber(globalPricing?.pricePerKgUsd, 0));
  const handlingFee = toNumber(warehousePricing?.warehouseHandlingFeeUsd, toNumber(globalPricing?.warehouseHandlingFeeUsd, 0));
  const cbmRateUsd = toNumber(warehousePricing?.cbmRateUsd, toNumber(globalPricing?.cbmRateUsd, 0));
  const divisor = toNumber(
    warehousePricing?.cbmDivisorByMethod?.[method],
    toNumber(globalPricing?.cbmDivisorByMethod?.[method], 0)
  );

  const volumetricKg = divisor > 0 ? totalCbm * divisor : 0;
  const chargeableKg = Math.max(totalKg, volumetricKg);

  let subtotal = chargeableKg * pricePerKg + totalCbm * cbmRateUsd + handlingFee;

  if (method) {
    const transport = warehousePricing?.transportPriceUsd?.[method];
    const fallbackTransport = globalPricing?.transportPriceUsd?.[method];
    subtotal += toNumber(transport, toNumber(fallbackTransport, 0));
  }

  const globalRules = Array.isArray(globalPricing?.customRules) ? globalPricing.customRules.map(normalizeRule) : [];
  const warehouseRules = Array.isArray(warehousePricing?.customPricingRules)
    ? warehousePricing.customPricingRules.map(normalizeRule)
    : [];

  const allRules = [...globalRules, ...warehouseRules].filter((r) => r.enabled && methodAllowed(method, r.methods));
  for (const rule of allRules) {
    if (rule.type === 'fixed') subtotal += rule.value;
    if (rule.type === 'percent') subtotal += subtotal * (rule.value / 100);
    if (rule.type === 'perKg') subtotal += chargeableKg * rule.value;
    if (rule.type === 'perCbm') subtotal += totalCbm * rule.value;
  }

  return Math.max(0, Math.round(subtotal));
}

