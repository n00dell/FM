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
const ROW_COLORS = [
  PLAYER_ROLES.ST.color,
  PLAYER_ROLES.AM.color,
  PLAYER_ROLES.CM.color,
  PLAYER_ROLES.DM.color,
  PLAYER_ROLES.CB.color,  // or FB color, your choice
  PLAYER_ROLES.GK.color
];

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
    ],
    spread: [ 1,   1,   1,   1,   1,   1   ],  // horizontal multiplier
    depth:  [ 0,  -20,  -10,   0,   0,   0   ]
  }
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
function buildGhostSpotsForFormation(formationName) {
  const cfg = FORMATIONS[formationName];
  if (!cfg) return;

  // Clear old spots
  state.layers.formation.destroyChildren();
  state.ghostSpots = [];

  const { offsetY, cx, fieldHeight } = state.dimensions;
  const shape = cfg.shape;

  const totalRows = Math.max(...shape.map(r => r.row)) + 1;

  const rowSpacing = fieldHeight * 0.7 / totalRows;

  const rowStarts = [];

  let spotIndex = 0;

  shape.forEach(g => {
    const y = offsetY + g.row * rowSpacing + (cfg.depth?.[g.row] || 0);
    rowStarts[g.row] = spotIndex;
    const rowCols = g.cols.length;
    const centerOffset = (rowCols - 1) / 2;

    g.cols.forEach((col, i) => {
      const spacing = 60 * (cfg.spread?.[g.row] || 1);
      const centerX = cx + (i - centerOffset) * spacing; // assuming 5 cols centered at 2
      const spot = new Konva.Circle({
        x: centerX,
        y: y,
        radius: 15,
        fill: 'rgba(128,128,128,0.6)',
        stroke: 'white',
        strokeWidth: 2
      });
      spot.occupied = false;
      spot.baseX = spot.x();
      spot.baseY = spot.y();
      spot.row = g.row;

      state.layers.formation.add(spot);
      state.ghostSpots.push(spot);
      spotIndex++;
    });
  });

  state.rowStarts = rowStarts;
  state.layers.formation.draw();
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
  const circ = player.findOne('Circle');
  if (!circ) return; // no circle found, can't snap
  circ.fill(ROW_COLORS[closest.row]); // reset color
  player.currentSpot = closest; 
  state.layers.players.draw();
}
function reflowSpots(formationName) {
  const cfg = FORMATIONS[formationName];
  if (!cfg) return;
  
  state.ghostSpots.forEach(spot => {
    const r = spot.row;               // which row 0…5
    const s = cfg.spread[r];          // how much to stretch horizontally
    const d = cfg.depth[r];           // how much to shift vertically
    
    // horizontal: compute delta from center
    const dx = spot.baseX - state.dimensions.cx;
    spot.x( state.dimensions.cx + dx * s );
    
    // vertical: just offset the baseY
    spot.y( spot.baseY + d );
  });
  
  // redraw the formation‐layer
  state.layers.formation.draw();
}
// 5) applyFormation using your rowStarts + shape
function applyFormation(name) {
  updateSpreadDepthUIControls(); // Update UI controls for spread/depth
  state.currentFormation = name;

  buildGhostSpotsForFormation(name); // ← 🔥 now builds only the spots you need

  reflowSpots(name); // Still needed for spread/depth updates

  // reset spots
  state.ghostSpots.forEach(s => s.occupied = false);

  const cfg = FORMATIONS[name];
  const spots = state.ghostSpots;

  state.players.forEach((pl, i) => {
    const spot = spots[i];
    if (!spot) return;

    if (pl.currentSpot) pl.currentSpot.occupied = false;
    pl.position({ x: spot.x(), y: spot.y() });
    spot.occupied = true;
    pl.currentSpot = spot;

    pl.findOne('Circle').fill(ROW_COLORS[spot.row]);
    pl.findOne('Text').text(cfg.numbers[i]);
    pl.role = cfg.roles[i];
    pl.number = cfg.numbers[i];
  });

  state.layers.players.draw();
}

function updateSpreadDepthUIControls() {
  const cfg = FORMATIONS[state.currentFormation];
  const lines = cfg.shape.map(s => s.row);
  const uniqueLines = [...new Set(lines)];

  const controlPanel = document.getElementById('tweak-panel');
  controlPanel.innerHTML = '';

  uniqueLines.forEach(row => {
    const spread = cfg.spread?.[row] ?? 1;
    const depth = cfg.depth?.[row] ?? 0;

    controlPanel.innerHTML += `
      <label>Row ${row} Spread:
        <input type="range" min="0.5" max="2.5" step="0.1" value="${spread}" data-type="spread" data-row="${row}">
      </label><br/>
      <label>Row ${row} Depth:
        <input type="range" min="-100" max="100" step="5" value="${depth}" data-type="depth" data-row="${row}">
      </label><br/>
    `;
  });

  controlPanel.querySelectorAll('input').forEach(input => {
    input.oninput = (e) => {
      const type = e.target.dataset.type;
      const row = parseInt(e.target.dataset.row);
      const value = parseFloat(e.target.value);
      const arr = FORMATIONS[state.currentFormation][type] || [];
      arr[row] = value;
      FORMATIONS[state.currentFormation][type] = arr;
      reflowSpots(state.currentFormation);
    };
  });
}
function createPlayer(x, y, number, role) {
  const group = new Konva.Group({
    x: x,
    y: y,
    draggable: true
  });

  const circle = new Konva.Circle({
    radius: 18,
    fill: PLAYER_ROLES[role]?.color || '#ccc',
    stroke: 'white',
    strokeWidth: 2
  });

  const label = new Konva.Text({
    text: number,
    fontSize: 14,
    fontFamily: 'Arial',
    fill: 'white',
    align: 'center',
    verticalAlign: 'middle',
    width: 36,
    height: 36,
    offsetX: 18,
    offsetY: 18
  });

  group.add(circle);
  group.add(label);

  // Drag logic
  group.on('dragend', () => {
    handlePlayerDrop(group);
  });

  return group;
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
  buildGhostSpotsForFormation('433');
  initPlayers();
  applyFormation('433');
  

   // Formation buttons
  document.querySelectorAll('.formation-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.formation-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFormation(btn.dataset.formation);
    };
  });

  // Extra tweak panel sliders (if you're using them)
  const fbDepthInput = document.getElementById('fb-depth');
  const cbSpreadInput = document.getElementById('cb-spread');

  if (fbDepthInput) {
    fbDepthInput.oninput = (e) => {
      FORMATIONS[state.currentFormation].depth[4] = Number(e.target.value);
      applyFormation(state.currentFormation);
    };
  }

  if (cbSpreadInput) {
    cbSpreadInput.oninput = (e) => {
      FORMATIONS[state.currentFormation].spread[4] = Number(e.target.value);
      applyFormation(state.currentFormation);
    };
  }

  // Redraw
  state.layers.field.draw();
  state.layers.players.draw();
  state.layers.formation.draw();
});