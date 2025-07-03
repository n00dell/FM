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
        const y = row.y * depth;
        const fill = colorsByRow[rowIndex] || '#888';
        row.xOffsets.forEach((offset, spotIndex) => {
          const x = cx + offset * spread;
          const spot = new Konva.Circle({
            x, y,
            radius: 15,
            fill: 'rgba(128,128,128,0.3)',
            stroke: 'white',
            strokeWidth: 2,
            visible: false
          });
      spot.occupied = false;
          spot.rowIndex = rowIndex;
          spot.spotIndex = spotIndex;
          spot.RoleColor = fill;
          spot.originalX = x; // Store original position for reference
          state.ghostSpots.push(spot);
          state.layers.formation.add(spot);
    });
  });
  state.layers.formation.draw();
}
// Additional helper function for tactical adjustments
// Enhanced adjustRowPlayers that respects formation intent
function adjustRowPlayers(rowIndex, respectFormationPositions = true) {
  const { fieldWidth, offsetX } = state.dimensions;
  
  // Get all players in this row
  const rowPlayers = state.players.filter(p => p.currentSpot?.rowIndex === rowIndex);
  if (rowPlayers.length === 0) return;
  
  // Get all spots in this row
  const rowSpots = state.ghostSpots.filter(s => s.rowIndex === rowIndex);
  if (rowSpots.length === 0) return;
  
  // Sort players by their current X position to maintain relative order
  rowPlayers.sort((a, b) => a.x() - b.x());
  
  // Check if this is a formation-applied positioning vs user drag
  const isFormationPositioning = respectFormationPositions && 
    rowPlayers.every(player => player.currentSpot && 
      Math.abs(player.x() - player.currentSpot.originalX) < 10);
  
  if (isFormationPositioning) {
    // For formation-applied positions, check if we should maintain original spacing
    const occupiedSpots = rowSpots.filter(spot => spot.occupied);
    const originalSpread = getOriginalSpread(occupiedSpots);
    
    // If players are meant to be at the edges (wide formation), maintain that
    if (shouldMaintainWideSpacing(occupiedSpots, rowSpots)) {
      // Keep original positions but apply smooth animation
      rowPlayers.forEach((player, i) => {
        const targetX = player.currentSpot.originalX;
        const targetY = player.currentSpot.y();
        
        const tween = new Konva.Tween({
          node: player,
          duration: 0.3,
          x: targetX,
          y: targetY,
          easing: Konva.Easings.EaseOut
        });
        tween.play();
        
        // Update player color based on row
        const rowColor = player.currentSpot.RoleColor;
        player.findOne('Circle').fill(rowColor);
      });
      
      state.layers.players.draw();
      return;
    }
  }
  
  // Apply dynamic spacing for other cases
  const basePadding = 40;
  const dynamicPadding = Math.max(basePadding, 60 - (rowPlayers.length * 5));
  const fieldLeft = offsetX + dynamicPadding;
  const fieldRight = offsetX + fieldWidth - dynamicPadding;
  const availableWidth = fieldRight - fieldLeft;
  
  // Calculate positions with improved spacing logic
  let positions = [];
  if (rowPlayers.length === 1) {
    // Single player goes to center
    positions = [fieldLeft + availableWidth / 2];
  } else if (rowPlayers.length === 2) {
    // Check if they should be wide or closer together
    const occupiedSpots = rowPlayers.map(p => p.currentSpot);
    if (shouldMaintainWideSpacing(occupiedSpots, rowSpots)) {
      // Keep them wide - use original positions
      positions = rowPlayers.map(p => p.currentSpot.originalX);
    } else {
      // Two players: use 1/3 and 2/3 positions for better balance
      positions = [
        fieldLeft + availableWidth * 0.33,
        fieldLeft + availableWidth * 0.67
      ];
    }
  } else {
    // Multiple players: even distribution with slight curve for realism
    const spacing = availableWidth / (rowPlayers.length - 1);
    for (let i = 0; i < rowPlayers.length; i++) {
      let baseX = fieldLeft + spacing * i;
      
      // Add slight curve for midfield rows (makes formation more natural)
      if (rowIndex >= 2 && rowIndex <= 3 && rowPlayers.length >= 3) {
        const curveFactor = 0.1;
        const normalizedPos = (i / (rowPlayers.length - 1)) - 0.5; // -0.5 to 0.5
        const curve = Math.sin(normalizedPos * Math.PI) * curveFactor * availableWidth;
        baseX += curve;
      }
      
      positions.push(baseX);
    }
  }
  
  // Apply new positions with smooth animation
  rowPlayers.forEach((player, i) => {
    const newX = positions[i];
    const newY = player.currentSpot.y();
    
    // Smooth transition instead of instant snap
    const tween = new Konva.Tween({
      node: player,
      duration: 0.3,
      x: newX,
      y: newY,
      easing: Konva.Easings.EaseOut
    });
    tween.play();
    
    // Update player color based on row
    const rowColor = player.currentSpot.RoleColor;
    player.findOne('Circle').fill(rowColor);
  });
  
  state.layers.players.draw();
}
// === CREATE PLAYER ===
// Updated drag handling to use formation-aware spacing
function createPlayer(x, y, number = '', color = '#1976d2') {
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
    
    // Find closest available spot
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
    
    const oldRowIndex = group.currentSpot?.rowIndex;

    if (closest && minDist < 70) {
      // Snap to new spot
      group.position({ x: closest.x(), y: closest.y() });
      closest.occupied = true;
      group.currentSpot = closest;
      group.findOne('Circle').fill(closest.RoleColor);
      
      // Use formation-aware spacing - pass false since this is user drag
      if (oldRowIndex !== undefined && oldRowIndex !== closest.rowIndex) {
        adjustRowPlayers(oldRowIndex, false); // User drag - don't respect formation
      }
      adjustRowPlayers(closest.rowIndex, false); // User drag - don't respect formation
      
    } else if (group.currentSpot) {
      // Snap back to original spot
      group.position({ x: group.currentSpot.x(), y: group.currentSpot.y() });
      group.currentSpot.occupied = true;
    } else {
      // Remove player if no valid spot
      const playerIndex = state.players.indexOf(group);
      if (playerIndex > -1) {
        state.players.splice(playerIndex, 1);
      }
      group.destroy();
    }
    
    state.layers.players.draw();
  });

  return group;
}

// === INIT PLAYERS ===
function initPlayers() {
      state.players = []; // Clear existing players
      
      for (let i = 0; i < 11; i++) {
        const spot = state.ghostSpots[i];
        if (!spot) continue;
        
        const color = spot.RoleColor || '#1976d2';
        const player = createPlayer(spot.x(), spot.y(), (i + 1).toString(), color);
        spot.occupied = true;
        player.currentSpot = spot;
        state.layers.players.add(player);
        state.players.push(player);
      }
      state.layers.players.draw();
    }

    

// Helper function to determine if wide spacing should be maintained
function shouldMaintainWideSpacing(occupiedSpots, allRowSpots) {
  if (occupiedSpots.length !== 2) return false;
  
  // Sort spots by X position
  const sortedOccupied = occupiedSpots.slice().sort((a, b) => a.originalX - b.originalX);
  const sortedAll = allRowSpots.slice().sort((a, b) => a.originalX - b.originalX);
  
  // Check if occupied spots are at the extreme ends
  const leftmostOccupied = sortedOccupied[0];
  const rightmostOccupied = sortedOccupied[1];
  const leftmostAvailable = sortedAll[0];
  const rightmostAvailable = sortedAll[sortedAll.length - 1];
  
  // If the two occupied spots are the leftmost and rightmost available spots
  const isAtExtremes = (leftmostOccupied.originalX === leftmostAvailable.originalX) &&
                      (rightmostOccupied.originalX === rightmostAvailable.originalX);
  
  return isAtExtremes;
}
// Helper function to calculate original spread of positions
function getOriginalSpread(spots) {
  if (spots.length < 2) return 0;
  const xPositions = spots.map(s => s.originalX).sort((a, b) => a - b);
  return xPositions[xPositions.length - 1] - xPositions[0];
}
// === FORMATION APPLY ===
// Enhanced formation application
function applyFormation(name) {
  const formation = FORMATIONS[name];
  if (!formation) return;
  
  // Clear all spots
  state.ghostSpots.forEach(s => s.occupied = false);
  
  const players = state.players;
  const indices = formation.indices;
  const rowsToAdjust = new Set();
  
  // Position players according to formation
  for (let i = 0; i < players.length && i < indices.length; i++) {
    const player = players[i];
    const spotIndex = indices[i];
    const spot = state.ghostSpots[spotIndex];
    if (!spot) continue;
    
    const oldRowIndex = player.currentSpot?.rowIndex;
    
    player.currentSpot = spot;
    spot.occupied = true;
    
    // Track rows that need adjustment
    if (oldRowIndex !== undefined) rowsToAdjust.add(oldRowIndex);
    rowsToAdjust.add(spot.rowIndex);
  }
  
  // Apply spacing adjustments with staggered timing for visual appeal
  let delay = 0;
  rowsToAdjust.forEach(rowIndex => {
    setTimeout(() => {
      adjustRowPlayers(rowIndex, true); // Formation application - respect formation positions
    }, delay);
    delay += 50; // 50ms stagger between rows
  });
  
  state.layers.players.draw();
}

// === UI: SHOW/HIDE SPOTS ===
function showGhostSpots() {
      for (const spot of state.ghostSpots) {
        if (!spot.occupied) {
          spot.visible(true);
          spot.fill('rgba(128,128,128,0.6)');
        }
      }
      state.layers.formation.draw();
    }
function hideGhostSpots() {
      state.ghostSpots.forEach(s => {
        s.visible(false);
        s.fill('rgba(128,128,128,0.3)');
      });
      state.layers.formation.draw();
    }

function showAllSpots() {
      state.ghostSpots.forEach(s => {
        s.visible(true);
        s.fill('rgba(128,128,128,0.4)');
      });
      state.layers.formation.draw();
      
      setTimeout(() => {
        hideGhostSpots();
      }, 2000);
    }
function resetFormation() {
      // Clear all players
      state.players.forEach(player => player.destroy());
      state.players = [];
      state.ghostSpots.forEach(spot => spot.occupied = false);
      state.layers.players.removeChildren();
      
      // Recreate players
      initPlayers();
      applyFormation('433');
    }

// === BOOTSTRAP ===
document.addEventListener('DOMContentLoaded', () => {
  initStage();
  buildGhostSpots();
  initPlayers();
  applyFormation('433');
});
