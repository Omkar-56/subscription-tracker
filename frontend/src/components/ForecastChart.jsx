'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { formatMoney } from '../utils/date';

const COLORS = {
  due: '#064e3b',
  cumulative: '#C77D2B',
  grid: '#e8e2d5',
  axis: '#353535',
};

function ForecastTooltip({ active, payload, label, currency = 'INR' }) {
  const cardRef = useRef(null);
  const [shiftY, setShiftY] = useState(0);

  const isVisible = Boolean(active && payload?.length);
  const point = isVisible ? payload[0].payload : null;
  const charges = point ? (point.charges || point.renewals || []) : [];

  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!isVisible || !el) {
      setShiftY(0);
      return;
    }

    const wrapper = el.parentElement;
    const chartEl = el.closest('.recharts-wrapper');
    if (!wrapper || !chartEl) {
      setShiftY(0);
      return;
    }

    const wrapperRect = wrapper.getBoundingClientRect();
    const chartRect = chartEl.getBoundingClientRect();

    // Recharts opens this tooltip upwards above the hovered point.
    // Only shift down if it would exceed the top of the viewport, while never overflowing past chart bottom.
    const minViewportTop = 12;
    const maxChartBottom = chartRect.bottom + 8;

    let nextShift = 0;
    if (wrapperRect.top < minViewportTop) {
      const neededDown = minViewportTop - wrapperRect.top;
      const maxSafeDown = Math.max(0, maxChartBottom - wrapperRect.bottom);
      nextShift = Math.min(neededDown, maxSafeDown);
    }

    setShiftY(Math.round(nextShift));
  }, [isVisible, label, charges.length]);

  if (!isVisible || !point) return null;

  return (
    <div
      ref={cardRef}
      style={shiftY ? { transform: `translateY(${shiftY}px)` } : undefined}
      className="w-60 sm:w-64 max-w-xs border border-line bg-paper px-3 py-2.5 shadow-md rounded-xl squircle"
    >
      <p className="font-display text-sm font-semibold leading-tight">{label}</p>
      <p className="tabular mt-1 text-xs sm:text-sm font-medium leading-snug" style={{ color: COLORS.due }}>
        Due this month: {formatMoney(point.total, currency)}
      </p>
      <p className="tabular text-[11px] sm:text-xs leading-snug" style={{ color: COLORS.cumulative }}>
        Cumulative: {formatMoney(point.cumulative, currency)}
      </p>
      {charges.length > 0 && (
        <ul className="mt-2 space-y-0.5 border-t border-line pt-1.5 max-h-[min(60vh,420px)] overflow-y-auto custom-scrollbar pr-1">
          {charges.map((c, i) => (
            <li key={`${c.name}-${i}`} className="flex items-center justify-between gap-3 text-xs leading-snug text-ink/85">
              <span className="truncate">{c.name}</span>
              <span className="tabular shrink-0 font-medium">
                {c.nativeCurrency && c.nativeCurrency !== currency ? (
                  <span title={`Native: ${formatMoney(c.nativeAmount, c.nativeCurrency)}`}>
                    {formatMoney(c.convertedAmount ?? c.amount, currency)}
                  </span>
                ) : (
                  formatMoney(c.convertedAmount ?? c.amount, currency)
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ForecastChart({ months, currency = 'INR' }) {
  const [showCumulative, setShowCumulative] = useState(false);

  const data = useMemo(() => {
    let running = 0;
    return (months || []).map((m) => {
      const val = Number(m.total ?? m.projectedSpend ?? 0);
      running += val;
      const monthLabel = m.label || m.month || '';
      return {
        ...m,
        total: val,
        label: monthLabel,
        shortLabel: monthLabel ? monthLabel.split(' ')[0] : '',
        cumulative: Number(running.toFixed(2)),
      };
    });
  }, [months]);

  const hasSpend = useMemo(() => {
    return data.some((m) => (m.total || 0) > 0);
  }, [data]);

  if (data.length === 0 || !hasSpend) {
    return (
      <div className="mt-3 rounded-2xl squircle border border-line bg-paper p-8 text-center text-sm text-ink/80 shadow-2xs">
        Add subscriptions to see your projected 12-month spend.
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl squircle border border-line bg-paper px-4 pb-4 pt-5 shadow-2xs">
      <div className="mb-2 flex justify-end">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-ink/85">
          <input
            type="checkbox"
            checked={showCumulative}
            onChange={(e) => setShowCumulative(e.target.checked)}
            className="accent-amber"
          />
          Show cumulative total
        </label>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="shortLabel"
            tick={{ fontSize: 12, fill: COLORS.axis, opacity: 0.75 }}
            tickLine={false}
            axisLine={{ stroke: COLORS.grid }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: COLORS.axis, opacity: 0.75 }}
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(v) => formatMoney(v, currency).replace('.00', '')}
          />
          <Tooltip
            content={<ForecastTooltip currency={currency} />}
            cursor={{ stroke: COLORS.grid }}
            allowEscapeViewBox={{ x: false, y: true }}
            reverseDirection={{ x: false, y: true }}
            isAnimationActive={false}
            offset={12}
            wrapperStyle={{ zIndex: 40, pointerEvents: 'none' }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="total"
            name="Due that month"
            stroke={COLORS.due}
            strokeWidth={2}
            dot={{ r: 3, fill: COLORS.due }}
            activeDot={{ r: 5 }}
          />
          {showCumulative && (
            <Line
              type="monotone"
              dataKey="cumulative"
              name="Cumulative"
              stroke={COLORS.cumulative}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 5 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      <p className="mt-2 text-xs text-ink/80">
        Hover any month to see exactly which subscriptions fall due in it.
      </p>
    </div>
  );
}
