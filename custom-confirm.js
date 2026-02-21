(function(){
  if (window.tsmsConfirm) return;

  var queue = Promise.resolve();

  function ensureModal(){
    if (document.getElementById("tsmsConfirmOverlay")) return;

    var style = document.createElement("style");
    style.id = "tsms-confirm-style";
    style.textContent = [
      ".tsms-confirm-overlay{position:fixed;inset:0;z-index:1500;background:rgba(0,0,0,.45);display:none;align-items:center;justify-content:center;padding:16px;}",
      ".tsms-confirm-overlay.show{display:flex;}",
      ".tsms-confirm-card{width:min(520px,100%);background:var(--surface-1,#fff);border:2px solid var(--border,#ccc);padding:14px;box-sizing:border-box;}",
      ".tsms-confirm-title{font-size:18px;font-weight:900;margin:0 0 10px;color:var(--text-primary,#111);line-height:1.4;word-break:break-word;}",
      ".tsms-confirm-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;}"
    ].join("");
    document.head.appendChild(style);

    var overlay = document.createElement("div");
    overlay.id = "tsmsConfirmOverlay";
    overlay.className = "tsms-confirm-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = '' +
      '<div class="tsms-confirm-card" role="dialog" aria-modal="true" aria-labelledby="tsmsConfirmTitle">' +
      '  <p class="tsms-confirm-title" id="tsmsConfirmTitle"></p>' +
      '  <div class="tsms-confirm-actions">' +
      '    <button class="btn" type="button" id="tsmsConfirmNoBtn">いいえ</button>' +
      '    <button class="btn next" type="button" id="tsmsConfirmYesBtn">はい</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(overlay);
  }

  function showConfirm(message){
    ensureModal();

    var overlay = document.getElementById("tsmsConfirmOverlay");
    var title = document.getElementById("tsmsConfirmTitle");
    var noBtn = document.getElementById("tsmsConfirmNoBtn");
    var yesBtn = document.getElementById("tsmsConfirmYesBtn");

    title.textContent = String(message || "この操作を実行しますか？");

    return new Promise(function(resolve){
      var closed = false;

      function cleanup(result){
        if (closed) return;
        closed = true;
        overlay.classList.remove("show");
        overlay.setAttribute("aria-hidden", "true");
        overlay.removeEventListener("click", onOverlayClick);
        noBtn.removeEventListener("click", onNo);
        yesBtn.removeEventListener("click", onYes);
        document.removeEventListener("keydown", onKeyDown);
        resolve(result);
      }

      function onOverlayClick(e){
        if (e.target === overlay) cleanup(false);
      }
      function onNo(){ cleanup(false); }
      function onYes(){ cleanup(true); }
      function onKeyDown(e){
        if (e.key === "Escape") cleanup(false);
      }

      overlay.addEventListener("click", onOverlayClick);
      noBtn.addEventListener("click", onNo);
      yesBtn.addEventListener("click", onYes);
      document.addEventListener("keydown", onKeyDown);

      overlay.classList.add("show");
      overlay.setAttribute("aria-hidden", "false");
      noBtn.focus();
    });
  }

  window.tsmsConfirm = function(message){
    queue = queue.then(function(){ return showConfirm(message); });
    return queue;
  };
})();
