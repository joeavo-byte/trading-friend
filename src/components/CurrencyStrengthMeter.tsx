import React from 'react';
import { CurrencyStrength, MarketPair } from '../types/market';
import { ArrowUpRight, ArrowDownRight, Compass, Flame } from 'lucide-react';

interface CurrencyStrengthMeterProps {
  strengths: CurrencyStrength[];
  onSelectCurrencyPair?: (pairId: string) => void;
  pairs: MarketPair[];
}

export const CurrencyStrengthMeter: React.FC<CurrencyStrengthMeterProps> = ({
  strengths,
  onSelectCurrencyPair,
  pairs,
}) => {
  const strongest = strengths[0];
  const weakest = strengths[strengths.length - 1];

  // Find direct trading pair for strongest vs weakest if exists
  const recommendedPair = pairs.find(
    p => (p.base === strongest.currency && p.quote === weakest.currency) ||
         (p.base === weakest.currency && p.quote === strongest.currency)
  );

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 transition-colors shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Global Currency Strength Matrix
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono font-medium">
              Live Relative Flow
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cross-currency basket flow across 8 global reserve currencies
          </p>
        </div>

        {/* Highlighted Matchup Banner */}
        {recommendedPair && (
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
            <Flame className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div className="text-xs">
              <span className="text-slate-500 dark:text-slate-400">High Disparity Pair: </span>
              <span className="font-bold font-mono text-emerald-700 dark:text-emerald-300">
                {recommendedPair.symbol} (Strong {strongest.currency} vs Weak {weakest.currency})
              </span>
            </div>
            {onSelectCurrencyPair && (
              <button
                onClick={() => onSelectCurrencyPair(recommendedPair.id)}
                className="text-xs font-semibold px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
              >
                Inspect
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid of 8 Currencies */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-4">
        {strengths.map(curr => {
          const isBull = curr.score >= 6.0;
          const isBear = curr.score <= 4.0;
          const barPercent = (curr.score / 10) * 100;

          return (
            <div
              key={curr.currency}
              className={`flex flex-col p-3 rounded-lg border transition-all ${
                isBull
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40'
                  : isBear
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  {curr.currency}
                </span>
                <span
                  className={`text-[11px] font-semibold font-mono tabular-nums ${
                    isBull
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isBear
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-500'
                  }`}
                >
                  {curr.score.toFixed(1)}/10
                </span>
              </div>

              {/* Strength bar */}
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isBull
                      ? 'bg-emerald-500'
                      : isBear
                      ? 'bg-rose-500'
                      : 'bg-slate-400'
                  }`}
                  style={{ width: `${barPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span className="capitalize">{curr.status}</span>
                <span
                  className={`font-semibold tabular-nums ${
                    curr.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {curr.change >= 0 ? '+' : ''}
                  {curr.change.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
