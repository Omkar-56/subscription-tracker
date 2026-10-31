'use client';

export default function StatCard({ label, value, sublabel, tone = 'default' }) {
  const toneClass = {
    default: 'text-ink',
    ledger: 'text-ledger-dark',
    emerald: 'text-emerald-700',
    amber: 'text-amber',
    rust: 'text-rust',
  }[tone] || 'text-ink';

  return (
    <div className="flex flex-col justify-between h-full border border-line bg-paper p-3.5 sm:px-5 sm:py-4 shadow-2xs">
      <div>
        <p className="text-[11px] sm:text-sm text-ink/70 leading-tight font-medium">{label}</p>
        <p className={`mt-1.5 sm:mt-2 font-display text-lg sm:text-2xl lg:text-3xl font-semibold tabular truncate ${toneClass}`}>
          {value}
        </p>
      </div>
      {sublabel && (
        <p className="mt-1 sm:mt-1.5 text-[10px] sm:text-[11px] text-ink/70 tabular leading-tight line-clamp-2">
          {sublabel}
        </p>
      )}
    </div>
  );
}
