/* =====================================================================
   CONFIG — edit this block to change file names, angles and captions.
   All video paths are relative to static/videos/.
   A missing video simply shows its grey placeholder label.
   ===================================================================== */
const CONFIG = {
  // ---------- 1. Real world: our model, successful rollouts ----------
  // phi = azimuth |φ| of camera 2 about the table center (0° robot side, 180° opposite side).
  // Clips with phi >= unseenFrom get an orange "unseen side" tag.
  unseenFrom: 135,
  real: [
    { name: 'Drawer Retrieval', clips: [
      { file: 'real/drawer_1.mp4', phi: 30 },
      { file: 'real/drawer_2.mp4', phi: 90 },
      { file: 'real/drawer_3.mp4', phi: 130 },
      { file: 'real/drawer_4.mp4', phi: 170 } ] },
    { name: 'Hammer Block', clips: [
      { file: 'real/hammer_1.mp4', phi: 60 },
      { file: 'real/hammer_2.mp4', phi: 150 } ] }
  ],

  // ---------- 2. Speed ----------
  chunkSeconds: 1.6,     // one 32-action chunk at 20 Hz
  barWindowSeconds: 30,  // time span drawn by each bar
  speed: [
    { key: 'drawer', name: 'Drawer Retrieval', pair: [
      { file: 'speed/drawer_original.mp4', name: 'Original',          sub: 'LingBot-VA server, 25/50 steps',              pause: 7.51, acting: '18%' },
      { file: 'speed/drawer_fast.mp4',     name: 'Ours · exact path', sub: 'fixed-layout cache + CUDA Graph, 10/20 steps', pause: 1.96, acting: '45%' } ] },
    { key: 'hammer', name: 'Hammer Block', pair: [
      { file: 'speed/hammer_original.mp4', name: 'Original',          sub: 'LingBot-VA server, 25/50 steps',              pause: 7.51, acting: '18%' },
      { file: 'speed/hammer_fast.mp4',     name: 'Ours · exact path', sub: 'fixed-layout cache + CUDA Graph, 10/20 steps', pause: 1.96, acting: '45%' } ] }
  ],
  // The even faster variant that fails
  limit: {
    file: 'speed/drawer_async_fail.mp4',
    title: 'Why not go even faster?',
    variant: 'Asynchronous generation',
    pause: 0.56, acting: '77%',
    text: 'Generating each chunk while the previous one executes removes most of the waiting, but the action now reads the model’s own prediction where a real observation was about to arrive. Over a trial the error accumulates and the arm creeps toward the drawer handle. We therefore deploy the exact synchronous path above.'
  },

  // ---------- 3. LIBERO viewpoints (ours only) ----------
  // files: libero/<task key>/az<angle>.mp4
  liberoTasks: [
    { key: 'task1', name: '[LIBERO-Long task 1]' },
    { key: 'task2', name: '[LIBERO-Long task 2]' },
    { key: 'task3', name: '[LIBERO-Long task 3]' }
  ],
  angles: [0, 45, 90, 135, 180],

  // ---------- 4. Withheld camera (LIBERO) ----------
  // files: withheld/<example key>/<cam2|wrist|imagined|gt>.mp4
  withheld: [
    { key: 'ex1', name: 'Example 1' },
    { key: 'ex2', name: 'Example 2' }
  ],

  // ---------- 5. RoboTwin gallery ----------
  // files: robotwin/T01.mp4 ... T50.mp4 (export each as a 2x2 grid of the four cameras)
  // name: task name; e1/e2: azimuths of the two external cameras (degrees)
  robotwin: Array.from({ length: 50 }, () => ({ name: '[task name]', e1: null, e2: null }))
};

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
(function renderReal() {
  const legend = `<div class="legend-panel">
      <div class="sector-map" aria-hidden="true"><div class="table"></div><div class="base"></div>
        <span class="lab l-robot">robot side · 0°</span><span class="lab l-opp">opposite side · 180°</span></div>
      <ul class="legend">
        <li><span class="sw" style="background:#DBEAFE;border:1px solid #93C5FD"></span>0–90° · training range of camera 2</li>
        <li><span class="sw" style="background:#93C5FD"></span>90–135°</li>
        <li><span class="sw" style="background:#FDBA74"></span>135–180° · unseen for camera 2</li>
        <li><span class="dot"></span>camera 2 (visible)</li>
        <li><span class="x">✕</span>camera 1 (withheld)</li>
      </ul></div>`;
  $('#real-blocks').innerHTML = CONFIG.real.map((task, ti) => {
    const clips = task.clips.slice().sort((a, b) => a.phi - b.phi).map(c => {
      const unseen = c.phi >= CONFIG.unseenFrom;
      const extra = minimap(c.phi) +
        `<div class="badge tr"><span>1×</span><span class="ok">✓ Success</span></div>
         <div class="badge bl">|φ| = ${c.phi}°</div>` +
        (unseen ? `<div class="badge unseen">unseen side</div>` : '');
      return `<div class="cell">${tile(c.file, { label: `${task.name} · ${c.phi}°`, extra, cls: unseen ? 'is-unseen' : '', caption: `${task.name} · camera 2 at |φ| = ${c.phi}°` })}</div>`;
    }).join('');
    // the last block gets the legend in its empty columns
    const pad = (ti === CONFIG.real.length - 1 && task.clips.length <= 2) ? legend : '';
    return `<div class="real-block"><h3>${esc(task.name)}</h3><div class="grid-4">${clips}${pad}</div></div>`;
  }).join('');
  if (!$('.legend-panel')) $('#real-blocks').insertAdjacentHTML('afterbegin', legend);
  watch($('#real-blocks'));
})();

/* ---------- 2. speed ---------- */
function segs(pause) {
  const out = []; let t = 0; const W = CONFIG.barWindowSeconds, A = CONFIG.chunkSeconds;
  while (t < W) {
    const a = Math.min(A, W - t); out.push(`<i style="flex:${a} 1 0;background:#2563EB"></i>`); t += a;
    if (t >= W) break;
    const p = Math.min(pause, W - t); out.push(`<i style="flex:${p} 1 0;background:#D4D7DD"></i>`); t += p;
  }
  return out.join('');
}
function speedCol(s, id, extraBadge = '') {
  return `<div class="speed-col">
    <div class="speed-title"><b>${esc(s.name)}</b><span>${esc(s.sub || '')}</span></div>
    ${tile(s.file, { ratio: 'r169', label: s.name, caption: s.name,
      extra: `<div class="badge rt-tag">REAL TIME</div>${extraBadge}<div class="badge clock" data-clock="${id}">00:00.0</div>` })}
    <div class="bar">${segs(s.pause)}<span class="head" data-head="${id}"></span></div>
    <div class="speed-nums"><span>Pause per chunk <b>${s.pause.toFixed(2)} s</b></span><span>Time acting <b>${esc(s.acting)}</b></span></div>
  </div>`;
}
function bindClock(v, id) {
  v.addEventListener('timeupdate', () => {
    const t = v.currentTime;
    const c = $(`[data-clock="${id}"]`), h = $(`[data-head="${id}"]`);
    if (c) c.textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${(t % 60).toFixed(1).padStart(4, '0')}`;
    if (h) h.style.left = `calc(${(Math.min(t / CONFIG.barWindowSeconds, 1) * 100).toFixed(2)}% - 1px)`;
  });
}
function renderSpeed(i) {
  const set = CONFIG.speed[i];
  $('#speed-grid').innerHTML = set.pair.map((s, j) => speedCol(s, 's' + j)).join('');
  $$('#speed-grid video').forEach((v, j) => bindClock(v, 's' + j));
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
  <div class="limit-video">${speedCol({ file: L.file, name: L.variant, sub: 'Drawer Retrieval', pause: L.pause, acting: L.acting }, 'lim',
    '<div class="badge fail">✗ Failure</div>')}</div>`;
bindClock($('#limit-card video'), 'lim');
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
  { key: 'imagined', t: 'Camera 1 — imagined',     n: 'what control reads', cls: 'imagined' },
  { key: 'gt',       t: 'Camera 1 — ground truth', n: 'for reference only, never given to the model', cls: 'gt' }
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
  const gap = (t.e1 != null && t.e2 != null) ? Math.abs(((t.e2 - t.e1 + 540) % 360) - 180) : null;
  const wide = gap != null && gap > 120;
  const cams = (t.e1 != null) ? ` · E1 ${t.e1}° / E2 ${t.e2}°` : '';
  return `<div class="rt-item" data-wide="${wide}">
    ${tile(`robotwin/${id}.mp4`, { ratio: 'r11', label: id, hover: true, caption: `${id} · ${t.name}${cams}` })}
    <span class="rt-name" title="${esc(t.name)}">${esc(t.name)}</span></div>`;
}).join('');
$$('#rt-filter button').forEach(b => b.addEventListener('click', () => {
  $$('#rt-filter button').forEach(x => x.classList.toggle('on', x === b));
  $$('.rt-item').forEach(it => it.classList.toggle('hide', b.dataset.f === 'wide' && it.dataset.wide !== 'true'));
}));

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
