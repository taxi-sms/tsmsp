const fs = require("fs");
const path = require("path");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(ROOT, "tsms-design.css"), "utf8");
const settingsReportEditorCss = fs.readFileSync(path.join(ROOT, "settings-report-editor.css"), "utf8");
const swUpdateUi = fs.readFileSync(path.join(ROOT, "sw-update-ui.js"), "utf8");

function read(name) {
  return fs.readFileSync(path.join(ROOT, name), "utf8");
}

function testSharedShellRulesExist() {
  assert.match(css, /--modal-shell-border: #58C2FF;/);
  assert.match(css, /--modal-shell-shadow: 0 0 20px rgba\(88, 194, 255, 0\.20\), 0 16px 48px rgba\(0,0,0,\.18\);/);
  assert.match(css, /\.page-block-unified \.main \{/);
  assert.match(css, /\.page-block-unified\.page-main-wide \.main \{ max-width: 1080px !important; \}/);
  assert.match(css, /\.page-block-unified\.page-main-xl \.main \{ max-width: 1220px !important; \}/);
  assert.match(css, /\.page-block-unified \.main \.card,[\s\S]*border: 0 !important;/);
  assert.match(css, /\.page-block-unified \.main \.section-boxed,[\s\S]*border: var\(--line-strong\) solid var\(--border\) !important;/);
  assert.match(css, /button\[data-group\]\.is-selected \{[\s\S]*background: var\(--selected-fill\) !important;[\s\S]*color: var\(--selected-text\) !important;[\s\S]*0 0 0 3px var\(--selected-ring\) !important/);
  assert.match(css, /:root\[data-theme="dark"\] \.page-block-unified button\[data-group\]\.is-selected \{[\s\S]*background: var\(--selected-fill\) !important;[\s\S]*border-color: var\(--selected-border\) !important;/);
  assert.match(css, /\.input:focus,[\s\S]*background: var\(--field-focus-bg\) !important;[\s\S]*box-shadow: 0 0 0 4px var\(--field-focus-ring\), inset 0 0 0 1px var\(--field-focus-border\);/);
  assert.match(css, /:root\[data-theme="dark"\] \.page-block-unified \.input:focus,[\s\S]*background: var\(--field-focus-bg\) !important;[\s\S]*0 0 0 4px var\(--field-focus-ring\) !important/);
  assert.match(css, /--choice-btn-ratio: 1\.22 \/ 1;/);
  assert.match(css, /--choice-btn-min-h: 72px;/);
  assert.match(css, /--bottom-nav-size-scale: 0\.95;/);
  assert.match(css, /--bottom-nav-h: calc\(60px \* var\(--bottom-nav-size-scale\)\);/);
  assert.match(css, /--bottom-nav-label-size: calc\(16px \* var\(--bottom-nav-size-scale\)\);/);
  assert.match(css, /--bottom-nav-icon-size: calc\(29px \* var\(--bottom-nav-size-scale\)\);/);
  assert.match(css, /--bottom-nav-item-gap: 1px;/);
  assert.match(css, /--bottom-nav-item-pad-top: calc\(6px \* var\(--bottom-nav-size-scale\)\);/);
  assert.match(css, /--bottom-nav-item-pad-bottom: calc\(7px \* var\(--bottom-nav-size-scale\)\);/);
  assert.match(css, /--bottom-nav-active-glow: rgba\(88, 194, 255, 0\.56\);/);
  assert.match(css, /--bottom-nav-surface: var\(--surface-1\);/);
  assert.match(css, /--bottom-nav-hover-surface: var\(--surface-2\);/);
  assert.match(css, /--more-sheet-surface: var\(--surface-1\);/);
  assert.match(css, /--more-sheet-item-surface: var\(--surface-2\);/);
  assert.match(css, /--more-sheet-item-hover-surface: var\(--surface-3\);/);
  assert.match(css, /:root\[data-theme="dark"\] \{[\s\S]*--bottom-nav-surface: #0e1a2d;[\s\S]*--bottom-nav-hover-surface: #0a1630;[\s\S]*--more-sheet-surface: #0e1a2d;[\s\S]*--more-sheet-item-surface: #0a1630;[\s\S]*--more-sheet-item-hover-surface: #132644;/);
  assert.match(css, /--bottom-nav-safe-zone: 20px;/);
  assert.match(css, /body \{[\s\S]*padding-bottom: calc\(var\(--bottom-nav-h\) \+ env\(safe-area-inset-bottom\) \+ var\(--bottom-nav-safe-zone\)\);/);
  assert.match(css, /\.tsms-bottom-nav \{[\s\S]*background: var\(--bottom-nav-surface\) !important;[\s\S]*padding-bottom: calc\(env\(safe-area-inset-bottom\) \+ var\(--bottom-nav-safe-zone\)\);/);
  assert.match(css, /\.tsms-bottom-nav a,\s*\.tsms-bottom-nav button \{[\s\S]*color: var\(--text-disabled\) !important;[\s\S]*font-size: var\(--bottom-nav-label-size\);[\s\S]*padding: var\(--bottom-nav-item-pad-top\) 0 var\(--bottom-nav-item-pad-bottom\);[\s\S]*gap: var\(--bottom-nav-item-gap\);/);
  assert.match(css, /\.tsms-bottom-nav a > span:last-child,\s*\.tsms-bottom-nav button > span:last-child \{[\s\S]*white-space: nowrap;[\s\S]*line-height: 1;[\s\S]*letter-spacing: -0\.02em;/);
  assert.match(css, /\.tsms-bottom-nav a:hover,\s*\.tsms-bottom-nav button:hover \{[\s\S]*background: var\(--bottom-nav-hover-surface\) !important;/);
  assert.match(css, /\.tsms-bottom-nav \.active \{[\s\S]*color: var\(--brand\) !important;[\s\S]*background: transparent !important;[\s\S]*box-shadow: none;/);
  assert.match(css, /\.tsms-bottom-nav \.active > span:last-child \{[\s\S]*text-shadow: 0 0 10px var\(--bottom-nav-active-glow\);/);
  assert.match(css, /\.tsms-bottom-nav \.active::before \{[\s\S]*content: none;/);
  assert.match(css, /\.tsms-bottom-nav \.ico \{[\s\S]*width: var\(--bottom-nav-icon-size\);[\s\S]*color: currentColor !important;/);
  assert.match(css, /\.tsms-bottom-nav \.ico svg \{[\s\S]*width: var\(--bottom-nav-icon-size\);[\s\S]*stroke: currentColor !important;/);
  assert.match(css, /\.tsms-bottom-nav \.active \.ico,\s*\.tsms-bottom-nav \.active \.ico svg \{[\s\S]*filter: drop-shadow\(0 0 8px var\(--bottom-nav-active-glow\)\);/);
  assert.match(css, /\.tsms-more-sheet \{[\s\S]*background: var\(--more-sheet-surface\) !important;/);
  assert.match(css, /\.tsms-more-sheet a \{[\s\S]*background: var\(--more-sheet-item-surface\) !important;/);
  assert.match(css, /\.tsms-more-sheet a:hover \{[\s\S]*background: var\(--more-sheet-item-hover-surface\) !important;/);
  assert.match(css, /\.table-wrap \{[\s\S]*overflow-y: auto;[\s\S]*max-height: calc\(100dvh - var\(--header-h\) - var\(--bottom-nav-h\) - var\(--bottom-nav-safe-zone\) - 120px - env\(safe-area-inset-bottom\)\);/);
  assert.match(css, /\[aria-label="cache-version"\] \{[\s\S]*margin: 6px 12px calc\(var\(--bottom-nav-h\) \+ 10px \+ env\(safe-area-inset-bottom\) \+ var\(--bottom-nav-safe-zone\)\);/);
  assert.match(css, /\.table-wrap thead th \{[\s\S]*position: sticky;[\s\S]*top: 0;[\s\S]*z-index: 3;/);
  assert.match(css, /:root\[data-theme="dark"\] \.table-wrap thead th \{[\s\S]*box-shadow:/);
  assert.match(css, /\.wf-row > \.btn \{[\s\S]*aspect-ratio: var\(--choice-btn-ratio\);[\s\S]*min-height: var\(--choice-btn-min-h\);/);
  assert.match(css, /\.wf-row > \.btn \.btn-label \{[\s\S]*display: block;[\s\S]*inline-size: min\(100%, 4em\);[\s\S]*margin: 0 auto;[\s\S]*text-wrap: wrap;[\s\S]*word-break: break-all;[\s\S]*overflow-wrap: normal;/);
  assert.match(css, /\.wf-row > \.btn\.is-label-long \.btn-label \{[\s\S]*font-size: calc\(var\(--font-lg\) - 1px\);/);
  assert.match(css, /\.wf-row > \.btn\.is-label-xlong \.btn-label \{[\s\S]*font-size: var\(--font-md\);[\s\S]*line-height: 1\.15;/);
  assert.match(css, /:where\(\.report-entry-page\) \.keypad-grid \{[\s\S]*grid-template-columns: repeat\(4, 1fr\);/);
  assert.match(css, /:where\(\.report-entry-page\) \.key-wide \{[\s\S]*grid-column: span 2;/);
  assert.match(css, /:where\(\.report-entry-page\) \.key-tall \{[\s\S]*grid-row: span 2;/);
  assert.match(css, /:where\(\.report-entry-page\) \.key-submit \{[\s\S]*font-size: var\(--font-xl\);[\s\S]*font-weight: 900;/);
  assert.match(css, /\.btn\.action-main \{[\s\S]*min-height: 118px;[\s\S]*font-size: var\(--font-4xl\);/);
  assert.match(css, /\.btn\.reset-final \{[\s\S]*min-height: 128px;/);
  assert.match(css, /\.page-block-unified \.btn\.action-main,[\s\S]*min-height: 118px !important;[\s\S]*font-size: var\(--font-4xl\) !important;/);
  assert.match(css, /\.page-block-unified \.btn\.reset-final \{[\s\S]*min-height: 128px !important;/);
  assert.match(css, /@media \(min-width: 376px\) and \(max-width: 767px\) \{[\s\S]*\.btn\.action-main \{ min-height: 124px; font-size: var\(--font-xl\); \}[\s\S]*\.btn\.reset-final \{ min-height: 136px; \}/);
  assert.match(css, /@media \(min-width: 768px\) \{[\s\S]*\.btn\.action-main \{ min-height: 132px; font-size: var\(--font-xl\); \}[\s\S]*\.btn\.reset-final \{ min-height: 144px; \}/);
  assert.match(css, /@media \(min-width: 376px\) and \(max-width: 767px\) \{[\s\S]*\.page-block-unified \.btn\.action-main,[\s\S]*min-height: 124px !important;[\s\S]*font-size: var\(--font-xl\) !important;[\s\S]*\.page-block-unified \.btn\.reset-final \{[\s\S]*min-height: 136px !important;/);
  assert.match(css, /@media \(min-width: 768px\) \{[\s\S]*\.page-block-unified \.btn\.action-main,[\s\S]*min-height: 132px !important;[\s\S]*font-size: var\(--font-xl\) !important;[\s\S]*\.page-block-unified \.btn\.reset-final \{[\s\S]*min-height: 144px !important;/);
  assert.match(css, /@media \(max-width: 375px\) \{[\s\S]*\.tsms-bottom-nav a,[\s\S]*--bottom-nav-label-size: calc\(15px \* var\(--bottom-nav-size-scale\)\);[\s\S]*--bottom-nav-icon-size: calc\(28px \* var\(--bottom-nav-size-scale\)\);[\s\S]*--bottom-nav-item-gap: 1px;[\s\S]*--bottom-nav-item-pad-top: calc\(7px \* var\(--bottom-nav-size-scale\)\);[\s\S]*--bottom-nav-item-pad-bottom: calc\(8px \* var\(--bottom-nav-size-scale\)\);[\s\S]*min-height: calc\(54px \* var\(--bottom-nav-size-scale\)\);/);
  assert.match(css, /@media \(min-width: 768px\) \{[\s\S]*\.tsms-bottom-nav a,[\s\S]*--bottom-nav-label-size: calc\(17px \* var\(--bottom-nav-size-scale\)\);[\s\S]*--bottom-nav-icon-size: calc\(31px \* var\(--bottom-nav-size-scale\)\);/);
  assert.match(css, /\.main\[style\*="justify-content:center"\],\s*\.auth-main \{/);
}

function testSharedStateDisplayRulesExist() {
  assert.match(css, /\.state-inline,[\s\S]*\.state-note,[\s\S]*\.state-field,[\s\S]*\.state-meta \{/);
  assert.match(css, /\[data-state-tone="info"\] \{[\s\S]*--state-color: var\(--accent\);[\s\S]*--state-bg-color: var\(--accent-light\);/);
  assert.match(css, /\[data-state-tone="success"\] \{[\s\S]*--state-color: var\(--success\);[\s\S]*--state-bg-color: var\(--success-bg\);/);
  assert.match(css, /\[data-state-tone="warning"\] \{[\s\S]*--state-color: var\(--warning\);[\s\S]*--state-bg-color: var\(--warning-bg\);/);
  assert.match(css, /\[data-state-tone="error"\] \{[\s\S]*--state-color: var\(--danger\);[\s\S]*--state-bg-color: var\(--danger-bg\);/);
  assert.match(css, /\.state-inline::before,[\s\S]*\.state-meta::before \{/);
  assert.match(css, /\.state-note \{[\s\S]*border-left: 4px solid var\(--state-border-color\) !important;[\s\S]*background: var\(--state-bg-color\) !important;/);
  assert.match(css, /\.state-field,[\s\S]*\.page-block-unified \.input\.state-field \{[\s\S]*box-shadow: inset 4px 0 0 0 var\(--state-border-color\);/);
}

function testPagesNoLongerCarryUnifiedShellBlocks() {
  for (const file of [
    "report.html",
    "confirm.html",
    "detail.html",
    "sales.html",
    "ops.html",
    "settings.html",
    "settings2.html"
  ]) {
    const html = read(file);
    assert.doesNotMatch(html, /unified-layout-tweaks/);
  }

  assert.doesNotMatch(read("settings.html"), /<style>/);
  assert.doesNotMatch(read("report.html"), /<style/);
  assert.doesNotMatch(read("confirm.html"), /<style/);
  assert.doesNotMatch(read("detail.html"), /<style/);
  assert.doesNotMatch(read("settings2.html"), /<style/);
  assert.doesNotMatch(read("sales.html"), /<style>\s*:root/);
  assert.doesNotMatch(read("confirm.html"), /confirm-page-tweaks/);
  assert.doesNotMatch(read("detail.html"), /date-switcher label/);
}

function testPageWidthModifiersExist() {
  assert.match(read("sales.html"), /<body class="page-block-unified page-main-xl">/);
  assert.match(read("settings.html"), /<body class="page-block-unified page-main-wide">/);
  assert.match(read("index.html"), /<section class="card section-boxed" aria-label="勤務カレンダー">/);
  assert.match(read("confirm.html"), /<body class="page-block-unified confirm-page">/);
  assert.match(css, /:where\(\.confirm-page\) \.actions\.entry-actions \.actionBtn \{[\s\S]*min-height: 32px;[\s\S]*padding: 6px 10px;[\s\S]*font-size: var\(--font-md\);/);
  assert.match(read("confirm.html"), /id="confirmSummaryModalBg"/);
  assert.match(read("confirm.html"), /id="confirmSummaryModalCountdown"/);
  assert.match(read("report.html"), /id="submitConfirmModalBg"/);
  assert.match(read("report.html"), /<button class="key small key-utility" type="button" data-key="back" aria-label="1文字削除">⌫<\/button>/);
  assert.match(read("report.html"), /<button class="key small key-utility" type="button" data-key="clear" aria-label="現在の金額をクリア">C<\/button>/);
  assert.match(read("report.html"), /<button class="key key-tall key-submit" type="button" data-key="submit">確定<\/button>/);
  assert.match(read("report.html"), /<button class="key key-wide" type="button" data-key="0">0<\/button>/);
  assert.match(read("index.html"), /\.modal\{\s*width:min\(560px,100%\);[\s\S]*border:2px solid var\(--modal-shell-border\);[\s\S]*box-shadow:var\(--modal-shell-shadow\);/);
  assert.match(read("report.html"), /class="result-modal-card confirm-summary-modal-card report-submit-confirm-modal-card"/);
  assert.match(read("report.html"), /class="confirm-summary-modal-title report-submit-confirm-modal-title"/);
  assert.match(read("report.html"), /class="confirm-summary-modal-subtitle report-submit-confirm-modal-subtitle"/);
  assert.match(read("report.html"), /class="confirm-summary-modal-list report-submit-confirm-modal-list"/);
  assert.match(read("report.html"), /<div class="line"><div class="k">支払方法<\/div><div class="v value-highlight" id="confirmPayMethod">-<\/div><\/div>/);
  assert.doesNotMatch(read("report.html"), /submit-confirm-modal-step/);
  assert.match(css, /:where\(\.confirm-page\) \.confirm-summary-modal-card,\s*:where\(\.report-entry-page\) \.report-submit-confirm-modal-card \{/);
  assert.match(css, /:where\(\.confirm-page\) \.confirm-summary-modal-card \{[\s\S]*--confirm-summary-modal-title-size: var\(--font-3xl\);[\s\S]*--confirm-summary-modal-subtitle-size: var\(--font-md\);[\s\S]*--confirm-summary-modal-countdown-size: var\(--font-md\);[\s\S]*--confirm-summary-modal-label-size: var\(--font-md\);[\s\S]*--confirm-summary-modal-value-size: var\(--font-xl\);[\s\S]*--confirm-summary-modal-emphasis-size: var\(--font-5xl\);/);
  assert.match(css, /:where\(\.confirm-page\) \.confirm-summary-modal-title \{[\s\S]*font-size: var\(--confirm-summary-modal-title-size\);[\s\S]*line-height: 1\.08;[\s\S]*white-space: nowrap;/);
  assert.match(css, /:where\(\.confirm-page\) \.confirm-summary-modal-subtitle \{[\s\S]*font-size: var\(--confirm-summary-modal-subtitle-size\);[\s\S]*line-height: 1\.2;[\s\S]*white-space: nowrap;/);
  assert.match(css, /:where\(\.confirm-page\) \.confirm-summary-modal-countdown \{/);
  assert.match(css, /:where\(\.confirm-page\) \.confirm-summary-modal-countdown \{[\s\S]*font-size: var\(--confirm-summary-modal-countdown-size\);[\s\S]*line-height: 1\.15;[\s\S]*white-space: nowrap;/);
  assert.match(css, /:where\(\.confirm-page\) \.confirm-summary-modal-list \.k \{[\s\S]*font-size: var\(--confirm-summary-modal-label-size\) !important;[\s\S]*font-weight: 800;[\s\S]*line-height: 1\.2 !important;[\s\S]*white-space: nowrap;/);
  assert.match(css, /:where\(\.confirm-page\) \.confirm-summary-modal-list \.v \{[\s\S]*font-size: var\(--confirm-summary-modal-value-size\) !important;[\s\S]*font-weight: 900;[\s\S]*line-height: 1\.15 !important;[\s\S]*white-space: nowrap;[\s\S]*overflow-wrap: normal;/);
  assert.match(css, /:where\(\.confirm-page\) \.confirm-summary-modal-list \.v \.value-number\.emphasis,\s*:where\(\.report-entry-page\) \.report-submit-confirm-modal-list \.v \.value-number\.emphasis \{/);
  assert.match(css, /:where\(\.confirm-page\) \.confirm-summary-modal-list \.v \.value-number\.emphasis \{[\s\S]*font-size: var\(--confirm-summary-modal-emphasis-size\);/);
  assert.doesNotMatch(css, /:where\(\.confirm-page\) \.confirm-summary-modal-title,\s*:where\(\.report-entry-page\) \.report-submit-confirm-modal-card \.confirm-summary-modal-title \{/);
  assert.doesNotMatch(css, /:where\(\.confirm-page\) \.confirm-summary-modal-subtitle,\s*:where\(\.report-entry-page\) \.report-submit-confirm-modal-card \.confirm-summary-modal-subtitle \{/);
  assert.doesNotMatch(css, /:where\(\.confirm-page\) \.confirm-summary-modal-list \.v,\s*:where\(\.report-entry-page\) \.report-submit-confirm-modal-list \.v \{/);
  assert.match(css, /:where\(\.report-entry-page\) \.report-submit-confirm-modal-card \{[\s\S]*--report-submit-confirm-title-size: clamp\(26px, 6vw, 28px\);[\s\S]*--report-submit-confirm-subtitle-size: clamp\(18px, 4\.2vw, 20px\);[\s\S]*--report-submit-confirm-label-size: clamp\(16px, 4\.1vw, 18px\);[\s\S]*--report-submit-confirm-value-size: clamp\(20px, 4\.8vw, 22px\);[\s\S]*--report-submit-confirm-button-size: clamp\(18px, 4\.4vw, 20px\);[\s\S]*border: var\(--line-strong\) solid var\(--modal-shell-border\) !important;[\s\S]*border-radius: var\(--radius-lg\);/);
  assert.match(css, /:where\(\.report-entry-page\) \.report-submit-confirm-modal-title \{[\s\S]*font-size: var\(--report-submit-confirm-title-size\);[\s\S]*line-height: 1\.08;[\s\S]*white-space: nowrap;/);
  assert.match(css, /:where\(\.report-entry-page\) \.report-submit-confirm-modal-subtitle \{[\s\S]*font-size: var\(--report-submit-confirm-subtitle-size\);[\s\S]*line-height: 1\.18;[\s\S]*white-space: nowrap;/);
  assert.match(css, /:where\(\.report-entry-page\) \.report-submit-confirm-modal-list \.k \{[\s\S]*font-size: var\(--report-submit-confirm-label-size\) !important;[\s\S]*font-weight: 800;[\s\S]*color: var\(--text-muted\) !important;[\s\S]*white-space: nowrap;/);
  assert.match(css, /:where\(\.report-entry-page\) \.report-submit-confirm-modal-list \.v \{[\s\S]*font-size: var\(--report-submit-confirm-value-size\) !important;[\s\S]*font-weight: 900;[\s\S]*white-space: normal;[\s\S]*word-break: normal;[\s\S]*overflow-wrap: anywhere;[\s\S]*line-height: 1\.2 !important;/);
  assert.match(css, /:where\(\.report-entry-page\) \.report-submit-confirm-modal-actions \.btn \{[\s\S]*min-height: 58px !important;[\s\S]*font-size: var\(--report-submit-confirm-button-size\) !important;/);
  assert.match(css, /\.result-modal-card \{[\s\S]*border: var\(--line-strong\) solid var\(--modal-shell-border\) !important;[\s\S]*box-shadow: var\(--modal-shell-shadow\);/);
  assert.match(css, /:where\(\.settings-report-legacy-page\) \.editor-modal-card \{[\s\S]*border: var\(--line-strong\) solid var\(--modal-shell-border\);[\s\S]*box-shadow: var\(--modal-shell-shadow\), 0 0 0 1px rgba\(126,167,235,\.22\) inset;/);
  assert.match(css, /:where\(\.report-entry-page\) \.confirm-modal-card,\s*:where\(\.report-entry-page\) \.result-modal-card \{[\s\S]*border: var\(--line-strong\) solid var\(--modal-shell-border\);[\s\S]*box-shadow: var\(--modal-shell-shadow\);/);
  assert.match(css, /:where\(\.report-entry-page\),[\s\S]*--legacy-page-border: #999;/);
  assert.match(css, /body:where\(\.report-entry-page\),[\s\S]*background: var\(--bg\);[\s\S]*color: var\(--text-primary\);/);
}

function testSettingsReportEditorUsesSharedTypeScale() {
  assert.match(settingsReportEditorCss, /\.settings-report-page \.settings-mode-banner\{[\s\S]*font-size:var\(--font-xl\);/);
  assert.match(settingsReportEditorCss, /\.settings-report-page \.settings-top-note\{[\s\S]*font-size:var\(--font-sm\);/);
  assert.match(settingsReportEditorCss, /\.settings-report-page \.wf-label\{[\s\S]*font-size:var\(--font-md\);/);
  assert.match(settingsReportEditorCss, /\.settings-report-page \.editor-modal-title\{[\s\S]*font-size:clamp\(24px, 5\.8vw, 28px\);/);
  assert.match(settingsReportEditorCss, /\.settings-report-page \.editor-modal-step\{[\s\S]*font-size:var\(--font-lg\);/);
  assert.match(settingsReportEditorCss, /\.settings-report-page \.editor-modal-label\{[\s\S]*font-size:var\(--font-md\);/);
  assert.match(settingsReportEditorCss, /\.settings-report-page \.editor-modal-help\{[\s\S]*font-size:var\(--font-sm\);/);
  assert.match(settingsReportEditorCss, /\.settings-report-page \.editor-check\{[\s\S]*font-size:var\(--font-md\);/);
}

function testSwUpdateBannerStacksOnMobile() {
  assert.match(swUpdateUi, /#\$\{BANNER_ID\} \.msg\{flex:1 1 auto;min-width:0;\}/);
  assert.match(swUpdateUi, /#\$\{BANNER_ID\} \.btn\{[\s\S]*display:inline-flex;[\s\S]*justify-content:center;[\s\S]*flex:0 0 auto;/);
  assert.match(swUpdateUi, /@media \(max-width: 767px\)\{[\s\S]*#\$\{BANNER_ID\}\{[\s\S]*flex-wrap:wrap;[\s\S]*align-items:flex-start;[\s\S]*#\$\{BANNER_ID\} \.msg\{[\s\S]*flex:1 0 100%;[\s\S]*#\$\{BANNER_ID\} \.btn\{[\s\S]*flex:1 1 0;[\s\S]*min-width:0;/);
}

function testHeaderActionGrammarIsUnified() {
  for (const file of ["confirm.html", "detail.html", "ops.html", "sales.html", "settings.html"]) {
    assert.match(read(file), /class="header-to-report" href="report\.html">日報入力へ</);
    assert.doesNotMatch(read(file), />入力画面へ</);
  }

  assert.match(read("report.html"), /class="header-to-report" href="report\.html">再読み込み</);
  assert.match(read("settings2.html"), /class="header-to-report" href="settings\.html">設定へ</);
}

function testPagesUseSharedStateDisplayGrammar() {
  assert.match(read("index.html"), /id="syncStatusInline" class="state-inline" data-state-tone="neutral" aria-live="polite"/);
  assert.match(read("index.html"), /syncInline\.dataset\.stateTone = "success";/);
  assert.match(read("index.html"), /syncInline\.dataset\.stateTone = "error";/);
  assert.match(read("ops.html"), /id="opsSyncMeta" data-state-tone="neutral" aria-live="polite">最終クラウド同期: --<\/div>/);
  assert.match(read("ops.html"), /opsSyncMeta\.dataset\.stateTone = "success";/);
  assert.match(read("ops.html"), /opsSyncMeta\.dataset\.stateTone = "error";/);
  assert.match(read("detail.html"), /id="detailModeNote"/);
  assert.match(read("detail.html"), /state-note" data-state-tone="error">テストデータを表示中です。クラウドには保存されません。/);
  assert.match(read("settings.html"), /id="subscriptionNote" data-state-tone="neutral" aria-live="polite">/);
  assert.match(read("settings.html"), /id="subscriptionStatus" data-state-tone="info" aria-live="polite">確認中\.\.\.<\/div>/);
  assert.match(read("settings.html"), /function setStateTone\(el, tone\)/);
  assert.match(read("settings2.html"), /id="saveStatus" data-state-tone="neutral" aria-live="polite">/);
  assert.match(read("settings2.html"), /saveStatus\.dataset\.stateTone = "warning";/);
  assert.match(read("settings2.html"), /saveStatus\.dataset\.stateTone = "info";/);
  assert.match(read("settings2.html"), /saveStatus\.dataset\.stateTone = "error";/);
}

function testSettingsHubPagesExist() {
  const home = read("settings-home.html");
  const report = read("settings-report.html");
  const calc = read("settings-calc.html");
  const period = read("settings-period.html");
  const backup = read("settings-backup.html");
  const account = read("settings-account.html");
  const guard = read("auth-guard.js");

  assert.match(home, /設定トップ/);
  assert.match(home, /settings-report\.html/);
  assert.match(home, /settings-calc\.html/);
  assert.match(home, /settings-period\.html/);
  assert.match(home, /settings-backup\.html/);
  assert.match(home, /settings-account\.html/);
  assert.match(home, /旧 settings\.html/);
  assert.match(home, /id="themeMode"/);
  assert.match(home, /terms\.html/);
  assert.match(home, /privacy\.html/);
  assert.match(home, /commerce\.html/);
  assert.match(report, /data-save-redirect="settings-home\.html"/);
  assert.match(report, /変更を保存して設定トップへ戻る/);
  assert.doesNotMatch(calc, /id="themeMode"/);
  assert.match(calc, /id="btnSaveCalcHome"/);
  assert.match(period, /id="closeStartDay"/);
  assert.match(period, /id="btnResetPeriod"/);
  assert.match(backup, /id="btnExportBackup"/);
  assert.match(backup, /id="btnCloudRestore"/);
  assert.doesNotMatch(backup, /terms\.html/);
  assert.doesNotMatch(backup, /privacy\.html/);
  assert.doesNotMatch(backup, /commerce\.html/);
  assert.match(account, /id="subscriptionStatus"/);
  assert.match(account, /id="btnDeleteAccount"/);
  assert.match(account, /アカウントパスワード変更/);
  assert.match(account, /<div class="label">アカウント削除<\/div>/);
  assert.match(account, /data-state-tone="warning">アカウントを削除（退会）出来ます。/);
  assert.match(account, /class="btn danger" id="btnDeleteAccount"/);
  assert.doesNotMatch(account, /terms\.html/);
  assert.doesNotMatch(account, /privacy\.html/);
  assert.doesNotMatch(account, /commerce\.html/);
  assert.match(guard, /settings-account\.html\?subscription=required/);
}

function testSettingsNavigationPointsToHub() {
  for (const file of [
    "report.html",
    "confirm.html",
    "detail.html",
    "ops.html",
    "sales.html",
    "settings.html",
    "settings2.html",
    "index.html"
  ]) {
    const html = read(file);
    assert.match(html, /settings-home\.html/);
  }
}

function testDesignSystemDocExists() {
  const doc = read("DESIGN-SYSTEM.md");
  assert.match(doc, /Source Of Truth/);
  assert.match(doc, /Forbidden Patterns/);
}

function runTests() {
  const tests = [
    ["共通シェル定義", testSharedShellRulesExist],
    ["共通状態表示定義", testSharedStateDisplayRulesExist],
    ["主要画面の重複シェル削減", testPagesNoLongerCarryUnifiedShellBlocks],
    ["画面幅修飾", testPageWidthModifiersExist],
    ["設定 editor typography", testSettingsReportEditorUsesSharedTypeScale],
    ["SW 更新バナー mobile stack", testSwUpdateBannerStacksOnMobile],
    ["ヘッダー右上アクション文法", testHeaderActionGrammarIsUnified],
    ["主要画面の状態表示文法", testPagesUseSharedStateDisplayGrammar],
    ["設定ハブページ追加", testSettingsHubPagesExist],
    ["設定導線のハブ化", testSettingsNavigationPointsToHub],
    ["デザインルール文書", testDesignSystemDocExists]
  ];

  let passed = 0;
  for (const [name, fn] of tests) {
    try {
      fn();
      passed += 1;
      console.log(`PASS: ${name}`);
    } catch (err) {
      console.error(`FAIL: ${name}`);
      console.error(err && err.stack ? err.stack : err);
      process.exitCode = 1;
      break;
    }
  }

  if (passed === tests.length) {
    console.log(`OK: ${passed} tests passed.`);
  }
}

runTests();
