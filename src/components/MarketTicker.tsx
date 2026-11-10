import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { MarketPair } from '../types/market';

interface MarketTickerProps {
  pairs: MarketPair[];
  selectedPairId: string;
  onSelectPair: (id: string) => void;
  lastTickPairId?: string;
  tickDirection?: 'up' | 'down';
}

export const MarketTicker: React.FC<MarketTickerProps> = ({
  pairs,
  selectedPairId,
  onSelectPair,
  lastTickPairId,
  tickDirection,
}) => {
  return (
    <div className="w-full bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none py-1.5 px-3">
      <div className="flex items-center gap-3 w-max">
        {pairs.map(pair => {
          const isSelected = pair.id === selectedPairId;
          const isTicked = pair.id === lastTickPairId;
          const isPositive = pair.change24hPercent >= 0;

          return (
            <button
              key={pair.id}
              onClick={() => onSelectPair(pair.id)}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-md text-xs transition-all border ${
                isSelected
                  ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 shadow-xs'
                  : 'bg-transparent border-transparent hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              } ${
                isTicked
                  ? tickDirection === 'up'
                    ? 'ring-1 ring-emerald-500/50'
                    : 'ring-1 ring-rose-500/50'
                  : ''
              }`}
            >
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {pair.symbol}
              </span>
              <span
                className={`font-mono tabular-nums font-medium ${
                  isTicked
                    ? tickDirection === 'up'
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-rose-600 dark:text-rose-400 font-bold'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {pair.currentPrice.toFixed(pair.decimals)}
              </span>
              <span
                className={`flex items-center font-mono tabular-nums text-[11px] ${
                  isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3 mr-0.5 inline" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-0.5 inline" />
                )}
                {isPositive ? '+' : ''}
                {pair.change24hPercent.toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
