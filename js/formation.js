// Enhanced formation definitions with corrected indices
export const FORMATIONS = {
  '433': {
    name: '4-3-3',
    indices: [
      23, // GK
      18, // LB
      19, // LCB
      21, // RCB
      22, // RB
      15, // CDM
      9,  // LCM
      11, // RCM
      3,  // LW
      1,  // ST
      7   // RW
    ],
    roles: {
      23: 'GK',
      18: 'LB',
      19: 'LCB',
      21: 'RCB',
      22: 'RB',
      15: 'CDM',
      9: 'CM',
      11: 'CM',
      3: 'LW',
      1: 'ST',
      7: 'RW'
    }
  },

  '442': {
    name: '4-4-2',
    indices: [
      23, // GK
      18, // LB
      19, // LCB
      21, // RCB
      22, // RB
      8,  // LM
      9,  // LCM
      11, // RCM
      12, // RM
      0,  // LST
      2   // RST
    ],
    roles: {
      23: 'GK',
      18: 'LB',
      19: 'LCB',
      21: 'RCB',
      22: 'RB',
      8: 'LM',
      9: 'CM',
      11: 'CM',
      12: 'RM',
      0: 'ST',
      2: 'ST'
    }
  },

  '352': {
    name: '3-5-2',
    indices: [
      23, // GK
      19, // LCB
      20, // CB
      21, // RCB
      13, // LWB (Row 3)
      9,  // LCM
      10, // CM
      11, // RCM
      17, // RWB (Row 3)
      0,  // LST
      2   // RST
    ],
    roles: {
      23: 'GK',
      19: 'LCB',
      20: 'CB',
      21: 'RCB',
      13: 'LWB',
      9: 'CM',
      10: 'CM',
      11: 'CM',
      17: 'RWB',
      0: 'ST',
      2: 'ST'
    }
  },

  '4231': {
    name: '4-2-3-1',
    indices: [
      23, // GK
      18, // LB
      19, // LCB
      21, // RCB
      22, // RB
      14, // LCDM
      16, // RCDM
      3,  // LW
      5,  // CAM
      7,  // RW
      1   // ST
    ],
    roles: {
      23: 'GK',
      18: 'LB',
      19: 'LCB',
      21: 'RCB',
      22: 'RB',
      14: 'CDM',
      16: 'CDM',
      3: 'LW',
      5: 'CAM',
      7: 'RW',
      1: 'ST'
    }
  },

  '4141': {
    name: '4-1-4-1',
    indices: [
      23, // GK
      18, // LB
      19, // LCB
      21, // RCB
      22, // RB
      15, // CDM
      8,  // LM
      9,  // LCM
      11, // RCM
      12, // RM
      1   // ST
    ],
    roles: {
      23: 'GK',
      18: 'LB',
      19: 'LCB',
      21: 'RCB',
      22: 'RB',
      15: 'CDM',
      8: 'LM',
      9: 'CM',
      11: 'CM',
      12: 'RM',
      1: 'ST'
    }
  },

  '532': {
    name: '5-3-2',
    indices: [
      23, // GK
      18, // LWB
      19, // LCB
      20, // CB
      21, // RCB
      22, // RWB
      9,  // LCM
      10, // CM
      11, // RCM
      0,  // LST
      2   // RST
    ],
    roles: {
      23: 'GK',
      18: 'LWB',
      19: 'LCB',
      20: 'CB',
      21: 'RCB',
      22: 'RWB',
      9: 'CM',
      10: 'CM',
      11: 'CM',
      0: 'ST',
      2: 'ST'
    }
  },

  '343': {
    name: '3-4-3',
    indices: [
      23, // GK
      19, // LCB
      20, // CB
      21, // RCB
      13, // LWB (Row 3)
      9,  // LCM
      11, // RCM
      17, // RWB (Row 3)
      3,  // LW (Row 1)
      1,  // ST
      7   // RW (Row 1)
    ],
    roles: {
      23: 'GK',
      19: 'LCB',
      20: 'CB',
      21: 'RCB',
      13: 'LWB',
      9: 'CM',
      11: 'CM',
      17: 'RWB',
      3: 'LW',
      1: 'ST',
      7: 'RW'
    }
  },

  '4321': {
    name: '4-3-2-1',
    indices: [
      23, // GK
      18, // LB
      19, // LCB
      21, // RCB
      22, // RB
      9,  // LCM
      10, // CM
      11, // RCM
      4,  // LAM
      6,  // RAM
      1   // ST
    ],
    roles: {
      23: 'GK',
      18: 'LB',
      19: 'LCB',
      21: 'RCB',
      22: 'RB',
      9: 'CM',
      10: 'CM',
      11: 'CM',
      4: 'CAM',
      6: 'CAM',
      1: 'ST'
    }
  }
};