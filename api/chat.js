// api/chat.js
const PROD_ORIGINS = new Set([
  "https://shyamfertility.github.io",
  "https://ivftube.com"
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
  return process.env.NODE_ENV === "production" ? PROD_ORIGINS : new Set([...PROD_ORIGINS, ...DEV_ORIGINS]);
}

function cors(origin) {
  const allowed = origin && allowedOrigins().has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowed || "http://localhost:3000",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, x-client-token",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}


export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const headers = cors(origin);

  if (req.method === "OPTIONS") {
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": ⁠ Bearer ${process.env.OPENROUTER_API_KEY} ⁠,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://ivftube.com",
      "X-Title": "Your App Name"
    },
    body: JSON.stringify(req.body || {})
  });

  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  res.status(upstream.status);
  res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");

  const data = await upstream.json().catch(() => ({}));
  return res.json(data);
}
