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
  fetchLiveExchangeRates,
} from './services/marketData';
import {
  generateTradingSignal,
  getLatestIndicators,
} from './services/technicalAnalysis';
import { MarketPair, Timeframe, SignalSensitivity, StreamSpeed } from './types/market';
import { Activity, Radio, Sparkles, Zap, Flame, X, CheckCircle2 } from 'lucide-react';

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
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);

  // Speed & Sensitivity Configuration (defaults to 'fast' for high responsiveness)
  const [sensitivity, setSensitivity] = useState<SignalSensitivity>('fast');
  const [streamSpeed, setStreamSpeed] = useState<StreamSpeed>('fast'); // 'ultra' = 300ms, 'fast' = 800ms, 'standard' = 1800ms
  const [isSyncingRates, setIsSyncingRates] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Live Toast Notification
  const [liveAlertToast, setLiveAlertToast] = useState<{
    id: number;
    title: string;
    symbol: string;
    signal: string;
    type: 'buy' | 'sell';
  } | null>(null);

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

  // Fetch initial real-world exchange rates on startup
  useEffect(() => {
    let isMounted = true;
    fetchLiveExchangeRates(pairs).then(realRates => {
      if (isMounted) setPairs(realRates);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSyncLiveRates = async () => {
    setIsSyncingRates(true);
    const updated = await fetchLiveExchangeRates(pairs);
    setPairs(updated);
    setIsSyncingRates(false);

    setLiveAlertToast({
      id: Date.now(),
      title: 'Exchange Rates Synchronized',
      symbol: 'GLOBAL',
      signal: 'Live 1H Data Updated',
      type: 'buy',
    });
  };

  const handleForceScan = () => {
    setIsScanning(true);
    // Force instant micro-tick and immediate signal re-evaluation
    setCandles(prev => [...prev]);
    setTimeout(() => {
      setIsScanning(false);
      setLiveAlertToast({
        id: Date.now(),
        title: 'Instant Signal Scan Complete',
        symbol: currentPair.symbol,
        signal: 'Zero-Lag Confluence Refreshed',
        type: 'buy',
      });
    }, 250);
  };

  // Real-time market tick generator with selectable speed:
  // Ultra: 300ms, Fast: 800ms, Standard: 1800ms
  useEffect(() => {
    const delay = streamSpeed === 'ultra' ? 300 : streamSpeed === 'fast' ? 800 : 1800;

    const interval = setInterval(() => {
      // ALWAYS update the currently active pair for continuous zero-lag responsiveness
      const isUp = Math.random() > 0.48;
      const volatility = currentPair.currentPrice * 0.00018;
      const delta = (isUp ? 1 : -1) * (Math.random() * volatility);
      const newPrice = Number((currentPair.currentPrice + delta).toFixed(currentPair.decimals));

      // Also pick 1 random background pair to keep watchlist moving
      const randomBgPair = pairs[Math.floor(Math.random() * pairs.length)];

      setPairs(prevPairs =>
        prevPairs.map(p => {
          if (p.id === currentPair.id) {
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
          }
          if (p.id === randomBgPair.id && p.id !== currentPair.id) {
            const bgDelta = (Math.random() > 0.5 ? 1 : -1) * (p.currentPrice * 0.00012);
            const bgPrice = Number((p.currentPrice + bgDelta).toFixed(p.decimals));
            return {
              ...p,
              currentPrice: bgPrice,
              change24h: bgPrice - p.basePrice,
              change24hPercent: Number((((bgPrice - p.basePrice) / p.basePrice) * 100).toFixed(2)),
            };
          }
          return p;
        })
      );

      setLastTickInfo({
        pairId: currentPair.id,
        direction: isUp ? 'up' : 'down',
      });

      // Update the active candle immediately
      setCandles(prevCandles => {
        if (prevCandles.length === 0) return prevCandles;
        const copy = [...prevCandles];
        const last = { ...copy[copy.length - 1] };
        last.close = newPrice;
        last.high = Math.max(last.high, newPrice);
        last.low = Math.min(last.low, newPrice);
        last.volume += Math.floor(Math.random() * 6) + 1;
        copy[copy.length - 1] = last;
        return copy;
      });
    }, delay);

    return () => clearInterval(interval);
  }, [currentPair, streamSpeed, pairs]);

  // Compute live technical indicators and consensus signal for selected pair with sensitivity
  const indicators = useMemo(() => {
    return getLatestIndicators(candles, sensitivity);
  }, [candles, sensitivity]);

  const signal = useMemo(() => {
    return generateTradingSignal(currentPair, candles, timeframe, sensitivity);
  }, [currentPair, candles, timeframe, sensitivity]);

  // Check for signal flip or live breakout to trigger notification & sound
  useEffect(() => {
    if (signal.signal !== prevSignalRef.current) {
      if (prevSignalRef.current && (signal.signal === 'STRONG_BUY' || signal.signal === 'BUY')) {
        playAlertChime(true);
        setLiveAlertToast({
          id: Date.now(),
          title: `New ${signal.signal.replace('_', ' ')} Triggered`,
          symbol: currentPair.symbol,
          signal: `${signal.confidence}% Confidence at ${signal.currentPrice}`,
          type: 'buy',
        });
      } else if (prevSignalRef.current && (signal.signal === 'STRONG_SELL' || signal.signal === 'SELL')) {
        playAlertChime(false);
        setLiveAlertToast({
          id: Date.now(),
          title: `New ${signal.signal.replace('_', ' ')} Triggered`,
          symbol: currentPair.symbol,
          signal: `${signal.confidence}% Confidence at ${signal.currentPrice}`,
          type: 'sell',
        });
      }
      prevSignalRef.current = signal.signal;
    }
  }, [signal.signal, soundAlerts, currentPair.symbol, signal.confidence, signal.currentPrice]);

  // Auto-dismiss toast after 4s
  useEffect(() => {
    if (!liveAlertToast) return;
    const t = setTimeout(() => setLiveAlertToast(null), 4000);
    return () => clearTimeout(t);
  }, [liveAlertToast]);

  // Compute live currency strength matrix
  const currencyStrengths = useMemo(() => {
    return calculateCurrencyStrengthMatrix(pairs);
  }, [pairs]);

  // Compute backtesting metrics for selected pair and timeframe
  const backtestSummary = useMemo(() => {
    return simulateBacktest(currentPair, candles, timeframe, sensitivity);
  }, [currentPair, candles, timeframe, sensitivity]);

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
        streamSpeed={streamSpeed}
        setStreamSpeed={setStreamSpeed}
        onSyncLiveRates={handleSyncLiveRates}
        isSyncingRates={isSyncingRates}
      />

      {/* Live Market Bar */}
      <MarketTicker
        pairs={pairs}
        selectedPairId={selectedPairId}
        onSelectPair={id => setSelectedPairId(id)}
        lastTickPairId={lastTickInfo?.pairId}
        tickDirection={lastTickInfo?.direction}
      />

      {/* Sub-header Live Status & Rapid Controls Strip */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
          <span>PulseFX</span>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{currentPair.symbol}</span>
          <span aria-hidden="true">/</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{timeframe} Timeframe</span>
          <span aria-hidden="true">·</span>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
            {sensitivity === 'fast' ? '⚡ Fast Mode (Zero-Lag)' : sensitivity === 'balanced' ? '⚖️ Balanced' : '🛡️ Strict'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-semibold">
              Live {streamSpeed === 'ultra' ? '300ms' : streamSpeed === 'fast' ? '800ms' : '1.8s'} Stream
            </span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Live Tick:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {currentPair.currentPrice.toFixed(currentPair.decimals)}
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
                <SignalCard
                  signal={signal}
                  pair={currentPair}
                  sensitivity={sensitivity}
                  setSensitivity={setSensitivity}
                  onForceScan={handleForceScan}
                  isScanning={isScanning}
                />
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
              sensitivity={sensitivity}
              setSensitivity={setSensitivity}
              onRefresh={handleForceScan}
              isRefreshing={isScanning}
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

      {/* Real-time Alert Toast Notification */}
      {liveAlertToast && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-start gap-3 max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className={`p-2 rounded-lg shrink-0 ${
            liveAlertToast.type === 'buy' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
          }`}>
            <Flame className="w-4 h-4" />
          </div>
          <div className="flex-1 pr-2">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
              <span>{liveAlertToast.symbol}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-mono">
                {liveAlertToast.title}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {liveAlertToast.signal}
            </p>
          </div>
          <button
            onClick={() => setLiveAlertToast(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
