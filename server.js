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

// ── Proxy endpoint ────────────────────────────────────────────────────────────
app.get("/c2c-orders", async (req, res) => {
  try {
    // Forward all query params (already signed by Apps Script) to Binance
    const params      = new URLSearchParams(req.query);
    const binanceUrl  = `https://api.binance.com/sapi/v1/c2c/orderMatch/listUserOrderHistory?${params}`;
    const apiKey      = req.headers["x-mbx-apikey"];

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

// Health check
app.get("/", (req, res) => res.send("Binance proxy running ✅"));

app.listen(PORT, () => console.log(`Proxy listening on port ${PORT}`));
