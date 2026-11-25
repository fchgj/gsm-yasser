export const API_BASE = "https://gsm-yasser-api.yasserkhelifi125.workers.dev";
export const DEFAULT_TIMEOUT_MS = 12000;
export const ADMIN_WHATSAPP_NUMBER = "213657241710";

export function normalizeImei(imei) {
  return String(imei || "").replace(/\D/g, "").trim();
}

export function isValidImei(imei) {
  const clean = normalizeImei(imei);
  if (!/^\d{15}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = Number(clean[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export function generateOrderRef(prefix = "GY") {
  const safePrefix = String(prefix || "GY").replace(/[^A-Za-z0-9]/g, "").toUpperCase() || "GY";
  const timePart = Date.now().toString(36).toUpperCase().slice(-5);
  const randPart = Math.floor(100 + Math.random() * 900);
  return `${safePrefix}-${timePart}${randPart}`;
}

async function postJson(path, payload, timeoutMs = DEFAULT_TIMEOUT_MS, extraOptions = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      ...extraOptions,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || `HTTP ${res.status}`);
    }
    return data;
  } catch (err) {
    if (err && err.name === "AbortError") {
      throw new Error("انتهت مهلة الاتصال بالخادم، يرجى المحاولة مرة أخرى.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// 1. الفحص المجاني برقم IMEI (يحفظ في جدول imei_checks)
export function checkFreeImei(imei, tac = "", device = "iPhone") {
  const cleanImei = normalizeImei(imei);
  if (!isValidImei(cleanImei)) {
    return Promise.reject(new Error("رقم IMEI غير صحيح (يجب أن يتكون من 15 رقماً)."));
  }

  const cleanTac = String(tac || "").replace(/\D/g, "").trim() || cleanImei.slice(0, 8);
  return postJson("/api/imei-check", {
    imei: cleanImei,
    tac: cleanTac,
    device: String(device || "iPhone").trim(),
  });
}

// 2. طلب إحدى الخدمات المدفوعة (يحفظ في جدول service_orders ويشغّل تنبيه واتساب في الخلفية)
export function createServiceOrder({
  imei,
  serviceName,
  customerContact = "",
  notes = "",
  price = "",
  currency = "",
  lang = "ar",
  refId = "",
  keepalive = false,
}) {
  const cleanImei = normalizeImei(imei);
  const cleanService = String(serviceName || "").trim();

  if (!isValidImei(cleanImei)) {
    return Promise.reject(new Error("رقم IMEI غير صحيح (يجب أن يتكون من 15 رقماً)."));
  }
  if (!cleanService) {
    return Promise.reject(new Error("يرجى اختيار نوع الخدمة."));
  }

  const cleanRefId = String(refId || "").trim() || generateOrderRef("GY");
  const cleanCurrency = String(currency || "").trim().toUpperCase();
  const rawPrice = String(price || "").trim();
  const formattedPrice = rawPrice && cleanCurrency && !rawPrice.toUpperCase().includes(cleanCurrency)
    ? `${rawPrice} ${cleanCurrency}`
    : rawPrice;

  return postJson(
    "/api/service-order",
    {
      ref_id: cleanRefId,
      imei: cleanImei,
      service_name: cleanService,
      price: formattedPrice,
      currency: cleanCurrency,
      lang: String(lang || "ar").trim().toLowerCase(),
      customer_contact: String(customerContact || "").trim(),
      notes: String(notes || "").trim(),
    },
    DEFAULT_TIMEOUT_MS,
    keepalive ? { keepalive: true } : {}
  ).then((res) => ({
    ...res,
    ref_id: res.ref_id || cleanRefId,
  }));
}

// 3. بناء رابط واتساب منسق للطلب (يُفتح فوراً عند النقر دون انتظار السيرفر)
export function buildOrderWhatsAppUrl({
  imei,
  serviceName,
  refId = "",
  price = "",
  currency = "",
  customerContact = "",
  notes = "",
  checkSummary = "",
  lang = "ar",
  phone = ADMIN_WHATSAPP_NUMBER,
}) {
  const cleanImei = normalizeImei(imei);
  const cleanRef = String(refId || "").trim() || generateOrderRef("GY");
  const cleanCurrency = String(currency || "").trim().toUpperCase();
  const rawPrice = String(price || "").trim();
  const formattedPrice = rawPrice && cleanCurrency && !rawPrice.toUpperCase().includes(cleanCurrency)
    ? `${rawPrice} ${cleanCurrency}`
    : rawPrice;

  const locale = ["ar", "fr", "en"].includes(String(lang).toLowerCase())
    ? String(lang).toLowerCase()
    : "ar";

  const labels = {
    ar: {
      header: "*طلب خدمة جديد - GSM Yasser Server*",
      ref: "رقم المرجع",
      imei: "IMEI",
      service: "الخدمة",
      price: "التسعيرة",
      check: "ملخص الفحص",
      contact: "تواصل العميل",
      notes: "ملاحظات",
    },
    fr: {
      header: "*Nouvelle Commande - GSM Yasser Server*",
      ref: "Référence",
      imei: "IMEI",
      service: "Service",
      price: "Tarif",
      check: "Résumé check",
      contact: "Contact client",
      notes: "Notes",
    },
    en: {
      header: "*New Service Order - GSM Yasser Server*",
      ref: "Reference",
      imei: "IMEI",
      service: "Service",
      price: "Price",
      check: "Check summary",
      contact: "Customer contact",
      notes: "Notes",
    },
  }[locale];

  const lines = [
    labels.header,
    `${labels.ref}: ${cleanRef}`,
    `${labels.service}: ${String(serviceName || "").trim()}`,
  ];

  if (cleanImei) lines.push(`${labels.imei}: ${cleanImei}`);
  if (formattedPrice) lines.push(`${labels.price}: ${formattedPrice}`);
  if (checkSummary) lines.push(`${labels.check}: ${String(checkSummary).trim()}`);
  if (customerContact) lines.push(`${labels.contact}: ${String(customerContact).trim()}`);
  if (notes) lines.push(`${labels.notes}: ${String(notes).trim()}`);

  const cleanPhone = String(phone || ADMIN_WHATSAPP_NUMBER).replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join("\n"))}`;
}
