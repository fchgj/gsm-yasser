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

// 2. دالة جمع البيانات من الاستمارة
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

// 3. دالة توليد الـ PDF (التصميم باللغة الفرنسية)
function generateImeiReportPDF(data) {
    loadPdfLibrary(() => {
        const reportContainer = document.createElement('div');
        reportContainer.style.padding = '30px';
        reportContainer.style.fontFamily = "'Segoe UI', Tahoma, Arial, sans-serif";
        reportContainer.style.color = '#1a1a1a';
        reportContainer.style.background = '#ffffff';
        reportContainer.style.direction = 'ltr'; // اللغة الفرنسية من اليسار لليمين

        const currentDate = new Date().toLocaleDateString('fr-FR'); // تاريخ بصيغة فرنسية

        // تحديد الحالة لتلوين المربع (أخضر إذا كان نظيفاً، أحمر إذا كان مقفولاً)
        const isClean = data.fmi.includes('OFF') || data.icloud.includes('Clean') || data.icloud.includes('N/A') === false;
        const verdictColor = isClean ? '#198754' : '#dc3545';
        const verdictText = isClean ? 'Appareil Propre et Clair' : 'Appareil Bloqué / Non Propre';
        const verdictIcon = isClean ? '✔️' : '❌';

        reportContainer.innerHTML = `
            <!-- En-tête / الترويسة -->
            <div style="border-bottom: 3px solid #0056b3; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 style="margin: 0; color: #0056b3; font-size: 22px;">GSM YASSER SERVER</h2>
                    <p style="margin: 4px 0 0; font-size: 11px; color: #555;">
                        Rapport de Vérification IMEI iPhone
                    </p>
                </div>
                <div style="text-align: right; font-size: 11px; color: #444;">
                    <p style="margin: 0;"><strong>Date :</strong> ${currentDate}</p>
                    <p style="margin: 4px 0 0; color: #0056b3;">yasserserver.com</p>
                </div>
            </div>

            <!-- Tableau / الجدول -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                <thead>
                    <tr style="background-color: #0056b3; color: #ffffff;">
                        <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left; width: 45%;">Paramètre</th>
                        <th style="padding: 12px; border: 1px solid #dee2e6; text-align: left; width: 55%;">Résultat</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="background-color: #f8f9fa;">
                        <td style="padding: 12px; border: 1px solid #dee2e6;">
                            <strong>IMEI / Numéro de Série</strong>
                        </td>
                        <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold; font-size: 14px;">
                            ${data.imei}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border: 1px solid #dee2e6;">
                            <strong>Modèle de l'Appareil</strong>
                        </td>
                        <td style="padding: 12px; border: 1px solid #dee2e6;">
                            ${data.model}
                        </td>
                    </tr>
                    <tr style="background-color: #f8f9fa;">
                        <td style="padding: 12px; border: 1px solid #dee2e6;">
                            <strong>Localiser mon iPhone (FMI)</strong>
                        </td>
                        <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">
                            ${data.fmi}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border: 1px solid #dee2e6;">
                            <strong>État iCloud</strong>
                        </td>
                        <td style="padding: 12px; border: 1px solid #dee2e6;">
                            ${data.icloud}
                        </td>
                    </tr>
                    <tr style="background-color: #f8f9fa;">
                        <td style="padding: 12px; border: 1px solid #dee2e6;">
                            <strong>Opérateur / Verrouillage SIM</strong>
                        </td>
                        <td style="padding: 12px; border: 1px solid #dee2e6;">
                            ${data.carrier}
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Verdict / الحالة النهائية -->
            <div style="background-color: ${verdictColor}; color: white; padding: 15px; border-radius: 8px; margin: 20px auto; width: 85%; text-align: center;">
                <h2 style="margin: 0; font-size: 20px;">${verdictIcon} ${verdictText}</h2>
            </div>

            <!-- Note légale / ملاحظة قانونية -->
            <div style="background-color: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 10px; color: #475569; line-height: 1.5; margin-bottom: 15px; text-align: left;">
                <p style="margin: 0;"><strong>FR :</strong> Ce rapport officiel de vérification est généré automatiquement via GSM Yasser Server. Les informations fournies sont basées sur les données du fabricant.</p>
            </div>

            <!-- Pied de page / التذييل -->
            <div style="text-align: center; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 10px;">
                GSM YASSER SERVER • Oran • WhatsApp: 0657241710
            </div>
        `;

        const opt = {
            margin:       10,
            filename:     `Rapport_IMEI_${data.imei}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 3, useCORS: true }, // رفعنا الجودة إلى 3 لضمان وضوح النص الفرنسي
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(reportContainer).save();
    });
}
