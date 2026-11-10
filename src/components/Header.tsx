import React from 'react';
import { Activity, Bell, BellOff, Moon, Sun, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'terminal' | 'screener' | 'heatmap' | 'backtest';
  setActiveTab: (tab: 'terminal' | 'screener' | 'heatmap' | 'backtest') => void;
  isDark: boolean;
  toggleTheme: () => void;
  soundAlerts: boolean;
  setSoundAlerts: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenAiAnalysis: () => void;
  selectedSymbol: string;
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
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40 transition-colors">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
          <Activity className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            PulseFX Terminal
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tracking-tight">
            1H+ Technical Confluence Signals
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

      {/* Zone 3: Primary Actions & Utilities */}
      <div className="flex items-center gap-2.5 shrink-0">
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

        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        <button
          onClick={onOpenAiAnalysis}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 rounded-lg hover:bg-slate-800 dark:hover:bg-emerald-500 transition-colors whitespace-nowrap shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Confluence Analysis</span>
        </button>
      </div>
    </header>
  );
};
