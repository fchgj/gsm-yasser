const API_BASE = "https://gsm-yasser-api.yasserkhelifi125.workers.dev";
const DEFAULT_TIMEOUT_MS = 12000;

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

async function postJson(path, payload, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
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

// 2. طلب إحدى الخدمات الأربع المدفوعة (يحفظ في جدول service_orders)
export function createServiceOrder({ imei, serviceName, customerContact = "", notes = "" }) {
  const cleanImei = String(imei || "").trim();
  const cleanService = String(serviceName || "").trim();

  if (!isValidImei(cleanImei)) {
    return Promise.reject(new Error("رقم IMEI غير صحيح (يجب أن يتكون من 15 رقماً)."));
  }
  if (!cleanService) {
    return Promise.reject(new Error("يرجى اختيار نوع الخدمة."));
  }

  return postJson("/api/service-order", {
    imei: cleanImei,
    service_name: cleanService,
    customer_contact: String(customerContact || "").trim(),
    notes: String(notes || "").trim(),
  });
}
