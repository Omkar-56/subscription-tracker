/**
 * Executes a task in the background without blocking the HTTP request/response.
 * If running on Cloudflare Workers, leverages ctx.waitUntil so the worker isolate
 * stays alive until the background promise resolves.
 */
export function runBackground(promiseOrFn) {
  const p = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;
  if (!p) return;

  if (globalThis.__cf_ctx && typeof globalThis.__cf_ctx.waitUntil === 'function') {
    globalThis.__cf_ctx.waitUntil(p);
  } else if (typeof p.catch === 'function') {
    p.catch((err) => {
      console.warn('[runBackground warning]:', err?.message || err);
    });
  }
}
