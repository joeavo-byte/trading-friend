import React from 'react';
import { BacktestSummary, MarketPair, Timeframe } from '../types/market';
import { CheckCircle2, XCircle, TrendingUp, Award, BarChart3, Clock } from 'lucide-react';

interface BacktestPerformanceProps {
  summary: BacktestSummary;
  pair: MarketPair;
  timeframe: Timeframe;
}

export const BacktestPerformance: React.FC<BacktestPerformanceProps> = ({
  summary,
  pair,
  timeframe,
}) => {
  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 transition-colors shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Signal Backtest Performance
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-300">
              {pair.symbol} · {timeframe}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Empirical historical signal execution over preceding 80 candles
          </p>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            Win Rate
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {summary.winRate}%
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            Across {summary.totalTrades} completed setups
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-sky-500" />
            Profit Factor
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {summary.profitFactor.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            Gross gains vs gross losses
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
            Net Performance
          </span>
          <div className={`text-xl font-bold font-mono tabular-nums mt-1 ${
            summary.netPips >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {summary.netPips >= 0 ? '+' : ''}{summary.netPips} pips
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            Avg Win +{summary.avgWinPips} / Loss -{summary.avgLossPips}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-rose-500" />
            Max Drawdown
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            -{summary.maxDrawdownPips} pips
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            Peak to trough divergence
          </span>
        </div>
      </div>

      {/* Historical Signals Ledger Table */}
      <div className="overflow-x-auto mt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Executed Signal Sequence Log
        </h4>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
              <th className="py-2.5 px-3">Date / Time</th>
              <th className="py-2.5 px-3">Signal</th>
              <th className="py-2.5 px-3 font-mono">Entry</th>
              <th className="py-2.5 px-3 font-mono">Exit</th>
              <th className="py-2.5 px-3 font-mono">Stop Loss</th>
              <th className="py-2.5 px-3 font-mono">Take Profit</th>
              <th className="py-2.5 px-3">Result</th>
              <th className="py-2.5 px-3 font-mono text-right">Net Pips</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {summary.trades.map(trade => {
              const isWin = trade.result === 'WIN';
              return (
                <tr
                  key={trade.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                    {new Date(trade.timestamp).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        trade.signal.includes('BUY')
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {trade.signal.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono tabular-nums text-slate-800 dark:text-slate-200">
                    {trade.entryPrice.toFixed(pair.decimals)}
                  </td>
                  <td className="py-2 px-3 font-mono tabular-nums text-slate-800 dark:text-slate-200">
                    {trade.exitPrice.toFixed(pair.decimals)}
                  </td>
                  <td className="py-2 px-3 font-mono tabular-nums text-rose-600 dark:text-rose-400">
                    {trade.stopLoss.toFixed(pair.decimals)}
                  </td>
                  <td className="py-2 px-3 font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                    {trade.takeProfit.toFixed(pair.decimals)}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        isWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isWin ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{trade.result}</span>
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono tabular-nums text-right font-bold">
                    <span
                      className={trade.profitPips >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}
                    >
                      {trade.profitPips >= 0 ? '+' : ''}
                      {trade.profitPips}
                    </span>
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
