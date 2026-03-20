const fs = require("fs");
const path = require("path");
const assert = require("assert");

const ROOT = path.resolve(__dirname, "..");

function read(name) {
  return fs.readFileSync(path.join(ROOT, name), "utf8");
}

function testOpsCloseWaitsForStrictCloudSync() {
  const html = read("ops.html");

  assert.match(html, /const WORKING_MUTATION_AT_KEY = "tsms_working_last_mutation_at";/);
  assert.match(html, /function buildResetCloseState\(\)/);
  assert.match(html, /function commitResetCloseState\(closeState\)/);
  assert.match(html, /const syncStateNow = \(window\.tsmsCloud && typeof window\.tsmsCloud\.syncStateNow === "function"\)/);
  assert.match(
    html,
    /const closeState = buildResetCloseState\(\);\s*await syncStateNow\(closeState\.syncPayloads\);\s*cloudSynced = true;\s*commitResetCloseState\(closeState\);\s*shouldLogoutAfterClear = true;/
  );
  assert.match(html, /クラウド同期に失敗したため、締め処理は実行していません。/);
}

function testAuthGuardExposesStrictSyncApi() {
  const source = read("auth-guard.js");

  assert.match(source, /backupNowStrict: \(\) => cloudBackupState\(\)/);
  assert.match(source, /captureStateForBackup: \(\) => captureCloudBackupState\(\)/);
  assert.match(source, /syncStateNow: \(\{ safePayload = null, workingPayload = null \} = \{\}\) => cloudBackupState\(\{ safePayload, workingPayload \}\)/);
}

function runTests() {
  const tests = [
    ["締め処理は strict cloud sync 完了後にのみ local clear", testOpsCloseWaitsForStrictCloudSync],
    ["auth guard が strict sync API を公開", testAuthGuardExposesStrictSyncApi]
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
