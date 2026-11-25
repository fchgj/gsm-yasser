// chatbot.js — Hybrid Chatbot Engine (Local FAQ + Cloudflare Worker AI fallback)
(function () {
  const STORAGE_KEY = "gsm_yasser_hybrid_chat_v1";

  // يمكنك وضع رابط Cloudflare Worker هنا لتفعيل الرد عبر AI API عند التبديل أو عند عدم تطابق سؤال محلي
  // مثال: const WORKER_CHAT_URL = "https://gsm-yasser-chat.your-subdomain.workers.dev/api/chat";
  const WORKER_CHAT_URL = "";

  const KNOWLEDGE_BASE = {
    ar: {
      welcome:
        "مرحباً بك في مساعد <strong>GSM Yasser Server</strong> الهجين. أستطيع الإجابة فوراً عن استعلامات <strong>iPhone IMEI</strong>، أو استخدام <strong>Cloudflare Worker + AI API</strong> للأسئلة العامة.",
      placeholder: "اسأل عن IMEI، iCloud، الشبكة، أو اكتب أي سؤال...",
      send: "إرسال",
      toggleLabel: "وضع الـ AI",
      modeLocalBadge: "محلي (مجاني)",
      modeAiBadge: "AI Worker",
      thinking: "جاري توليد الرد...",
      fallbackLocal:
        "لم أجد إجابة محلية مباشرة لهذا السؤال ضمن قاعدة أسئلة <strong>iPhone IMEI</strong>. يمكنك تفعيل وضع <strong>AI Worker</strong> أو التواصل مباشرة عبر واتساب <span class='ltr-num'>+213657241710</span>.",
      workerNotConfigured:
        "وضع <strong>AI Worker</strong> مفعّل في الواجهة، لكن <code>WORKER_CHAT_URL</code> غير مضبوط بعد في <code>chatbot.js</code>. أضف رابط الـ Worker لربطه بـ AI API.",
      workerError: "تعذر الاتصال بـ Cloudflare Worker حالياً. تم الإبقاء على الرد المحلي.",
      quickQuestions: [
        { label: "الفرق بين المجاني والمدفوع", text: "ما الفرق بين الفحص المجاني والخدمات المدفوعة؟" },
        { label: "فحص iCloud والشبكة", text: "كيف أفحص iCloud وقفل الشبكة و GSMA Blacklist؟" },
        { label: "أين أجد IMEI؟", text: "أين أجد رقم IMEI المكوّن من 15 رقماً؟" },
        { label: "كيف أطلب خدمة؟", text: "كيف أطلب خدمة مدفوعة عبر واتساب؟" }
      ],
      entries: [
        {
          keywords: ["فرق", "مجاني", "luhn", "رياضي", "بنية", "tac", "free", "gratuit"],
          answer:
            "<strong>الفحص المجاني</strong> يتحقق رياضياً من رقم IMEI المكوّن من 15 رقماً عبر خوارزمية <strong>Luhn</strong> ويستخرج <strong>TAC</strong> فقط؛ ولا يعرض حالة <strong>iCloud</strong> أو <strong>قفل الشبكة</strong> أو <strong>GSMA Blacklist</strong>. الاستعلام الفعلي لهذه الحالات يتم عبر <strong>الخدمات المدفوعة</strong>."
        },
        {
          keywords: ["icloud", "find my", "شبكة", "مشغل", "carrier", "sim", "blacklist", "حظر", "مسروق", "pro", "gsx"],
          answer:
            "الفحص الفعلي لحالة <strong>iCloud / Find My</strong>، <strong>قفل الشبكة</strong>، <strong>GSMA Blacklist</strong>، أو <strong>Full PRO Complete Report</strong> متوفر ضمن <strong>خدمات الفحص المدفوعة</strong> عبر واتساب <span class='ltr-num'>+213657241710</span>."
        },
        {
          keywords: ["أين", "أجد", "معرفة", "*#06#", "إعدادات", "حول", "15", "find", "trouver", "settings"],
          answer:
            "يمكنك معرفة رقم IMEI المكوّن من 15 رقماً بطلب <code class='ltr-num'>*#06#</code> على لوحة الاتصال أو من خلال <strong>الإعدادات &gt; عام &gt; حول</strong>."
        },
        {
          keywords: ["طلب", "أطلب", "واتساب", "whatsapp", "سعر", "دفع", "مرجع", "ref", "order", "commander"],
          answer:
            "أدخل رقم IMEI المكوّن من 15 رقماً في خانة الفحص، ثم اضغط على زر <strong>WhatsApp</strong> أسفل الخدمة المطلوبة ليتم تجهيز رسالة تتضمن رقم IMEI ورمز المرجع مباشرة."
        }
      ]
    },
    fr: {
      welcome:
        "Bienvenue sur l'assistant hybride <strong>GSM Yasser Server</strong>. Réponses instantanées sur l'<strong>IMEI iPhone</strong> et prise en charge de <strong>Cloudflare Worker + AI API</strong>.",
      placeholder: "Posez une question sur l'IMEI, iCloud, le réseau...",
      send: "Envoyer",
      toggleLabel: "Mode AI",
      modeLocalBadge: "Local (Gratuit)",
      modeAiBadge: "AI Worker",
      thinking: "Génération de la réponse...",
      fallbackLocal:
        "Aucune réponse locale directe trouvée pour cette question. Activez le <strong>Mode AI</strong> avec votre Cloudflare Worker ou contactez WhatsApp <span class='ltr-num'>+213657241710</span>.",
      workerNotConfigured:
        "Le <strong>Mode AI</strong> est activé, mais <code>WORKER_CHAT_URL</code> n'est pas encore défini dans <code>chatbot.js</code>.",
      workerError: "Impossible de joindre le Cloudflare Worker pour le moment.",
      quickQuestions: [
        { label: "Gratuit vs Payant", text: "Quelle est la différence entre le check gratuit et les services payants ?" },
        { label: "iCloud & Réseau", text: "Comment vérifier iCloud, le verrouillage réseau et GSMA Blacklist ?" },
        { label: "Où trouver l'IMEI ?", text: "Où trouver l'IMEI à 15 chiffres ?" },
        { label: "Commander un service", text: "Comment commander un service payant sur WhatsApp ?" }
      ],
      entries: [
        {
          keywords: ["différence", "gratuit", "luhn", "mathématique", "tac", "free"],
          answer:
            "Le <strong>contrôle gratuit</strong> effectue uniquement une vérification mathématique (algorithme <strong>Luhn</strong>) et extrait le <strong>TAC</strong> ; il ne vérifie pas en direct <strong>iCloud</strong>, le <strong>verrouillage réseau</strong> ou la <strong>GSMA Blacklist</strong>."
        },
        {
          keywords: ["icloud", "find my", "réseau", "opérateur", "carrier", "sim", "blacklist", "pro", "gsx"],
          answer:
            "Les vérifications réelles (<strong>Carrier Lock</strong>, <strong>iCloud Status</strong>, <strong>GSMA Blacklist</strong> et <strong>Full PRO Complete Report</strong>) sont disponibles via les <strong>services payants</strong> sur WhatsApp <span class='ltr-num'>+213657241710</span>."
        },
        {
          keywords: ["trouver", "où", "*#06#", "réglages", "informations", "15", "find", "settings"],
          answer:
            "Composez <code class='ltr-num'>*#06#</code> ou ouvrez <strong>Réglages &gt; Général &gt; Informations</strong> pour afficher l'IMEI à 15 chiffres."
        },
        {
          keywords: ["commander", "whatsapp", "paiement", "référence", "ref", "order"],
          answer:
            "Saisissez l'IMEI à 15 chiffres puis cliquez sur <strong>WhatsApp</strong> sous le service souhaité pour générer votre message avec l'IMEI et la référence."
        }
      ]
    },
    en: {
      welcome:
        "Welcome to the <strong>GSM Yasser Server</strong> hybrid assistant. Instant local answers for <strong>iPhone IMEI</strong> plus optional <strong>Cloudflare Worker + AI API</strong> support.",
      placeholder: "Ask about IMEI, iCloud, carrier lock, or anything else...",
      send: "Send",
      toggleLabel: "AI Mode",
      modeLocalBadge: "Local (Free)",
      modeAiBadge: "AI Worker",
      thinking: "Generating reply...",
      fallbackLocal:
        "No direct local FAQ match found. Switch on <strong>AI Mode</strong> with your Cloudflare Worker or reach out on WhatsApp <span class='ltr-num'>+213657241710</span>.",
      workerNotConfigured:
        "<strong>AI Mode</strong> is toggled on, but <code>WORKER_CHAT_URL</code> is not set yet in <code>chatbot.js</code>.",
      workerError: "Could not reach the Cloudflare Worker right now.",
      quickQuestions: [
        { label: "Free vs. Paid Check", text: "What is the difference between Free Check and Paid Services?" },
        { label: "iCloud & Carrier", text: "How do I check iCloud, Carrier Lock, and GSMA Blacklist?" },
        { label: "Where is IMEI?", text: "Where can I find my 15-digit IMEI?" },
        { label: "How to order?", text: "How do I order a paid service via WhatsApp?" }
      ],
      entries: [
        {
          keywords: ["difference", "free", "luhn", "math", "tac", "gratuit"],
          answer:
            "<strong>Free Check</strong> only performs mathematical validation (<strong>Luhn</strong> algorithm) and extracts the <strong>TAC</strong>; it does not check live <strong>iCloud</strong>, <strong>carrier lock</strong>, or <strong>GSMA Blacklist</strong> status."
        },
        {
          keywords: ["icloud", "find my", "carrier", "network", "sim", "blacklist", "pro", "gsx"],
          answer:
            "Live checks for <strong>Carrier Lock</strong>, <strong>iCloud Status</strong>, <strong>GSMA Blacklist</strong>, and <strong>Full PRO Complete Report</strong> are available under <strong>Paid Verification Services</strong> via WhatsApp <span class='ltr-num'>+213657241710</span>."
        },
        {
          keywords: ["find", "where", "*#06#", "settings", "about", "15", "trouver"],
          answer:
            "Dial <code class='ltr-num'>*#06#</code> on your phone or open <strong>Settings &gt; General &gt; About</strong> to view your 15-digit IMEI."
        },
        {
          keywords: ["order", "whatsapp", "pay", "ref", "reference", "commander"],
          answer:
            "Enter your 15-digit IMEI, then click <strong>WhatsApp</strong> under the service you want to open a pre-filled order message with your IMEI and reference code."
        }
      ]
    }
  };

  function getLang() {
    const lang = document.documentElement.lang || localStorage.getItem("gsm_yasser_lang") || "ar";
    return KNOWLEDGE_BASE[lang] ? lang : "ar";
  }

  function getActiveImei() {
    const inputEl = document.getElementById("imeiInput");
    const fromInput = inputEl ? inputEl.value.replace(/\D/g, "") : "";
    if (fromInput.length === 15) return fromInput;
    const saved = localStorage.getItem("gsm_yasser_last_imei") || "";
    return saved.replace(/\D/g, "");
  }

  function appendImeiContext(html, lang) {
    const imei = getActiveImei();
    if (!imei) return html;
    if (lang === "ar") return `${html}<br><br>📱 IMEI الحالي: <code class="ltr-num">${imei}</code>`;
    if (lang === "fr") return `${html}<br><br>📱 IMEI actuel : <code class="ltr-num">${imei}</code>`;
    return `${html}<br><br>📱 Active IMEI: <code class="ltr-num">${imei}</code>`;
  }

  function matchLocalKnowledge(prompt, lang) {
    const pack = KNOWLEDGE_BASE[lang] || KNOWLEDGE_BASE.ar;
    const normalized = prompt.toLowerCase();
    let bestEntry = null;
    let bestScore = 0;

    for (const entry of pack.entries) {
      let score = 0;
      for (const kw of entry.keywords) {
        if (normalized.includes(kw.toLowerCase())) score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    }

    if (!bestEntry || bestScore === 0) return null;
    return appendImeiContext(bestEntry.answer, lang);
  }

  async function askCloudflareWorker(message, history, lang) {
    const pack = KNOWLEDGE_BASE[lang] || KNOWLEDGE_BASE.ar;
    if (!WORKER_CHAT_URL) {
      return { ok: false, text: pack.workerNotConfigured };
    }

    const res = await fetch(WORKER_CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        lang,
        imei: getActiveImei() || null,
        history: history.slice(-6)
      })
    });

    if (!res.ok) {
      throw new Error(`Worker HTTP ${res.status}`);
    }

    const data = await res.json();
    const replyText = typeof data.reply === "string" && data.reply.trim()
      ? data.reply.trim()
      : pack.workerError;

    return { ok: true, text: replyText };
  }

  function injectStyles() {
    if (document.getElementById("gsmFloatingChatStyles")) return;
    const style = document.createElement("style");
    style.id = "gsmFloatingChatStyles";
    style.textContent = `
      .gsm-fab-btn {
        position: fixed;
        bottom: 20px;
        inset-inline-start: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--accent, #2563eb);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.16);
        box-shadow: 0 12px 28px rgba(37, 99, 235, 0.38);
        font-size: 1.45rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 940;
        transition: transform 0.18s ease, background 0.18s ease;
      }
      .gsm-fab-btn:hover {
        transform: translateY(-2px) scale(1.03);
        background: var(--accent-hover, #1d4ed8);
      }
      .gsm-chat-popup {
        display: none;
        position: fixed;
        bottom: 86px;
        inset-inline-start: 20px;
        width: min(390px, calc(100vw - 24px));
        max-height: min(540px, calc(100vh - 110px));
        background: var(--surface, #0f172a);
        color: var(--text, #f8fafc);
        border: 1px solid var(--border, #1e293b);
        border-radius: 16px;
        box-shadow: var(--shadow, 0 14px 36px rgba(0, 0, 0, 0.4));
        z-index: 945;
        flex-direction: column;
        overflow: hidden;
      }
      .gsm-chat-popup.open {
        display: flex;
        animation: gsmPopupIn 0.18s ease;
      }
      @keyframes gsmPopupIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .gsm-chat-head {
        padding: 12px 14px;
        background: var(--surface-2, #162033);
        border-bottom: 1px solid var(--border, #1e293b);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .gsm-chat-title-wrap {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .gsm-chat-title {
        font-weight: 800;
        font-size: 0.96rem;
      }
      .gsm-mode-pill {
        font-size: 0.72rem;
        font-weight: 800;
        padding: 2px 8px;
        border-radius: 999px;
        background: rgba(37, 99, 235, 0.16);
        color: #60a5fa;
      }
      .gsm-head-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .gsm-mini-btn {
        background: var(--surface, #0f172a);
        color: var(--text, #f8fafc);
        border: 1px solid var(--border, #1e293b);
        border-radius: 8px;
        min-height: 32px;
        padding: 4px 9px;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
      }
      .gsm-mini-btn.active {
        background: var(--accent, #2563eb);
        color: #ffffff;
        border-color: var(--accent, #2563eb);
      }
      .gsm-chat-quick {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 10px 12px;
        border-bottom: 1px solid var(--border, #1e293b);
        background: var(--surface, #0f172a);
      }
      .gsm-q-chip {
        background: var(--surface-2, #162033);
        color: var(--text, #f8fafc);
        border: 1px solid var(--border, #1e293b);
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
      }
      .gsm-q-chip:hover {
        border-color: var(--accent, #2563eb);
      }
      .gsm-chat-body {
        padding: 12px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 9px;
        flex: 1;
        min-height: 200px;
      }
      .gsm-bubble {
        max-width: 90%;
        padding: 10px 12px;
        border-radius: 12px;
        font-size: 0.88rem;
        line-height: 1.55;
        word-break: break-word;
      }
      .gsm-bubble.bot {
        align-self: flex-start;
        background: var(--surface-2, #162033);
        border: 1px solid var(--border, #1e293b);
      }
      .gsm-bubble.user {
        align-self: flex-end;
        background: var(--accent, #2563eb);
        color: #ffffff;
        font-weight: 600;
      }
      .gsm-chat-form {
        display: flex;
        gap: 8px;
        padding: 10px 12px;
        border-top: 1px solid var(--border, #1e293b);
        background: var(--surface, #0f172a);
      }
      .gsm-chat-input {
        flex: 1;
        min-height: 40px;
        background: var(--surface-2, #162033);
        color: var(--text, #f8fafc);
        border: 1px solid var(--border, #1e293b);
        border-radius: 10px;
        padding: 8px 11px;
        font-size: 0.9rem;
        outline: none;
      }
      .gsm-chat-input:focus {
        border-color: var(--accent, #2563eb);
      }
      .gsm-chat-send {
        min-height: 40px;
        padding: 0 14px;
        background: var(--accent, #2563eb);
        color: #ffffff;
        border: none;
        border-radius: 10px;
        font-weight: 800;
        font-size: 0.88rem;
        cursor: pointer;
      }
      @media (max-width: 480px) {
        .gsm-fab-btn {
          bottom: 14px;
          inset-inline-start: 14px;
          width: 52px;
          height: 52px;
        }
        .gsm-chat-popup {
          bottom: 74px;
          inset-inline-start: 12px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createWidgetDom() {
    if (document.getElementById("gsmFloatingFab")) return;

    const fab = document.createElement("button");
    fab.type = "button";
    fab.id = "gsmFloatingFab";
    fab.className = "gsm-fab-btn";
    fab.setAttribute("aria-label", "فتح المساعد الهجين");
    fab.title = "GSM Yasser Assistant";
    fab.textContent = "💬";

    const popup = document.createElement("section");
    popup.id = "gsmFloatingPopup";
    popup.className = "gsm-chat-popup";
    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-label", "مساعد GSM Yasser Server");

    popup.innerHTML = `
      <div class="gsm-chat-head">
        <div class="gsm-chat-title-wrap">
          <span class="gsm-chat-title">GSM Assistant</span>
          <span class="gsm-mode-pill" id="gsmModeBadge">محلي (مجاني)</span>
        </div>
        <div class="gsm-head-actions">
          <button type="button" class="gsm-mini-btn" id="gsmAiToggleBtn">وضع الـ AI</button>
          <button type="button" class="gsm-mini-btn" id="gsmChatCloseBtn" aria-label="إغلاق">✕</button>
        </div>
      </div>
      <div class="gsm-chat-quick" id="gsmQuickBar"></div>
      <div class="gsm-chat-body" id="gsmChatBody" role="log" aria-live="polite"></div>
      <form class="gsm-chat-form" id="gsmChatForm">
        <input type="text" class="gsm-chat-input" id="gsmChatInput" autocomplete="off" />
        <button type="submit" class="gsm-chat-send" id="gsmChatSendBtn">إرسال</button>
      </form>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(popup);
  }

  function initHybridChatbot() {
    injectStyles();
    createWidgetDom();

    const fab = document.getElementById("gsmFloatingFab");
    const popup = document.getElementById("gsmFloatingPopup");
    const closeBtn = document.getElementById("gsmChatCloseBtn");
    const aiToggleBtn = document.getElementById("gsmAiToggleBtn");
    const modeBadge = document.getElementById("gsmModeBadge");
    const quickBar = document.getElementById("gsmQuickBar");
    const chatBody = document.getElementById("gsmChatBody");
    const chatForm = document.getElementById("gsmChatForm");
    const chatInput = document.getElementById("gsmChatInput");
    const chatSendBtn = document.getElementById("gsmChatSendBtn");

    let useAiWorker = false;
    let history = [];

    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (saved && Array.isArray(saved.history)) {
        history = saved.history;
        useAiWorker = Boolean(saved.useAiWorker);
      }
    } catch (_) {}

    function persistState() {
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ useAiWorker, history: history.slice(-12) })
        );
      } catch (_) {}
    }

    function renderBubble(item) {
      const div = document.createElement("div");
      div.className = `gsm-bubble ${item.sender === "user" ? "user" : "bot"}`;
      if (item.isHtml) div.innerHTML = item.content;
      else div.textContent = item.content;
      chatBody.appendChild(div);
      chatBody.scrollTop = chatBody.scrollHeight;
      return div;
    }

    function renderMessages() {
      const lang = getLang();
      const pack = KNOWLEDGE_BASE[lang] || KNOWLEDGE_BASE.ar;
      chatBody.innerHTML = "";
      if (history.length === 0) {
        renderBubble({ sender: "bot", content: pack.welcome, isHtml: true });
      } else {
        history.forEach(renderBubble);
      }
    }

    function syncLocale() {
      const lang = getLang();
      const pack = KNOWLEDGE_BASE[lang] || KNOWLEDGE_BASE.ar;
      chatInput.placeholder = pack.placeholder;
      chatSendBtn.textContent = pack.send;
      aiToggleBtn.textContent = pack.toggleLabel;
      aiToggleBtn.classList.toggle("active", useAiWorker);
      modeBadge.textContent = useAiWorker ? pack.modeAiBadge : pack.modeLocalBadge;

      quickBar.innerHTML = pack.quickQuestions
        .map(
          (q, idx) =>
            `<button type="button" class="gsm-q-chip" data-q-idx="${idx}">${q.label}</button>`
        )
        .join("");

      renderMessages();
    }

    async function handleUserQuestion(text) {
      const clean = text.trim();
      if (!clean) return;

      const lang = getLang();
      const pack = KNOWLEDGE_BASE[lang] || KNOWLEDGE_BASE.ar;

      const userItem = { sender: "user", content: clean, isHtml: false };
      history.push(userItem);
      renderBubble(userItem);
      persistState();

      // 1) البحث المحلي السريع أولاً (بدون تكلفة API)
      const localMatch = matchLocalKnowledge(clean, lang);
      if (localMatch && !useAiWorker) {
        const botItem = { sender: "bot", content: localMatch, isHtml: true };
        history.push(botItem);
        renderBubble(botItem);
        persistState();
        return;
      }

      // 2) في الوضع الهجين: إذا لم يتطابق محلياً وكان Worker مضبوطاً، أو إذا فعّل المستخدم وضع AI
      if (useAiWorker || WORKER_CHAT_URL) {
        const pendingEl = renderBubble({ sender: "bot", content: pack.thinking, isHtml: false });
        try {
          const workerRes = await askCloudflareWorker(clean, history, lang);
          pendingEl.remove();
          const botItem = {
            sender: "bot",
            content: appendImeiContext(workerRes.text, lang),
            isHtml: false
          };
          history.push(botItem);
          renderBubble(botItem);
          persistState();
          return;
        } catch (_) {
          pendingEl.remove();
          if (localMatch) {
            const botItem = { sender: "bot", content: localMatch, isHtml: true };
            history.push(botItem);
            renderBubble(botItem);
            persistState();
            return;
          }
          const errItem = { sender: "bot", content: pack.workerError, isHtml: false };
          history.push(errItem);
          renderBubble(errItem);
          persistState();
          return;
        }
      }

      // 3) رد محلي افتراضي بدون تكلفة
      const fallbackItem = { sender: "bot", content: pack.fallbackLocal, isHtml: true };
      history.push(fallbackItem);
      renderBubble(fallbackItem);
      persistState();
    }

    fab.addEventListener("click", () => {
      const nextOpen = !popup.classList.contains("open");
      popup.classList.toggle("open", nextOpen);
      if (nextOpen) {
        syncLocale();
        chatInput.focus();
      }
    });

    closeBtn.addEventListener("click", () => {
      popup.classList.remove("open");
    });

    aiToggleBtn.addEventListener("click", () => {
      useAiWorker = !useAiWorker;
      persistState();
      syncLocale();
    });

    quickBar.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-q-idx]");
      if (!chip) return;
      const lang = getLang();
      const pack = KNOWLEDGE_BASE[lang] || KNOWLEDGE_BASE.ar;
      const qObj = pack.quickQuestions[Number(chip.dataset.qIdx)];
      if (qObj) handleUserQuestion(qObj.text);
    });

    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = chatInput.value;
      if (!val.trim()) return;
      chatInput.value = "";
      handleUserQuestion(val);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") popup.classList.remove("open");
    });

    // مزامنة تلقائية عند تغيير لغة الصفحة من أزرار EN / FR / العربية
    const observer = new MutationObserver(() => {
      if (popup.classList.contains("open")) syncLocale();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

    syncLocale();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHybridChatbot);
  } else {
    initHybridChatbot();
  }
})();
