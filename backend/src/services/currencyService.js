let cachedRates = {};
let lastFetchedAt = 0;
// Short cache (1 hour) to keep rates fresh and reflect real-world exchange fluctuations
const CACHE_TTL_MS = 1000 * 60 * 60 * 1; 

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

/**
 * Fetches real-time exchange rates with USD as the base.
 * Uses primary open exchange API (open.er-api.com) and falls back to ECB-backed frankfurter.app.
 */
async function fetchLiveRates() {
  const now = Date.now();
  if (now - lastFetchedAt < CACHE_TTL_MS && Object.keys(cachedRates).length > 0) {
    return cachedRates;
  }

  // 1. Primary Live API: ExchangeRate-API (Free, unauthenticated, daily/hourly updates)
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && Object.keys(data.rates).length > 5) {
        cachedRates = { ...data.rates, USD: 1.0 };
        lastFetchedAt = now;
        return cachedRates;
      }
    }
  } catch (err) {
    console.warn('[CurrencyService] Primary rates API error, trying secondary source:', err.message);
  }

  // 2. Secondary Live API: Frankfurter (Free, open-source ECB live rates)
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD', { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        cachedRates = { ...data.rates, USD: 1.0 };
        lastFetchedAt = now;
        return cachedRates;
      }
    }
  } catch (err) {
    console.warn('[CurrencyService] Secondary rates API error:', err.message);
  }

  // Fallback offline rates for the supported 8 currencies if offline
  if (Object.keys(cachedRates).length === 0) {
    return {
      USD: 1.0,
      INR: 87.5,
      EUR: 0.92,
      CAD: 1.39,
      AED: 3.67,
      JPY: 153.2,
      SGD: 1.34,
      AUD: 1.54,
    };
  }

  return cachedRates;
}

export const currencyService = {
  async getRates() {
    return fetchLiveRates();
  },

  async convert(amount, from = 'INR', to = 'INR') {
    const num = Number(amount) || 0;
    const f = (from || 'INR').toUpperCase();
    const t = (to || 'INR').toUpperCase();
    if (f === t) return num;

    const rates = await fetchLiveRates();
    const rateFrom = rates[f] || (f === 'USD' ? 1 : rates.INR ? rates.INR / 87.5 : 1);
    const rateTo = rates[t] || (t === 'USD' ? 1 : rates.INR ? rates.INR / 87.5 : 1);

    // Convert from -> USD base -> target currency
    const amountInUSD = num / rateFrom;
    const converted = amountInUSD * rateTo;
    return Number(converted.toFixed(2));
  },

  getSupportedCurrencies() {
    return SUPPORTED_CURRENCIES;
  },

  isSupported(currency) {
    if (!currency) return false;
    return ALLOWED_CURRENCY_CODES.includes(String(currency).toUpperCase());
  },
};
