import { parseLocalDate, getNextActiveRenewalDate } from './date';

export function getGuestSubs() {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('subtrack_guest_subs');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        let changed = false;

        const realSubs = parsed
          .filter((s) => !(typeof s.id === 'string' && s.id.startsWith('demo-')))
          .map((s) => {
            let clean = s.status === 'paused' ? { ...s, status: 'cancelled' } : { ...s };
            if (clean.name) {
              const trimmed = clean.name.trim();
              clean.name = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
            }
            if (!clean.createdAt && typeof clean.id === 'string' && clean.id.startsWith('guest-')) {
              const ts = Number(clean.id.replace('guest-', ''));
              if (!isNaN(ts) && ts > 0) {
                clean.createdAt = new Date(ts).toISOString();
              }
            }
            // Auto-advance active non-trial subscriptions if renewal date is reached
            if (clean.status === 'active' && !clean.isFreeTrial && clean.nextRenewalDate) {
              const rDate = parseLocalDate(clean.nextRenewalDate);
              if (rDate <= todayStart) {
                const nextDate = getNextActiveRenewalDate(clean.nextRenewalDate, clean.billingCycle || 'monthly');
                if (nextDate !== clean.nextRenewalDate) {
                  clean.nextRenewalDate = nextDate;
                  changed = true;
                }
              }
            }
            return clean;
          });

        if (changed || realSubs.length !== parsed.length) {
          localStorage.setItem('subtrack_guest_subs', JSON.stringify(realSubs));
        }
        return realSubs;
      }
    } catch {
      // ignore
    }
  }
  return [];
}

export function saveGuestSubs(subs) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('subtrack_guest_subs', JSON.stringify(subs));
}
