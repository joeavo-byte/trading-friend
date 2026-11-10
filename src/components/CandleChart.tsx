import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Eye, EyeOff, Layers, Maximize2, RotateCcw } from 'lucide-react';
import { Candle, MarketPair, Timeframe } from '../types/market';
import {
  calculateEMA,
  calculateBollingerBands,
  calculateSupertrend,
  calculateRSI,
  calculateMACD,
  calculateStochastic,
} from '../services/technicalAnalysis';
import { TIMEFRAMES } from '../services/marketData';

interface CandleChartProps {
  pair: MarketPair;
  candles: Candle[];
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  isDark: boolean;
}

type SubchartType = 'rsi' | 'macd' | 'stoch' | 'volume';

export const CandleChart: React.FC<CandleChartProps> = ({
  pair,
  candles,
  timeframe,
  setTimeframe,
  isDark,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Overlay toggles
  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(true);
  const [showEMA200, setShowEMA200] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showSupertrend, setShowSupertrend] = useState(true);

  // Subchart type
  const [subchart, setSubchart] = useState<SubchartType>('rsi');

  // Hover crosshair state
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [crosshairPos, setCrosshairPos] = useState<{ x: number; y: number } | null>(null);

  // Indicators precomputed
  const closes = useMemo(() => candles.map(c => c.close), [candles]);
  const ema20 = useMemo(() => calculateEMA(closes, 20), [closes]);
  const ema50 = useMemo(() => calculateEMA(closes, 50), [closes]);
  const ema200 = useMemo(() => calculateEMA(closes, Math.min(200, Math.floor(closes.length * 0.8))), [closes]);
  const bb = useMemo(() => calculateBollingerBands(closes, 20, 2), [closes]);
  const supertrend = useMemo(() => calculateSupertrend(candles, 10, 3), [candles]);
  const rsi = useMemo(() => calculateRSI(closes, 14), [closes]);
  const macd = useMemo(() => calculateMACD(closes), [closes]);
  const stoch = useMemo(() => calculateStochastic(candles), [candles]);

  // Main draw routine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = containerRef.current.clientWidth;
    const height = 440;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Layout partitions: Main chart (70%) and Subchart (26%), 4% gap
    const mainBottom = height * 0.68;
    const subTop = height * 0.72;
    const subHeight = height - subTop - 24; // 24px bottom time axis
    const rightMargin = 72; // price scale width
    const plotWidth = width - rightMargin;

    // Theme colors
    const colors = {
      bg: isDark ? '#090d16' : '#ffffff',
      grid: isDark ? 'rgba(51, 65, 85, 0.25)' : 'rgba(226, 232, 240, 0.8)',
      text: isDark ? '#94a3b8' : '#64748b',
      textActive: isDark ? '#f8fafc' : '#0f172a',
      bullCandle: isDark ? '#10b981' : '#059669',
      bearCandle: isDark ? '#f43f5e' : '#e11d48',
      wick: isDark ? '#cbd5e1' : '#475569',
      crosshair: isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(100, 116, 139, 0.45)',
      ema20: '#f59e0b',
      ema50: '#38bdf8',
      ema200: '#a855f7',
      bbFill: isDark ? 'rgba(56, 189, 248, 0.06)' : 'rgba(14, 165, 233, 0.08)',
      bbLine: '#0ea5e9',
      stBull: '#10b981',
      stBear: '#f43f5e',
    };

    // Calculate Min and Max for Main Chart
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    candles.forEach((c, idx) => {
      minPrice = Math.min(minPrice, c.low);
      maxPrice = Math.max(maxPrice, c.high);

      if (showEMA20 && !isNaN(ema20[idx])) {
        minPrice = Math.min(minPrice, ema20[idx]);
        maxPrice = Math.max(maxPrice, ema20[idx]);
      }
      if (showEMA50 && !isNaN(ema50[idx])) {
        minPrice = Math.min(minPrice, ema50[idx]);
        maxPrice = Math.max(maxPrice, ema50[idx]);
      }
      if (showEMA200 && !isNaN(ema200[idx])) {
        minPrice = Math.min(minPrice, ema200[idx]);
        maxPrice = Math.max(maxPrice, ema200[idx]);
      }
      if (showBollinger && !isNaN(bb.lower[idx])) {
        minPrice = Math.min(minPrice, bb.lower[idx]);
        maxPrice = Math.max(maxPrice, bb.upper[idx]);
      }
      if (showSupertrend && !isNaN(supertrend.values[idx])) {
        minPrice = Math.min(minPrice, supertrend.values[idx]);
        maxPrice = Math.max(maxPrice, supertrend.values[idx]);
      }
    });

    const pricePadding = (maxPrice - minPrice) * 0.08;
    minPrice -= pricePadding;
    maxPrice += pricePadding;
    const priceRange = maxPrice - minPrice || 1;

    const candleCount = candles.length;
    const candleWidth = Math.max(2, (plotWidth / candleCount) * 0.7);
    const candleStep = plotWidth / candleCount;

    const getX = (i: number) => i * candleStep + candleStep / 2;
    const getY = (priceVal: number) => mainBottom - ((priceVal - minPrice) / priceRange) * (mainBottom - 16);

    // 1. Draw Grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = colors.grid;

    // Horizontal price grid
    const priceTicks = 5;
    for (let i = 0; i <= priceTicks; i++) {
      const p = minPrice + (priceRange / priceTicks) * i;
      const y = getY(p);

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(plotWidth, y);
      ctx.stroke();

      // Price labels on right margin
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = colors.text;
      ctx.textAlign = 'left';
      ctx.fillText(p.toFixed(pair.decimals), plotWidth + 8, y + 3);
    }

    // Vertical time grid (every 10 candles)
    for (let i = 0; i < candleCount; i += 12) {
      const x = getX(i);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height - 24);
      ctx.stroke();

      const date = new Date(candles[i].timestamp);
      const timeStr =
        timeframe === '1D' || timeframe === '1W' || timeframe === '1M'
          ? `${date.getMonth() + 1}/${date.getDate()}`
          : `${date.getHours().toString().padStart(2, '0')}:00`;

      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = colors.text;
      ctx.textAlign = 'center';
      ctx.fillText(timeStr, x, height - 8);
    }

    // 2. Bollinger Bands Overlay
    if (showBollinger) {
      // Area Fill
      ctx.fillStyle = colors.bbFill;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < candleCount; i++) {
        if (!isNaN(bb.upper[i])) {
          const x = getX(i);
          const y = getY(bb.upper[i]);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      for (let i = candleCount - 1; i >= 0; i--) {
        if (!isNaN(bb.lower[i])) {
          ctx.lineTo(getX(i), getY(bb.lower[i]));
        }
      }
      ctx.closePath();
      ctx.fill();

      // Lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.bbLine;
      ctx.setLineDash([2, 2]);

      // Upper
      ctx.beginPath();
      for (let i = 0; i < candleCount; i++) {
        if (!isNaN(bb.upper[i])) {
          if (i === 0) ctx.moveTo(getX(i), getY(bb.upper[i]));
          else ctx.lineTo(getX(i), getY(bb.upper[i]));
        }
      }
      ctx.stroke();

      // Lower
      ctx.beginPath();
      for (let i = 0; i < candleCount; i++) {
        if (!isNaN(bb.lower[i])) {
          if (i === 0) ctx.moveTo(getX(i), getY(bb.lower[i]));
          else ctx.lineTo(getX(i), getY(bb.lower[i]));
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Supertrend Overlay
    if (showSupertrend) {
      ctx.lineWidth = 2;
      for (let i = 1; i < candleCount; i++) {
        if (!isNaN(supertrend.values[i]) && !isNaN(supertrend.values[i - 1])) {
          ctx.strokeStyle = supertrend.direction[i] === 'bullish' ? colors.stBull : colors.stBear;
          ctx.beginPath();
          ctx.moveTo(getX(i - 1), getY(supertrend.values[i - 1]));
          ctx.lineTo(getX(i), getY(supertrend.values[i]));
          ctx.stroke();
        }
      }
    }

    // 4. Moving Averages Overlays
    const drawLine = (data: number[], color: string, width = 1.5) => {
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < candleCount; i++) {
        if (!isNaN(data[i])) {
          const x = getX(i);
          const y = getY(data[i]);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    };

    if (showEMA20) drawLine(ema20, colors.ema20, 1.5);
    if (showEMA50) drawLine(ema50, colors.ema50, 1.5);
    if (showEMA200) drawLine(ema200, colors.ema200, 1.5);

    // 5. Candlesticks
    candles.forEach((c, i) => {
      const isBull = c.close >= c.open;
      const x = getX(i);
      const openY = getY(c.open);
      const closeY = getY(c.close);
      const highY = getY(c.high);
      const lowY = getY(c.low);

      const candleColor = isBull ? colors.bullCandle : colors.bearCandle;

      // Wick
      ctx.strokeStyle = candleColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      const topY = Math.min(openY, closeY);
      const bHeight = Math.max(1.5, Math.abs(closeY - openY));
      ctx.fillStyle = candleColor;
      ctx.fillRect(x - candleWidth / 2, topY, candleWidth, bHeight);
    });

    // 6. Current Price Line with Right Axis Tag
    const lastPrice = candles[candleCount - 1].close;
    const lastY = getY(lastPrice);

    ctx.strokeStyle = colors.bullCandle;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(0, lastY);
    ctx.lineTo(plotWidth, lastY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Live Badge
    ctx.fillStyle = colors.bullCandle;
    ctx.fillRect(plotWidth + 4, lastY - 9, 64, 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(lastPrice.toFixed(pair.decimals), plotWidth + 36, lastY + 3);

    // 7. Divider before Subchart
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, subTop - 4);
    ctx.lineTo(width, subTop - 4);
    ctx.stroke();

    // 8. Draw Subchart
    if (subchart === 'rsi') {
      // Overbought (70), Middle (50), Oversold (30)
      const getRsiY = (val: number) => subTop + subHeight - (val / 100) * subHeight;

      ctx.strokeStyle = colors.grid;
      ctx.setLineDash([2, 3]);
      [30, 50, 70].forEach(level => {
        const y = getRsiY(level);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(plotWidth, y);
        ctx.stroke();

        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillStyle = colors.text;
        ctx.textAlign = 'left';
        ctx.fillText(`${level}`, plotWidth + 8, y + 3);
      });
      ctx.setLineDash([]);

      // RSI curve
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < candleCount; i++) {
        if (!isNaN(rsi[i])) {
          const x = getX(i);
          const y = getRsiY(rsi[i]);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();

      // Current RSI label
      const currentRsi = rsi[candleCount - 1] || 50;
      ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = currentRsi > 70 ? colors.bearCandle : currentRsi < 30 ? colors.bullCandle : colors.text;
      ctx.textAlign = 'left';
      ctx.fillText(`RSI(14): ${currentRsi.toFixed(1)}`, 8, subTop + 12);
    } else if (subchart === 'macd') {
      const maxHist = Math.max(...macd.histogram.filter(v => !isNaN(v)).map(Math.abs), 0.0001);
      const midY = subTop + subHeight / 2;

      // Histogram Bars
      macd.histogram.forEach((hist, i) => {
        if (!isNaN(hist)) {
          const x = getX(i);
          const barH = (hist / maxHist) * (subHeight * 0.45);
          ctx.fillStyle = hist >= 0 ? colors.bullCandle : colors.bearCandle;
          if (hist >= 0) {
            ctx.fillRect(x - candleWidth / 2, midY - barH, candleWidth, barH);
          } else {
            ctx.fillRect(x - candleWidth / 2, midY, candleWidth, Math.abs(barH));
          }
        }
      });

      // Zero Line
      ctx.strokeStyle = colors.grid;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(plotWidth, midY);
      ctx.stroke();

      ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = colors.text;
      ctx.textAlign = 'left';
      ctx.fillText(`MACD (12, 26, 9) Hist: ${macd.histogram[candleCount - 1]?.toFixed(pair.decimals) || '0'}`, 8, subTop + 12);
    } else if (subchart === 'stoch') {
      const getStochY = (val: number) => subTop + subHeight - (val / 100) * subHeight;

      // 20 and 80 levels
      ctx.strokeStyle = colors.grid;
      ctx.setLineDash([2, 3]);
      [20, 80].forEach(level => {
        const y = getStochY(level);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(plotWidth, y);
        ctx.stroke();

        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillStyle = colors.text;
        ctx.textAlign = 'left';
        ctx.fillText(`${level}`, plotWidth + 8, y + 3);
      });
      ctx.setLineDash([]);

      // %K Line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let startedK = false;
      for (let i = 0; i < candleCount; i++) {
        if (!isNaN(stoch.k[i])) {
          const x = getX(i);
          const y = getStochY(stoch.k[i]);
          if (!startedK) {
            ctx.moveTo(x, y);
            startedK = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();

      // %D Line
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      let startedD = false;
      for (let i = 0; i < candleCount; i++) {
        if (!isNaN(stoch.d[i])) {
          const x = getX(i);
          const y = getStochY(stoch.d[i]);
          if (!startedD) {
            ctx.moveTo(x, y);
            startedD = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();

      ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = colors.text;
      ctx.textAlign = 'left';
      ctx.fillText(`Stoch %K: ${stoch.k[candleCount - 1]?.toFixed(0) || '0'}  %D: ${stoch.d[candleCount - 1]?.toFixed(0) || '0'}`, 8, subTop + 12);
    } else if (subchart === 'volume') {
      const maxVol = Math.max(...candles.map(c => c.volume), 1);
      candles.forEach((c, i) => {
        const x = getX(i);
        const vHeight = (c.volume / maxVol) * subHeight;
        ctx.fillStyle = c.close >= c.open ? colors.bullCandle : colors.bearCandle;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(x - candleWidth / 2, subTop + subHeight - vHeight, candleWidth, vHeight);
        ctx.globalAlpha = 1.0;
      });

      ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = colors.text;
      ctx.textAlign = 'left';
      ctx.fillText(`Volume: ${candles[candleCount - 1].volume.toLocaleString()}`, 8, subTop + 12);
    }

    // 9. Draw Crosshair on Hover
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < candleCount && crosshairPos) {
      const hoverX = getX(hoverIndex);
      const hoverY = Math.min(mainBottom, crosshairPos.y);

      ctx.strokeStyle = colors.crosshair;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, height - 24);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, hoverY);
      ctx.lineTo(plotWidth, hoverY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price at hover cursor
      const hoveredPrice = minPrice + ((mainBottom - hoverY) / (mainBottom - 16)) * priceRange;
      ctx.fillStyle = isDark ? '#1e293b' : '#334155';
      ctx.fillRect(plotWidth + 4, hoverY - 9, 64, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(hoveredPrice.toFixed(pair.decimals), plotWidth + 36, hoverY + 3);
    }
  }, [
    candles,
    timeframe,
    isDark,
    showEMA20,
    showEMA50,
    showEMA200,
    showBollinger,
    showSupertrend,
    subchart,
    hoverIndex,
    crosshairPos,
    pair,
    ema20,
    ema50,
    ema200,
    bb,
    supertrend,
    rsi,
    macd,
    stoch,
  ]);

  // Handle Mouse Movement on Canvas
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const plotWidth = rect.width - 72;
    const candleStep = plotWidth / candles.length;
    const idx = Math.floor(x / candleStep);

    if (idx >= 0 && idx < candles.length) {
      setHoverIndex(idx);
      setCrosshairPos({ x, y });
    } else {
      setHoverIndex(null);
      setCrosshairPos(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    setCrosshairPos(null);
  };

  const activeCandle = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < candles.length
    ? candles[hoverIndex]
    : candles[candles.length - 1];

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 transition-colors">
      {/* Top Controls: Timeframe selector (starting strictly from 1H) + Overlay Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        {/* Timeframe Buttons starting strictly from 1H */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                timeframe === tf.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={tf.description}
            >
              {tf.id}
            </button>
          ))}
        </div>

        {/* Technical Overlays Toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setShowEMA20(prev => !prev)}
            className={`px-2 py-0.5 text-[11px] font-mono font-medium rounded border transition-colors ${
              showEMA20
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700'
            }`}
          >
            EMA 20
          </button>
          <button
            onClick={() => setShowEMA50(prev => !prev)}
            className={`px-2 py-0.5 text-[11px] font-mono font-medium rounded border transition-colors ${
              showEMA50
                ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700'
            }`}
          >
            EMA 50
          </button>
          <button
            onClick={() => setShowEMA200(prev => !prev)}
            className={`px-2 py-0.5 text-[11px] font-mono font-medium rounded border transition-colors ${
              showEMA200
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700'
            }`}
          >
            EMA 200
          </button>
          <button
            onClick={() => setShowBollinger(prev => !prev)}
            className={`px-2 py-0.5 text-[11px] font-mono font-medium rounded border transition-colors ${
              showBollinger
                ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700'
            }`}
          >
            Bollinger (20,2)
          </button>
          <button
            onClick={() => setShowSupertrend(prev => !prev)}
            className={`px-2 py-0.5 text-[11px] font-mono font-medium rounded border transition-colors ${
              showSupertrend
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700'
            }`}
          >
            Supertrend
          </button>

          {/* Subchart Dropdown / Tabs */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
            {(['rsi', 'macd', 'stoch', 'volume'] as SubchartType[]).map(type => (
              <button
                key={type}
                onClick={() => setSubchart(type)}
                className={`px-2 py-0.5 text-[11px] font-semibold uppercase rounded transition-colors ${
                  subchart === type
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time OHLCV Inspection Strip */}
      {activeCandle && (
        <div className="flex flex-wrap items-center gap-4 py-2 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
          <span className="text-slate-400 dark:text-slate-500">
            {new Date(activeCandle.timestamp).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span>
            <span className="text-slate-400">O:</span> {activeCandle.open.toFixed(pair.decimals)}
          </span>
          <span>
            <span className="text-slate-400">H:</span> {activeCandle.high.toFixed(pair.decimals)}
          </span>
          <span>
            <span className="text-slate-400">L:</span> {activeCandle.low.toFixed(pair.decimals)}
          </span>
          <span className={activeCandle.close >= activeCandle.open ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
            <span className="text-slate-400">C:</span> {activeCandle.close.toFixed(pair.decimals)}
          </span>
          <span>
            <span className="text-slate-400">Vol:</span> {activeCandle.volume.toLocaleString()}
          </span>
        </div>
      )}

      {/* Canvas Chart Viewport */}
      <div ref={containerRef} className="relative w-full h-[440px] overflow-hidden rounded-lg bg-slate-50/50 dark:bg-slate-950/60">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-crosshair block w-full h-full"
        />
      </div>
    </div>
  );
};
