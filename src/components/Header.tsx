import React from 'react';
import { Activity, Bell, BellOff, Moon, Sun, Sparkles, Zap, RefreshCw } from 'lucide-react';
import { StreamSpeed } from '../types/market';

interface HeaderProps {
  activeTab: 'terminal' | 'screener' | 'heatmap' | 'backtest';
  setActiveTab: (tab: 'terminal' | 'screener' | 'heatmap' | 'backtest') => void;
  isDark: boolean;
  toggleTheme: () => void;
  soundAlerts: boolean;
  setSoundAlerts: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenAiAnalysis: () => void;
  selectedSymbol: string;
  streamSpeed: StreamSpeed;
  setStreamSpeed: (speed: StreamSpeed) => void;
  onSyncLiveRates?: () => void;
  isSyncingRates?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  toggleTheme,
  soundAlerts,
  setSoundAlerts,
  onOpenAiAnalysis,
  selectedSymbol,
  streamSpeed,
  setStreamSpeed,
  onSyncLiveRates,
  isSyncingRates = false,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40 transition-colors">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
          <Activity className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              PulseFX Terminal
            </span>
            <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              FAST ENGINE
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tracking-tight">
            1H+ Real-time Technical Confluence Signals
          </span>
        </div>
      </div>

      {/* Zone 2: Clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
        <button
          onClick={() => setActiveTab('terminal')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 relative py-1 ${
            activeTab === 'terminal' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''
          }`}
        >
          Trading Terminal
          {activeTab === 'terminal' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('screener')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 relative py-1 ${
            activeTab === 'screener' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''
          }`}
        >
          Signal Screener
          {activeTab === 'screener' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('heatmap')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 relative py-1 ${
            activeTab === 'heatmap' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''
          }`}
        >
          Currency Heatmap
          {activeTab === 'heatmap' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('backtest')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 relative py-1 ${
            activeTab === 'backtest' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''
          }`}
        >
          Signal Backtesting
          {activeTab === 'backtest' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />
          )}
        </button>
      </nav>

      {/* Zone 3: Primary Actions & Speed Utilities */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Stream Speed Control */}
        <div className="hidden sm:flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-mono">
          <span className="text-[10px] text-slate-400 px-1.5 font-sans font-medium flex items-center gap-0.5">
            <Zap className="w-3 h-3 text-amber-500" />
            Tick Rate:
          </span>
          <button
            onClick={() => setStreamSpeed('ultra')}
            title="Ultra-fast 300ms live stream"
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
              streamSpeed === 'ultra'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            300ms
          </button>
          <button
            onClick={() => setStreamSpeed('fast')}
            title="Fast 800ms live stream"
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
              streamSpeed === 'fast'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            800ms
          </button>
          <button
            onClick={() => setStreamSpeed('standard')}
            title="Standard 1800ms stream"
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
              streamSpeed === 'standard'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            1.8s
          </button>
        </div>

        {/* Sync Live Rates button */}
        {onSyncLiveRates && (
          <button
            onClick={onSyncLiveRates}
            disabled={isSyncingRates}
            title="Sync live real-world Forex & Crypto rates now"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingRates ? 'animate-spin text-emerald-500' : 'text-slate-400'}`} />
            <span className="hidden xl:inline">Sync Rates</span>
          </button>
        )}

        {/* Audio Alerts */}
        <button
          onClick={() => setSoundAlerts(prev => !prev)}
          title={soundAlerts ? 'Mute signal audio chimes' : 'Enable signal audio chimes'}
          className={`p-2 rounded-lg border transition-colors ${
            soundAlerts
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
              : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {soundAlerts ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* AI Analysis Modal CTA */}
        <button
          onClick={onOpenAiAnalysis}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 rounded-lg hover:bg-slate-800 dark:hover:bg-emerald-500 transition-colors whitespace-nowrap shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Analysis</span>
        </button>
      </div>
    </header>
  );
};
