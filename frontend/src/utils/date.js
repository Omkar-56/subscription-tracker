export function parseLocalDate(dateInput) {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === 'string') {
    const match = dateInput.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
  }
  return new Date(dateInput);
}

export function formatDate(dateStr) {
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateIso(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addCycleToDate(dateInput, cycle = 'monthly') {
  const d = parseLocalDate(dateInput);
  if (cycle === 'weekly') {
    d.setDate(d.getDate() + 7);
    return d;
  }
  const months = { monthly: 1, quarterly: 3, yearly: 12 }[cycle] || 1;
  const origDay = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < origDay) {
    d.setDate(0);
  }
  return d;
}

export function getNextActiveRenewalDate(dateInput, cycle = 'monthly') {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let cur = parseLocalDate(dateInput);
  let guard = 0;
  while (cur <= today && guard < 60) {
    cur = addCycleToDate(cur, cycle);
    guard += 1;
  }
  return formatDateIso(cur);
}

export function daysUntil(dateStr) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = parseLocalDate(dateStr);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

export function formatMoney(amount, currency = 'INR') {
  const curr = (currency || 'INR').toUpperCase();
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } catch {
    return `${curr} ${Number(amount || 0).toFixed(2)}`;
  }
}
