// Role mapping based on grid positions
// rowIndex 0-5, spotIndex 0-4
export const ROLE_MAPPING = {
  0: {
    // Row 0: Strikers (3 spots)
    0: 'LW',
    1: 'LW',
    2: 'ST',
    3: 'RW',
    4: 'RW'
  },
  1: {
    // Row 1: Attacking Midfield/Wingers (5 spots)
    0: 'LW',
    1: 'LAM',
    2: 'CAM',
    3: 'RAM',
    4: 'RW'
  },
  2: {
    // Row 2: Central Midfield (5 spots)
    0: 'LM',
    1: 'LCM',
    2: 'CM',
    3: 'RCM',
    4: 'RM'
  },
  3: {
    // Row 3: Defensive Midfield (5 spots)
    0: 'LWB',
    1: 'LDM',
    2: 'CDM',
    3: 'RDM',
    4: 'RWB'
  },
  4: {
    // Row 4: Defense (5 spots)
    0: 'LB',
    1: 'LCB',
    2: 'CB',
    3: 'RCB',
    4: 'RB'
  },
  5: {
    // Row 5: Goalkeeper (1 spot in center)
    0: 'GK',
    1: 'GK',
    2: 'GK',
    3: 'GK',
    4: 'GK'
  }
};

// Get role for a specific spot based on row and spot indices
export function getRoleForSpot(rowIndex, spotIndex) {
  const row = ROLE_MAPPING[rowIndex];
  if (!row) {
    console.warn(`Invalid rowIndex: ${rowIndex}`);
    return 'P';
  }

  const role = row[spotIndex];
  if (!role) {
    console.warn(`Invalid spotIndex: ${spotIndex} for rowIndex: ${rowIndex}`);
    return 'P';
  }

  return role;
}

// Get role for a formation-specific spot
// This is used when applying a formation to get the correct role label
export function getRoleForFormationSpot(formationRoles, ghostSpotId, rowIndex, spotIndex) {
  // First check if the formation has a specific role for this spot
  if (formationRoles && formationRoles[ghostSpotId]) {
    return formationRoles[ghostSpotId];
  }

  // Otherwise fall back to the default role mapping
  return getRoleForSpot(rowIndex, spotIndex);
}
