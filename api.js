const API_BASE = "https://gsm-yasser-api.yasserkhelifi125.workers.dev";
const DEFAULT_TIMEOUT_MS = 12000;
export const ADMIN_WHATSAPP_NUMBER = "213550000000"; // استبدل برقمك الدولي بدون + أو أصفار بادئة

export function isValidImei(imei) {
  const clean = String(imei || "").trim();
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
  const timePart = Date.now().toString(36).toUpperCase().slice(-5);
  const randPart = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${timePart}${randPart}`;
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
    if (err.name === "AbortError") {
      throw new Error("انتهت مهلة الاتصال بالخادم، يرجى المحاولة مرة أخرى.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// 1. الفحص المجاني برقم IMEI (يحفظ في جدول imei_checks)
export function checkFreeImei(imei, tac = "", device = "iPhone") {
  const cleanImei = String(imei || "").trim();
  if (!isValidImei(cleanImei)) {
    return Promise.reject(new Error("رقم IMEI غير صحيح (يجب أن يتكون من 15 رقماً)."));
  }

  const cleanTac = String(tac || "").trim() || cleanImei.slice(0, 8);
  return postJson("/api/imei-check", {
    imei: cleanImei,
    tac: cleanTac,
    device: String(device || "iPhone").trim(),
  });
}

// 2. طلب إحدى الخدمات الأربع المدفوعة (يحفظ في جدول service_orders ويشغّل تنبيه واتساب في الخلفية)
export function createServiceOrder({
  imei,
  serviceName,
  customerContact = "",
  notes = "",
  price = "",
  refId = "",
  keepalive = false,
}) {
  const cleanImei = String(imei || "").trim();
  const cleanService = String(serviceName || "").trim();

  if (!isValidImei(cleanImei)) {
    return Promise.reject(new Error("رقم IMEI غير صحيح (يجب أن يتكون من 15 رقماً)."));
  }
  if (!cleanService) {
    return Promise.reject(new Error("يرجى اختيار نوع الخدمة."));
  }

  const cleanRefId = String(refId || "").trim() || generateOrderRef("GY");

  return postJson(
    "/api/service-order",
    {
      ref_id: cleanRefId,
      imei: cleanImei,
      service_name: cleanService,
      price: String(price || "").trim(),
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
  refId,
  price = "",
  customerContact = "",
  notes = "",
  phone = ADMIN_WHATSAPP_NUMBER,
}) {
  const lines = [
    "*طلب خدمة جديد - GSM Yasser Server*",
    `رقم المرجع: ${refId}`,
    `IMEI: ${imei}`,
    `الخدمة: ${serviceName}`,
  ];

  if (price) lines.push(`التسعيرة: ${price}`);
  if (customerContact) lines.push(`تواصل العميل: ${customerContact}`);
  if (notes) lines.push(`ملاحظات: ${notes}`);

  const cleanPhone = String(phone || ADMIN_WHATSAPP_NUMBER).replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join("\n"))}`;
}
