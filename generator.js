const HTML2PDF_CDN = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
const BRAND_NAME = "GSM YASSER SERVER";
const BRAND_DOMAIN = "yasserserver.com";
const BRAND_CONTACT = "Oran • WhatsApp: 0657241710";

function getFieldValue(id, fallback = "N/A") {
  const el = document.getElementById(id);
  const val = el && typeof el.value === "string" ? el.value.trim() : "";
  return val || fallback;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function loadPdfLibrary(onReady, onError) {
  if (typeof html2pdf !== "undefined") {
    onReady();
    return;
  }

  const existing = document.querySelector(`script[src="${HTML2PDF_CDN}"]`);
  if (existing) {
    existing.addEventListener("load", onReady, { once: true });
    existing.addEventListener("error", () => onError && onError(new Error("Échec du chargement de html2pdf")), { once: true });
    return;
  }

  const script = document.createElement("script");
  script.src = HTML2PDF_CDN;
  script.async = true;
  script.onload = onReady;
  script.onerror = () => onError && onError(new Error("Échec du chargement de html2pdf"));
  document.head.appendChild(script);
}

function evaluateDeviceCleanStatus(data) {
  const fmi = String(data.fmi || "").toLowerCase();
  const icloud = String(data.icloud || "").toLowerCase();

  const hasBlockedKeyword =
    fmi.includes("on") ||
    fmi.includes("lost") ||
    icloud.includes("lost") ||
    icloud.includes("locked") ||
    icloud.includes("blacklist");

  if (hasBlockedKeyword) return false;

  const isFmiOff = /\boff\b/.test(fmi);
  const isIcloudClean = icloud.includes("clean");

  return isFmiOff || isIcloudClean;
}

function collectDataAndGenerate() {
  const data = {
    imei: getFieldValue("imei", "N/A"),
    model: getFieldValue("model", "N/A"),
    fmi: getFieldValue("fmi", "N/A"),
    icloud: getFieldValue("icloud", "N/A"),
    carrier: getFieldValue("carrier", "N/A"),
  };

  generateImeiReportPDF(data);
}

function generateImeiReportPDF(data, onError) {
  loadPdfLibrary(
    () => {
      const safeImei = escapeHtml(data.imei || "N/A");
      const safeModel = escapeHtml(data.model || "N/A");
      const safeFmi = escapeHtml(data.fmi || "N/A");
      const safeIcloud = escapeHtml(data.icloud || "N/A");
      const safeCarrier = escapeHtml(data.carrier || "N/A");

      const currentDate = new Date().toLocaleDateString("fr-FR");
      const isClean = evaluateDeviceCleanStatus(data);

      const verdictColor = isClean ? "#198754" : "#dc3545";
      const verdictText = isClean ? "Appareil Propre et Clair" : "Appareil Bloqué / À Vérifier";
      const verdictIcon = isClean ? "✔️" : "⚠️";

      const reportContainer = document.createElement("div");
      reportContainer.style.padding = "28px";
      reportContainer.style.fontFamily = "'Segoe UI', Tahoma, Arial, sans-serif";
      reportContainer.style.color = "#1a1a1a";
      reportContainer.style.background = "#ffffff";
      reportContainer.style.direction = "ltr";

      reportContainer.innerHTML = `
        <div style="border-bottom: 3px solid #0056b3; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="margin: 0; color: #0056b3; font-size: 22px;">${escapeHtml(BRAND_NAME)}</h2>
            <p style="margin: 4px 0 0; font-size: 11px; color: #555;">
              Rapport de Vérification IMEI iPhone
            </p>
          </div>
          <div style="text-align: right; font-size: 11px; color: #444;">
            <p style="margin: 0;"><strong>Date :</strong> ${escapeHtml(currentDate)}</p>
            <p style="margin: 4px 0 0; color: #0056b3;">${escapeHtml(BRAND_DOMAIN)}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <thead>
            <tr style="background-color: #0056b3; color: #ffffff;">
              <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left; width: 45%;">Paramètre</th>
              <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left; width: 55%;">Résultat</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>IMEI / Numéro de Série</strong></td>
              <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold; font-size: 14px;">${safeImei}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Modèle de l'Appareil</strong></td>
              <td style="padding: 12px; border: 1px solid #dee2e6;">${safeModel}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Localiser mon iPhone (FMI)</strong></td>
              <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">${safeFmi}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>État iCloud</strong></td>
              <td style="padding: 12px; border: 1px solid #dee2e6;">${safeIcloud}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Opérateur / Verrouillage SIM</strong></td>
              <td style="padding: 12px; border: 1px solid #dee2e6;">${safeCarrier}</td>
            </tr>
          </tbody>
        </table>

        <div style="background-color: ${verdictColor}; color: #ffffff; padding: 14px; border-radius: 8px; margin: 20px auto; width: 88%; text-align: center;">
          <h2 style="margin: 0; font-size: 19px;">${verdictIcon} ${escapeHtml(verdictText)}</h2>
        </div>

        <div style="background-color: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 10px; color: #475569; line-height: 1.5; margin-bottom: 15px; text-align: left;">
          <p style="margin: 0;"><strong>FR :</strong> Ce rapport de vérification est généré automatiquement via ${escapeHtml(BRAND_NAME)}. Les informations fournies sont basées sur les données fournies ou consultées.</p>
        </div>

        <div style="text-align: center; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 10px;">
          ${escapeHtml(BRAND_NAME)} • ${escapeHtml(BRAND_CONTACT)}
        </div>
      `;

      const fileImei = /^\d{15}$/.test(String(data.imei || "").trim()) ? String(data.imei).trim() : "Report";
      const opt = {
        margin: 10,
        filename: `Rapport_IMEI_${fileImei}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2.5, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      html2pdf()
        .set(opt)
        .from(reportContainer)
        .save()
        .catch((err) => {
          if (onError) onError(err);
        });
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}
