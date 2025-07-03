// Enhanced formation definitions with corrected indices
export const FORMATIONS = {
  '433': {
    name: '4-3-3',
    indices: [
      23, // GK (row 5, spot 0)
      20, // LB (row 4, spot 0) 
      21, // LCB (row 4, spot 1)
      22, // CB (row 4, spot 2)
      23, // RCB (row 4, spot 3)
      24, // RB (row 4, spot 4)
      15, // CDM (row 3, spot 2)
      10, // LCM (row 2, spot 1)
      12, // RCM (row 2, spot 3)
      5,  // LW (row 1, spot 0)
      1,  // ST (row 0, spot 1)
      9   // RW (row 1, spot 4)
    ],
    roles: {
      23: 'GK',   // Goalkeeper
      20: 'LB',   // Left Back
      21: 'LCB',  // Left Center Back
      22: 'CB',   // Center Back
      23: 'RCB',  // Right Center Back
      24: 'RB',   // Right Back
      15: 'CDM',  // Defensive Midfielder
      10: 'LCM',  // Left Central Midfielder
      12: 'RCM',  // Right Central Midfielder
      5:  'LW',   // Left Winger
      1:  'ST',   // Striker
      9:  'RW'    // Right Winger
    }
  },
  
  '442': {
    name: '4-4-2',
    indices: [
      23, // GK
      20, 21, 22, 23, 24, // Defense (LB, LCB, CB, RCB, RB)
      10, 11, 12, 13,     // Midfield (LM, LCM, RCM, RM)
      1, 2                // Attack (ST, ST)
    ],
    roles: {
      23: 'GK',
      20: 'LB',
      21: 'LCB', 
      22: 'CB',
      23: 'RCB',
      24: 'RB',
      10: 'LM',
      11: 'LCM',
      12: 'RCM', 
      13: 'RM',
      1: 'ST',
      2: 'ST'
    }
  }
};