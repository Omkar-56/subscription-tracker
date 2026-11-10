export const SUPPORTED_CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

export const ALLOWED_CURRENCY_CODES = SUPPORTED_CURRENCIES.map((c) => c.code);

const DEFAULT_RATES = {
  USD: 1.0,
  INR: 87.5,
  EUR: 0.92,
  CAD: 1.39,
  AED: 3.67,
  JPY: 153.2,
  SGD: 1.34,
  AUD: 1.54,
};

// Pre-seeded with baseline rates so cold starts and isolate instances never block on external APIs
let cachedRates = { ...DEFAULT_RATES };
let lastFetchedAt = Date.now();
const CACHE_TTL_MS = 1000 * 60 * 60 * 1; // 1 hour

/**
 * Fetches real-time exchange rates with USD as the base.
 * Uses a quick timeout (1.5s) to ensure worker API requests never hang.
 */
async function fetchLiveRates() {
  const now = Date.now();
  if (now - lastFetchedAt < CACHE_TTL_MS && Object.keys(cachedRates).length > 0) {
    return cachedRates;
  }

  // 1. Primary Live API: ExchangeRate-API (quick 1.5s timeout)
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const data = await res.json();
      if (data?.rates && Object.keys(data.rates).length > 5) {
        cachedRates = { ...data.rates, USD: 1.0 };
        lastFetchedAt = now;
        return cachedRates;
      }
    }
  } catch (err) {
    // Graceful fallback to cached/baseline rates
  }

  // 2. Secondary Live API: Frankfurter (quick 1.5s timeout)
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD', { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const data = await res.json();
      if (data?.rates) {
        cachedRates = { ...data.rates, USD: 1.0 };
        lastFetchedAt = now;
        return cachedRates;
      }
    }
  } catch (err) {
    // Graceful fallback to cached/baseline rates
  }

  return cachedRates;
}

export function convertWithRates(amount, from = 'INR', to = 'INR', rates = cachedRates) {
  const num = Number(amount) || 0;
  const f = (from || 'INR').toUpperCase();
  const t = (to || 'INR').toUpperCase();
  if (f === t) return num;

  const r = rates || cachedRates;
  const rateFrom = r[f] || (f === 'USD' ? 1 : r.INR ? r.INR / 87.5 : 1);
  const rateTo = r[t] || (t === 'USD' ? 1 : r.INR ? r.INR / 87.5 : 1);

  // Convert from -> USD base -> target currency
  const amountInUSD = num / rateFrom;
  const converted = amountInUSD * rateTo;
  return Number(converted.toFixed(2));
}

export const currencyService = {
  async getRates() {
    return fetchLiveRates();
  },

  convertWithRates,

  async convert(amount, from = 'INR', to = 'INR') {
    const rates = await fetchLiveRates();
    return convertWithRates(amount, from, to, rates);
  },

  getSupportedCurrencies() {
    return SUPPORTED_CURRENCIES;
  },

  isSupported(currency) {
    if (!currency) return false;
    return ALLOWED_CURRENCY_CODES.includes(String(currency).toUpperCase());
  },
};
