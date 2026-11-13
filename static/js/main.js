/* Page logic. Settings live in static/js/config.js */
if (typeof CONFIG === 'undefined') {
  document.body.insertAdjacentHTML('afterbegin',
    '<div style="padding:16px;background:#DC2626;color:#fff;font:600 15px Inter,sans-serif;text-align:center">' +
    'static/js/config.js is missing or has a syntax error, so the videos cannot be listed.</div>');
  throw new Error('CONFIG not loaded');
}
/* ===================================================================== */
const V = 'static/videos/';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function tile(file, { ratio = 'r43', label = '', extra = '', cls = '', hover = false, caption = '' } = {}) {
  return `<div class="vid ${ratio} ${cls}" data-caption="${esc(caption || label)}">
    <span class="ph">${esc(label)}<br>${esc(file)}</span>
    <video muted loop playsinline preload="none" data-src="${V + file}"${hover ? ' data-hover' : ''}></video>
    ${extra}</div>`;
}
function pos(phi, R = 38) { // 0° = robot side (bottom), 180° = opposite side (top)
  const r = phi * Math.PI / 180;
  return { l: (50 + R * Math.sin(r)).toFixed(1) + '%', t: (50 + R * Math.cos(r)).toFixed(1) + '%' };
}
function minimap(phi) {
  const c = pos(phi), w = pos(phi + 180);
  return `<div class="minimap" aria-hidden="true"><div class="tb"></div><div class="bs"></div>
    <div class="cam" style="left:${c.l};top:${c.t}"></div>
    <div class="wh" style="left:${w.l};top:${w.t}">✕</div></div>`;
}

/* ---------- lazy load + autoplay when visible ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) {
      if (v.hasAttribute('data-hover')) return;
      if (!v.getAttribute('src')) v.src = v.dataset.src;
      v.play().catch(() => {});
    } else if (!v.paused) v.pause();
  });
}, { rootMargin: '200px' });
function watch(root = document) {
  $$('video[data-src]', root).forEach(v => {
    if (v._watched) return; v._watched = true;
    v.addEventListener('error', () => v.removeAttribute('src'));
    io.observe(v);
    if (v.hasAttribute('data-hover')) {
      const box = v.parentNode;
      box.addEventListener('mouseenter', () => { if (!v.getAttribute('src')) v.src = v.dataset.src; v.play().catch(() => {}); });
      box.addEventListener('mouseleave', () => v.pause());
    }
  });
}
function segToggle(el, items, onPick) {
  el.innerHTML = items.map((it, i) => `<button type="button" role="tab" data-i="${i}" class="${i ? '' : 'on'}">${esc(it.name)}</button>`).join('');
  $$('button', el).forEach(b => b.addEventListener('click', () => {
    $$('button', el).forEach(x => x.classList.toggle('on', x === b));
    onPick(+b.dataset.i);
  }));
}

/* ---------- 1. real world ---------- */
// Angle around the table, clockwise, robot at the top (0 = robot side, 180 = opposite side).
function ringPos(deg) {
  const r = deg * Math.PI / 180;
  return { l: (50 + 41 * Math.sin(r)).toFixed(1) + '%', t: (55 - 34 * Math.cos(r)).toFixed(1) + '%' };
}
function camMap(visible, blind) {
  const v = ringPos(visible), b = ringPos(blind);
  return `<div class="rmap" aria-hidden="true"><div class="rm-robot"></div><div class="rm-table"></div>
    <div class="rm-vis" style="left:${v.l};top:${v.t}"></div>
    <div class="rm-blind" style="left:${b.l};top:${b.t}">✕</div></div>`;
}
(function renderReal() {
  const legend = `<div class="legend-panel">
      <div class="split-map" aria-hidden="true">
        <div class="sm-robot">robot</div>
        <div class="sm-circle"><div class="sm-table">table</div></div>
      </div>
      <ul class="legend">
        <li><span class="sw" style="background:#FDBA74"></span>camera 1 in training</li>
        <li><span class="sw" style="background:#93C5FD"></span>camera 2 in training</li>
        <li><span class="lg-vis"></span>visible camera</li>
        <li><span class="lg-blind">✕</span>blind camera</li>
      </ul></div>`;
  $('#real-blocks').innerHTML = CONFIG.real.map(task => {
    const clips = task.clips.map((c, i) => {
      const extra = camMap(c.visible, c.blind) +
        `<div class="badge tr"><span>1×</span><span class="ok">✓ Success</span></div>`;
      return `<div class="cell">${tile(c.file, { label: `${task.name} · clip ${i + 1}`, extra, caption: `${task.name} · clip ${i + 1}` })}</div>`;
    }).join('');
    return `<div class="real-block"><h3>${esc(task.name)}</h3><div class="grid-2 real-tiles">${clips}</div></div>`;
  }).join('');
  // Put the legend to the right of the section intro (eyebrow, title, paragraph)
  const wrap = $('#real .wrap');
  const intro = document.createElement('div');
  intro.className = 'real-intro';
  const left = document.createElement('div');
  left.className = 'real-intro-text';
  ['.eyebrow', 'h2', '.lead'].forEach(sel => { const el = $(sel, wrap); if (el) left.appendChild(el); });
  intro.appendChild(left);
  intro.insertAdjacentHTML('beforeend', legend);
  wrap.insertBefore(intro, wrap.firstChild);
  watch($('#real-blocks'));
})();

/* ---------- 2. speed ---------- */
// Simple progress bar under each video: grey track, black fill. Click to seek.
function speedCol(s, id, extraBadge = '') {
  return `<div class="speed-col">
    <div class="speed-title"><b>${esc(s.name)}</b><span>${esc(s.sub || '')}</span></div>
    ${tile(s.file, { ratio: 'r169', label: s.name, caption: s.name,
      extra: `${extraBadge}<div class="badge clock" data-clock="${id}">00:00.0</div>` })}
    <div class="progress" data-bar="${id}" role="progressbar" aria-label="Playback progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="fill" data-fill="${id}"></span></div>
  </div>`;
}
function bindSpeed(v, id) {
  const bar = $(`[data-bar="${id}"]`), fill = $(`[data-fill="${id}"]`), clock = $(`[data-clock="${id}"]`);
  v.addEventListener('timeupdate', () => {
    const t = v.currentTime, d = v.duration || 0;
    const pct = d ? Math.min(t / d, 1) * 100 : 0;
    fill.style.width = pct.toFixed(2) + '%';
    bar.setAttribute('aria-valuenow', Math.round(pct));
    clock.textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${(t % 60).toFixed(1).padStart(4, '0')}`;
  });
  bar.addEventListener('click', e => {
    if (!v.duration) return;
    const r = bar.getBoundingClientRect();
    v.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * v.duration;
  });
}
function renderSpeed(i) {
  const set = CONFIG.speed[i];
  $('#speed-grid').innerHTML = set.pair.map((s, j) => speedCol(s, 's' + j)).join('');
  $$('#speed-grid video').forEach((v, j) => bindSpeed(v, 's' + j));
  watch($('#speed-grid'));
}
segToggle($('#speed-toggle'), CONFIG.speed, renderSpeed);
renderSpeed(0);
$('#play-both').addEventListener('click', () => {
  $$('#speed-grid video').forEach(v => { if (!v.getAttribute('src')) v.src = v.dataset.src; v.currentTime = 0; v.play().catch(() => {}); });
});

const L = CONFIG.limit;
$('#limit-card').innerHTML = `
  <div class="limit-text">
    <h3>${esc(L.title)}</h3>
    <p>${esc(L.text)}</p>
  </div>
  <div class="limit-video">${speedCol({ file: L.file, name: L.variant, sub: 'Drawer Retrieval' }, 'lim',
    '<div class="badge fail">✗ Failure</div>')}</div>`;
bindSpeed($('#limit-card video'), 'lim');
watch($('#limit-card'));

/* ---------- 3. LIBERO viewpoints ---------- */
$('#libero-task').innerHTML = CONFIG.liberoTasks.map((t, i) => `<option value="${i}">${esc(t.name)}</option>`).join('');
function renderLibero(i) {
  const t = CONFIG.liberoTasks[i];
  $('#libero-strip').innerHTML = CONFIG.angles.map(a => `<div class="cell">
    ${tile(`libero/${t.key}/az${a}.mp4`, { label: `${a}°`, caption: `${t.name} · |Δazimuth| = ${a}°`,
      extra: `<div class="badge bl">|Δazimuth| = ${a}°</div>` })}</div>`).join('');
  watch($('#libero-strip'));
}
$('#libero-task').addEventListener('change', e => renderLibero(+e.target.value));
renderLibero(0);

/* ---------- 4. withheld camera ---------- */
const OBS = [
  { key: 'cam2',     t: 'Camera 2',                n: 'input' },
  { key: 'wrist',    t: 'Wrist camera',            n: 'input' },
  { key: 'imagined', t: 'Camera 1 (imagined)',     n: 'what control reads', cls: 'imagined' },
  { key: 'gt',       t: 'Camera 1 (ground truth)', n: 'for reference only, never given to the model', cls: 'gt' }
];
function renderObs(i) {
  const ex = CONFIG.withheld[i];
  $('#obs-grid').innerHTML = OBS.map(o => `<div class="obs-col">
    ${tile(`withheld/${ex.key}/${o.key}.mp4`, { label: o.t, cls: o.cls || '', caption: `${ex.name} · ${o.t}` })}
    <div class="t">${esc(o.t)}</div><div class="n">${esc(o.n)}</div></div>`).join('');
  const vs = $$('#obs-grid video');
  vs.forEach(v => v.addEventListener('play', () => vs.forEach(o => { if (o !== v && Math.abs(o.currentTime - v.currentTime) > 0.15) o.currentTime = v.currentTime; })));
  watch($('#obs-grid'));
}
segToggle($('#obs-toggle'), CONFIG.withheld, renderObs);
renderObs(0);

/* ---------- 5. RoboTwin gallery ---------- */
$('#rt-grid').innerHTML = CONFIG.robotwin.map((t, i) => {
  const id = 'T' + String(i + 1).padStart(2, '0');
  const cams = (t.e1 != null) ? ` · E1 ${t.e1}° / E2 ${t.e2}°` : '';
  return `<div class="rt-item">
    ${tile(`robotwin/${id}.mp4`, { ratio: 'r11', label: id, caption: `${id} · ${t.name}${cams}` })}
    <span class="rt-name" title="${esc(t.name)}">${esc(t.name)}</span>${t.e1 != null ? `<span class="rt-cams">E1 ${t.e1}° · E2 ${t.e2}°</span>` : ''}</div>`;
}).join('');

/* ---------- teaser + init ---------- */
watch();

/* ---------- lightbox ---------- */
const lb = $('#lightbox'), lbv = $('#lb-video');
document.addEventListener('click', e => {
  const box = e.target.closest('.vid');
  if (!box || box.classList.contains('teaser')) return;
  lbv.src = box.querySelector('video').dataset.src; lbv.play().catch(() => {});
  $('#lb-caption').textContent = box.dataset.caption || '';
  lb.hidden = false;
});
function closeLb() { lb.hidden = true; lbv.pause(); lbv.removeAttribute('src'); lbv.load(); }
$('#lb-close').addEventListener('click', closeLb);
lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) closeLb(); });
