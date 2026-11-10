import React from 'react';
import { IndicatorSignalDetail, IndicatorValues, MarketPair } from '../types/market';

interface IndicatorBreakdownProps {
  details: IndicatorSignalDetail[];
  indicators: IndicatorValues;
  pair: MarketPair;
}

export const IndicatorBreakdown: React.FC<IndicatorBreakdownProps> = ({
  details,
  indicators,
  pair,
}) => {
  const getSignalBadge = (sig: string) => {
    switch (sig) {
      case 'STRONG_BUY':
      case 'BUY':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono">
            BUY
          </span>
        );
      case 'STRONG_SELL':
      case 'SELL':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono">
            SELL
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-500/15 text-slate-600 dark:text-slate-400 font-mono">
            NEUTRAL
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 transition-colors shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Technical Indicator Confluence Matrix
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time multi-indicator breakdown & statistical status
          </p>
        </div>
      </div>

      {/* Main Indicators Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
              <th className="py-2.5 px-3">Indicator</th>
              <th className="py-2.5 px-3 font-mono">Value</th>
              <th className="py-2.5 px-3">Signal</th>
              <th className="py-2.5 px-3">Interpretation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {details.map((item, idx) => (
              <tr
                key={idx}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                  {item.name}
                </td>
                <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                  {item.value}
                </td>
                <td className="py-2.5 px-3">{getSignalBadge(item.signal)}</td>
                <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                  {item.interpretation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pivot Points Summary Card */}
      {indicators.pivotPoints && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Institutional Pivot Levels (Floor & Fibonacci)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center font-mono">
            <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
              <span className="text-[10px] text-rose-600 block">R3</span>
              <span className="text-xs font-semibold tabular-nums text-rose-700 dark:text-rose-400">
                {indicators.pivotPoints.r3.toFixed(pair.decimals)}
              </span>
            </div>
            <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
              <span className="text-[10px] text-rose-600 block">R2</span>
              <span className="text-xs font-semibold tabular-nums text-rose-700 dark:text-rose-400">
                {indicators.pivotPoints.r2.toFixed(pair.decimals)}
              </span>
            </div>
            <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
              <span className="text-[10px] text-rose-600 block">R1</span>
              <span className="text-xs font-semibold tabular-nums text-rose-700 dark:text-rose-400">
                {indicators.pivotPoints.r1.toFixed(pair.decimals)}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-bold">PIVOT (P)</span>
              <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-white">
                {indicators.pivotPoints.pivot.toFixed(pair.decimals)}
              </span>
            </div>
            <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[10px] text-emerald-600 block">S1</span>
              <span className="text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                {indicators.pivotPoints.s1.toFixed(pair.decimals)}
              </span>
            </div>
            <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[10px] text-emerald-600 block">S2</span>
              <span className="text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                {indicators.pivotPoints.s2.toFixed(pair.decimals)}
              </span>
            </div>
            <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[10px] text-emerald-600 block">S3</span>
              <span className="text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                {indicators.pivotPoints.s3.toFixed(pair.decimals)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
