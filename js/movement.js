// Movement patterns for different roles
// Offsets are relative to the player's starting position
// x: horizontal movement (negative = left, positive = right)
// y: vertical movement (negative = up/forward, positive = down/backward)

export const MOVEMENT_PATTERNS = {
    // Strikers
    'ST': { x: 0, y: -50 },      // Standard striker pushes up
    'DLF': { x: 0, y: 60 },      // Deep Lying Forward drops deep
    'AF': { x: 0, y: -80 },      // Advanced Forward pushes line hard
    'F9': { x: 0, y: 70 },       // False 9 drops very deep

    // Wingers
    'LW': { x: -20, y: -60 },    // Left Winger stays wide and pushes up
    'RW': { x: 20, y: -60 },     // Right Winger stays wide and pushes up
    'IW': { x: 40, y: -40 },     // Inverted Winger cuts inside (generic, direction depends on side)
    'IF': { x: 50, y: -50 },     // Inside Forward cuts inside aggressively

    // Midfielders
    'CM': { x: 0, y: 0 },        // Standard CM holds position
    'BBM': { x: 0, y: -40 },     // Box to Box pushes up (and down, but we simulate attacking phase)
    'AP': { x: 0, y: -30 },      // Advanced Playmaker finds space forward
    'DLP': { x: 0, y: 20 },      // Deep Lying Playmaker drops slightly
    'CDM': { x: 0, y: 10 },      // CDM holds/drops
    'VOL': { x: 0, y: -40 },     // Segundo Volante pushes forward

    // Defenders
    'CB': { x: 0, y: -10 },      // CB pushes up slightly with line
    'LCB': { x: -10, y: -10 },   // Wide CBs spread
    'RCB': { x: 10, y: -10 },
    'LB': { x: -10, y: -40 },    // Fullbacks push up
    'RB': { x: 10, y: -40 },
    'WB': { x: -10, y: -70 },    // Wingbacks push high
    'IWB': { x: 30, y: -30 },    // Inverted Wingback tucks in

    // Goalkeeper
    'GK': { x: 0, y: -20 },      // GK sweeps up slightly
    'SK': { x: 0, y: -40 }       // Sweeper Keeper pushes up more
};

// Helper to get movement for a specific role and side (for asymmetric roles like IW)
export function getMovementForRole(role, side = 'center') {
    let movement = MOVEMENT_PATTERNS[role] || { x: 0, y: 0 };

    // Clone to avoid modifying original
    movement = { ...movement };

    // Adjust for side-specific logic (e.g. Inverted roles)
    if (role === 'IW' || role === 'IF' || role === 'IWB') {
        if (side === 'left') {
            movement.x = Math.abs(movement.x); // Move right (inside)
        } else if (side === 'right') {
            movement.x = -Math.abs(movement.x); // Move left (inside)
        }
    }

    return movement;
}
