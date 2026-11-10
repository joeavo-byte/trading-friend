import { Candle, IndicatorValues, TradingSignal, SignalType, Timeframe, IndicatorSignalDetail, MarketPair } from '../types/market';

/**
 * Calculates Simple Moving Average
 */
export function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

/**
 * Calculates Exponential Moving Average
 */
export function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  let initialSMA = 0;
  for (let i = 0; i < period; i++) {
    initialSMA += data[i] || 0;
  }
  initialSMA /= period;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(NaN);
    } else if (i === period - 1) {
      ema.push(initialSMA);
    } else {
      const currentEMA = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
      ema.push(currentEMA);
    }
  }
  return ema;
}

/**
 * Calculates Relative Strength Index (RSI 14)
 */
export function calculateRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = [];
  if (closes.length < period + 1) return Array(closes.length).fill(50);

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < period; i++) {
    rsi.push(NaN);
  }

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi.push(100 - (100 / (1 + rs)));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }

  return rsi;
}

/**
 * Calculates MACD (12, 26, 9)
 */
export function calculateMACD(closes: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);
  
  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macdLine.push(NaN);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }

  // Filter out NaNs for signal calculation
  const validMacdValues = macdLine.filter(val => !isNaN(val));
  const validSignalLine = calculateEMA(validMacdValues, signalPeriod);

  const signalLine: number[] = [];
  let validIndex = 0;
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(macdLine[i])) {
      signalLine.push(NaN);
    } else {
      signalLine.push(validSignalLine[validIndex] ?? NaN);
      validIndex++;
    }
  }

  const histogram: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(macdLine[i]) || isNaN(signalLine[i])) {
      histogram.push(NaN);
    } else {
      histogram.push(macdLine[i] - signalLine[i]);
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Calculates Bollinger Bands (20, 2)
 */
export function calculateBollingerBands(closes: number[], period = 20, multiplier = 2) {
  const sma = calculateSMA(closes, period);
  const upper: number[] = [];
  const lower: number[] = [];
  const bandwidth: number[] = [];
  const percentB: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
      bandwidth.push(NaN);
      percentB.push(NaN);
    } else {
      const slice = closes.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);

      const up = mean + multiplier * stdDev;
      const low = mean - multiplier * stdDev;
      upper.push(up);
      lower.push(low);
      bandwidth.push(mean === 0 ? 0 : ((up - low) / mean) * 100);
      percentB.push(up === low ? 0.5 : (closes[i] - low) / (up - low));
    }
  }

  return { upper, middle: sma, lower, bandwidth, percentB };
}

/**
 * Calculates Average True Range (ATR 14)
 */
export function calculateATR(candles: Candle[], period = 14): number[] {
  const tr: number[] = [candles[0].high - candles[0].low];

  for (let i = 1; i < candles.length; i++) {
    const hl = candles[i].high - candles[i].low;
    const hpc = Math.abs(candles[i].high - candles[i - 1].close);
    const lpc = Math.abs(candles[i].low - candles[i - 1].close);
    tr.push(Math.max(hl, hpc, lpc));
  }

  const atr: number[] = [];
  let initialATR = 0;
  for (let i = 0; i < period; i++) {
    initialATR += tr[i] || 0;
  }
  initialATR /= period;

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      atr.push(NaN);
    } else if (i === period - 1) {
      atr.push(initialATR);
    } else {
      const val = (atr[i - 1] * (period - 1) + tr[i]) / period;
      atr.push(val);
    }
  }

  return atr;
}

/**
 * Calculates Supertrend Indicator (period = 10, multiplier = 3)
 */
export function calculateSupertrend(candles: Candle[], period = 10, multiplier = 3) {
  const atr = calculateATR(candles, period);
  const supertrend: number[] = [];
  const direction: ('bullish' | 'bearish')[] = [];

  let upperBand = 0;
  let lowerBand = 0;
  let inUptrend = true;

  for (let i = 0; i < candles.length; i++) {
    if (isNaN(atr[i])) {
      supertrend.push(NaN);
      direction.push('bullish');
      continue;
    }

    const hl2 = (candles[i].high + candles[i].low) / 2;
    const basicUpper = hl2 + multiplier * atr[i];
    const basicLower = hl2 - multiplier * atr[i];

    if (i === 0 || isNaN(atr[i - 1])) {
      upperBand = basicUpper;
      lowerBand = basicLower;
    } else {
      if (basicUpper < upperBand || candles[i - 1].close > upperBand) {
        upperBand = basicUpper;
      }
      if (basicLower > lowerBand || candles[i - 1].close < lowerBand) {
        lowerBand = basicLower;
      }
    }

    if (i > 0 && !isNaN(supertrend[i - 1])) {
      if (inUptrend && candles[i].close < lowerBand) {
        inUptrend = false;
      } else if (!inUptrend && candles[i].close > upperBand) {
        inUptrend = true;
      }
    }

    if (inUptrend) {
      supertrend.push(lowerBand);
      direction.push('bullish');
    } else {
      supertrend.push(upperBand);
      direction.push('bearish');
    }
  }

  return { values: supertrend, direction };
}

/**
 * Calculates Stochastic Oscillator (%K, %D)
 */
export function calculateStochastic(candles: Candle[], kPeriod = 14, dPeriod = 3) {
  const rawK: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < kPeriod - 1) {
      rawK.push(50);
    } else {
      const slice = candles.slice(i - kPeriod + 1, i + 1);
      const lowestLow = Math.min(...slice.map(c => c.low));
      const highestHigh = Math.max(...slice.map(c => c.high));
      if (highestHigh === lowestLow) {
        rawK.push(50);
      } else {
        rawK.push(((candles[i].close - lowestLow) / (highestHigh - lowestLow)) * 100);
      }
    }
  }

  const kValues = calculateSMA(rawK, 3);
  const dValues = calculateSMA(kValues.map(v => isNaN(v) ? 50 : v), dPeriod);

  return { k: kValues, d: dValues };
}

/**
 * Computes Floor and Fibonacci Pivot Points from last completed candle
 */
export function calculatePivotPoints(lastCandle: Candle) {
  const { high, low, close } = lastCandle;
  const pivot = (high + low + close) / 3;
  const range = high - low;

  const r1 = 2 * pivot - low;
  const s1 = 2 * pivot - high;
  const r2 = pivot + range;
  const s2 = pivot - range;
  const r3 = high + 2 * (pivot - low);
  const s3 = low - 2 * (high - pivot);

  return { pivot, r1, r2, r3, s1, s2, s3 };
}

/**
 * Extracts latest indicator snapshot for a given series
 */
export function getLatestIndicators(candles: Candle[]): IndicatorValues {
  const closes = candles.map(c => c.close);
  const ema20Series = calculateEMA(closes, 20);
  const ema50Series = calculateEMA(closes, 50);
  const ema200Series = calculateEMA(closes, Math.min(200, Math.floor(closes.length * 0.8)));
  const rsiSeries = calculateRSI(closes, 14);
  const macdSeries = calculateMACD(closes);
  const bbSeries = calculateBollingerBands(closes, 20, 2);
  const stSeries = calculateSupertrend(candles, 10, 3);
  const stochSeries = calculateStochastic(candles, 14, 3);
  const atrSeries = calculateATR(candles, 14);

  const lastIndex = candles.length - 1;
  const prevCandle = candles[Math.max(0, lastIndex - 1)];

  return {
    ema20: ema20Series[lastIndex] || closes[lastIndex],
    ema50: ema50Series[lastIndex] || closes[lastIndex],
    ema200: ema200Series[lastIndex] || closes[lastIndex],
    rsi: rsiSeries[lastIndex] || 50,
    macd: {
      macd: macdSeries.macdLine[lastIndex] || 0,
      signal: macdSeries.signalLine[lastIndex] || 0,
      histogram: macdSeries.histogram[lastIndex] || 0,
    },
    bollingerBands: {
      upper: bbSeries.upper[lastIndex] || closes[lastIndex],
      middle: bbSeries.middle[lastIndex] || closes[lastIndex],
      lower: bbSeries.lower[lastIndex] || closes[lastIndex],
      bandwidth: bbSeries.bandwidth[lastIndex] || 0,
      percentB: bbSeries.percentB[lastIndex] || 0.5,
    },
    supertrend: {
      value: stSeries.values[lastIndex] || closes[lastIndex],
      direction: stSeries.direction[lastIndex] || 'bullish',
    },
    stochastic: {
      k: stochSeries.k[lastIndex] || 50,
      d: stochSeries.d[lastIndex] || 50,
    },
    atr: atrSeries[lastIndex] || (candles[lastIndex].high - candles[lastIndex].low),
    pivotPoints: calculatePivotPoints(prevCandle),
  };
}

/**
 * Evaluates full indicator confluence to generate institutional Buy/Sell signal
 */
export function generateTradingSignal(
  pair: MarketPair,
  candles: Candle[],
  timeframe: Timeframe
): TradingSignal {
  const currentPrice = pair.currentPrice;
  const indicators = getLatestIndicators(candles);
  const details: IndicatorSignalDetail[] = [];
  const reasons: string[] = [];

  let score = 0; // -100 to +100
  let bullishCount = 0;
  let bearishCount = 0;
  let neutralCount = 0;

  // 1. Moving Averages (EMA 20, 50, 200) - Weight: 25 pts
  let maScore = 0;
  let maDesc = '';
  if (currentPrice > indicators.ema20 && indicators.ema20 > indicators.ema50) {
    maScore += 15;
    if (indicators.ema50 > indicators.ema200) {
      maScore += 10;
      maDesc = 'Full Bullish Alignment: Price > EMA20 > EMA50 > EMA200';
    } else {
      maDesc = 'Short-term Bullish: Price > EMA20 > EMA50';
    }
    details.push({
      name: 'Moving Averages',
      value: `EMA20: ${indicators.ema20.toFixed(pair.decimals)}`,
      signal: 'BUY',
      interpretation: maDesc,
    });
    reasons.push(maDesc);
    bullishCount++;
  } else if (currentPrice < indicators.ema20 && indicators.ema20 < indicators.ema50) {
    maScore -= 15;
    if (indicators.ema50 < indicators.ema200) {
      maScore -= 10;
      maDesc = 'Full Bearish Alignment: Price < EMA20 < EMA50 < EMA200';
    } else {
      maDesc = 'Short-term Bearish: Price < EMA20 < EMA50';
    }
    details.push({
      name: 'Moving Averages',
      value: `EMA20: ${indicators.ema20.toFixed(pair.decimals)}`,
      signal: 'SELL',
      interpretation: maDesc,
    });
    reasons.push(maDesc);
    bearishCount++;
  } else {
    maDesc = 'Consolidating near EMA 20/50 bands';
    details.push({
      name: 'Moving Averages',
      value: `EMA50: ${indicators.ema50.toFixed(pair.decimals)}`,
      signal: 'NEUTRAL',
      interpretation: maDesc,
    });
    neutralCount++;
  }
  score += maScore;

  // 2. RSI (14) - Weight: 20 pts
  const rsi = indicators.rsi;
  let rsiScore = 0;
  let rsiSignal: SignalType = 'NEUTRAL';
  let rsiDesc = '';

  if (rsi < 30) {
    rsiScore = 18;
    rsiSignal = 'STRONG_BUY';
    rsiDesc = `Oversold condition (${rsi.toFixed(1)}). Potential bullish bounce.`;
    bullishCount++;
    reasons.push(`RSI severely oversold (${rsi.toFixed(1)} < 30)`);
  } else if (rsi > 70) {
    rsiScore = -18;
    rsiSignal = 'STRONG_SELL';
    rsiDesc = `Overbought condition (${rsi.toFixed(1)}). Potential bearish exhaustion.`;
    bearishCount++;
    reasons.push(`RSI heavily overbought (${rsi.toFixed(1)} > 70)`);
  } else if (rsi >= 52 && rsi <= 68) {
    rsiScore = 12;
    rsiSignal = 'BUY';
    rsiDesc = `Bullish momentum (${rsi.toFixed(1)}) maintaining upward trajectory`;
    bullishCount++;
    reasons.push(`RSI bullish momentum at ${rsi.toFixed(1)}`);
  } else if (rsi >= 32 && rsi <= 48) {
    rsiScore = -12;
    rsiSignal = 'SELL';
    rsiDesc = `Bearish momentum (${rsi.toFixed(1)}) under selling pressure`;
    bearishCount++;
    reasons.push(`RSI bearish momentum at ${rsi.toFixed(1)}`);
  } else {
    rsiDesc = `Neutral momentum (${rsi.toFixed(1)}) in equilibrium`;
    neutralCount++;
  }
  score += rsiScore;
  details.push({
    name: 'RSI (14)',
    value: rsi.toFixed(1),
    signal: rsiSignal,
    interpretation: rsiDesc,
  });

  // 3. MACD (12, 26, 9) - Weight: 20 pts
  const { macd, signal: macdSig, histogram } = indicators.macd;
  let macdScore = 0;
  let macdSignalType: SignalType = 'NEUTRAL';
  let macdDesc = '';

  if (macd > macdSig && histogram > 0) {
    macdScore = histogram > (indicators.atr * 0.05) ? 20 : 12;
    macdSignalType = histogram > (indicators.atr * 0.05) ? 'STRONG_BUY' : 'BUY';
    macdDesc = `Bullish MACD crossover, positive histogram expansion (${histogram.toFixed(pair.decimals)})`;
    bullishCount++;
    reasons.push('MACD Line above Signal with positive momentum bar');
  } else if (macd < macdSig && histogram < 0) {
    macdScore = Math.abs(histogram) > (indicators.atr * 0.05) ? -20 : -12;
    macdSignalType = Math.abs(histogram) > (indicators.atr * 0.05) ? 'STRONG_SELL' : 'SELL';
    macdDesc = `Bearish MACD crossover, negative histogram expansion (${histogram.toFixed(pair.decimals)})`;
    bearishCount++;
    reasons.push('MACD Line below Signal with negative momentum bar');
  } else {
    macdDesc = 'MACD flat with signal convergence';
    neutralCount++;
  }
  score += macdScore;
  details.push({
    name: 'MACD (12,26,9)',
    value: `Hist: ${histogram > 0 ? '+' : ''}${histogram.toFixed(pair.decimals)}`,
    signal: macdSignalType,
    interpretation: macdDesc,
  });

  // 4. Supertrend (10, 3) - Weight: 15 pts
  let stScore = 0;
  let stSignal: SignalType = 'NEUTRAL';
  let stDesc = '';
  if (indicators.supertrend.direction === 'bullish') {
    stScore = 15;
    stSignal = 'BUY';
    stDesc = `Bullish trend support at ${indicators.supertrend.value.toFixed(pair.decimals)}`;
    bullishCount++;
    reasons.push('Supertrend is Bullish Green');
  } else {
    stScore = -15;
    stSignal = 'SELL';
    stDesc = `Bearish trend resistance at ${indicators.supertrend.value.toFixed(pair.decimals)}`;
    bearishCount++;
    reasons.push('Supertrend is Bearish Red');
  }
  score += stScore;
  details.push({
    name: 'Supertrend (10,3)',
    value: indicators.supertrend.value.toFixed(pair.decimals),
    signal: stSignal,
    interpretation: stDesc,
  });

  // 5. Bollinger Bands (20, 2) - Weight: 10 pts
  const { upper, lower, percentB } = indicators.bollingerBands;
  let bbScore = 0;
  let bbSignal: SignalType = 'NEUTRAL';
  let bbDesc = '';

  if (percentB <= 0.1) {
    bbScore = 10;
    bbSignal = 'BUY';
    bbDesc = `Price testing Lower Band (${lower.toFixed(pair.decimals)}). Mean-reversion candidate.`;
    bullishCount++;
    reasons.push('Bollinger Lower Band support reached');
  } else if (percentB >= 0.9) {
    bbScore = -10;
    bbSignal = 'SELL';
    bbDesc = `Price testing Upper Band (${upper.toFixed(pair.decimals)}). Mean-reversion candidate.`;
    bearishCount++;
    reasons.push('Bollinger Upper Band resistance reached');
  } else if (percentB > 0.5) {
    bbScore = 5;
    bbSignal = 'BUY';
    bbDesc = 'Trading in upper half of Bollinger channel';
    bullishCount++;
  } else {
    bbScore = -5;
    bbSignal = 'SELL';
    bbDesc = 'Trading in lower half of Bollinger channel';
    bearishCount++;
  }
  score += bbScore;
  details.push({
    name: 'Bollinger Bands',
    value: `%B: ${(percentB * 100).toFixed(0)}%`,
    signal: bbSignal,
    interpretation: bbDesc,
  });

  // 6. Stochastic (14, 3, 3) - Weight: 10 pts
  const { k, d } = indicators.stochastic;
  let stochScore = 0;
  let stochSignal: SignalType = 'NEUTRAL';
  let stochDesc = '';

  if (k < 20 && k > d) {
    stochScore = 10;
    stochSignal = 'STRONG_BUY';
    stochDesc = `Bullish crossover in oversold zone (K:${k.toFixed(0)} > D:${d.toFixed(0)})`;
    bullishCount++;
    reasons.push('Stochastic bullish cross in oversold territory');
  } else if (k > 80 && k < d) {
    stochScore = -10;
    stochSignal = 'STRONG_SELL';
    stochDesc = `Bearish crossover in overbought zone (K:${k.toFixed(0)} < D:${d.toFixed(0)})`;
    bearishCount++;
    reasons.push('Stochastic bearish cross in overbought territory');
  } else if (k > d) {
    stochScore = 4;
    stochSignal = 'BUY';
    stochDesc = `K above D (${k.toFixed(0)} / ${d.toFixed(0)})`;
    bullishCount++;
  } else {
    stochScore = -4;
    stochSignal = 'SELL';
    stochDesc = `K below D (${k.toFixed(0)} / ${d.toFixed(0)})`;
    bearishCount++;
  }
  score += stochScore;
  details.push({
    name: 'Stochastic Oscillator',
    value: `${k.toFixed(0)} / ${d.toFixed(0)}`,
    signal: stochSignal,
    interpretation: stochDesc,
  });

  // Bound score between -100 and +100
  score = Math.max(-100, Math.min(100, Math.round(score)));

  // Final Consensus Signal Classification
  let finalSignal: SignalType = 'NEUTRAL';
  let confidence = Math.abs(score);

  if (score >= 45) {
    finalSignal = score >= 70 ? 'STRONG_BUY' : 'BUY';
  } else if (score <= -45) {
    finalSignal = score <= -70 ? 'STRONG_SELL' : 'SELL';
  } else {
    finalSignal = 'NEUTRAL';
    confidence = Math.max(20, 100 - Math.abs(score) * 2);
  }

  // Calculate dynamic Entry, Stop Loss, and Take Profit levels based on ATR
  const atr = indicators.atr || (currentPrice * 0.005);
  const pipFactor = pair.pipFactor;

  let entryPrice = currentPrice;
  let stopLoss = 0;
  let takeProfit1 = 0;
  let takeProfit2 = 0;
  let takeProfit3 = 0;
  let riskRewardRatio = 2.0;

  if (finalSignal === 'BUY' || finalSignal === 'STRONG_BUY') {
    entryPrice = currentPrice;
    stopLoss = currentPrice - 1.5 * atr;
    takeProfit1 = currentPrice + 1.8 * atr;
    takeProfit2 = currentPrice + 3.2 * atr;
    takeProfit3 = currentPrice + 5.0 * atr;
    riskRewardRatio = Number(((takeProfit1 - entryPrice) / (entryPrice - stopLoss)).toFixed(2));
  } else if (finalSignal === 'SELL' || finalSignal === 'STRONG_SELL') {
    entryPrice = currentPrice;
    stopLoss = currentPrice + 1.5 * atr;
    takeProfit1 = currentPrice - 1.8 * atr;
    takeProfit2 = currentPrice - 3.2 * atr;
    takeProfit3 = currentPrice - 5.0 * atr;
    riskRewardRatio = Number(((entryPrice - takeProfit1) / (stopLoss - entryPrice)).toFixed(2));
  } else {
    // Neutral fallback
    entryPrice = currentPrice;
    stopLoss = currentPrice - 1.5 * atr;
    takeProfit1 = currentPrice + 1.5 * atr;
    takeProfit2 = currentPrice + 3.0 * atr;
    takeProfit3 = currentPrice + 4.5 * atr;
    riskRewardRatio = 1.0;
  }

  const stopLossPips = Math.round(Math.abs(entryPrice - stopLoss) / pipFactor);
  const takeProfit1Pips = Math.round(Math.abs(takeProfit1 - entryPrice) / pipFactor);

  return {
    symbol: pair.symbol,
    timeframe,
    signal: finalSignal,
    confidence,
    score,
    timestamp: Date.now(),
    currentPrice,
    entryPrice,
    stopLoss,
    takeProfit1,
    takeProfit2,
    takeProfit3,
    riskRewardRatio,
    stopLossPips,
    takeProfit1Pips,
    bullishIndicatorsCount: bullishCount,
    bearishIndicatorsCount: bearishCount,
    neutralIndicatorsCount: neutralCount,
    reasons: reasons.slice(0, 4),
    indicatorDetails: details,
  };
}
