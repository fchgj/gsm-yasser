<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GSM Yasser</title>
<style>
  * { box-sizing: border-box; font-family: Arial, sans-serif; }
  body { margin: 0; background: #0f172a; color: #fff; text-align: center; padding: 20px; }
  .container { max-width: 500px; margin: auto; }
  h1 { font-size: 28px; margin-top: 24px; }
  p { color: #cbd5e1; line-height: 1.6; }
  .card { background: #1e293b; padding: 20px; border-radius: 16px; margin: 15px 0; }
  .card h3 { margin: 0 0 10px 0; }
  input {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid #334155;
    background: #0f172a;
    color: #fff;
    font-size: 15px;
    margin-bottom: 10px;
  }
  .code-box { background: #0f172a; padding: 12px; border-radius: 10px; word-break: break-all; font-size: 14px; margin: 10px 0; }
  button {
    width: 100%;
    padding: 14px;
    border: 0;
    border-radius: 12px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    margin-top: 10px;
  }
  .btn-primary { background: #06b6d4; color: #000; }
  .btn-copy { background: #22c55e; color: #fff; }
  .btn-share { background: #3b82f6; color: #fff; }
  .btn-top { background: #f59e0b; color: #000; }
  .btn-download { background: #fff; color: #000; }
  .status { font-size: 13px; color: #fbbf24; margin-top: 8px; min-height: 18px; }
</style>
</head>
<body>

<div class="container">
  <h1>GSM YASSER</h1>
  <p>iPhone IMEI lookup &amp; instant report tools.</p>

  <!-- IMEI LOOKUP BOX -->
  <div class="card">
    <h3>IMEI Lookup</h3>
    <input type="text" id="imeiInput" inputmode="numeric" maxlength="15" placeholder="Enter 15-digit IMEI">
    <button class="btn-primary" onclick="handleLookup()">Check IMEI</button>
    <div class="status" id="imeiStatus"></div>
  </div>

  <!-- COPY LINK -->
  <div class="card">
    <h3>Website Link</h3>
    <div class="code-box" id="siteLink">https://fchgj.github.io/gsm-yasser/</div>
    <button class="btn-copy" onclick="copyText('https://fchgj.github.io/gsm-yasser/', this)">Copy Link</button>
  </div>

  <!-- COPY WHATSAPP -->
  <div class="card">
    <h3>WhatsApp Number</h3>
    <div class="code-box">+213 00 00 00 00</div>
    <button class="btn-copy" onclick="copyText('+213000000000', this)">Copy Number</button>
  </div>

  <!-- SHARE + DOWNLOAD -->
  <div class="card">
    <h3>Share &amp; Info</h3>
    <button class="btn-share" onclick="shareSite(this)">Share</button>
    <button class="btn-download" onclick="downloadFile()">Download Info</button>
  </div>

  <button class="btn-top" onclick="window.scrollTo({top:0, behavior:'smooth'})">Back To Top ↑</button>
  <p style="font-size:12px; margin-top:20px;">
    © 2026 GSM Yasser — <a href="legal.html" style="color:#94a3b8;">Legal</a>
  </p>
</div>

<script>
function isValidIMEI(imei) {
  if (!/^\d{15}$/.test(imei)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = parseInt(imei[i], 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

function handleLookup() {
  const imei = document.getElementById("imeiInput").value.trim();
  const statusEl = document.getElementById("imeiStatus");
  if (!isValidIMEI(imei)) {
    statusEl.textContent = "Please enter a valid 15-digit IMEI.";
    return;
  }
  // Connect this to your api.js / report.html flow
  statusEl.textContent = "Valid IMEI format. Connect api.js to fetch live report.";
}

function copyText(text, btn) {
  const originalText = btn.innerText;
  function showDone() {
    btn.innerText = "Copied ✓";
    setTimeout(() => { btn.innerText = originalText; }, 1500);
  }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(showDone).catch(() => fallbackCopy(text, showDone));
  } else {
    fallbackCopy(text, showDone);
  }
}

function fallbackCopy(text, callback) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(ta);
  callback();
}

function shareSite(btn) {
  const url = "https://fchgj.github.io/gsm-yasser/";
  if (navigator.share) {
    navigator.share({ title: "GSM Yasser", text: "Check this website", url: url }).catch(() => {});
  } else {
    copyText(url, btn);
  }
}

function downloadFile() {
  const content = "GSM YASSER\nWebsite: https://fchgj.github.io/gsm-yasser/\nWhatsApp: +213 00 00 00 00\n";
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gsm-yasser.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>

</body>
</html>
