// 1. تحميل مكتبة html2pdf تلقائياً
function loadPdfLibrary(callback) {
    if (typeof html2pdf !== 'undefined') {
        callback();
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = callback;
    document.head.appendChild(script);
}

// 2. دالة جمع البيانات من الاستمارة وتشغيل التوليد
function collectDataAndGenerate() {
    const data = {
        imei: document.getElementById('imei').value.trim() || 'N/A',
        model: document.getElementById('model').value.trim() || 'N/A',
        fmi: document.getElementById('fmi').value.trim() || 'N/A',
        icloud: document.getElementById('icloud').value.trim() || 'N/A',
        carrier: document.getElementById('carrier').value.trim() || 'N/A'
    };

    generateImeiReportPDF(data);
}

// 3. دالة توليد الـ PDF (التصميم الاحترافي)
function generateImeiReportPDF(data) {
    loadPdfLibrary(() => {
        const reportContainer = document.createElement('div');
        reportContainer.style.padding = '25px';
        reportContainer.style.fontFamily = "'Segoe UI', Tahoma, Arial, sans-serif";
        reportContainer.style.color = '#1a1a1a';
        reportContainer.style.background = '#ffffff';
        reportContainer.style.direction = 'ltr';

        const currentDate = new Date().toLocaleDateString('en-GB');

        reportContainer.innerHTML = `
            <div style="border-bottom: 3px solid #0056b3; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 style="margin: 0; color: #0056b3; font-size: 20px;">GSM YASSER SERVER</h2>
                    <p style="margin: 4px 0 0; font-size: 11px; color: #555;">
                        iPhone IMEI Verification Report | Rapport de vérification IMEI | تقرير فحص الآيفون
                    </p>
                </div>
                <div style="text-align: right; font-size: 11px; color: #444;">
                    <p style="margin: 0;"><strong>Date / التاريخ:</strong> ${currentDate}</p>
                    <p style="margin: 4px 0 0; color: #0056b3;">yasserserver.com</p>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
                <thead>
                    <tr style="background-color: #0056b3; color: #ffffff;">
                        <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left; width: 45%;">Parameter / Paramètre / البيان</th>
                        <th style="padding: 10px; border: 1px solid #dee2e6; text-align: left; width: 55%;">Result / Résultat / النتيجة</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="background-color: #f8f9fa;">
                        <td style="padding: 10px; border: 1px solid #dee2e6;">
                            <strong>IMEI / Serial</strong><br>
                            <span style="color: #555; font-size: 11px;">Numéro IMEI / الرقم التسلسلي</span>
                        </td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold; font-size: 13px;">
                            ${data.imei}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #dee2e6;">
                            <strong>Device Model</strong><br>
                            <span style="color: #555; font-size: 11px;">Modèle de l'appareil / طراز الجهاز</span>
                        </td>
                        <td style="padding: 10px; border: 1px solid #dee2e6;">
                            ${data.model}
                        </td>
                    </tr>
                    <tr style="background-color: #f8f9fa;">
                        <td style="padding: 10px; border: 1px solid #dee2e6;">
                            <strong>Find My iPhone (FMI)</strong><br>
                            <span style="color: #555; font-size: 11px;">Localiser mon iPhone / العثور على الآيفون</span>
                        </td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">
                            ${data.fmi}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #dee2e6;">
                            <strong>iCloud Status</strong><br>
                            <span style="color: #555; font-size: 11px;">État iCloud / حالة الآي كلاود</span>
                        </td>
                        <td style="padding: 10px; border: 1px solid #dee2e6;">
                            ${data.icloud}
                        </td>
                    </tr>
                    <tr style="background-color: #f8f9fa;">
                        <td style="padding: 10px; border: 1px solid #dee2e6;">
                            <strong>SIM Lock / Carrier</strong><br>
                            <span style="color: #555; font-size: 11px;">Opérateur / حالة الشبكة</span>
                        </td>
                        <td style="padding: 10px; border: 1px solid #dee2e6;">
                            ${data.carrier}
                        </td>
                    </tr>
                </tbody>
            </table>

            <div style="background-color: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 10px; color: #475569; line-height: 1.5; margin-bottom: 15px;">
                <p style="margin: 0 0 4px;"><strong>EN:</strong> This official verification report is generated automatically via GSM Yasser Server.</p>
                <p style="margin: 0 0 4px;"><strong>FR:</strong> Ce rapport de vérification officiel est généré automatiquement via GSM Yasser Server.</p>
                <p style="margin: 0; text-align: right; direction: rtl;"><strong>AR:</strong> تم إصدار تقرير الفحص الرسمي هذا تلقائياً عبر منصة GSM Yasser Server.</p>
            </div>

            <div style="text-align: center; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 10px;">
                GSM YASSER SERVER • yasserserver.com
            </div>
        `;

        const opt = {
            margin:       10,
            filename:     `IMEI_Report_${data.imei}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(reportContainer).save();
    });
}
