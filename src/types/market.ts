export type Timeframe = '1H' | '4H' | '1D' | '1W' | '1M';

export type AssetCategory = 'forex-major' | 'forex-minor' | 'exotic' | 'crypto';

export type SignalType = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';

export interface MarketPair {
  id: string;
  symbol: string;
  name: string;
  base: string;
  quote: string;
  category: AssetCategory;
  decimals: number;
  pipFactor: number; // e.g. 0.0001 for EUR/USD, 0.01 for USD/JPY, 1 for BTC/USD
  basePrice: number;
  currentPrice: number;
  change24h: number;
  change24hPercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorValues {
  ema20: number;
  ema50: number;
  ema200: number;
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
    percentB: number;
  };
  supertrend: {
    value: number;
    direction: 'bullish' | 'bearish';
  };
  stochastic: {
    k: number;
    d: number;
  };
  atr: number;
  pivotPoints: {
    pivot: number;
    r1: number;
    r2: number;
    r3: number;
    s1: number;
    s2: number;
    s3: number;
  };
}

export interface IndicatorSignalDetail {
  name: string;
  value: string;
  signal: SignalType;
  interpretation: string;
}

export interface TradingSignal {
  symbol: string;
  timeframe: Timeframe;
  signal: SignalType;
  confidence: number; // 0 to 100%
  score: number; // -100 to +100
  timestamp: number;
  currentPrice: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: number;
  stopLossPips: number;
  takeProfit1Pips: number;
  bullishIndicatorsCount: number;
  bearishIndicatorsCount: number;
  neutralIndicatorsCount: number;
  reasons: string[];
  indicatorDetails: IndicatorSignalDetail[];
}

export interface CurrencyStrength {
  currency: string;
  score: number; // 0 to 10
  change: number; // relative delta
  status: 'Bullish' | 'Neutral' | 'Bearish';
}

export interface HistoricalTrade {
  id: string;
  timestamp: number;
  timeframe: Timeframe;
  signal: SignalType;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  result: 'WIN' | 'LOSS' | 'OPEN';
  profitPips: number;
  durationPeriods: number;
}

export interface BacktestSummary {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  netPips: number;
  maxDrawdownPips: number;
  avgWinPips: number;
  avgLossPips: number;
  trades: HistoricalTrade[];
}
