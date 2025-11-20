import Konva from 'https://esm.sh/konva';
import { FORMATIONS } from './formation.js';
import { getRoleForSpot, getRoleForFormationSpot } from './role.js';
import { MOVEMENT_PATTERNS, getMovementForRole } from './movement.js';
import { initTheme, applyTheme, getCurrentTheme, THEMES } from './themes.js';

// === GLOBAL STATE ===
const state = {
  stage: null,
  layers: {},
  ghostSpots: [],
  players: [],
  dimensions: {},
  currentFormation: '433',
  isSimulating: false
};

// === FIELD INIT ===
function initStage() {
  // Initial setup with a logical size (we'll scale this to fit)
  const logicalWidth = 800;
  const logicalHeight = 700;

  const stage = new Konva.Stage({
    container: 'konva-holder',
    width: logicalWidth,
    height: logicalHeight
  });

  const fieldWidth = 400;
  const fieldHeight = 600;
  // Center field in logical space
  const offsetX = (logicalWidth - fieldWidth) / 2;
  const offsetY = (logicalHeight - fieldHeight) / 2;
  const cx = offsetX + fieldWidth / 2;
  const cy = offsetY + fieldHeight / 2;

  // Store global dims
  state.stage = stage;
  state.dimensions = { fieldWidth, fieldHeight, offsetX, offsetY, cx, cy, logicalWidth, logicalHeight };
  state.layers.field = new Konva.Layer();
  state.layers.formation = new Konva.Layer();
  state.layers.players = new Konva.Layer();

  // Pitch Background
  const field = new Konva.Rect({
    x: offsetX, y: offsetY,
    width: fieldWidth, height: fieldHeight,
    fill: 'rgba(255, 255, 255, 0.02)',
    stroke: 'rgba(255,255,255,0.15)',
    strokeWidth: 2,
    shadowBlur: 0,
    cornerRadius: 4
  });

  const centerCircle = new Konva.Circle({
    x: cx, y: cy,
    radius: 50,
    stroke: 'rgba(255,255,255,0.15)', strokeWidth: 2, fill: 'transparent'
  });

  const centerLine = new Konva.Line({
    points: [offsetX, cy, offsetX + fieldWidth, cy],
    stroke: 'rgba(255,255,255,0.15)', strokeWidth: 2
  });

  const centerSpot = new Konva.Circle({
    x: cx, y: cy, radius: 3, fill: 'rgba(255,255,255,0.3)'
  });

  const topBox = new Konva.Rect({
    x: cx - 80, y: offsetY,
    width: 160, height: 80,
    stroke: 'rgba(255,255,255,0.15)', strokeWidth: 2
  });

  const bottomBox = new Konva.Rect({
    x: cx - 80, y: offsetY + fieldHeight - 80,
    width: 160, height: 80,
    stroke: 'rgba(255,255,255,0.15)', strokeWidth: 2
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
    stroke: 'rgba(255,255,255,0.15)', strokeWidth: 2
  }));

  state.layers.field.add(field, centerCircle, centerLine, centerSpot, topBox, bottomBox);
  cornerArcs.forEach(arc => state.layers.field.add(arc));

  stage.add(state.layers.field, state.layers.formation, state.layers.players);
  state.layers.field.draw();

  // Initial fit
  fitStageToParent();

  // Handle resize
  window.addEventListener('resize', fitStageToParent);
}

function fitStageToParent() {
  const container = document.getElementById('konva-holder');
  if (!container || !state.stage) return;

  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;

  // Scale to fit, maintaining aspect ratio if desired, or just fit
  // Here we scale to fit the container while keeping the logical coordinate system
  const scale = Math.min(
    containerWidth / state.dimensions.logicalWidth,
    containerHeight / state.dimensions.logicalHeight
  );

  state.stage.width(containerWidth);
  state.stage.height(containerHeight);
  state.stage.scale({ x: scale, y: scale });

  // Center the content
  const newX = (containerWidth - state.dimensions.logicalWidth * scale) / 2;
  const newY = (containerHeight - state.dimensions.logicalHeight * scale) / 2;

  state.stage.position({ x: newX, y: newY });
}

// === GHOST SPOTS ===
function buildGhostSpots(spread = 1, depth = 1) {
  const { offsetY, cx, fieldHeight } = state.dimensions;
  // Updated rows with correct positioning
  const rows = [
    // Row 0: Strikers (3 spots)
    { y: offsetY + 140, xOffsets: [-60, 0, 60] },
    // Row 1: Attacking Midfield/Wingers (5 spots, wingers at ends)
    { y: offsetY + 220, xOffsets: [-140, -70, 0, 70, 140] },
    // Row 2: Central Midfield (5 spots)
    { y: offsetY + 300, xOffsets: [-120, -60, 0, 60, 120] },
    // Row 3: Defensive Midfield (5 spots)
    { y: offsetY + 380, xOffsets: [-140, -70, 0, 70, 140] },
    // Row 4: Defense (5 spots)
    { y: offsetY + 460, xOffsets: [-120, -60, 0, 60, 120] },
    // Row 5: Goalkeeper (1 spot) - positioned at the bottom
    { y: offsetY + fieldHeight - 40, xOffsets: [0] }
  ];
  const colorsByRow = ['#3b82f6', '#60a5fa', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  state.ghostSpots = []; // Clear existing spots
  rows.forEach((row, rowIndex) => {
    const y = offsetY + (row.y - offsetY) * depth;
    const fill = colorsByRow[rowIndex] || '#888';

    row.xOffsets.forEach((offset, spotIndex) => {
      const x = cx + offset * spread;
      const spot = new Konva.Circle({
        x, y,
        radius: 16,
        fill: 'rgba(255,255,255,0.05)',
        stroke: 'rgba(255,255,255,0.2)',
        strokeWidth: 1,
        visible: false
      });

      // Add label to spot
      const label = new Konva.Text({
        x: x - 20,
        y: y - 6,
        width: 40,
        text: '',
        fontSize: 10,
        fontFamily: 'Outfit',
        fill: 'rgba(255,255,255,0.5)',
        align: 'center',
        visible: false,
        listening: false // Let clicks pass through to spot
      });

      spot.occupied = false;
      spot.rowIndex = rowIndex;
      spot.spotIndex = spotIndex;
      spot.RoleColor = fill;
      spot.originalX = x;
      spot.role = 'P'; // Default role
      spot.labelNode = label; // Link label to spot

      state.ghostSpots.push(spot);
      state.layers.formation.add(spot);
      state.layers.formation.add(label);
    });
  });
  state.layers.formation.draw();
}
// Additional helper function for tactical adjustments
// Enhanced adjustRowPlayers that respects formation intent
function adjustRowPlayers(rowIndex, respectFormationPositions = true) {
  const { fieldWidth, offsetX } = state.dimensions;

  // Get players in this row
  const rowPlayers = state.players.filter(p => p.currentSpot?.rowIndex === rowIndex);
  if (rowPlayers.length === 0) return;

  const rowSpots = state.ghostSpots.filter(s => s.rowIndex === rowIndex);
  if (rowSpots.length === 0) return;

  // Sort players left to right
  rowPlayers.sort((a, b) => a.x() - b.x());

  const allOccupiedSpots = rowPlayers.map(p => p.currentSpot);

  // FIXED: Only adjust spacing for adjacent players, otherwise keep original ghost spot positions
  const shouldAdjustSpacing = checkIfPlayersAreAdjacent(rowPlayers);

  // Determine target X positions
  let positions = [];

  if (!shouldAdjustSpacing) {
    // Just use ghost spot positions
    positions = rowPlayers.map(p => p.currentSpot.originalX);
  } else {
    // Apply spread (dynamic layout)
    const basePadding = 40;
    const dynamicPadding = Math.max(basePadding, 60 - (rowPlayers.length * 5));
    const fieldLeft = offsetX + dynamicPadding;
    const fieldRight = offsetX + fieldWidth - dynamicPadding;
    const availableWidth = fieldRight - fieldLeft;

    if (rowPlayers.length === 1) {
      // Single player stays at ghost spot position
      positions = [rowPlayers[0].currentSpot.originalX];
    } else if (rowPlayers.length === 2) {
      // Check if they're at extreme positions (like wingers)
      const occupiedSpots = rowPlayers.map(p => p.currentSpot);
      if (shouldMaintainWideSpacing(occupiedSpots, rowSpots)) {
        positions = rowPlayers.map(p => p.currentSpot.originalX);
      } else {
        positions = [
          fieldLeft + availableWidth * 0.33,
          fieldLeft + availableWidth * 0.67
        ];
      }
    } else if (rowIndex === 4 && rowPlayers.length === 3) {
      // Special case for 3 CBs - keep them tight in the center
      const centerX = state.dimensions.cx;
      const spacing = 70; // Tighter spacing for CBs
      positions = [
        centerX - spacing,
        centerX,
        centerX + spacing
      ];
    } else {
      const spacing = availableWidth / (rowPlayers.length - 1);
      for (let i = 0; i < rowPlayers.length; i++) {
        let baseX = fieldLeft + spacing * i;

        // Slight realism curve for midfielders
        if (rowIndex >= 2 && rowIndex <= 3) {
          const curveFactor = 0.1;
          const normalizedPos = (i / (rowPlayers.length - 1)) - 0.5;
          const curve = Math.sin(normalizedPos * Math.PI) * curveFactor * availableWidth;
          baseX += curve;
        }

        positions.push(baseX);
      }
    }
  }

  // Apply position updates
  rowPlayers.forEach((player, i) => {
    const newX = positions[i];
    const newY = player.currentSpot.y();

    new Konva.Tween({
      node: player,
      duration: 0.3,
      x: newX,
      y: newY,
      easing: Konva.Easings.EaseOut
    }).play();

    // Update role color
    player.findOne('Circle').fill(player.currentSpot.RoleColor);
  });

  state.layers.players.draw();
}


// Helper function to check if players are adjacent horizontally
function checkIfPlayersAreAdjacent(players) {
  if (players.length <= 1) return false;

  // Get spot indices of current players
  const playerSpotIndices = players.map(p => p.currentSpot.spotIndex).sort((a, b) => a - b);

  // Check if any two consecutive players are adjacent (difference of 1)
  for (let i = 0; i < playerSpotIndices.length - 1; i++) {
    if (playerSpotIndices[i + 1] - playerSpotIndices[i] === 1) {
      return true; // Found adjacent players
    }
  }

  return false; // No adjacent players
}

// === CREATE PLAYER ===
// Updated drag handling to use formation-aware spacing
function createPlayer(x, y, role = 'P', color = '#3b82f6') {
  const group = new Konva.Group({ x, y, draggable: true });

  // Get current theme data
  const currentThemeName = getCurrentTheme();
  const themeData = THEMES[currentThemeName] || THEMES.premium;
  const style = themeData.playerStyle || THEMES.premium.playerStyle;

  // Create visual elements based on theme
  let mainShape, glow, label;

  // 1. GLOW EFFECT
  if (style.shadow) {
    glow = new Konva.Circle({
      radius: 22,
      fill: color,
      opacity: 0,
      listening: false,
      name: 'glow'
    });
  } else {
    // Invisible placeholder for consistent structure
    glow = new Konva.Circle({
      radius: 22,
      fill: 'transparent',
      opacity: 0,
      listening: false,
      name: 'glow'
    });
  }

  // 2. MAIN PLAYER SHAPE
  if (style.shape === 'square') {
    // Retro/Arcade style
    mainShape = new Konva.Rect({
      width: 36,
      height: 36,
      offsetX: 18,
      offsetY: 18,
      fill: style.type === 'pixel' ? color : 'transparent',
      stroke: style.stroke,
      strokeWidth: style.strokeWidth,
      shadowColor: color,
      shadowBlur: style.type === 'pixel' ? 10 : 0,
      shadowOpacity: 0.5,
      name: 'mainShape'
    });
  } else {
    // Standard Circle style (Premium, Whiteboard, Chalkboard)
    mainShape = new Konva.Circle({
      radius: 18,
      fill: style.type === 'chalk' ? 'transparent' : color,
      stroke: style.stroke,
      strokeWidth: style.strokeWidth,
      shadowColor: 'black',
      shadowBlur: style.type === 'marker' ? 5 : (style.type === 'led' ? 15 : 0),
      shadowOpacity: 0.3,
      dash: style.type === 'chalk' ? [15, 5] : null, // Chalk effect
      name: 'mainShape'
    });
  }

  // 3. LABEL TEXT
  const fontSize = role.length > 3 ? 9 : (role.length > 2 ? 10 : 11);
  label = new Konva.Text({
    text: role,
    fontSize: fontSize,
    fontFamily: style.font.split(',')[0].replace(/['"]/g, ''), // Extract primary font
    fontStyle: 'bold',
    fill: style.type === 'chalk' ? 'white' : (style.type === 'marker' ? 'white' : 'white'),
    align: 'center',
    verticalAlign: 'middle',
    width: 36,
    height: 36,
    offsetX: 18,
    offsetY: 18,
    name: 'label'
  });

  group.add(glow, mainShape, label);
  group.currentSpot = null;
  group.playerRole = role;

  let originalSpot = null;

  group.on('mouseenter', () => {
    document.body.style.cursor = 'pointer';

    // Theme-specific hover effect
    if (style.type === 'pixel' || style.type === 'led') {
      // Glitch/Pulse effect for digital themes
      new Konva.Tween({
        node: mainShape,
        duration: 0.1,
        shadowBlur: 20,
        scaleX: 1.1,
        scaleY: 1.1
      }).play();
    } else {
      // Standard lift effect
      new Konva.Tween({
        node: glow,
        duration: 0.2,
        opacity: 0.4,
        scaleX: 1.2,
        scaleY: 1.2
      }).play();
    }
  });

  group.on('mouseleave', () => {
    document.body.style.cursor = 'default';

    if (style.type === 'pixel' || style.type === 'led') {
      new Konva.Tween({
        node: mainShape,
        duration: 0.2,
        shadowBlur: style.type === 'pixel' ? 10 : 15,
        scaleX: 1,
        scaleY: 1
      }).play();
    } else {
      new Konva.Tween({
        node: glow,
        duration: 0.2,
        opacity: 0,
        scaleX: 1,
        scaleY: 1
      }).play();
    }
  });

  group.on('dragstart', () => {
    originalSpot = group.currentSpot; // Store original spot
    showGhostSpots();
    if (group.currentSpot) group.currentSpot.occupied = false;

    // Lift effect
    new Konva.Tween({
      node: group,
      duration: 0.1,
      scaleX: 1.1,
      scaleY: 1.1
    }).play();
  });

  group.on('dragend', () => {
    hideGhostSpots();

    // Drop effect
    new Konva.Tween({
      node: group,
      duration: 0.1,
      scaleX: 1,
      scaleY: 1
    }).play();

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

    const oldRowIndex = originalSpot?.rowIndex;

    if (closest && minDist < 70) {
      // Snap to new spot
      group.position({ x: closest.x(), y: closest.y() });
      closest.occupied = true;
      group.currentSpot = closest;

      // Use formation-aware spacing - pass false since this is user drag
      if (oldRowIndex !== undefined && oldRowIndex !== closest.rowIndex) {
        adjustRowPlayers(oldRowIndex, false); // User drag - don't respect formation
      }
      adjustRowPlayers(closest.rowIndex, false); // User drag - don't respect formation

      setTimeout(() => {
        const finalRole = getRoleForSpot(closest.rowIndex, closest.spotIndex);
        group.playerRole = finalRole;

        //Update label 
        const textNode = group.findOne('.label');
        textNode.text(finalRole);
        textNode.fontSize(finalRole.length > 3 ? 9 : (finalRole.length > 2 ? 10 : 11));

        // Update main shape color (works for both Circle and Rect)
        const mainShape = group.findOne('.mainShape');
        if (mainShape) {
          mainShape.fill(closest.RoleColor);
          // Only update shadow color if it has one
          if (mainShape.shadowColor()) {
            mainShape.shadowColor(closest.RoleColor);
          }
        }

        // Update glow color if it exists
        const glow = group.findOne('.glow');
        if (glow) {
          glow.fill(closest.RoleColor);
        }

        state.layers.players.draw();
      }, 350); // Allow time for position update


    } else if (originalSpot) {
      // Snap back to original spot
      group.position({ x: originalSpot.x(), y: originalSpot.y() });
      originalSpot.occupied = true;
      group.currentSpot = originalSpot;
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

  // FIXED: 11 unique players with correct spot assignments
  // FIXED: 11 unique players with correct spot assignments matching new 4-3-3 definition
  const playersToCreate = [
    { spotIndex: 23 },  // GK
    { spotIndex: 18 },  // LB
    { spotIndex: 19 },  // LCB
    { spotIndex: 21 },  // RCB
    { spotIndex: 22 },  // RB
    { spotIndex: 15 },  // CDM
    { spotIndex: 9 },   // LCM
    { spotIndex: 11 },  // RCM
    { spotIndex: 3 },   // LW
    { spotIndex: 1 },   // ST
    { spotIndex: 7 }    // RW
  ];

  playersToCreate.forEach(({ spotIndex, role }) => {
    const spot = state.ghostSpots[spotIndex];
    if (!spot) {
      console.warn(`Spot ${spotIndex} not found for role ${role}`);
      return;
    }

    const color = spot.RoleColor || '#3b82f6';
    const player = createPlayer(spot.x(), spot.y(), role, color);
    spot.occupied = true;
    player.currentSpot = spot;
    const newRole = getRoleForSpot(spot.rowIndex, spot.spotIndex);
    player.playerRole = newRole;

    const textNode = player.findOne('Text');
    textNode.text(newRole);
    textNode.fontSize(newRole.length > 3 ? 9 : (newRole.length > 2 ? 10 : 11));
    state.layers.players.add(player);
    state.players.push(player);
  });
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

    // Update role based on formation
    const newRole = formation.roles ? formation.roles[spotIndex] :
      getRoleForSpot(spot.rowIndex, spot.spotIndex);

    // Assign role to spot
    spot.role = newRole;
    spot.labelNode.text(newRole);

    // Update player role
    player.playerRole = newRole;

    // Update label text and font size
    const textNode = player.findOne('Text');
    textNode.text(newRole);
    textNode.fontSize(newRole.length > 2 ? 10 : 11);

    // Track rows that need adjustment
    if (oldRowIndex !== undefined) rowsToAdjust.add(oldRowIndex);
    rowsToAdjust.add(spot.rowIndex);
  }

  // Update all ghost spot labels for the formation (even unoccupied ones)
  // This ensures that when dragging, the user sees the correct roles
  // Update all ghost spot labels for the formation
  // First, clear ALL labels to avoid stale ones from previous formations
  state.ghostSpots.forEach(spot => {
    spot.role = '';
    spot.labelNode.text('');
  });

  // Then apply new labels from the formation
  if (formation.roles) {
    Object.entries(formation.roles).forEach(([index, role]) => {
      const spot = state.ghostSpots[index];
      if (spot) {
        spot.role = role;
        spot.labelNode.text(role);
      }
    });
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
// Optional: Function to manually set a player's role (useful for custom formations)
function setPlayerRole(player, newRole) {
  player.playerRole = newRole;
  const textNode = player.findOne('Text');
  textNode.text(newRole);
  textNode.fontSize(newRole.length > 2 ? 10 : 11);
  state.layers.players.draw();
}

// Optional: Function to get all players by role (useful for tactical analysis)
function getPlayersByRole(role) {
  return state.players.filter(player => player.playerRole === role);
}

// Optional: Function to validate formation (check if all essential roles are filled)
function validateFormation() {
  const roles = state.players.map(p => p.playerRole);
  const hasGK = roles.includes('GK');
  const hasDefenders = roles.some(role => ['LB', 'CB', 'LCB', 'RCB', 'RB'].includes(role));
  const hasMidfielders = roles.some(role => ['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(role));
  const hasAttackers = roles.some(role => ['ST', 'LW', 'RW', 'CF'].includes(role));

  return {
    valid: hasGK && hasDefenders && hasMidfielders && hasAttackers,
    missing: {
      goalkeeper: !hasGK,
      defenders: !hasDefenders,
      midfielders: !hasMidfielders,
      attackers: !hasAttackers
    }
  };
}
// === UI: SHOW/HIDE SPOTS ===
function showGhostSpots() {
  for (const spot of state.ghostSpots) {
    if (!spot.occupied) {
      spot.visible(true);
      spot.labelNode.visible(true);
      spot.fill('rgba(255,255,255,0.1)');
    }
  }
  state.layers.formation.draw();
}
function hideGhostSpots() {
  state.ghostSpots.forEach(s => {
    s.visible(false);
    s.labelNode.visible(false);
    s.fill('rgba(255,255,255,0.05)');
  });
  state.layers.formation.draw();
}

function showAllSpots() {
  state.ghostSpots.forEach(s => {
    s.visible(true);
    s.labelNode.visible(true);
    s.fill('rgba(255,255,255,0.1)');
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

// === SIMULATION LOGIC ===
function simulateMovement() {
  if (state.isSimulating) {
    // Reset to base formation
    state.players.forEach(player => {
      if (player.currentSpot) {
        new Konva.Tween({
          node: player,
          duration: 0.6,
          x: player.currentSpot.x(),
          y: player.currentSpot.y(),
          easing: Konva.Easings.EaseInOut
        }).play();
      }
    });

    state.isSimulating = false;
    const btn = document.getElementById('simulate-btn');
    if (btn) {
      btn.innerHTML = '<i class="fas fa-play"></i> Simulate';
      btn.classList.remove('active');
    }
  } else {
    // Apply movements
    state.players.forEach(player => {
      const role = player.playerRole;
      // Determine side based on position relative to center
      const side = player.x() < state.dimensions.cx ? 'left' : (player.x() > state.dimensions.cx ? 'right' : 'center');

      const movement = getMovementForRole(role, side);

      if (movement.x !== 0 || movement.y !== 0) {
        new Konva.Tween({
          node: player,
          duration: 0.8,
          x: player.x() + movement.x,
          y: player.y() + movement.y,
          easing: Konva.Easings.EaseInOut
        }).play();
      }
    });

    state.isSimulating = true;
    const btn = document.getElementById('simulate-btn');
    if (btn) {
      btn.innerHTML = '<i class="fas fa-undo"></i> Reset';
      btn.classList.add('active');
    }
  }
}

// === BOOTSTRAP ===
document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme system
  initTheme();

  initStage();
  buildGhostSpots();
  initPlayers();
  applyFormation('433');

  // Add event listeners for formation buttons
  const formationBtns = document.querySelectorAll('.formation-btn');
  formationBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      formationBtns.forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      btn.classList.add('active');

      const formationName = btn.dataset.formation;
      applyFormation(formationName);
    });
  });

  // Theme switcher functionality
  const themeToggle = document.getElementById('theme-toggle');
  const themeDropdown = document.getElementById('theme-dropdown');

  if (themeToggle && themeDropdown) {
    // Toggle dropdown visibility
    themeToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      themeDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!themeToggle.contains(e.target) && !themeDropdown.contains(e.target)) {
        themeDropdown.classList.remove('active');
      }
    });

    // Handle theme selection
    const themeOptions = themeDropdown.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
      option.addEventListener('click', () => {
        const themeName = option.dataset.theme;
        applyTheme(themeName);
        themeDropdown.classList.remove('active');

        // Update active state
        themeOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
      });
    });
  }

  // Listen for theme changes to update player visuals
  window.addEventListener('themeChanged', () => {
    updateAllPlayerVisuals();
  });

  // Simulate Movement button (placeholder)
  const simulateMovementBtn = document.getElementById('simulate-movement-btn');
  if (simulateMovementBtn) {
    simulateMovementBtn.addEventListener('click', () => {
      // Call existing simulation function
      simulateMovement();
    });
  }

  // Bind legacy simulation button if it exists
  const simBtn = document.getElementById('simulate-btn');
  if (simBtn) {
    simBtn.addEventListener('click', simulateMovement);
  }
});

// Helper to redraw all players with new theme style
function updateAllPlayerVisuals() {
  // Store current player data
  const playerData = state.players.map(p => ({
    x: p.x(),
    y: p.y(),
    role: p.playerRole,
    spot: p.currentSpot,
    color: p.currentSpot ? p.currentSpot.RoleColor : '#3b82f6'
  }));

  // Remove all existing players
  state.players.forEach(p => p.destroy());
  state.players = [];
  state.layers.players.removeChildren();

  // Recreate players with new style
  playerData.forEach(data => {
    const player = createPlayer(data.x, data.y, data.role, data.color);
    player.currentSpot = data.spot;
    player.playerRole = data.role;

    // Ensure text and colors are correct
    const textNode = player.findOne('.label');
    if (textNode) {
      textNode.text(data.role);
      textNode.fontSize(data.role.length > 3 ? 9 : (data.role.length > 2 ? 10 : 11));
    }

    state.layers.players.add(player);
    state.players.push(player);
  });

  state.layers.players.draw();
}
