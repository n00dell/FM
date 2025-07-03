// roles.js - Player Role Mapping System
export const ROLE_MAPPING = {
  0: {
    0: 'ST',    // Left striker position
    1: 'ST',    // Center striker position  
    2: 'ST'     // Right striker position
  },
  
  // Row 1: Attacking Midfield/Wingers (5 spots, wingers at ends)
  1: {
    0: 'LW',    // Left Winger (furthest left)
    1: 'LAM',   // Left Attacking Mid
    2: 'CAM',   // Central Attacking Mid
    3: 'RAM',   // Right Attacking Mid
    4: 'RW'     // Right Winger (furthest right)
  },
  
  // Row 2: Central Midfield (5 spots)
  2: {
    0: 'LM',    // Left Mid
    1: 'CM',   // Left Central Mid
    2: 'CM',    // Central Mid
    3: 'CM',   // Right Central Mid
    4: 'RM'     // Right Mid
  },
  
  // Row 3: Defensive Midfielders (5 spots)
  3: {
    0: 'LWB',   // Left Wing Back
    1: 'CDM',  // Left Central Defensive Mid
    2: 'CDM',   // Central Defensive Mid
    3: 'CDM',  // Right Central Defensive Mid
    4: 'RWB'    // Right Wing Back
  },
  
  // Row 4: Defense (5 spots)
  4: {
    0: 'LB',    // Left Back
    1: 'CB',   // Left Center Back
    2: 'CB',    // Center Back
    3: 'CB',   // Right Center Back
    4: 'RB'     // Right Back
  },
  
  // Row 5: Goalkeeper (1 spot)
  5: {
    0: 'GK'     // Goalkeeper
  }
};

// Alternative role names for different formations/tactics
export const ROLE_VARIANTS = {
  // Attacking roles
  'ST': ['CF', 'F9', 'TM', 'PF'],  // Striker variants
  'LW': ['LWF', 'IF', 'W'],        // Left Wing variants
  'RW': ['RWF', 'IF', 'W'],        // Right Wing variants
  
  // Midfield roles
  'CAM': ['AM', 'AP', 'ENG', 'TRE'], // Central Attacking Mid variants
  'CM': ['BWM', 'B2B', 'DLP', 'MEZ'], // Central Mid variants
  'CDM': ['DM', 'REG', 'BWM', 'ANC'], // Defensive Mid variants
  
  // Defensive roles
  'CB': ['BPD', 'CD', 'NCB', 'L'],    // Center Back variants
  'LB': ['WB', 'FB', 'CWB', 'IWB'],   // Left Back variants
  'RB': ['WB', 'FB', 'CWB', 'IWB'],   // Right Back variants
  
  // Goalkeeper
  'GK': ['SK', 'SWK']                 // Goalkeeper variants
};

// Function to get role based on spot position
export function getRoleForSpot(rowIndex, spotIndex) {
  const row = ROLE_MAPPING[rowIndex];
  if (!row) return 'P'; // Default to 'P' for Player if no mapping found
  
  const role = row[spotIndex];
  return role || 'P'; // Default to 'P' if no specific role found
}

// Function to get role variant (useful for different tactical setups)
export function getRoleVariant(baseRole, variantIndex = 0) {
  const variants = ROLE_VARIANTS[baseRole];
  if (!variants || variantIndex >= variants.length) {
    return baseRole; // Return base role if no variants or index out of bounds
  }
  return variants[variantIndex];
}

// Function to get all possible roles for a row (useful for UI/formation editor)
export function getRolesForRow(rowIndex) {
  const row = ROLE_MAPPING[rowIndex];
  if (!row) return [];
  
  return Object.values(row);
}

// Enhanced formation definitions with role mapping


// Function to get role for a specific formation and spot index
export function getRoleForFormationSpot(formationName, spotIndex) {
  const formation = FORMATIONS[formationName];
  if (!formation || !formation.roles) {
    // Fallback to position-based role mapping
    const spot = state.ghostSpots[spotIndex];
    if (spot) {
      return getRoleForSpot(spot.rowIndex, spot.spotIndex);
    }
    return 'P';
  }
  
  return formation.roles[spotIndex] || 'P';
}