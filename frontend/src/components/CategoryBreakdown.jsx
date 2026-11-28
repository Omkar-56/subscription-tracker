'use client';

import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatMoney } from '../utils/date';
import { CATEGORY_LEGEND, normalizeCategory } from '../utils/brands';

const EMPTY_RING_DATA = [{ category: 'empty', monthlySpend: 1 }];

export default function CategoryBreakdown({ categories = [], totalMonthly = 0, currency = 'INR' }) {
  const [activeKey, setActiveKey] = useState(null);

  const allCategories = useMemo(() => {
    const aggMap = new Map();

    for (const item of categories || []) {
      const key = normalizeCategory(item.category).toLowerCase();
      const spend = Number(item.monthlySpend ?? item.amount ?? 0);
      const count = Number(item.count ?? 0);
      const existing = aggMap.get(key) || { monthlySpend: 0, count: 0 };
      aggMap.set(key, {
        monthlySpend: existing.monthlySpend + spend,
        count: existing.count + count,
      });
    }

    const merged = CATEGORY_LEGEND.map((leg, order) => {
      const entry = aggMap.get(leg.key) || { monthlySpend: 0, count: 0 };
      const percentage =
        totalMonthly > 0
          ? Math.round((entry.monthlySpend / totalMonthly) * 100)
          : 0;

      return {
        category: leg.key,
        label: leg.label,
        color: leg.color,
        monthlySpend: entry.monthlySpend,
        count: entry.count,
        percentage,
        order,
      };
    });

    merged.sort((a, b) => {
      if (b.monthlySpend !== a.monthlySpend) {
        return b.monthlySpend - a.monthlySpend;
      }
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.order - b.order;
    });

    return merged;
  }, [categories, totalMonthly]);

  const pieData = useMemo(
    () => allCategories.filter((c) => c.monthlySpend > 0),
    [allCategories]
  );

  const activeCategory = useMemo(
    () => (activeKey ? allCategories.find((c) => c.category === activeKey) || null : null),
    [allCategories, activeKey]
  );

  const hasData = pieData.length > 0;

  return (
    <div className="h-full rounded-2xl squircle border border-line bg-paper p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-stretch gap-4 sm:gap-5">
      {/* Left Side: Donut Chart + Hover Metric */}
      <div className="shrink-0 sm:w-[168px] xl:w-[184px] flex flex-col items-center justify-center">
        <div className="relative h-[162px] w-[162px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {hasData ? (
                <Pie
                  data={pieData}
                  dataKey="monthlySpend"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={2}
                  isAnimationActive={false}
                  onMouseEnter={(_, index) => setActiveKey(pieData[index]?.category || null)}
                  onMouseLeave={() => setActiveKey(null)}
                >
                  {pieData.map((entry) => {
                    const isActive = activeKey === entry.category;
                    return (
                      <Cell
                        key={entry.category}
                        fill={entry.color}
                        className="transition-opacity duration-150 cursor-pointer outline-none"
                        stroke={isActive ? '#064e3b' : '#ffffff'}
                        strokeWidth={isActive ? 2 : 1}
                        opacity={activeKey === null || isActive ? 1 : 0.4}
                      />
                    );
                  })}
                </Pie>
              ) : (
                <Pie
                  data={EMPTY_RING_DATA}
                  dataKey="monthlySpend"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  stroke="none"
                  isAnimationActive={false}
                >
                  <Cell fill="#e8e2d5" />
                </Pie>
              )}
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Donut Label */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-3">
            {activeCategory ? (
              <>
                <p className="text-[10px] font-medium text-ink/80 truncate max-w-[92px]">
                  {activeCategory.label}
                </p>
                <p className="font-display text-xs sm:text-sm font-bold text-ink tabular truncate max-w-[96px]">
                  {formatMoney(activeCategory.monthlySpend, currency)}
                </p>
                <p className="text-[10px] text-ledger font-semibold tabular">
                  {activeCategory.percentage}%
                </p>
              </>
            ) : (
              <>
                <p className="text-[10px] uppercase tracking-wider text-ink/70 font-medium">Monthly</p>
                <p className="font-display text-xs sm:text-sm font-bold text-ink tabular truncate max-w-[96px]">
                  {formatMoney(totalMonthly, currency)}
                </p>
                <p className="text-[10px] text-ink/70">total</p>
              </>
            )}
          </div>
        </div>

        <p className="mt-1.5 text-center text-[11px] leading-tight text-ink/70 italic">
          {activeCategory
            ? `${activeCategory.count} active sub${activeCategory.count === 1 ? '' : 's'}`
            : hasData
              ? 'Hover slice for details'
              : 'No active spend yet'}
        </p>
      </div>

      {/* Right Side: Scrollable List of All Categories */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col border-t sm:border-t-0 sm:border-l border-line/60 pt-3 sm:pt-0 sm:pl-4">
        <div className="flex-1 min-h-0 max-h-56 sm:max-h-60 lg:max-h-none overflow-y-auto custom-scrollbar pr-2 space-y-1.5">
          {allCategories.map((item) => {
            const isHovered = activeKey === item.category;
            const isZero = item.monthlySpend <= 0 && item.count === 0;
            const barWidth = item.monthlySpend > 0 ? Math.min(100, Math.max(2, item.percentage)) : 0;

            return (
              <div
                key={item.category}
                onMouseEnter={() => setActiveKey(item.category)}
                onMouseLeave={() => setActiveKey(null)}
                onClick={() => setActiveKey((prev) => (prev === item.category ? null : item.category))}
                className={`rounded-lg squircle px-2 py-1.5 transition-colors cursor-pointer ${
                  isHovered ? 'bg-stone-100/90' : 'hover:bg-stone-50/80'
                } ${isZero && !isHovered ? 'opacity-65' : 'opacity-100'}`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-ink truncate">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-ink/70 font-mono shrink-0">
                      ({item.count})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 tabular font-mono shrink-0">
                    <span className="text-ink font-semibold">
                      {formatMoney(item.monthlySpend, currency)}
                      <span className="text-[10px] font-sans font-normal text-ink/75">/mo</span>
                    </span>
                    <span className="text-[10px] text-ink/75 w-8 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                <div className="mt-1 h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
