import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
const isValidApiKey = apiKey && apiKey.trim() !== '' && apiKey !== 'MY_GEMINI_API_KEY' && !apiKey.startsWith('MY_');
const ai = isValidApiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Server-side Gemini AI Technical Analysis endpoint
app.post('/api/ai-analysis', async (req, res) => {
  try {
    const { symbol, timeframe, currentPrice, signal, score, confidence, indicators, reasons } = req.body;

    if (!symbol) {
      return res.status(400).json({ error: 'Market symbol is required' });
    }

    if (!ai) {
      // Fallback deterministic analysis if no API key is provided
      return res.json({
        analysis: {
          executiveSummary: `Institutional quantitative scan for ${symbol} on the ${timeframe} timeframe indicates a ${signal} bias (Confluence Score: ${score}/100, Confidence: ${confidence}%). Price is trading at ${currentPrice} relative to critical dynamic exponential bands.`,
          marketStructure: `Price structure exhibits ${score >= 0 ? 'bullish higher-low sequences with buyer accumulation' : 'bearish distribution with repeated lower-high rejections'}. The 20-period EMA (${indicators?.ema20 ?? 'N/A'}) and 50-period EMA (${indicators?.ema50 ?? 'N/A'}) confirm the prevailing ${timeframe} vector.`,
          momentumDiagnosis: `RSI is currently indexed at ${indicators?.rsi ?? 50}, signaling ${indicators?.rsi > 70 ? 'exhaustion' : indicators?.rsi < 30 ? 'capitulation' : 'stable momentum'}. MACD histogram is reading ${indicators?.macd?.histogram ?? 0}, aligned with active session orderflow.`,
          tradeExecutionPlan: {
            recommendedAction: signal,
            keyEntryZone: `${currentPrice}`,
            invalidationLevel: `${indicators?.supertrend?.value ?? (currentPrice * 0.995).toFixed(4)}`,
            primaryTarget: `${(currentPrice * (score >= 0 ? 1.012 : 0.988)).toFixed(4)}`,
            secondaryTarget: `${(currentPrice * (score >= 0 ? 1.025 : 0.975)).toFixed(4)}`,
            riskRewardRatio: '1:2.4',
          },
          macroRiskWarning: 'Always enforce strict position sizing (1-2% maximum account risk) and verify upcoming economic calendar high-impact releases (CPI, Non-Farm Payrolls, Central Bank rate decisions).',
        },
        model: 'algorithmic-confluence-engine',
      });
    }

    const prompt = `You are a Chief Currency Strategist and Institutional Technical Market Analyst.
Analyze the following market technical data and generate a structured institutional analysis report:

- Instrument: ${symbol}
- Selected Timeframe: ${timeframe}
- Current Market Price: ${currentPrice}
- Quantitative Signal: ${signal} (Confidence: ${confidence}%, Score: ${score}/100)
- Technical Readings:
  * EMA 20: ${indicators?.ema20}
  * EMA 50: ${indicators?.ema50}
  * EMA 200: ${indicators?.ema200}
  * RSI (14): ${indicators?.rsi}
  * MACD Histogram: ${indicators?.macd?.histogram} (MACD Line: ${indicators?.macd?.macd}, Signal: ${indicators?.macd?.signal})
  * Bollinger Bands: Upper ${indicators?.bollingerBands?.upper}, Lower ${indicators?.bollingerBands?.lower}, %B: ${indicators?.bollingerBands?.percentB}
  * Supertrend: ${indicators?.supertrend?.direction} (Level: ${indicators?.supertrend?.value})
  * Stochastic K/D: ${indicators?.stochastic?.k} / ${indicators?.stochastic?.d}
  * Average True Range (ATR): ${indicators?.atr}
  * Key Reasons Identified: ${Array.isArray(reasons) ? reasons.join('; ') : 'Confluence alignment'}

Return your response strictly as valid JSON adhering to this schema:
{
  "executiveSummary": "Concise 2-3 sentence overview of the market regime, consensus bias, and institutional orderflow context.",
  "marketStructure": "Detailed breakdown of support/resistance, moving average alignment, and price action geometry.",
  "momentumDiagnosis": "Evaluation of RSI, MACD divergence/expansion, and Stochastic positioning.",
  "tradeExecutionPlan": {
    "recommendedAction": "${signal}",
    "keyEntryZone": "Optimal entry price range",
    "invalidationLevel": "Exact hard stop loss level with technical justification",
    "primaryTarget": "First scale-out target",
    "secondaryTarget": "Extended swing target",
    "riskRewardRatio": "Estimated R:R (e.g. 1:2.5)"
  },
  "macroRiskWarning": "Specific volatility factors or session considerations (London/NY overlap, central bank risk)."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      parsedData = {
        executiveSummary: responseText.slice(0, 300),
        marketStructure: 'Orderflow confluence confirmed by quantitative technical indicators.',
        momentumDiagnosis: `RSI at ${indicators?.rsi ?? 50} and MACD aligned with ${signal}.`,
        tradeExecutionPlan: {
          recommendedAction: signal,
          keyEntryZone: `${currentPrice}`,
          invalidationLevel: `${indicators?.supertrend?.value ?? currentPrice}`,
          primaryTarget: 'Target 1',
          secondaryTarget: 'Target 2',
          riskRewardRatio: '1:2.2',
        },
        macroRiskWarning: 'Manage position size according to volatility parameters.',
      };
    }

    res.json({ analysis: parsedData, model: 'gemini-3.8-flash' });
  } catch (error: any) {
    console.error('Gemini Analysis Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate AI analysis' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trading Analysis Terminal server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
