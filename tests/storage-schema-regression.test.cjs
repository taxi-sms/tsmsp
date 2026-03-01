const assert = require("assert");
const path = require("path");
const { pathToFileURL } = require("url");

class MockStorage {
  constructor(seed = {}) {
    this.map = new Map(Object.entries(seed).map(([k, v]) => [k, String(v)]));
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.map.set(String(key), String(value));
  }
  removeItem(key) {
    this.map.delete(String(key));
  }
  key(index) {
    return Array.from(this.map.keys())[index] || null;
  }
  get length() {
    return this.map.size;
  }
}

async function loadModule() {
  const modPath = path.resolve(__dirname, "..", "storage-schema.js");
  return import(pathToFileURL(modPath).href);
}

async function testMigrationRepairsInvalidShapes() {
  const mod = await loadModule();
  const storage = new MockStorage({
    tsms_reports: '{"bad":1}',
    tsms_reports_archive: "broken-json",
    ops: "null",
    ops_archive_v1: '["x"]',
    tsms_settings: '{"walkRate":60}',
    tsms_sales_plan: "[]",
    tsms_sales_manual_v1: '"abc"',
    tsms_sales_manual_mode: "9",
    tsms_confirm_force_empty: "0",
    tsms_theme: "blue",
    tsms_holidays_jp_v1: '{"map":[],"fetchedAt":"x"}',
    tsms_supabase_config: '{"url":123,"anonKey":null}'
  });

  const result = mod.migrateLocalStorageSchema(storage);
  assert.strictEqual(result.migrated, true);
  assert.ok(result.changedKeys.length >= 1);
  assert.strictEqual(storage.getItem(mod.STORAGE_SCHEMA_VERSION_KEY), String(mod.STORAGE_SCHEMA_VERSION));

  assert.strictEqual(storage.getItem("tsms_reports"), "[]");
  assert.strictEqual(storage.getItem("tsms_reports_archive"), "[]");
  assert.strictEqual(storage.getItem("ops"), "{}");
  assert.strictEqual(storage.getItem("ops_archive_v1"), "{}");
  assert.strictEqual(storage.getItem("tsms_sales_plan"), "{}");
  assert.strictEqual(storage.getItem("tsms_sales_manual_v1"), "{}");
  assert.strictEqual(storage.getItem("tsms_sales_manual_mode"), "0");
  assert.strictEqual(storage.getItem("tsms_confirm_force_empty"), null);
  assert.strictEqual(storage.getItem("tsms_theme"), "light");

  const settings = JSON.parse(storage.getItem("tsms_settings"));
  assert.strictEqual(settings.walkRate, 60);
  assert.strictEqual(settings.taxRate, 10);
  assert.strictEqual(settings.feeRate, 4);

  const holidays = JSON.parse(storage.getItem("tsms_holidays_jp_v1"));
  assert.deepStrictEqual(holidays, { fetchedAt: 0, map: {} });

  const supabaseCfg = JSON.parse(storage.getItem("tsms_supabase_config"));
  assert.strictEqual(supabaseCfg.url, "123");
  assert.strictEqual(supabaseCfg.anonKey, "");

  const backup = JSON.parse(storage.getItem(mod.STORAGE_SCHEMA_BACKUP_KEY));
  assert.strictEqual(backup.toVersion, mod.STORAGE_SCHEMA_VERSION);
  assert.ok(backup.before.tsms_reports);
}

async function testIdempotentMigration() {
  const mod = await loadModule();
  const storage = new MockStorage({
    tsms_reports: "[]",
    tsms_settings: '{"taxRate":10,"feeRate":4,"goFeeYen":100,"walkRate":50,"closeStartDay":16,"closeEndDay":15,"shiftNote":""}'
  });

  const first = mod.migrateLocalStorageSchema(storage);
  assert.strictEqual(first.migrated, true);
  const second = mod.migrateLocalStorageSchema(storage);
  assert.strictEqual(second.migrated, false);
  assert.deepStrictEqual(second.changedKeys, []);
}

async function runTests() {
  const tests = [
    ["不正データ修復", testMigrationRepairsInvalidShapes],
    ["再実行安全性", testIdempotentMigration]
  ];
  let passed = 0;
  for (const [name, fn] of tests) {
    try {
      await fn();
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
