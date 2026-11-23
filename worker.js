
const ALLOWED_ORIGIN = "https://fchgj.github.io";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin"
};

const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const PAID_SERVICES = [
  "icloud_fmi",
  "carrier_check",
  "blacklist_gsma",
  "full_pro"
];

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS
    }
  });
}

function randomCode(length = 5) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, b =>
    CAPTCHA_CHARS[b % CAPTCHA_CHARS.length]
  ).join("");
}

function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeBase64url(value) {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded = normalized +
    "=".repeat((4 - normalized.length % 4) % 4);

  const binary = atob(padded);

  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

async function sha256(value) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );

  return base64url(new Uint8Array(digest));
}

async function signPayload(payload, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  return base64url(new Uint8Array(signature));
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  if (a.length !== b.length) return false;

  let difference = 0;

  for (let i = 0; i < a.length; i++) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return difference === 0;
}

function createCaptchaSVG(code) {
  const chars = code.split("");

  const letters = chars.map((char, i) => {
    const y = 43 + (i % 2) * 4;
    const rotation = (i - 2) * 7;

    return `<text x="${35 + i * 42}" y="${y}"
      transform="rotate(${rotation} ${35 + i * 42} ${y})"
      font-size="29" font-weight="bold"
      fill="#173b70">${char}</text>`;
  }).join("");

  return `
  <svg xmlns="http://www.w3.org/2000/svg"
       width="250" height="75" viewBox="0 0 250 75">
    <rect width="250" height="75" rx="10" fill="#eef3fb"/>
    <path d="M0 20 L250 55 M0 60 L250 15"
      stroke="#9bb4d7" stroke-width="1.5" opacity=".5"/>
    <circle cx="35" cy="15" r="3" fill="#829bc0"/>
    <circle cx="210" cy="55" r="3" fill="#829bc0"/>
    ${letters}
  </svg>`;
}

function validIMEI(value) {
  const imei = String(value || "");

  if (!/^\d{15}$/.test(imei)) return false;

  let sum = 0;

  for (let i = 0; i < 14; i++) {
    let digit = Number(imei[i]);

    if ((13 - i) % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
  }

  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === Number(imei[14]);
}

async function checkRateLimit(request, env, secret, limit = 15) {
  const ip = request.headers.get("CF-Connecting-IP");

  if (!ip) return true;

  const ipHash = await sha256(`${ip}:${secret}`);
  const now = Date.now();
  const windowStart = Math.floor(now / 60000) * 60000;

  const result = await env.DB.prepare(`
    INSERT INTO api_rate_limits
      (ip_hash, window_start, request_count)
    VALUES (?, ?, 1)
    ON CONFLICT(ip_hash) DO UPDATE SET
      request_count = CASE
        WHEN api_rate_limits.window_start = excluded.window_start
        THEN api_rate_limits.request_count + 1
        ELSE 1
      END,
      window_start = excluded.window_start
    RETURNING request_count
  `).bind(ipHash, windowStart).first();

  return Number(result?.request_count || 0) <= limit;
}

async function createCaptcha(env, secret) {
  const code = randomCode(5);
  const id = crypto.randomUUID();
  const expiresAt = Date.now() + 180000;

  const codeHash = await sha256(code);

  await env.DB.prepare(`
    INSERT INTO captcha_challenges
      (id, code_hash, expires_at, used)
    VALUES (?, ?, ?, 0)
  `).bind(id, codeHash, expiresAt).run();

  const payload = base64url(
    new TextEncoder().encode(
      JSON.stringify({ id, exp: expiresAt })
    )
  );

  const signature = await signPayload(payload, secret);

  const svg = createCaptchaSVG(code);

  const image = "data:image/svg+xml;base64," + btoa(svg);

  return {
    ok: true,
    captchaImage: image,
    captchaToken: `${payload}.${signature}`,
    expiresInSec: 180
  };
}

async function verifyCaptcha(token, input, env, secret) {
  if (
    typeof token !== "string" ||
    typeof input !== "string" ||
    token.length > 2000
  ) {
    return false;
  }

  const parts = token.split(".");

  if (parts.length !== 2) return false;

  const [payload, signature] = parts;

  const expected = await signPayload(payload, secret);

  if (!safeEqual(signature, expected)) return false;

  let data;

  try {
    data = JSON.parse(
      new TextDecoder().decode(decodeBase64url(payload))
    );
  } catch {
    return false;
  }

  if (
    !data ||
    typeof data.id !== "string" ||
    typeof data.exp !== "number" ||
    Date.now() > data.exp
  ) {
    return false;
  }

  const result = await env.DB.prepare(`
    UPDATE captcha_challenges
    SET used = 1
    WHERE id = ?
      AND used = 0
      AND expires_at > ?
    RETURNING code_hash
  `).bind(data.id, Date.now()).first();

  if (!result) return false;

  const enteredHash = await sha256(
    input.trim().toUpperCase()
  );

  return safeEqual(enteredHash, result.code_hash);
}

async function handleFreeCheck(body, env) {
  const imei = String(body.imei || "").trim();

  if (!validIMEI(imei)) {
    return jsonResponse({
      ok: false,
      error: "INVALID_IMEI",
      message: "Invalid IMEI number."
    }, 400);
  }

  const tac = imei.slice(0, 8);

  const deviceInfo = await env.DB.prepare(`
    SELECT
      tac,
      model,
      release_year,
      ios_version,
      processor,
      network
    FROM device_catalog
    WHERE tac = ?
    LIMIT 1
  `).bind(tac).first();

  await env.DB.prepare(`
    INSERT INTO imei_checks
      (imei, tac, device, created_at, status)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    imei,
    tac,
    deviceInfo?.model || "Unknown iPhone",
    new Date().toISOString(),
    "completed"
  ).run();

  return jsonResponse({
    ok: true,
    imei,
    tac,
    found: Boolean(deviceInfo),
    deviceInfo: deviceInfo || null,
    message: deviceInfo
      ? "Device information found."
      : "IMEI format verified. Device information is not available in the local catalog."
  });
}

async function handlePaidRequest(body, env) {
  const imei = String(body.imei || "").trim();
  const service = String(body.service || "").trim();
  const email = String(body.email || "").trim().toLowerCase();

  if (!validIMEI(imei)) {
    return jsonResponse({
      ok: false,
      error: "INVALID_IMEI"
    }, 400);
  }

  if (!PAID_SERVICES.includes(service)) {
    return jsonResponse({
      ok: false,
      error: "INVALID_SERVICE"
    }, 400);
  }

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return jsonResponse({
      ok: false,
      error: "INVALID_EMAIL"
    }, 400);
  }

  const requestId = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO service_requests
      (id, imei, service, email, customer_name, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    requestId,
    imei,
    service,
    email,
    String(body.customerName || "").slice(0, 100),
    "pending",
    new Date().toISOString()
  ).run();

  return jsonResponse({
    ok: true,
    requestId,
    status: "pending",
    message: "Your service request has been received."
  }, 201);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");

    if (origin && origin !== ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    if (!env.CAPTCHA_SECRET || env.CAPTCHA_SECRET.length < 32) {
      return jsonResponse({
        ok: false,
        error: "SERVER_SECRET_NOT_CONFIGURED"
      }, 500);
    }

    if (!env.DB) {
      return jsonResponse({
        ok: false,
        error: "DATABASE_NOT_CONFIGURED"
      }, 500);
    }

    const secret = env.CAPTCHA_SECRET;
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (request.method === "GET" && path === "/api/health") {
        return jsonResponse({
          ok: true,
          service: "GSM Yasser Server API",
          version: "2.0"
        });
      }

      if (request.method === "GET" && path === "/api/captcha") {
        if (!await checkRateLimit(request, env, secret, 20)) {
          return jsonResponse({
            ok: false,
            error: "RATE_LIMIT_EXCEEDED"
          }, 429);
        }

        return jsonResponse(
          await createCaptcha(env, secret)
        );
      }

      if (
        request.method === "POST" &&
        (path === "/api/imei-check" ||
         path === "/api/service-request")
      ) {
        if (!await checkRateLimit(request, env, secret, 10)) {
          return jsonResponse({
            ok: false,
            error: "RATE_LIMIT_EXCEEDED"
          }, 429);
        }

        const contentLength = Number(
          request.headers.get("Content-Length") || 0
        );

        if (contentLength > 10000) {
          return jsonResponse({
            ok: false,
            error: "REQUEST_TOO_LARGE"
          }, 413);
        }

        let body;

        try {
          body = await request.json();
        } catch {
          return jsonResponse({
            ok: false,
            error: "INVALID_JSON"
          }, 400);
        }

        const captchaValid = await verifyCaptcha(
          body.captchaToken,
          body.captchaCode,
          env,
          secret
        );

        if (!captchaValid) {
          return jsonResponse({
            ok: false,
            error: "INVALID_CAPTCHA"
          }, 400);
        }

        if (path === "/api/imei-check") {
          return await handleFreeCheck(body, env);
        }

        return await handlePaidRequest(body, env);
      }

      return jsonResponse({
        ok: false,
        error: "NOT_FOUND"
      }, 404);

    } catch (error) {
      console.error("Worker error:", error);

      return jsonResponse({
        ok: false,
        error: "INTERNAL_SERVER_ERROR"
      }, 500);
    }
  }
};
