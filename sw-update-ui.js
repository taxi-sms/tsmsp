const SW_URL = "./sw.js?v=20260228-1";
const STYLE_ID = "tsms-sw-update-ui-style";
const BANNER_ID = "tsms-sw-update-ui-banner";

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
#${BANNER_ID}{
  position:fixed;
  left:10px;
  right:10px;
  bottom:calc(78px + env(safe-area-inset-bottom));
  z-index:2200;
  display:none;
  align-items:center;
  gap:8px;
  padding:10px 12px;
  border:2px solid var(--border,#D5DEE6);
  border-radius:10px;
  background:var(--surface-1,#fff);
  color:var(--text-primary,#111);
  box-shadow:0 8px 22px rgba(0,0,0,.16);
  font-size:13px;
  line-height:1.35;
}
#${BANNER_ID}.show{display:flex;}
#${BANNER_ID} .msg{flex:1 1 auto;min-width:0;}
#${BANNER_ID} .btn{
  appearance:none;
  border:2px solid var(--border,#D5DEE6);
  background:var(--surface-2,#EEF3F6);
  color:var(--text-primary,#111);
  border-radius:6px;
  min-height:40px;
  padding:0 10px;
  font-weight:900;
  font-size:13px;
  white-space:nowrap;
}
#${BANNER_ID} .btn.primary{
  border-color:var(--accent,#2580ED);
  background:var(--accent,#2580ED);
  color:#fff;
}
`;
  document.head.appendChild(style);
}

function ensureBanner() {
  let root = document.getElementById(BANNER_ID);
  if (root) return root;
  root = document.createElement("div");
  root.id = BANNER_ID;
  root.setAttribute("role", "status");
  root.setAttribute("aria-live", "polite");
  root.innerHTML = `
    <div class="msg" id="${BANNER_ID}-msg"></div>
    <button type="button" class="btn primary" id="${BANNER_ID}-reload">更新して再読み込み</button>
    <button type="button" class="btn" id="${BANNER_ID}-close">あとで</button>
  `;
  document.body.appendChild(root);

  const reloadBtn = document.getElementById(`${BANNER_ID}-reload`);
  const closeBtn = document.getElementById(`${BANNER_ID}-close`);
  if (reloadBtn) {
    reloadBtn.addEventListener("click", () => {
      location.reload();
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      root.classList.remove("show");
    });
  }
  return root;
}

function showBanner(message) {
  ensureStyle();
  const root = ensureBanner();
  const msg = document.getElementById(`${BANNER_ID}-msg`);
  if (msg) msg.textContent = String(message || "");
  root.classList.add("show");
}

function bindRegistration(reg) {
  if (!reg || reg.__tsmsUiBound) return;
  reg.__tsmsUiBound = true;

  if (reg.waiting) {
    showBanner("新しいバージョンがあります。再読み込みして反映できます。");
  }

  reg.addEventListener("updatefound", () => {
    const worker = reg.installing;
    if (!worker) return;
    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        showBanner("更新データを取得しました。再読み込みで最新表示になります。");
      }
    });
  });
}

export function installSwUpdateUi() {
  if (window.__tsmsSwUpdateUiInstalled) return;
  window.__tsmsSwUpdateUiInstalled = true;

  if (!("serviceWorker" in navigator)) return;
  if (location.protocol.indexOf("http") !== 0) return;

  const hadController = !!navigator.serviceWorker.controller;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController) return;
    showBanner("アプリ更新を適用しました。再読み込みして最新状態にしてください。");
  });

  window.addEventListener("load", async () => {
    let reg = null;
    try {
      reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register(SW_URL));
    } catch (_) {
      return;
    }
    bindRegistration(reg);
    try { await reg.update(); } catch (_) {}
    if (reg.waiting) {
      showBanner("新しいバージョンがあります。再読み込みして反映できます。");
    }
  });
}

