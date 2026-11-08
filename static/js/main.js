/* =====================================================================
   CONFIG — edit this block to change file names, numbers and captions.
   All video paths are relative to static/videos/.
   A missing video simply shows its grey placeholder label.
   ===================================================================== */
const CONFIG = {
  // ---------- 1. Real world viewpoint grid ----------
  realTasks: [
    { key: 'hammer',   name: 'Hammer Block' },
    { key: 'rotate_t', name: 'Rotate T' },
    { key: 'drawer',   name: 'Drawer Retrieval' }
  ],
  realBins: [
    { key: '0-90',    label: '0–90°',    caption: 'robot side',                          hi: false },
    { key: '90-135',  label: '90–135°',  caption: 'side view',                           hi: false },
    { key: '135-180', label: '135–180°', caption: 'opposite side — unseen for camera 2', hi: true  }
  ],
  // Actual azimuth |φ| of camera 2 in each clip: [0-90, 90-135, 135-180]
  realPhi: {
    hammer:   [45, 110, 160],
    rotate_t: [40, 120, 150],
    drawer:   [60, 115, 170]
  },
  // Success per bin (Table 4). Fill in LingBot-VA when available.
  realSuccess: {
    ours: { hammer: ['5/5', '3/5', '3/5'], rotate_t: ['5/5', '4/5', '4/5'], drawer: ['5/5', '4/5', '5/5'] },
    va:   { hammer: ['–/5', '–/5', '–/5'], rotate_t: ['–/5', '–/5', '–/5'], drawer: ['–/5', '–/5', '–/5'] }
  },
  // files: real/ours/<task>_<bin>.mp4 and real/va/<task>_<bin>.mp4
  failures: [
    { file: 'real/fail_1.mp4', caption: 'Hammer Block · 150° · grasp slips' },
    { file: 'real/fail_2.mp4', caption: 'Rotate T · 120° · under-rotation' },
    { file: 'real/fail_3.mp4', caption: 'Hammer Block · 170° · [reason]' }
  ],

  // ---------- 2. Speed ----------
  speed: [
    { file: 'speed/original.mp4', name: 'Original LingBot-VA server', sub: '25/50 denoising steps',                       pause: 7.51, acting: '18%' },
    { file: 'speed/ours.mp4',     name: 'Ours · exact path',          sub: 'fixed-layout cache + CUDA Graph, 10/20 steps', pause: 1.96, acting: '45%' }
  ],
  chunkSeconds: 1.6,     // one 32-action chunk at 20 Hz
  barWindowSeconds: 30,  // length of the clip shown by the bar

  // ---------- 3. Withheld camera ----------
  // files: withheld/<real|libero>/<cam2|wrist|imagined|gt>.mp4

  // ---------- 4. LIBERO sweep ----------
  liberoTasks: [
    { key: 'task1', name: '[LIBERO-Long task 1]' },
    { key: 'task2', name: '[LIBERO-Long task 2]' }
  ],
  angles: [0, 45, 90, 135, 180],
  // Horizontal position of 0° and 180° inside fig4.png (fraction of image width)
  fig4Axis: { left: 0.12, right: 0.96 },
  // files: libero/<task>/<pi05|anycamvla|ours>_<angle>.mp4

  // ---------- 5. RoboTwin gallery ----------
  // files: robotwin/T01.mp4 ... T50.mp4 (export each as a 2x2 grid of the four cameras)
  // name: task name; e1/e2: azimuths of the two external cameras (degrees)
  robotwin: Array.from({ length: 50 }, (_, i) => ({ name: '[task name]', e1: null, e2: null })),

  // ---------- 6. Plus benchmarks ----------
  plus: [
    { name: 'RoboTwin 2.0-Plus',  score: '[TBD]', clips: [
      { file: 'plus/robotwin_1.mp4', caption: '15% closer' },
      { file: 'plus/robotwin_2.mp4', caption: '5° rotation' },
      { file: 'plus/robotwin_3.mp4', caption: 'closer + rotation' } ] },
    { name: 'LIBERO-Plus (Long)', score: '83.5%', clips: [
      { file: 'plus/libero_1.mp4', caption: '2× distance' },
      { file: 'plus/libero_2.mp4', caption: '10° roll' },
      { file: 'plus/libero_3.mp4', caption: 'axis off table center' } ] }
  ]
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
function pos(phi) { // 0° = robot side (bottom of map), 180° = opposite side
  const r = phi * Math.PI / 180;
  return { l: (50 + 38 * Math.sin(r)).toFixed(1) + '%', t: (50 + 38 * Math.cos(r)).toFixed(1) + '%' };
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
      if (!v.getAttribute('src') && !v.hasAttribute('data-hover')) { v.src = v.dataset.src; }
      if (!v.hasAttribute('data-hover') && v.getAttribute('src')) v.play().catch(() => {});
    } else if (!v.paused) { v.pause(); }
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
function swapSrc(v, file) {
  v.dataset.src = V + file;
  v.parentNode.querySelector('.ph').innerHTML = `${esc(v.parentNode.dataset.caption)}<br>${esc(file)}`;
  v.src = v.dataset.src; v.load(); v.play().catch(() => {});
}

/* ---------- 1. real world ---------- */
let method = 'ours';
function renderReal() {
  const T = CONFIG.realTasks;
  let html = `<div class="real-row head"><div></div>${T.map(t => `<div>${esc(t.name)}</div>`).join('')}</div>`;
  CONFIG.realBins.forEach((b, bi) => {
    html += `<div class="real-row${b.hi ? ' hi' : ''}"><div class="bin"><b>${esc(b.label)}</b><span>${esc(b.caption)}</span></div>`;
    T.forEach(t => {
      const phi = CONFIG.realPhi[t.key][bi];
      const ok = method === 'ours';
      const file = `real/${method}/${t.key}_${b.key}.mp4`;
      const extra = minimap(phi) +
        `<div class="badge tr"><span>1×</span><span class="${ok ? 'ok' : 'va'}">${ok ? 'Ours' : 'LingBot-VA'}</span></div>
         <div class="badge bl">${esc(t.name)} · |φ| = ${phi}°</div>`;
      html += `<div class="cell">${tile(file, { label: `${t.name} · ${phi}°`, extra, caption: `${ok ? 'Ours' : 'LingBot-VA'} · ${t.name} · |φ| = ${phi}°` })}
        <div class="succ">Success in bin: <b>${esc(CONFIG.realSuccess[method][t.key][bi])}</b></div></div>`;
    });
    html += '</div>';
  });
  $('#real-grid').innerHTML = html;
  watch($('#real-grid'));
}
$$('#method-toggle button').forEach(b => b.addEventListener('click', () => {
  method = b.dataset.method;
  $$('#method-toggle button').forEach(x => x.classList.toggle('on', x === b));
  renderReal();
}));
$('#fail-grid').innerHTML = CONFIG.failures.map(f =>
  `<div>${tile(f.file, { label: 'failure', caption: f.caption })}<div class="fail-cap">${esc(f.caption)}</div></div>`).join('');

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
$('#speed-grid').innerHTML = CONFIG.speed.map((s, i) => `
  <div class="speed-col">
    <div class="speed-title"><b>${esc(s.name)}</b><span>${esc(s.sub)}</span></div>
    ${tile(s.file, { ratio: 'r169', label: s.name, caption: s.name,
      extra: `<div class="badge rt-tag">REAL TIME</div><div class="badge clock" data-clock="${i}">00:00.0</div>` })}
    <div class="bar">${segs(s.pause)}<span class="head" data-head="${i}"></span></div>
    <div class="speed-nums"><span>Pause per chunk <b>${s.pause.toFixed(2)} s</b></span><span>Time acting <b>${esc(s.acting)}</b></span></div>
  </div>`).join('');
const speedVids = $$('#speed-grid video');
speedVids.forEach((v, i) => v.addEventListener('timeupdate', () => {
  const t = v.currentTime;
  $(`[data-clock="${i}"]`).textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${(t % 60).toFixed(1).padStart(4, '0')}`;
  const frac = Math.min(t / CONFIG.barWindowSeconds, 1);
  $(`[data-head="${i}"]`).style.left = `calc(${(frac * 100).toFixed(2)}% - 1px)`;
}));
$('#play-both').addEventListener('click', () => {
  speedVids.forEach(v => { if (!v.getAttribute('src')) v.src = v.dataset.src; v.currentTime = 0; v.play().catch(() => {}); });
});

/* ---------- 3. withheld camera ---------- */
const OBS = [
  { key: 'cam2',     t: 'Camera 2',                n: 'input' },
  { key: 'wrist',    t: 'Wrist camera',            n: 'input' },
  { key: 'imagined', t: 'Camera 1 — imagined',     n: 'what control reads', cls: 'imagined' },
  { key: 'gt',       t: 'Camera 1 — ground truth', n: 'for reference only, never given to the model', cls: 'gt' }
];
function renderObs(set) {
  $('#obs-grid').innerHTML = OBS.map(o => `<div class="obs-col">
    ${tile(`withheld/${set}/${o.key}.mp4`, { label: o.t, cls: o.cls || '', caption: `${set === 'real' ? 'Real Franka' : 'LIBERO-Long'} · ${o.t}` })}
    <div class="t">${esc(o.t)}</div><div class="n">${esc(o.n)}</div></div>`).join('');
  const vs = $$('#obs-grid video');
  watch($('#obs-grid'));
  // keep the four views in sync: restart together once all can play
  vs.forEach(v => v.addEventListener('play', () => vs.forEach(o => { if (o !== v && Math.abs(o.currentTime - v.currentTime) > 0.15) o.currentTime = v.currentTime; })));
}
$$('#obs-toggle button').forEach(b => b.addEventListener('click', () => {
  $$('#obs-toggle button').forEach(x => x.classList.toggle('on', x === b));
  renderObs(b.dataset.obs);
}));
renderObs('real');

/* ---------- 4. LIBERO sweep ---------- */
const SWEEP = [
  { key: 'pi05',      name: 'π0.5',      sub: 'displaced view as input' },
  { key: 'anycamvla', name: 'AnyCamVLA', sub: 'view synthesis in loop' },
  { key: 'ours',      name: 'Ours',      sub: 'one external camera', ours: true }
];
let angleIdx = 3, taskKey = CONFIG.liberoTasks[0].key;
$('#libero-task').innerHTML = CONFIG.liberoTasks.map(t => `<option value="${t.key}">${esc(t.name)}</option>`).join('');
$('#angle-btns').innerHTML = CONFIG.angles.map((a, i) => `<button type="button" data-i="${i}">${a}°</button>`).join('');
$('#sweep-rows').innerHTML = SWEEP.map(m => `<div class="sweep-row">
  <div class="who${m.ours ? ' ours' : ''}"><b>${esc(m.name)}</b><span>${esc(m.sub)}</span></div>
  ${tile('', { ratio: 'r167', label: m.name, caption: m.name, extra: `<div class="badge tr"><span class="angle-badge"></span></div>` })}
  </div>`).join('');
function updateSweep(first) {
  const a = CONFIG.angles[angleIdx];
  $$('#angle-btns button').forEach((b, i) => b.classList.toggle('on', i === angleIdx));
  $$('.angle-badge').forEach(s => s.textContent = a + '°');
  const { left, right } = CONFIG.fig4Axis;
  $('#fig4-marker').style.left = ((left + (right - left) * a / 180) * 100).toFixed(2) + '%';
  $$('#sweep-rows .vid').forEach((box, i) => {
    const file = `libero/${taskKey}/${SWEEP[i].key}_${a}.mp4`;
    box.dataset.caption = `${SWEEP[i].name} · ${a}°`;
    const v = box.querySelector('video');
    if (first) { v.dataset.src = V + file; box.querySelector('.ph').innerHTML = `${esc(box.dataset.caption)}<br>${esc(file)}`; }
    else swapSrc(v, file);
  });
}
$$('#angle-btns button').forEach(b => b.addEventListener('click', () => { angleIdx = +b.dataset.i; updateSweep(); }));
$('#libero-task').addEventListener('change', e => { taskKey = e.target.value; updateSweep(); });
updateSweep(true);

/* ---------- 5. RoboTwin gallery ---------- */
$('#rt-grid').innerHTML = CONFIG.robotwin.map((t, i) => {
  const id = 'T' + String(i + 1).padStart(2, '0');
  const gap = (t.e1 != null && t.e2 != null) ? Math.abs(((t.e2 - t.e1 + 540) % 360) - 180) : null;
  const wide = gap != null && gap > 120;
  const cams = (t.e1 != null) ? `E1 ${t.e1}° / E2 ${t.e2}°` : '';
  return `<div class="rt-item${wide ? ' wide' : ''}" data-wide="${wide}">
    ${tile(`robotwin/${id}.mp4`, { ratio: 'r11', label: id, hover: true, caption: `${id} · ${t.name} ${cams}` })}
    <span class="rt-name" title="${esc(t.name)}">${esc(t.name)}</span></div>`;
}).join('');
$$('#rt-filter button').forEach(b => b.addEventListener('click', () => {
  $$('#rt-filter button').forEach(x => x.classList.toggle('on', x === b));
  $$('.rt-item').forEach(it => it.classList.toggle('hide', b.dataset.f === 'wide' && it.dataset.wide !== 'true'));
}));

/* ---------- 6. Plus ---------- */
$('#plus-grid').innerHTML = CONFIG.plus.map(p => `<div class="plus-col">
  <div class="plus-title"><b>${esc(p.name)}</b><span>Camera-factor success <em>${esc(p.score)}</em></span></div>
  <div class="grid-3">${p.clips.map(c => `<div class="plus-clip">${tile(c.file, { ratio: 'r11', label: c.caption, caption: `${p.name} · ${c.caption}` })}<span>${esc(c.caption)}</span></div>`).join('')}</div>
</div>`).join('');

/* ---------- teaser + init ---------- */
renderReal();
watch();

/* ---------- lightbox ---------- */
const lb = $('#lightbox'), lbv = $('#lb-video');
document.addEventListener('click', e => {
  const box = e.target.closest('.vid');
  if (!box || box.classList.contains('teaser')) return;
  const v = box.querySelector('video');
  lbv.src = v.dataset.src; lbv.play().catch(() => {});
  $('#lb-caption').textContent = box.dataset.caption || '';
  lb.hidden = false;
});
function closeLb() { lb.hidden = true; lbv.pause(); lbv.removeAttribute('src'); lbv.load(); }
$('#lb-close').addEventListener('click', closeLb);
lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) closeLb(); });
