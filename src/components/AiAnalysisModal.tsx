import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, ShieldCheck, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { MarketPair, Timeframe, TradingSignal, IndicatorValues } from '../types/market';

interface AiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  pair: MarketPair;
  timeframe: Timeframe;
  signal: TradingSignal;
  indicators: IndicatorValues;
}

interface AiAnalysisData {
  executiveSummary: string;
  marketStructure: string;
  momentumDiagnosis: string;
  tradeExecutionPlan: {
    recommendedAction: string;
    keyEntryZone: string;
    invalidationLevel: string;
    primaryTarget: string;
    secondaryTarget: string;
    riskRewardRatio: string;
  };
  macroRiskWarning: string;
}

export const AiAnalysisModal: React.FC<AiAnalysisModalProps> = ({
  isOpen,
  onClose,
  pair,
  timeframe,
  signal,
  indicators,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AiAnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch('/api/ai-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: pair.symbol,
        timeframe,
        currentPrice: pair.currentPrice,
        signal: signal.signal,
        score: signal.score,
        confidence: signal.confidence,
        indicators,
        reasons: signal.reasons,
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => {
        if (isMounted) {
          setData(json.analysis);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error(err);
          setError('Unable to fetch institutional AI analysis. Please verify server connection.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, pair.symbol, timeframe]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Institutional AI Market Intelligence
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {pair.symbol} · {timeframe} Framework · Confluence Audit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="font-mono text-xs">Synthesizing quantitative indicators & orderflow...</span>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

          {data && !loading && (
            <>
              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                  Executive Confluence Thesis
                </span>
                <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                  {data.executiveSummary}
                </p>
              </div>

              {/* Execution Plan Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Institutional Trade Execution Structure
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Order Action</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {data.tradeExecutionPlan.recommendedAction}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Key Entry Range</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {data.tradeExecutionPlan.keyEntryZone}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
                    <span className="text-[10px] text-rose-500 block">Hard Invalidation</span>
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                      {data.tradeExecutionPlan.invalidationLevel}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                    <span className="text-[10px] text-emerald-500 block">Primary Target</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {data.tradeExecutionPlan.primaryTarget}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                    <span className="text-[10px] text-emerald-500 block">Extended Target</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {data.tradeExecutionPlan.secondaryTarget}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Expected R:R</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {data.tradeExecutionPlan.riskRewardRatio}
                    </span>
                  </div>
                </div>
              </div>

              {/* Technical Breakdown Sections */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                    Market Structure & Moving Average Geometry
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {data.marketStructure}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                    Momentum Diagnosis (RSI, MACD & Stochastic)
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {data.momentumDiagnosis}
                  </p>
                </div>
              </div>

              {/* Macro & Volatility Warning */}
              {data.macroRiskWarning && (
                <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                    {data.macroRiskWarning}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
};
