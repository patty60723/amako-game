/* v723: formal three-chapter rollback navigation compatibility only.
   Run synchronously in the same-origin root head, before the game dispatcher.
   No story records, chapter source, cookies, network or third-party storage. */
(function () {
  'use strict';
  const NAV = 'amako_three_chapter_review_navigation_v231';
  const BACKUP = 'amako_formal_rollback_navigation_v723_backup';
  const SCHEMA = 'amako.formal-rollback-navigation/v723';
  function publish(status, reason, backupKey) {
    const result = { schema: SCHEMA, status, reason };
    if (backupKey) result.backupKey = backupKey;
    window.amakoFormalRollbackNavigationV723 = Object.freeze(result);
  }
  function fail(reason, backupKey) {
    publish('failed', reason, backupKey);
    function showFailure() {
      if (document.getElementById('amako-formal-rollback-error-v723')) return;
      const alert = document.createElement('section');
      alert.id = 'amako-formal-rollback-error-v723';
      alert.setAttribute('role', 'alert');
      alert.setAttribute('aria-live', 'assertive');
      alert.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:20px;padding:32px;box-sizing:border-box;background:#eef0e9;color:#233940;font:20px/1.7 system-ui,sans-serif;text-align:center';
      const message = document.createElement('p');
      message.textContent = '目前無法安全確認遊戲的章節位置。遊戲存檔沒有被刪除，請重新整理後再試一次。';
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = '重新整理';
      retry.style.cssText = 'min-height:48px;min-width:120px;padding:8px 20px;font:inherit;color:inherit;background:#fff;border:1px solid #67818b;border-radius:6px';
      retry.addEventListener('click', function () { window.location.reload(); });
      alert.appendChild(message);
      alert.appendChild(retry);
      (document.body || document.documentElement).appendChild(alert);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showFailure, { once: true });
    else showFailure();
  }
  let storage, raw, value;
  try { storage = window.localStorage; raw = storage.getItem(NAV); }
  catch (_) { fail('navigation_read_failed'); return; }
  if (raw === null) { publish('unchanged', 'navigation_missing'); return; }
  try { value = JSON.parse(raw); }
  catch (_) { publish('unchanged', 'navigation_invalid_json'); return; }
  if (!value || Array.isArray(value) || typeof value !== 'object' || Object.keys(value).length !== 2 || !Object.prototype.hasOwnProperty.call(value, 'version') || !Object.prototype.hasOwnProperty.call(value, 'active') || value.version !== 1 || typeof value.active !== 'string') {
    publish('unchanged', 'navigation_unknown_schema'); return;
  }
  if (value.active !== 'ch04') { publish('unchanged', 'navigation_not_fourth'); return; }
  let backupKey = '', emptyKey = '';
  try {
    for (let i = 0; i < 32; i++) {
      const key = BACKUP + (i ? '_' + i : '');
      const prior = storage.getItem(key);
      if (prior === raw) { backupKey = key; break; }
      if (prior === null && !emptyKey) emptyKey = key;
    }
    if (!backupKey) {
      if (!emptyKey) { fail('backup_slots_full'); return; }
      storage.setItem(emptyKey, raw);
      if (storage.getItem(emptyKey) !== raw) { fail('backup_readback_failed'); return; }
      backupKey = emptyKey;
    }
  } catch (_) { fail('backup_failed'); return; }
  // Compare again after backup. A different tab must not have its navigation overwritten.
  try {
    if (storage.getItem(NAV) !== raw) { fail('navigation_changed_during_backup', backupKey); return; }
    const next = JSON.stringify({ version: 1, active: 'ch03' });
    storage.setItem(NAV, next);
    if (storage.getItem(NAV) !== next) { fail('navigation_write_readback_failed', backupKey); return; }
  } catch (_) { fail('navigation_write_failed', backupKey); return; }
  publish('migrated', 'fourth_to_third', backupKey);
}());
