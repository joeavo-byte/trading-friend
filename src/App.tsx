import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { MarketTicker } from './components/MarketTicker';
import { CandleChart } from './components/CandleChart';
import { SignalCard } from './components/SignalCard';
import { IndicatorBreakdown } from './components/IndicatorBreakdown';
import { CurrencyStrengthMeter } from './components/CurrencyStrengthMeter';
import { SignalScreener } from './components/SignalScreener';
import { BacktestPerformance } from './components/BacktestPerformance';
import { AiAnalysisModal } from './components/AiAnalysisModal';
import {
  INITIAL_MARKET_PAIRS,
  generateCandlesForPair,
  calculateCurrencyStrengthMatrix,
  simulateBacktest,
} from './services/marketData';
import {
  generateTradingSignal,
  getLatestIndicators,
} from './services/technicalAnalysis';
import { MarketPair, Timeframe } from './types/market';
import { Activity, Radio, Sparkles } from 'lucide-react';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pulsefx_theme');
      if (stored) return stored === 'dark';
      return true; // Default to dark for institutional trading terminals
    }
    return true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pulsefx_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pulsefx_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // Sound alert setting
  const [soundAlerts, setSoundAlerts] = useState<boolean>(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'terminal' | 'screener' | 'heatmap' | 'backtest'>('terminal');

  // Selected pair and timeframe (strictly starting from 1H)
  const [pairs, setPairs] = useState<MarketPair[]>(INITIAL_MARKET_PAIRS);
  const [selectedPairId, setSelectedPairId] = useState<string>('EURUSD');
  const [timeframe, setTimeframe] = useState<Timeframe>('1H');

  // Last tick animation tracker
  const [lastTickInfo, setLastTickInfo] = useState<{ pairId: string; direction: 'up' | 'down' } | undefined>();

  // AI Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Previous signal tracking to trigger audio chime on flip
  const prevSignalRef = useRef<string>('');

  // Audio synthesizer chime
  const playAlertChime = (isBullish: boolean) => {
    if (!soundAlerts || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isBullish ? 587.33 : 369.99, ctx.currentTime); // D5 or F#4
      osc.frequency.exponentialRampToValueAtTime(isBullish ? 880 : 261.63, ctx.currentTime + 0.25); // A5 or C4

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // AudioContext policy suppression fallback
    }
  };

  // Find currently selected pair
  const currentPair = useMemo(() => {
    return pairs.find(p => p.id === selectedPairId) || pairs[0];
  }, [pairs, selectedPairId]);

  // Generate historical candles for active pair and timeframe
  const [candles, setCandles] = useState(() =>
    generateCandlesForPair(currentPair, timeframe, 85)
  );

  // Re-generate base candles when pair or timeframe changes
  useEffect(() => {
    setCandles(generateCandlesForPair(currentPair, timeframe, 85));
  }, [selectedPairId, timeframe]);

  // Real-time market tick generator (simulates live exchange feed ticks every 1.6s)
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick random pair (favoring the currently selected pair 45% of the time)
      const targetPair = Math.random() < 0.45
        ? currentPair
        : pairs[Math.floor(Math.random() * pairs.length)];

      const isUp = Math.random() > 0.48;
      const volatility = targetPair.currentPrice * 0.00015;
      const delta = (isUp ? 1 : -1) * (Math.random() * volatility);
      const newPrice = Number((targetPair.currentPrice + delta).toFixed(targetPair.decimals));

      setPairs(prevPairs =>
        prevPairs.map(p => {
          if (p.id !== targetPair.id) return p;
          const newHigh = Math.max(p.high24h, newPrice);
          const newLow = Math.min(p.low24h, newPrice);
          const newChange = newPrice - p.basePrice;
          const newChangePercent = Number(((newChange / p.basePrice) * 100).toFixed(2));

          return {
            ...p,
            currentPrice: newPrice,
            high24h: newHigh,
            low24h: newLow,
            change24h: newChange,
            change24hPercent: newChangePercent,
          };
        })
      );

      setLastTickInfo({
        pairId: targetPair.id,
        direction: isUp ? 'up' : 'down',
      });

      // If tick was for active pair, update the latest candle close, high, low
      if (targetPair.id === selectedPairId) {
        setCandles(prevCandles => {
          if (prevCandles.length === 0) return prevCandles;
          const copy = [...prevCandles];
          const last = { ...copy[copy.length - 1] };
          last.close = newPrice;
          last.high = Math.max(last.high, newPrice);
          last.low = Math.min(last.low, newPrice);
          last.volume += Math.floor(Math.random() * 8) + 1;
          copy[copy.length - 1] = last;
          return copy;
        });
      }
    }, 1600);

    return () => clearInterval(interval);
  }, [selectedPairId, currentPair, pairs]);

  // Compute live technical indicators and consensus signal for selected pair
  const indicators = useMemo(() => {
    return getLatestIndicators(candles);
  }, [candles]);

  const signal = useMemo(() => {
    return generateTradingSignal(currentPair, candles, timeframe);
  }, [currentPair, candles, timeframe]);

  // Check for signal flip to play audio chime
  useEffect(() => {
    if (signal.signal !== prevSignalRef.current) {
      if (prevSignalRef.current && (signal.signal === 'STRONG_BUY' || signal.signal === 'BUY')) {
        playAlertChime(true);
      } else if (prevSignalRef.current && (signal.signal === 'STRONG_SELL' || signal.signal === 'SELL')) {
        playAlertChime(false);
      }
      prevSignalRef.current = signal.signal;
    }
  }, [signal.signal, soundAlerts]);

  // Compute live currency strength matrix
  const currencyStrengths = useMemo(() => {
    return calculateCurrencyStrengthMatrix(pairs);
  }, [pairs]);

  // Compute backtesting metrics for selected pair and timeframe
  const backtestSummary = useMemo(() => {
    return simulateBacktest(currentPair, candles, timeframe);
  }, [currentPair, candles, timeframe]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-emerald-500/20">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        toggleTheme={toggleTheme}
        soundAlerts={soundAlerts}
        setSoundAlerts={setSoundAlerts}
        onOpenAiAnalysis={() => setIsAiModalOpen(true)}
        selectedSymbol={currentPair.symbol}
      />

      {/* Live Market Bar */}
      <MarketTicker
        pairs={pairs}
        selectedPairId={selectedPairId}
        onSelectPair={id => setSelectedPairId(id)}
        lastTickPairId={lastTickInfo?.pairId}
        tickDirection={lastTickInfo?.direction}
      />

      {/* Sub-header Live Status & Breadcrumb strip */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
          <span>PulseFX</span>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{currentPair.symbol}</span>
          <span aria-hidden="true">/</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{timeframe} Timeframe</span>
          <span aria-hidden="true">·</span>
          <span className="text-[11px] text-slate-400">Timeframes starting strictly from 1H</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-semibold">Live 1.6s Streaming Engine</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">24h Vol:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {currentPair.volume24h.toLocaleString()} lots
            </span>
          </div>
        </div>
      </div>

      {/* Main Viewport */}
      <main className="flex-1 w-full max-w-(--breakpoint-2xl) mx-auto p-4 sm:p-6 space-y-6">
        {/* TAB 1: TRADING TERMINAL */}
        {activeTab === 'terminal' && (
          <div className="space-y-6">
            {/* Top Split: Candlestick Chart (65%) + Signal Consensus Card (35%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8">
                <CandleChart
                  pair={currentPair}
                  candles={candles}
                  timeframe={timeframe}
                  setTimeframe={setTimeframe}
                  isDark={isDark}
                />
              </div>

              <div className="lg:col-span-4">
                <SignalCard signal={signal} pair={currentPair} />
              </div>
            </div>

            {/* Bottom Row: Full Technical Indicator Matrix */}
            <div className="w-full">
              <IndicatorBreakdown
                details={signal.indicatorDetails}
                indicators={indicators}
                pair={currentPair}
              />
            </div>

            {/* Currency Strength Quick Ribbon */}
            <div className="w-full">
              <CurrencyStrengthMeter
                strengths={currencyStrengths}
                onSelectCurrencyPair={id => setSelectedPairId(id)}
                pairs={pairs}
              />
            </div>
          </div>
        )}

        {/* TAB 2: MULTI-ASSET SIGNAL SCREENER */}
        {activeTab === 'screener' && (
          <div className="space-y-6">
            <SignalScreener
              pairs={pairs}
              selectedPairId={selectedPairId}
              onSelectPair={id => {
                setSelectedPairId(id);
                setActiveTab('terminal');
              }}
            />
          </div>
        )}

        {/* TAB 3: GLOBAL CURRENCY STRENGTH MATRIX */}
        {activeTab === 'heatmap' && (
          <div className="space-y-6">
            <CurrencyStrengthMeter
              strengths={currencyStrengths}
              onSelectCurrencyPair={id => {
                setSelectedPairId(id);
                setActiveTab('terminal');
              }}
              pairs={pairs}
            />

            {/* Deep dive on top currency pairs */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Relative Flow Strategy Guide
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                High-probability technical setups occur when matching the strongest currency (bullish momentum) against the weakest currency (bearish pressure).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                    Strongest Currency Leader: {currencyStrengths[0].currency}
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    Exhibiting aggressive institutional buying flow with a score of {currencyStrengths[0].score}/10. Look for long pullbacks on 1H and 4H timeframes.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60">
                  <span className="font-bold text-rose-700 dark:text-rose-400 block mb-1">
                    Weakest Currency Anchor: {currencyStrengths[currencyStrengths.length - 1].currency}
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    Sustained capital outflow with a score of {currencyStrengths[currencyStrengths.length - 1].score}/10. Target short breakdown continuations.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">
                    Recommended Trading Action
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    Trade pairs pairing {currencyStrengths[0].currency} against {currencyStrengths[currencyStrengths.length - 1].currency} for maximum directional momentum and reduced whipsaw.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SIGNAL BACKTESTING */}
        {activeTab === 'backtest' && (
          <div className="space-y-6">
            <BacktestPerformance
              summary={backtestSummary}
              pair={currentPair}
              timeframe={timeframe}
            />
          </div>
        )}
      </main>

      {/* Institutional AI Analysis Modal */}
      <AiAnalysisModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        pair={currentPair}
        timeframe={timeframe}
        signal={signal}
        indicators={indicators}
      />
    </div>
  );
}
