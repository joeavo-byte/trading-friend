import React, { useState, useMemo } from 'react';
import { MarketPair, AssetCategory, Timeframe, SignalType, SignalSensitivity } from '../types/market';
import { Search, Filter, TrendingUp, TrendingDown, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { generateCandlesForPair } from '../services/marketData';
import { generateTradingSignal } from '../services/technicalAnalysis';

interface SignalScreenerProps {
  pairs: MarketPair[];
  onSelectPair: (id: string) => void;
  selectedPairId: string;
  sensitivity?: SignalSensitivity;
  setSensitivity?: (s: SignalSensitivity) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const SignalScreener: React.FC<SignalScreenerProps> = ({
  pairs,
  onSelectPair,
  selectedPairId,
  sensitivity = 'fast',
  setSensitivity,
  onRefresh,
  isRefreshing = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | AssetCategory>('all');
  const [signalFilter, setSignalFilter] = useState<'all' | 'buy' | 'sell' | 'fast'>('all');

  // Precompute multi-timeframe signals for all pairs
  const screenerData = useMemo(() => {
    return pairs.map(pair => {
      const candles1H = generateCandlesForPair(pair, '1H', 50);
      const candles4H = generateCandlesForPair(pair, '4H', 50);
      const candles1D = generateCandlesForPair(pair, '1D', 50);

      const sig1H = generateTradingSignal(pair, candles1H, '1H', sensitivity);
      const sig4H = generateTradingSignal(pair, candles4H, '4H', sensitivity);
      const sig1D = generateTradingSignal(pair, candles1D, '1D', sensitivity);

      return {
        pair,
        sig1H,
        sig4H,
        sig1D,
      };
    });
  }, [pairs, sensitivity]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return screenerData.filter(item => {
      const matchesSearch =
        item.pair.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pair.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pair.base.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pair.quote.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' || item.pair.category === categoryFilter;

      let matchesSignal = true;
      if (signalFilter === 'buy') {
        matchesSignal =
          item.sig1H.signal.includes('BUY') ||
          item.sig4H.signal.includes('BUY');
      } else if (signalFilter === 'sell') {
        matchesSignal =
          item.sig1H.signal.includes('SELL') ||
          item.sig4H.signal.includes('SELL');
      } else if (signalFilter === 'fast') {
        matchesSignal = Boolean(item.sig1H.isLiveBarTrigger || item.sig4H.isLiveBarTrigger);
      }

      return matchesSearch && matchesCategory && matchesSignal;
    });
  }, [screenerData, searchTerm, categoryFilter, signalFilter]);

  const renderSignalBadge = (sig: SignalType) => {
    if (sig === 'STRONG_BUY') {
      return (
        <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono">
          STR BUY
        </span>
      );
    }
    if (sig === 'BUY') {
      return (
        <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
          BUY
        </span>
      );
    }
    if (sig === 'STRONG_SELL') {
      return (
        <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 font-mono">
          STR SELL
        </span>
      );
    }
    if (sig === 'SELL') {
      return (
        <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono">
          SELL
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
        NEUTRAL
      </span>
    );
  };

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 transition-colors shadow-xs">
      {/* Controls: Search, Asset Class Filter & Signal Direction */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        {/* Search & Refresh */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Forex pairs or currencies..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shrink-0"
              title="Force Instant Screener Re-scan"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Signal Sensitivity selector */}
          {setSensitivity && (
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs">
              <span className="text-[11px] text-slate-400 pl-1 font-medium">Speed:</span>
              {(
                [
                  { id: 'fast', label: '⚡ Fast' },
                  { id: 'balanced', label: 'Balanced' },
                  { id: 'conservative', label: 'Strict' },
                ] as const
              ).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSensitivity(opt.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                    sensitivity === opt.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Asset Category segmented controls */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'forex-major', label: 'Majors' },
                { id: 'forex-minor', label: 'Minors' },
                { id: 'exotic', label: 'Exotics' },
                { id: 'crypto', label: 'Crypto' },
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  categoryFilter === tab.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Signal Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'buy', label: 'Buy' },
                { id: 'sell', label: 'Sell' },
                { id: 'fast', label: '⚡ Fast Triggers' },
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                onClick={() => setSignalFilter(tab.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  signalFilter === tab.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Screener Table */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
              <th className="py-3 px-3">Instrument</th>
              <th className="py-3 px-3 font-mono">Live Price</th>
              <th className="py-3 px-3 font-mono">24h Change</th>
              <th className="py-3 px-3">1H Signal</th>
              <th className="py-3 px-3">4H Signal</th>
              <th className="py-3 px-3">1D Signal</th>
              <th className="py-3 px-3 font-mono">1H RSI</th>
              <th className="py-3 px-3 font-mono">Velocity</th>
              <th className="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredData.map(({ pair, sig1H, sig4H, sig1D }) => {
              const isSelected = pair.id === selectedPairId;
              const isPositive = pair.change24hPercent >= 0;

              return (
                <tr
                  key={pair.id}
                  onClick={() => onSelectPair(pair.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {pair.symbol}
                        </span>
                        {sig1H.isLiveBarTrigger && (
                          <span className="inline-flex items-center text-[9px] font-bold font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            ⚡ LIVE
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 uppercase">
                          {pair.category.replace('forex-', '')}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {pair.name}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                    {pair.currentPrice.toFixed(pair.decimals)}
                  </td>

                  <td className="py-3 px-3 font-mono tabular-nums">
                    <span
                      className={`inline-flex items-center ${
                        isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {pair.change24hPercent.toFixed(2)}%
                    </span>
                  </td>

                  <td className="py-3 px-3">{renderSignalBadge(sig1H.signal)}</td>
                  <td className="py-3 px-3">{renderSignalBadge(sig4H.signal)}</td>
                  <td className="py-3 px-3">{renderSignalBadge(sig1D.signal)}</td>

                  <td className="py-3 px-3 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    {sig1H.indicatorDetails.find(d => d.name.includes('RSI'))?.value || '50.0'}
                  </td>

                  <td className="py-3 px-3 font-mono tabular-nums">
                    <span
                      className={`font-semibold ${
                        (sig1H.signalVelocity || 0) > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : (sig1H.signalVelocity || 0) < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {(sig1H.signalVelocity || 0) > 0 ? '+' : ''}
                      {sig1H.signalVelocity || 0}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onSelectPair(pair.id);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 rounded-md transition-colors"
                    >
                      <span>Analyze</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
