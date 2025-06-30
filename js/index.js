import Konva from 'https://esm.sh/konva';

// Game State
const state = {
  currentFormation: '433',
  currentMode: 'defend',
  players: [],
  ghostSpots: [],
  selectedPlayer: null,
  dimensions: {},
  layers: {}
};

// Constants
const PLAYER_ROLES = {
  GK: { color: '#FF5722', name: 'Goalkeeper' },
  CB: { color: '#1976D2', name: 'Center Back' },
  FB: { color: '#2196F3', name: 'Full Back' },
  DM: { color: '#673AB7', name: 'Defensive Mid' },
  CM: { color: '#9C27B0', name: 'Central Mid' },
  AM: { color: '#E91E63', name: 'Attacking Mid' },
  W:  { color: '#FF9800', name: 'Winger' },
  ST: { color: '#4CAF50', name: 'Striker' }
};

// Define your formations in row/col terms—no magic numbers
const FORMATIONS = {
  '433': {
    shape: [
      { row: 5, cols: [0]       }, // GK row (1)
      { row: 4, cols: [0,1,3,4] }, // DEF row (5) → take 4
      { row: 3, cols: [2]       }, // DM row (5) → center
      { row: 2, cols: [1,3]     }, // CM row (5) → two inner
      { row: 1, cols: [0,4]     }, // AM row (5) → two inner
      { row: 0, cols: [1]       }  // ST row (3) → center
    ],
    roles: [
      'GK',
      'FB','CB','CB','FB',
      'DM',
      'CM','CM',
      'AM','AM',
      'ST'
    ],
    numbers: [
      '1',
      '2','3','4','5',
      '6',
      '8','10',
      '7','11',
      '9'
    ]
  }
  // add 442, 352 etc. the same way…
};

// 1) Draw pitch + store dims
function initStage() {
  const container = document.querySelector('.pitch-container');
  const stage = new Konva.Stage({
    container: 'konva-holder',
    width:  container.clientWidth,
    height: container.clientHeight
  });

  const fieldWidth  = 400;
  const fieldHeight = 600;
  const offsetX     = (stage.width()  - fieldWidth)  / 2;
  const offsetY     = (stage.height() - fieldHeight) / 2;
  const cx = offsetX + fieldWidth  / 2;
  const cy = offsetY + fieldHeight / 2;

  state.dimensions = { fieldWidth, fieldHeight, offsetX, offsetY, cx, cy };
  state.layers = {
    field:     new Konva.Layer(),
    players:   new Konva.Layer(),
    formation: new Konva.Layer(),
    overlays:  new Konva.Layer()
  };

  // field bg
  const field = new Konva.Rect({
    x: offsetX, y: offsetY,
    width: fieldWidth, height: fieldHeight,
    fill: '#2d8f2d',
    stroke: 'white', strokeWidth: 3
  });

  // center circle
  const centerCircle = new Konva.Circle({
    x: cx, y: cy,
    radius: 50,
    stroke: 'white',
    strokeWidth: 2,
    fill: 'transparent'
  });

  state.layers.field.add(field, centerCircle);
  Object.values(state.layers).forEach(l => stage.add(l));
  return stage;
}

// 2) Build ghost spots and rowStarts
function initGhostSpots() {
  const { offsetY, cx } = state.dimensions;

  // rows top→bottom
  const rows = [
    { y: offsetY + 140, xOff: [-60, 0, 60]      }, // ST(3)
    { y: offsetY + 220, xOff: [-140,-70,0,70,140]}, // AM(5)
    { y: offsetY + 280, xOff: [-140,-70,0,70,140]}, // CM(5)
    { y: offsetY + 360, xOff: [-140,-70,0,70,140]}, // DM(5)
    { y: offsetY + 440, xOff: [-140,-70,0,70,140]}, // DEF(5)
    { y: offsetY + 560, xOff: [0]               }  // GK(1)
  ];

  // build a flat ghostSpots + row-length/starts
  const lengths = rows.map(r => r.xOff.length);
  const starts  = lengths.reduce((a,len,i) => {
    if (i===0) a.push(0);
    else       a.push(a[i-1] + lengths[i-1]);
    return a;
  }, []);

  state.ghostSpots = [];
  rows.forEach((r,i) => {
    r.xOff.forEach((dx,j) => {
      const spot = new Konva.Circle({
        x: cx + dx,
        y: r.y,
        radius: 15,
        fill: 'rgba(128,128,128,0.6)',
        stroke: 'white',
        strokeWidth: 2,
        visible: false
      });
      spot.occupied = false;
      state.ghostSpots.push(spot);
      state.layers.formation.add(spot);
    });
  });

  state.rowStarts = starts; // [0,3,8,13,18,23]
}

// 3) Player factory
function createPlayer(x,y,num,role) {
  const group = new Konva.Group({ x,y, draggable:true, role, number:num });
  const circ = new Konva.Circle({ radius:18, fill:PLAYER_ROLES[role].color, stroke:'white', strokeWidth:2 });
  const text = new Konva.Text({
    text: num, fontSize:14, fill:'white',
    width:36, height:36, offsetX:18, offsetY:18,
    align:'center', verticalAlign:'middle'
  });
  group.add(circ, text);

  group.on('dragstart', () => {
    state.selectedPlayer = group;
    state.ghostSpots.forEach(s => { if(!s.occupied) s.visible(true) });
    state.layers.formation.draw();
    if (group.currentSpot) group.currentSpot.occupied = false;
  });

  group.on('dragend', () => {
    state.ghostSpots.forEach(s => s.visible(false));
    state.layers.formation.draw();
    // snap→closest spot or revert/destroy (reuse your handlePlayerDrop)
    handlePlayerDrop(group);
  });

  return group;
}

// 4) Drop logic (reuse your version)
function handlePlayerDrop(player) {
  let min=1e9, closest=null;
  state.ghostSpots.forEach(spot => {
    if (spot.occupied) return;
    const dx=spot.x()-player.x(), dy=spot.y()-player.y();
    const d=Math.sqrt(dx*dx+dy*dy);
    if (d<min && d<70) { min=d; closest=spot }
  });
  if (closest) {
    player.position({ x:closest.x(), y:closest.y() });
    closest.occupied=true;
    player.currentSpot=closest;
  } else if (player.currentSpot) {
    player.position({ x:player.currentSpot.x(), y:player.currentSpot.y() });
    player.currentSpot.occupied = true;
  }
  state.layers.players.draw();
}

// 5) applyFormation using your rowStarts + shape
function applyFormation(name) {
  const cfg = FORMATIONS[name];
  if (!cfg) return;
  // clear old
  state.ghostSpots.forEach(s => s.occupied=false);

  // build spot-list via rowStarts + shape:
  const spots = cfg.shape.flatMap(g =>
    g.cols.map(col => {
      const idx = state.rowStarts[g.row] + col;
      return state.ghostSpots[idx];
    })
  );

  // snap each player
  state.players.forEach((pl,i) => {
    const target = spots[i];
    if (pl.currentSpot) pl.currentSpot.occupied=false;
    pl.position({ x:target.x(), y:target.y() });
    target.occupied=true;
    pl.currentSpot=target;
    // update color & num & role
    pl.findOne('Circle').fill(PLAYER_ROLES[cfg.roles[i]].color);
    pl.findOne('Text').text(cfg.numbers[i]);
    pl.role=cfg.roles[i];
    pl.number=cfg.numbers[i];
  });

  state.layers.players.draw();
}

// 6) initPlayers
function initPlayers() {
  // start them in first 11 ghostSpots (any order)
  for (let i=0; i<11; i++) {
    const sp = state.ghostSpots[i];
    const num = (i+1).toString();
    const rl  = (i===0?'GK': i<5?'CB': i<8?'CM':'ST');
    const pl  = createPlayer(sp.x(), sp.y(), num, rl);
    state.layers.players.add(pl);
    sp.occupied=true;
    pl.currentSpot=sp;
    state.players.push(pl);
  }
}

// 7) boot the app
document.addEventListener('DOMContentLoaded', () => {
  initStage();
  initGhostSpots();
  initPlayers();
  applyFormation('433');

  // UI buttons
  document.querySelectorAll('.formation-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.formation-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFormation(btn.dataset.formation);
    };
  });

  state.layers.field.draw();
  state.layers.players.draw();
  state.layers.formation.draw();
});