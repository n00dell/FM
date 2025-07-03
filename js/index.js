import Konva from 'https://esm.sh/konva';

// === GLOBAL STATE ===
const state = {
  stage: null,
  layers: {},
  ghostSpots: [],
  players: [],
  dimensions: {},
  currentFormation: '433'
};

// === FORMATIONS ===
const FORMATIONS = {
  '433': {
    name: '4-3-3',
    indices: [
      22,             // GK
      17, 18, 19, 21, // DEF
      9, 10, 11,      // MID
      0, 1, 2         // ATT
    ]
  }
};

// === FIELD INIT ===
function initStage() {
  const stage = new Konva.Stage({
    container: 'konva-holder',
    width: 1000,
    height: 700
  });
  const fieldWidth = 400;
  const fieldHeight = 600;
  const offsetX = (stage.width() - fieldWidth) / 2;
  const offsetY = (stage.height() - fieldHeight) / 2;
  const cx = offsetX + fieldWidth / 2;
  const cy = offsetY + fieldHeight / 2;

  // Store global dims
  state.stage = stage;
  state.dimensions = { fieldWidth, fieldHeight, offsetX, offsetY, cx, cy };
  state.layers.field = new Konva.Layer();
  state.layers.formation = new Konva.Layer();
  state.layers.players = new Konva.Layer();

  const field = new Konva.Rect({
    x: offsetX, y: offsetY,
    width: fieldWidth, height: fieldHeight,
    fill: '#2d8f2d', stroke: 'white', strokeWidth: 3
  });

  const centerCircle = new Konva.Circle({
    x: cx, y: cy,
    radius: 50,
    stroke: 'white', strokeWidth: 2, fill: 'transparent'
  });

  const centerLine = new Konva.Line({
    points: [offsetX, cy, offsetX + fieldWidth, cy],
    stroke: 'white', strokeWidth: 2
  });

  const centerSpot = new Konva.Circle({
    x: cx, y: cy, radius: 3, fill: 'white'
  });

  const topBox = new Konva.Rect({
    x: cx - 80, y: offsetY,
    width: 160, height: 80,
    stroke: 'white', strokeWidth: 2
  });

  const bottomBox = new Konva.Rect({
    x: cx - 80, y: offsetY + fieldHeight - 80,
    width: 160, height: 80,
    stroke: 'white', strokeWidth: 2
  });

  const cornerRadius = 5;
  const corners = [
    { x: offsetX, y: offsetY },
    { x: offsetX + fieldWidth, y: offsetY },
    { x: offsetX, y: offsetY + fieldHeight },
    { x: offsetX + fieldWidth, y: offsetY + fieldHeight }
  ];

  const cornerArcs = corners.map((corner, i) => new Konva.Arc({
    x: corner.x, y: corner.y,
    innerRadius: cornerRadius,
    outerRadius: cornerRadius,
    angle: 90,
    rotation: i * 90,
    stroke: 'white', strokeWidth: 2
  }));

  state.layers.field.add(field, centerCircle, centerLine, centerSpot, topBox, bottomBox);
  cornerArcs.forEach(arc => state.layers.field.add(arc));

  stage.add(state.layers.field, state.layers.formation, state.layers.players);
  state.layers.field.draw();
}

// === GHOST SPOTS ===
function buildGhostSpots(spread = 1, depth = 1) {
  const { offsetY, cx } = state.dimensions;
  const rows = [
    { y: offsetY + 140, xOffsets: [-60, 0, 60] },
    { y: offsetY + 220, xOffsets: [-140, -70, 0, 70, 140] },
    { y: offsetY + 280, xOffsets: [-120, -60, 0, 60, 120] },
    { y: offsetY + 360, xOffsets: [-140, -70, 0, 70, 140] },
    { y: offsetY + 440, xOffsets: [-120, -60, 0, 60, 120] },
    { y: offsetY + 560, xOffsets: [0] }
  ];
  const colorsByRow = ['#1976d2', '#42a5f5', '#66bb6a', '#fdd835', '#e53935', '#9e9e9e'];
  rows.forEach((row, rowIndex) => {
    const y = offsetY + row.y * depth;
    const fill = colorsByRow[rowIndex] || '#888';
    row.xOffsets.forEach(offset => {
      const x = cx + offset * spread;
      const spot = new Konva.Circle({
        x,y,
        radius: 15,
        fill: 'rgba(128,128,128,0.6)',
        stroke: 'white',
        strokeWidth: 2,
        visible: false
      });
      spot.occupied = false;
      spot.rowIndex = rowIndex;
      spot.RoleColor = fill;
      state.ghostSpots.push(spot);
      state.layers.formation.add(spot);
    });
  });
  state.layers.formation.draw();
}

// === CREATE PLAYER ===
function createPlayer(x, y, number = '' ,color = '#1976d2') {
  const group = new Konva.Group({ x, y, draggable: true });
  const circle = new Konva.Circle({
    radius: 18,
    fill: color,
    stroke: 'white',
    strokeWidth: 2
  });
  const label = new Konva.Text({
    text: number,
    fontSize: 14,
    fill: 'white',
    align: 'center',
    verticalAlign: 'middle',
    width: 36,
    height: 36,
    offsetX: 18,
    offsetY: 18
  });
  group.add(circle, label);
  group.currentSpot = null;

  group.on('dragstart', () => {
    showGhostSpots();
    if (group.currentSpot) group.currentSpot.occupied = false;
  });

  group.on('dragend', () => {
    hideGhostSpots();
    let minDist = Infinity, closest = null;
    for (const spot of state.ghostSpots) {
      if (spot.occupied) continue;
      const dx = spot.x() - group.x();
      const dy = spot.y() - group.y();
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closest = spot;
      }
    }
    if (closest && minDist < 70) {
      group.position({ x: closest.x(), y: closest.y() });
      closest.occupied = true;
      group.currentSpot = closest;
      group.findOne('Circle').fill(closest.RoleColor);
    } else if (group.currentSpot) {
      group.position({ x: group.currentSpot.x(), y: group.currentSpot.y() });
      group.currentSpot.occupied = true;
    } else {
      group.destroy();
    }
    state.layers.players.draw();
  });

  return group;
}

// === INIT PLAYERS ===
function initPlayers() {
  for (let i = 0; i < 11; i++) {
    const spot = state.ghostSpots[i];
    const color = spot.RoleColor || '#1976d2';
    const player = createPlayer(spot.x(), spot.y(), (i + 1).toString(), color);
    spot.occupied = true;
    player.currentSpot = spot;
    state.layers.players.add(player);
    state.players.push(player);
  }
  state.layers.players.draw();
}

// === FORMATION APPLY ===
function applyFormation(name) {
  const formation = FORMATIONS[name];
  if (!formation) return;
  state.ghostSpots.forEach(s => s.occupied = false);
  const players = state.players;
  const indices = formation.indices;
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const spotIndex = indices[i];
    const spot = state.ghostSpots[spotIndex];
    if (!spot) continue;
    player.position({ x: spot.x(), y: spot.y() });
    player.currentSpot = spot;
    spot.occupied = true;
  }
  state.layers.players.draw();
}

// === UI: SHOW/HIDE SPOTS ===
function showGhostSpots() {
  for (const spot of state.ghostSpots) {
    if (!spot.occupied) spot.visible(true);
  }
  state.layers.formation.draw();
}
function hideGhostSpots() {
  state.ghostSpots.forEach(s => s.visible(false));
  state.layers.formation.draw();
}

// === BOOTSTRAP ===
document.addEventListener('DOMContentLoaded', () => {
  initStage();
  buildGhostSpots();
  initPlayers();
  applyFormation('433');
});
