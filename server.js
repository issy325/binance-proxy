/**
 * Binance C2C Proxy Server
 * Forwards signed C2C order history requests to Binance.
 * Deploy this on Render.com (free tier).
 */

const express = require("express");
const app     = express();
const PORT    = process.env.PORT || 3000;

// ── Security ──────────────────────────────────────────────────────────────────
// A secret token so only YOUR Apps Script can use this proxy.
// Set this as an environment variable on Render called PROXY_SECRET.
const PROXY_SECRET = process.env.PROXY_SECRET;

app.use((req, res, next) => {
  const token = req.headers["x-proxy-secret"];
  if (!PROXY_SECRET || token !== PROXY_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// ── C2C order history endpoint ────────────────────────────────────────────────
app.get("/c2c-orders", async (req, res) => {
  try {
    const params     = new URLSearchParams(req.query);
    const binanceUrl = `https://api.binance.com/sapi/v1/c2c/orderMatch/listUserOrderHistory?${params}`;
    const apiKey     = req.headers["x-mbx-apikey"];

    const response = await fetch(binanceUrl, {
      method:  "GET",
      headers: { "X-MBX-APIKEY": apiKey },
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Public ticker endpoint (used by spread checker) ───────────────────────────
// No Binance API key needed — just forwards the symbol and returns bid/ask.
app.get("/ticker", async (req, res) => {
  try {
    const symbol     = req.query.symbol || "USDTZAR";
    const binanceUrl = `https://api.binance.com/api/v3/ticker/bookTicker?symbol=${symbol}`;

    const response = await fetch(binanceUrl);
    const data     = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.send("Binance proxy running ✅"));

app.listen(PORT, () => console.log(`Proxy listening on port ${PORT}`));
