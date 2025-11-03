// /api/chat.js

const PROD_ORIGINS = new Set([
  "https://shyamfertility.github.io",
  "https://ivftube.com",
]);

const DEV_ORIGINS = new Set([
  "http://localhost:8000",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:8000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
]);

function allowedOrigins() {
  return process.env.NODE_ENV === "production"
    ? PROD_ORIGINS
    : new Set([...PROD_ORIGINS, ...DEV_ORIGINS]);
}

function cors(origin) {
  const allowed = origin && allowedOrigins().has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowed || "http://localhost:3000",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "content-type, authorization, x-client-token",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const headers = cors(origin);
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Nice response if you open the URL in a browser
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, message: "Use POST /api/chat" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        // ✅ FIXED: proper template string, no weird spaces
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        // OpenRouter recommends these for rate-limiting/attribution
        "HTTP-Referer": process.env.PUBLIC_BASE_URL || "https://ivftube.com",
        "X-Title": "IVFTube OpenRouter Proxy",
      },
      body: JSON.stringify(req.body || {}),
    });

    const text = await upstream.text(); // pass through whatever OpenRouter returns
    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    return res.send(text);
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "proxy_failed", message: err?.message || "Unknown error" });
  }
}
