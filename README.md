html
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
  h1 { font-size: 28px; margin-top: 30px; }
  p { color: #cbd5e1; line-height: 1.6; }
  .card { background: #1e293b; padding: 20px; border-radius: 16px; margin: 15px 0; }
  .card h3 { margin: 0 0 10px 0; }
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
  .btn-copy { background: #22c55e; color: #fff; }
  .btn-share { background: #3b82f6; color: #fff; }
  .btn-top { background: #f59e0b; color: #000; }
  .btn-download { background: #fff; color: #000; }
</style>
</head>
<body>

<div class="container">
  <h1>GSM YASSER</h1>
  <p>All GSM tools and services in one place.</p>

  <!-- CARD 1 : COPY LINK -->
  <div class="card">
    <h3>Website Link</h3>
    <div class="code-box" id="siteLink">https://fchgj.github.io/gsm-yasser/</div>
    <button class="btn-copy" onclick="copyText('https://fchgj.github.io/gsm-yasser/', this)">Copy Link</button>
  </div>

  <!-- CARD 2 : COPY ANY TEXT -->
  <div class="card">
    <h3>WhatsApp Number</h3>
    <div class="code-box">+213 00 00 00 00</div>
    <button class="btn-copy" onclick="copyText('+213000000000', this)">Copy Number</button>
  </div>

  <!-- CARD 3 : SHARE + DOWNLOAD -->
  <div class="card">
    <h3>Share Website</h3>
    <button class="btn-share" onclick="shareSite()">Share</button>
    <button class="btn-download" onclick="downloadFile()">Download Info</button>
  </div>

  <button class="btn-top" onclick="window.scrollTo({top:0, behavior:'smooth'})">Back To Top ↑</button>
  <p style="font-size:12px; margin-top:20px;">© 2026 GSM Yasser - All Rights Reserved</p>
</div>

<script>
// COPY FUNCTION - Works on Mobile + Desktop
function copyText(text, btn) {
  var originalText = btn.innerText;

  function showDone() {
    btn.innerText = "Copied ✓";
    setTimeout(function(){ btn.innerText = originalText; }, 1500);
    alert("Copied: " + text);
  }

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(showDone).catch(function(){
      fallbackCopy(text, showDone);
    });
  } else {
    fallbackCopy(text, showDone);
  }
}

// Fallback for old Android browsers
function fallbackCopy(text, callback) {
  var ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch(e) {}
  document.body.removeChild(ta);
  callback();
}

// SHARE FUNCTION
function shareSite() {
  var url = "https://fchgj.github.io/gsm-yasser/";
  if (navigator.share) {
    navigator.share({ title: "GSM Yasser", text: "Check this website", url: url });
  } else {
    copyText(url, event.target);
  }
}

// DOWNLOAD FUNCTION - Creates a txt file
function downloadFile() {
  var content = "GSM YASSER\nWebsite: https://fchgj.github.io/gsm-yasser/\nThanks for visiting!";
  var blob = new Blob([content], { type: "text/plain" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "gsm-yasser.txt";
  a.click();
}
</script>

</body>
</html>


