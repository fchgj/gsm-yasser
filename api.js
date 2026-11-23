const API_BASE = "https://gsm-yasser-api.yasserkhelifi125.workers.dev";

async function postJson(path, payload) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

// 1. الفحص المجاني برقم IMEI (يحفظ في جدول imei_checks)
export function checkFreeImei(imei, tac = "", device = "iPhone") {
  return postJson("/api/imei-check", { imei, tac, device });
}

// 2. طلب إحدى الخدمات الأربع المدفوعة (يحفظ في جدول service_orders)
export function createServiceOrder({ imei, serviceName, customerContact = "", notes = "" }) {
  return postJson("/api/service-order", {
    imei,
    service_name: serviceName,
    customer_contact: customerContact,
    notes,
  });
}
