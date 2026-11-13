/* =====================================================================
   CONFIG: edit this file to change file names, angles, captions and the
   speed bars. All video paths are relative to static/videos/.
   A missing video simply shows its grey placeholder label.
   ===================================================================== */
const CONFIG = {
  // ---------- 1. Real world: our model, successful rollouts ----------
  // Positions of the two cameras in each clip's mini map, as an angle around
  // the table, clockwise, with the robot at the top:
  //   0 = robot side (top), 90 = right, 180 = opposite side (bottom), 270 = left.
  // visible = camera the model sees (circle), blind = withheld camera (cross).
  // Clips are shown in this order: two per row.
  real: [
    { name: 'Drawer Retrieval', clips: [
      { file: 'real/drawer_1.mp4', visible: 180, blind: 300 },
      { file: 'real/drawer_2.mp4', visible: 140, blind: 50 },
      { file: 'real/drawer_3.mp4', visible: 75,  blind: 225 },
      { file: 'real/drawer_4.mp4', visible: 305, blind: 135 } ] },
    { name: 'Hammer Block', clips: [
      { file: 'real/hammer_1.mp4', visible: 165, blind: 285 },
      { file: 'real/hammer_2.mp4', visible: 75,  blind: 225 } ] }
  ],

  // ---------- 2. Speed ----------
  // acting: the time ranges [start, end] (seconds, measured in THIS video file)
  // during which the robot is moving. Everything between them is drawn as waiting.
  // Get them with tools/acting_segments.py, from your robot logs, or by hand.
  // Leave acting: [] and the bar shows "not annotated yet".
  speed: [
    { key: 'drawer', name: 'Drawer Retrieval', pair: [
      { file: 'speed/drawer_original.mp4', name: 'Default denoising steps',                    sub: 'resynchronization + 25/50 denoising steps',     acting: [] },
      { file: 'speed/drawer_fast.mp4',     name: 'Fewer denoising steps', sub: 'resynchronization + 10/20 denoising steps', acting: [] } ] },
    { key: 'hammer', name: 'Hammer Block', pair: [
      { file: 'speed/hammer_original.mp4', name: 'Default denoising steps',                    sub: 'resynchronization + 25/50 denoising steps',     acting: [] },
      { file: 'speed/hammer_fast.mp4',     name: 'Fewer denoising steps', sub: 'resynchronization + 10/20 denoising steps', acting: [] } ] }
  ],
  // The even faster variant that fails
  limit: {
    file: 'speed/drawer_async_fail.mp4',
    title: 'Why not go even faster?',
    variant: 'Asynchronous chunk prediction',
    acting: [],
    text: 'Built on the same KV cache, this variant predicts the next action chunk while the current one is still executing, so the robot almost never waits. But the next chunk is then conditioned on the model\u2019s own predicted video frames instead of the camera images that were about to arrive. Over a trial the prediction error accumulates and the arm creeps toward the drawer handle. In contrast, with fewer denoising steps each chunk is still conditioned on the newest camera images, and the success rate stays close to that with more steps, so we deploy that setting.'
  },

  // ---------- 3. LIBERO viewpoints (ours only) ----------
  // files: libero/<task key>/az<angle>.mp4
  liberoTasks: [
    { key: 'task1', name: 'Turn on the stove and put the moka pot on it' },
    { key: 'task2', name: 'Put both the alphabet soup and the tomato sauce in the basket' },
    { key: 'task3', name: 'Pick up the book and place it in the back compartment of the caddy' }
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
  robotwin: [
    { name: 'adjust bottle', e1: null, e2: null },  // T01.mp4
    { name: 'beat block hammer', e1: null, e2: null },  // T02.mp4
    { name: 'blocks ranking rgb', e1: null, e2: null },  // T03.mp4
    { name: 'blocks ranking size', e1: null, e2: null },  // T04.mp4
    { name: 'click alarmclock', e1: null, e2: null },  // T05.mp4
    { name: 'click bell', e1: null, e2: null },  // T06.mp4
    { name: 'dump bin bigbin', e1: null, e2: null },  // T07.mp4
    { name: 'grab roller', e1: null, e2: null },  // T08.mp4
    { name: 'handover block', e1: null, e2: null },  // T09.mp4
    { name: 'handover mic', e1: null, e2: null },  // T10.mp4
    { name: 'hanging mug', e1: null, e2: null },  // T11.mp4
    { name: 'lift pot', e1: null, e2: null },  // T12.mp4
    { name: 'move can pot', e1: null, e2: null },  // T13.mp4
    { name: 'move pillbottle pad', e1: null, e2: null },  // T14.mp4
    { name: 'move playingcard away', e1: null, e2: null },  // T15.mp4
    { name: 'move stapler pad', e1: null, e2: null },  // T16.mp4
    { name: 'open laptop', e1: null, e2: null },  // T17.mp4
    { name: 'open microwave', e1: null, e2: null },  // T18.mp4
    { name: 'pick diverse bottles', e1: null, e2: null },  // T19.mp4
    { name: 'pick dual bottles', e1: null, e2: null },  // T20.mp4
    { name: 'place a2b left', e1: null, e2: null },  // T21.mp4
    { name: 'place a2b right', e1: null, e2: null },  // T22.mp4
    { name: 'place bread basket', e1: null, e2: null },  // T23.mp4
    { name: 'place bread skillet', e1: null, e2: null },  // T24.mp4
    { name: 'place burger fries', e1: null, e2: null },  // T25.mp4
    { name: 'place can basket', e1: null, e2: null },  // T26.mp4
    { name: 'place cans plasticbox', e1: null, e2: null },  // T27.mp4
    { name: 'place container plate', e1: null, e2: null },  // T28.mp4
    { name: 'place dual shoes', e1: null, e2: null },  // T29.mp4
    { name: 'place empty cup', e1: null, e2: null },  // T30.mp4
    { name: 'place fan', e1: null, e2: null },  // T31.mp4
    { name: 'place mouse pad', e1: null, e2: null },  // T32.mp4
    { name: 'place object basket', e1: null, e2: null },  // T33.mp4
    { name: 'place object scale', e1: null, e2: null },  // T34.mp4
    { name: 'place object stand', e1: null, e2: null },  // T35.mp4
    { name: 'place phone stand', e1: null, e2: null },  // T36.mp4
    { name: 'place shoe', e1: null, e2: null },  // T37.mp4
    { name: 'press stapler', e1: null, e2: null },  // T38.mp4
    { name: 'put bottles dustbin', e1: null, e2: null },  // T39.mp4
    { name: 'put object cabinet', e1: null, e2: null },  // T40.mp4
    { name: 'rotate qrcode', e1: null, e2: null },  // T41.mp4
    { name: 'scan object', e1: null, e2: null },  // T42.mp4
    { name: 'shake bottle', e1: null, e2: null },  // T43.mp4
    { name: 'shake bottle horizontally', e1: null, e2: null },  // T44.mp4
    { name: 'stack blocks three', e1: null, e2: null },  // T45.mp4
    { name: 'stack blocks two', e1: null, e2: null },  // T46.mp4
    { name: 'stack bowls three', e1: null, e2: null },  // T47.mp4
    { name: 'stack bowls two', e1: null, e2: null },  // T48.mp4
    { name: 'stamp seal', e1: null, e2: null },  // T49.mp4
    { name: 'turn switch', e1: null, e2: null }  // T50.mp4
  ]
};
