// ==UserScript==
// @name         Airflow Mark DAG run as "queued"
// @namespace    https://*.composer.googleusercontent.com
// @version      1.0
// @description  Adds a "queued" option to the "Mark state as…" menu on the Airflow 2.9 grid view (Cloud Composer). Re-queues the selected DAG run via the existing /dagrun_queued endpoint.
// @match        https://*.composer.googleusercontent.com/dags/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=airflow.apache.org
// @run-at       document-idle
// @grant        none
// ==/UserScript==
(function () {
  'use strict';

  const log = (...a) => console.debug('[mark-queued]', ...a);
  const meta = (name) => {
    const m = document.querySelector(`meta[name="${name}"]`);
    return m ? m.getAttribute('content') : null;
  };

  // The Airflow grid React app lives inside an open shadow root on <div id="root">.
  function getShadow() {
    const host = document.getElementById('root');
    return host && host.shadowRoot ? host.shadowRoot : null;
  }

  // Identify the "Mark state as…" menu (items: failed + success, and NOT the Clear menu).
  function findMarkMenu(shadow) {
    for (const menu of shadow.querySelectorAll('[role="menu"]')) {
      const items = [...menu.querySelectorAll('[role="menuitem"]')].map((i) => i.textContent.trim());
      if (items.includes('failed') && items.includes('success') && !items.some((t) => /Clear/i.test(t))) {
        return menu;
      }
    }
    return null;
  }

  async function markQueued() {
    const url = meta('dagrun_queued_url');
    const csrf = meta('csrf_token');
    const params = new URLSearchParams(location.search);
    const dagId = location.pathname.match(/\/dags\/([^/]+)/)?.[1];
    const runId = params.get('dag_run_id');
    if (!url || !csrf || !dagId || !runId) {
      alert('mark-queued: missing url/csrf/dag_id/dag_run_id — aborting.');
      return;
    }
    if (!confirm(`Mark DAG run as "queued"?\n\nDAG: ${dagId}\nRun: ${runId}\n\nThis re-queues the run for the scheduler.`)) return;

    const body = new URLSearchParams({ csrf_token: csrf, dag_id: dagId, dag_run_id: runId, confirmed: 'true' });
    try {
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRFToken': csrf },
        body,
      });
      if (res.ok || res.status === 302) {
        log('queued OK', res.status);
        location.reload();
      } else {
        const txt = await res.text().catch(() => '');
        alert(`mark-queued failed: HTTP ${res.status}\n${txt.slice(0, 300)}`);
      }
    } catch (e) {
      alert('mark-queued request error: ' + e.message);
    }
  }

  // Inject a "queued" item, styled by cloning the existing "failed" item so it looks native.
  function injectQueued(menu) {
    if (menu.querySelector('[data-mark-queued]')) return;
    // Only meaningful for a DAG run (not a task instance).
    if (new URLSearchParams(location.search).get('task_id')) return;

    const failedItem = [...menu.querySelectorAll('[role="menuitem"]')].find((i) => i.textContent.trim() === 'failed');
    if (!failedItem) return;

    const q = failedItem.cloneNode(true);
    q.setAttribute('data-mark-queued', '1');
    q.removeAttribute('id');
    q.removeAttribute('disabled');
    q.setAttribute('aria-disabled', 'false');
    // Replace label text node ("failed" -> "queued")
    q.childNodes.forEach((n) => { if (n.nodeType === Node.TEXT_NODE) n.textContent = 'queued'; });
    // Recolor the status swatch to the "queued" colour (gray)
    const swatch = q.querySelector('div');
    if (swatch) swatch.style.background = '#888888';
    q.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); markQueued(); }, true);

    menu.appendChild(q);
    log('injected queued item');
  }

  function watch(shadow) {
    const tryInject = () => {
      const menu = findMarkMenu(shadow);
      if (menu) injectQueued(menu);
    };
    new MutationObserver(tryInject).observe(shadow, { childList: true, subtree: true });
    tryInject();
  }

  // Wait for the shadow root to appear.
  (function waitForShadow() {
    const shadow = getShadow();
    if (shadow) { watch(shadow); return; }
    const obs = new MutationObserver(() => {
      const s = getShadow();
      if (s) { obs.disconnect(); watch(s); }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  })();
})();
