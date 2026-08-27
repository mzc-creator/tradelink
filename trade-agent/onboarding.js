(function (global) {
  const STYLE_ID = 'tl-tour-style';
  const CSS = `
#tl-tour-root{position:fixed;inset:0;z-index:240;pointer-events:none}
#tl-tour-root.active{pointer-events:auto}
.tl-tour-mask{position:absolute;inset:0;background:rgba(15,23,42,.48)}
.tl-tour-hole{position:absolute;border-radius:12px;box-shadow:0 0 0 9999px rgba(15,23,42,.48);outline:2px solid #7c3aed;transition:top .18s,left .18s,width .18s,height .18s;pointer-events:none;background:transparent}
.tl-tour-card{position:absolute;width:min(360px,calc(100vw - 32px));background:#fff;border-radius:14px;box-shadow:0 18px 50px rgba(15,23,42,.22);padding:16px 16px 12px;z-index:2;color:#0f172a;font-family:inherit}
.tl-tour-card.center{left:50%;top:50%;transform:translate(-50%,-50%)}
.tl-tour-kicker{font-size:11px;font-weight:700;letter-spacing:.04em;color:#7c3aed;margin-bottom:6px}
.tl-tour-card h3{font-size:16px;font-weight:750;margin:0 0 8px;line-height:1.35}
.tl-tour-card p{font-size:13px;line-height:1.65;color:#475569;margin:0 0 14px}
.tl-tour-foot{display:flex;align-items:center;gap:8px}
.tl-tour-prog{font-size:12px;color:#94a3b8;font-weight:600;margin-right:auto}
.tl-tour-foot button{border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:650;font-family:inherit;cursor:pointer}
.tl-tour-skip{background:transparent;color:#64748b}
.tl-tour-skip:hover{color:#0f172a}
.tl-tour-prev{background:#f1f5f9;color:#334155}
.tl-tour-next{background:#7c3aed;color:#fff}
.tl-tour-next:hover{background:#6d28d9}
.btn-tour{background:#fff!important;color:#7c3aed!important;border:1px solid rgba(124,58,237,.28)!important}
.btn-tour:hover{background:rgba(124,58,237,.08)!important}
`;

  let session = null;

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  function keyName(key) { return 'tradelink_tour_' + key; }
  function isDone(key) {
    try { return localStorage.getItem(keyName(key)) === '1'; } catch (e) { return false; }
  }
  function markDone(key) {
    try { localStorage.setItem(keyName(key), '1'); } catch (e) {}
  }

  function onKey(e) {
    if (!session) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
    else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  }
  function onResize() { if (session) paint(); }

  function close(save) {
    if (session && save) markDone(session.key);
    const href = session && session._finishHref;
    session = null;
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', onResize);
    document.getElementById('tl-tour-root')?.remove();
    if (href) location.href = href;
  }

  function placeCard(card, holeRect) {
    if (!holeRect) {
      card.classList.add('center');
      card.style.left = '';
      card.style.top = '';
      return;
    }
    card.classList.remove('center');
    const pad = 12, cw = card.offsetWidth, ch = card.offsetHeight;
    let top = holeRect.bottom + pad;
    if (top + ch > window.innerHeight - 12 && holeRect.top > ch + pad) top = holeRect.top - ch - pad;
    top = Math.min(Math.max(12, top), Math.max(12, window.innerHeight - ch - 12));
    let left = holeRect.left;
    left = Math.min(Math.max(12, left), Math.max(12, window.innerWidth - cw - 12));
    card.style.left = left + 'px';
    card.style.top = top + 'px';
  }

  function paint() {
    if (!session) return;
    const step = session.steps[session.index];
    if (typeof step.before === 'function') step.before();
    const el = step.sel ? document.querySelector(step.sel) : null;
    const root = document.getElementById('tl-tour-root');
    if (!root) return;
    const hole = root.querySelector('.tl-tour-hole');
    const card = root.querySelector('.tl-tour-card');
    card.querySelector('.tl-tour-kicker').textContent = step.kicker || '新手引导';
    card.querySelector('h3').textContent = step.title;
    const p = card.querySelector('p');
    p.textContent = step.body || '';
    p.style.display = step.body ? '' : 'none';
    card.querySelector('.tl-tour-prog').textContent = (session.offset + session.index + 1) + ' / ' + session.total;
    card.querySelector('.tl-tour-prev').style.visibility = session.index === 0 ? 'hidden' : 'visible';
    card.querySelector('.tl-tour-next').textContent = session.index === session.steps.length - 1
      ? (step.doneLabel || (step.continue ? '下一步' : '完成')) : '下一步';

    const apply = function () {
      const mask = root.querySelector('.tl-tour-mask');
      if (el) {
        const r = el.getBoundingClientRect();
        const p = 6;
        mask.style.display = 'none';
        hole.style.display = 'block';
        hole.style.top = (r.top - p) + 'px';
        hole.style.left = (r.left - p) + 'px';
        hole.style.width = Math.max(24, r.width + p * 2) + 'px';
        hole.style.height = Math.max(24, r.height + p * 2) + 'px';
        hole.style.borderRadius = step.radius || '12px';
        placeCard(card, r);
      } else {
        mask.style.display = 'block';
        hole.style.display = 'none';
        placeCard(card, null);
      }
    };

    if (el) {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      setTimeout(apply, 80);
    } else apply();
  }

  function next() {
    if (!session) return;
    if (session.index >= session.steps.length - 1) {
      const last = session.steps[session.index];
      session._finishHref = last.href || '';
      close(!last.continue);
      return;
    }
    session.index += 1;
    paint();
  }
  function prev() {
    if (!session || session.index === 0) return;
    session.index -= 1;
    paint();
  }

  function start(steps, opts) {
    opts = opts || {};
    const key = opts.storageKey || 'default';
    if (!opts.force && isDone(key)) return;
    if (!steps || !steps.length) return;
    ensureStyle();
    close(false);
    session = { steps: steps.slice(), index: 0, key: key, _finishHref: '', offset: opts.offset || 0, total: opts.total || steps.length };
    const root = document.createElement('div');
    root.id = 'tl-tour-root';
    root.className = 'active';
    root.innerHTML = '<div class="tl-tour-mask"></div><div class="tl-tour-hole"></div>' +
      '<div class="tl-tour-card">' +
      '<div class="tl-tour-kicker">新手引导</div><h3></h3><p></p>' +
      '<div class="tl-tour-foot"><span class="tl-tour-prog"></span>' +
      '<button type="button" class="tl-tour-skip">跳过</button>' +
      '<button type="button" class="tl-tour-prev">上一步</button>' +
      '<button type="button" class="tl-tour-next">下一步</button></div></div>';
    document.body.appendChild(root);
    root.querySelector('.tl-tour-skip').onclick = function () { close(true); };
    root.querySelector('.tl-tour-prev').onclick = prev;
    root.querySelector('.tl-tour-next').onclick = next;
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onResize);
    paint();
  }

  global.TradeOnboarding = {
    start: start,
    replay: function (steps, opts) { start(steps, Object.assign({}, opts || {}, { force: true })); },
    done: isDone
  };
  ensureStyle();
})(window);
