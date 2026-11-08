/* =====================================================================
   CONFIG: edit this file to change file names, angles, captions and the
   speed bars. All video paths are relative to static/videos/.
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
  // acting: the time ranges [start, end] (seconds, measured in THIS video file)
  // during which the robot is moving. Everything between them is drawn as waiting.
  // Get them with tools/acting_segments.py, from your robot logs, or by hand.
  // Leave acting: [] and the bar shows "not annotated yet".
  speed: [
    { key: 'drawer', name: 'Drawer Retrieval', pair: [
      { file: 'speed/drawer_original.mp4', name: 'Original',                    sub: 'LingBot-VA server, 25/50 denoising steps',     acting: [] },
      { file: 'speed/drawer_fast.mp4',     name: 'Ours · fewer denoising steps', sub: 'fixed-layout KV cache + 10/20 denoising steps', acting: [] } ] },
    { key: 'hammer', name: 'Hammer Block', pair: [
      { file: 'speed/hammer_original.mp4', name: 'Original',                    sub: 'LingBot-VA server, 25/50 denoising steps',     acting: [] },
      { file: 'speed/hammer_fast.mp4',     name: 'Ours · fewer denoising steps', sub: 'fixed-layout KV cache + 10/20 denoising steps', acting: [] } ] }
  ],
  // The even faster variant that fails
  limit: {
    file: 'speed/drawer_async_fail.mp4',
    title: 'Why not go even faster?',
    variant: 'Asynchronous chunk prediction',
    acting: [],
    text: 'Built on the same KV cache, this variant predicts the next action chunk while the current one is still executing, so the robot almost never waits. But the next chunk is then conditioned on the model\u2019s own prediction of the scene instead of the observation that was about to arrive. Over a trial the error accumulates and the arm creeps toward the drawer handle. Fewer denoising steps, in contrast, keep the latest observation and stay within seed-to-seed variation, so we deploy that path.'
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
  // name: task name; e1/e2: azimuths of the two external cameras in degrees (optional, shown under the tile)
  robotwin: Array.from({ length: 50 }, () => ({ name: '[task name]', e1: null, e2: null }))
};
