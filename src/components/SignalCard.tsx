import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { TradingSignal, MarketPair } from '../types/market';

interface SignalCardProps {
  signal: TradingSignal;
  pair: MarketPair;
}

export const SignalCard: React.FC<SignalCardProps> = ({ signal, pair }) => {
  const [copied, setCopied] = useState(false);

  const getSignalBadgeColor = (sig: string) => {
    switch (sig) {
      case 'STRONG_BUY':
        return 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30';
      case 'BUY':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'STRONG_SELL':
        return 'text-rose-700 dark:text-rose-300 bg-rose-500/15 border-rose-500/30';
      case 'SELL':
        return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getSignalIcon = (sig: string) => {
    if (sig.includes('BUY')) return <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    if (sig.includes('SELL')) return <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
    return <Minus className="w-5 h-5 text-slate-500" />;
  };

  const formattedSignalTitle = signal.signal.replace('_', ' ');

  const handleCopySetup = () => {
    const text = `[PulseFX Signal] ${pair.symbol} (${signal.timeframe})
Signal: ${formattedSignalTitle} (Confidence: ${signal.confidence}%)
Entry: ${signal.entryPrice.toFixed(pair.decimals)}
Stop Loss: ${signal.stopLoss.toFixed(pair.decimals)} (${signal.stopLossPips} pips)
Take Profit 1: ${signal.takeProfit1.toFixed(pair.decimals)} (${signal.takeProfit1Pips} pips, R:R 1:${signal.riskRewardRatio})
Take Profit 2: ${signal.takeProfit2.toFixed(pair.decimals)}
Take Profit 3: ${signal.takeProfit3.toFixed(pair.decimals)}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Score normalized for progress bar (-100 to +100 -> 0 to 100%)
  const scorePercent = Math.max(0, Math.min(100, (signal.score + 100) / 2));

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 transition-colors shadow-xs">
      {/* Top Header: Pair Symbol, Timeframe & Copy button */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {pair.symbol}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              {signal.timeframe}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {pair.name} · Real-time Technical Confluence
          </p>
        </div>

        <button
          onClick={handleCopySetup}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          title="Copy trade plan to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy Setup</span>
            </>
          )}
        </button>
      </div>

      {/* Main Signal Badge & Gauge */}
      <div className="py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
              {getSignalIcon(signal.signal)}
            </div>
            <div>
              <span className="text-xs uppercase font-medium text-slate-500 dark:text-slate-400 tracking-wider">
                Consensus Signal
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-lg font-extrabold px-2.5 py-0.5 rounded-md border font-mono tracking-tight ${getSignalBadgeColor(
                    signal.signal
                  )}`}
                >
                  {formattedSignalTitle}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              Confidence
            </span>
            <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {signal.confidence}%
            </span>
          </div>
        </div>

        {/* Dynamic Sentiment Meter (-100 Strong Sell to +100 Strong Buy) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="text-rose-600 dark:text-rose-400 font-medium">Strong Sell</span>
            <span className="text-slate-400">Neutral (0)</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Strong Buy</span>
          </div>
          <div className="relative w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                signal.score > 20
                  ? 'bg-emerald-500'
                  : signal.score < -20
                  ? 'bg-rose-500'
                  : 'bg-slate-400'
              }`}
              style={{ width: `${scorePercent}%` }}
            />
          </div>
          <div className="text-right text-[11px] font-mono text-slate-500">
            Confluence Score: <span className="font-semibold text-slate-800 dark:text-slate-200">{signal.score > 0 ? `+${signal.score}` : signal.score}/100</span>
          </div>
        </div>
      </div>

      {/* Trade Execution Grid (Entry, SL, TP1, TP2, TP3, R:R) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 pb-4 border-t border-slate-100 dark:border-slate-800">
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Optimal Entry</span>
          </div>
          <div className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {signal.entryPrice.toFixed(pair.decimals)}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
          <div className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            <span>Stop Loss (SL)</span>
          </div>
          <div className="text-sm font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-1">
            {signal.stopLoss.toFixed(pair.decimals)}
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
            -{signal.stopLossPips} pips
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
          <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Target className="w-3 h-3" />
            <span>Take Profit 1</span>
          </div>
          <div className="text-sm font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {signal.takeProfit1.toFixed(pair.decimals)}
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
            +{signal.takeProfit1Pips} pips (1:{signal.riskRewardRatio})
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            <span>Take Profit 2</span>
          </div>
          <div className="text-sm font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200 mt-1">
            {signal.takeProfit2.toFixed(pair.decimals)}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            <span>Take Profit 3</span>
          </div>
          <div className="text-sm font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200 mt-1">
            {signal.takeProfit3.toFixed(pair.decimals)}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Risk:Reward
          </div>
          <div className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            1 : {signal.riskRewardRatio}
          </div>
        </div>
      </div>

      {/* Indicator Consensus Tally */}
      <div className="flex items-center justify-between py-2.5 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs font-mono">
        <span className="text-slate-500 dark:text-slate-400">Indicator Votes:</span>
        <div className="flex items-center gap-4">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            {signal.bullishIndicatorsCount} Buy
          </span>
          <span className="text-slate-400">
            {signal.neutralIndicatorsCount} Neutral
          </span>
          <span className="text-rose-600 dark:text-rose-400 font-semibold">
            {signal.bearishIndicatorsCount} Sell
          </span>
        </div>
      </div>

      {/* Technical Rationale Checklist */}
      {signal.reasons && signal.reasons.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            Key Confluence Factors:
          </span>
          <ul className="space-y-1">
            {signal.reasons.map((reason, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5"
              >
                <span className="text-emerald-500 font-bold">✓</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
