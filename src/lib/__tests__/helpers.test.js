import { describe, it, expect } from 'vitest';
import {
  calcCableDistance,
  isValidIPv4,
  isValidSubnetMask,
  isValidVLAN,
  findDuplicateIPs,
  migrateProjectKeys,
  dedupDeviceIds,
  findDevDef,
  calcPPSection,
  uid,
  syncUid,
  KEY_MIGRATION_MAP
} from '../helpers';

// ========================================================
// calcCableDistance
// ========================================================
describe('calcCableDistance', () => {
  it('should return euclidean distance when no waypoints', () => {
    // 120px horizontal distance at 40px/m = 3m
    expect(calcCableDistance(0, 0, 120, 0)).toBe(3);
  });

  it('should return 1m minimum for very short cables', () => {
    expect(calcCableDistance(0, 0, 5, 0)).toBe(1);
  });

  it('should sum segments through waypoints', () => {
    // L-shaped: (0,0) -> (120,0) -> (120,80)  = 120 + 80 = 200px => 5m
    const wps = [{ x: 120, y: 0 }];
    expect(calcCableDistance(0, 0, 120, 80, wps)).toBe(5);
  });

  it('should handle multiple waypoints', () => {
    // Rectangle path: (0,0)->(200,0)->(200,200)->(0,200) = 200+200+200 = 600px => 15m
    const wps = [{ x: 200, y: 0 }, { x: 200, y: 200 }];
    expect(calcCableDistance(0, 0, 0, 200, wps)).toBe(15);
  });

  it('should respect custom pxPerMeter', () => {
    // 200px at 100px/m = 2m
    expect(calcCableDistance(0, 0, 200, 0, [], 100)).toBe(2);
  });

  it('should return 1m for zero distance', () => {
    expect(calcCableDistance(0, 0, 0, 0)).toBe(1);
  });
});

// ========================================================
// isValidIPv4
// ========================================================
describe('isValidIPv4', () => {
  it('should accept valid IPs', () => {
    expect(isValidIPv4('192.168.1.1')).toBe(true);
    expect(isValidIPv4('10.0.0.1')).toBe(true);
    expect(isValidIPv4('255.255.255.255')).toBe(true);
    expect(isValidIPv4('0.0.0.0')).toBe(true);
  });

  it('should reject invalid IPs', () => {
    expect(isValidIPv4('')).toBe(false);
    expect(isValidIPv4(null)).toBe(false);
    expect(isValidIPv4(undefined)).toBe(false);
    expect(isValidIPv4('256.1.1.1')).toBe(false);
    expect(isValidIPv4('1.2.3')).toBe(false);
    expect(isValidIPv4('1.2.3.4.5')).toBe(false);
    expect(isValidIPv4('abc.def.ghi.jkl')).toBe(false);
    expect(isValidIPv4('192.168.01.1')).toBe(false); // leading zero
  });
});

// ========================================================
// isValidSubnetMask
// ========================================================
describe('isValidSubnetMask', () => {
  it('should accept valid masks', () => {
    expect(isValidSubnetMask('255.255.255.0')).toBe(true);    // /24
    expect(isValidSubnetMask('255.255.0.0')).toBe(true);      // /16
    expect(isValidSubnetMask('255.255.255.128')).toBe(true);   // /25
    expect(isValidSubnetMask('255.255.255.192')).toBe(true);   // /26
  });

  it('should reject invalid masks', () => {
    expect(isValidSubnetMask('255.255.255.1')).toBe(false);   // not contiguous
    expect(isValidSubnetMask('0.0.0.0')).toBe(false);
    expect(isValidSubnetMask('not-a-mask')).toBe(false);
  });
});

// ========================================================
// isValidVLAN
// ========================================================
describe('isValidVLAN', () => {
  it('should accept valid VLANs', () => {
    expect(isValidVLAN(1)).toBe(true);
    expect(isValidVLAN(100)).toBe(true);
    expect(isValidVLAN(4094)).toBe(true);
    expect(isValidVLAN('10')).toBe(true);
  });

  it('should reject invalid VLANs', () => {
    expect(isValidVLAN(0)).toBe(false);
    expect(isValidVLAN(4095)).toBe(false);
    expect(isValidVLAN(-1)).toBe(false);
    expect(isValidVLAN('abc')).toBe(false);
    expect(isValidVLAN(null)).toBe(false);
  });
});

// ========================================================
// findDuplicateIPs
// ========================================================
describe('findDuplicateIPs', () => {
  it('should detect duplicates', () => {
    const devices = [
      { name: 'Cam1', config: { ipAddress: '192.168.1.100' } },
      { name: 'Cam2', config: { ipAddress: '192.168.1.100' } },
      { name: 'NVR', config: { ipAddress: '192.168.1.1' } },
    ];
    const dupes = findDuplicateIPs(devices);
    expect(dupes).toHaveLength(1);
    expect(dupes[0].ip).toBe('192.168.1.100');
    expect(dupes[0].devices).toContain('Cam1');
    expect(dupes[0].devices).toContain('Cam2');
  });

  it('should return empty when no duplicates', () => {
    const devices = [
      { name: 'A', config: { ipAddress: '10.0.0.1' } },
      { name: 'B', config: { ipAddress: '10.0.0.2' } },
    ];
    expect(findDuplicateIPs(devices)).toHaveLength(0);
  });

  it('should skip devices without IP', () => {
    const devices = [
      { name: 'A', config: {} },
      { name: 'B' },
    ];
    expect(findDuplicateIPs(devices)).toHaveLength(0);
  });

  it('should skip invalid IPs', () => {
    const devices = [
      { name: 'A', config: { ipAddress: 'invalid' } },
      { name: 'B', config: { ipAddress: 'invalid' } },
    ];
    expect(findDuplicateIPs(devices)).toHaveLength(0);
  });
});

// ========================================================
// migrateProjectKeys
// ========================================================
describe('migrateProjectKeys', () => {
  it('should mark devices from deleted families as legacy', () => {
    const project = {
      floors: [{
        id: 'f1',
        devices: [
          { id: 'd1', key: 'cam_mhd_bullet_2mp', name: 'Cam MHD' },
          { id: 'd2', key: 'cam_ip_bullet_2mp', name: 'Cam IP' },
        ],
        connections: [],
        racks: [],
        quadros: [],
      }],
    };
    const migrated = migrateProjectKeys(project);
    const d1 = migrated.floors[0].devices.find(d => d.id === 'd1');
    const d2 = migrated.floors[0].devices.find(d => d.id === 'd2');
    expect(d1._legacy).toBe(true);
    expect(d2._legacy).toBeFalsy();
  });

  it('should preserve _originalKey', () => {
    const project = {
      floors: [{
        id: 'f1',
        devices: [
          { id: 'd1', key: 'dvr_4ch', name: 'DVR' },
        ],
        connections: [],
        racks: [],
        quadros: [],
      }],
    };
    const migrated = migrateProjectKeys(project);
    const d = migrated.floors[0].devices[0];
    expect(d._originalKey).toBe('dvr_4ch');
    expect(d._legacy).toBe(true);
  });
});

// ========================================================
// dedupDeviceIds
// ========================================================
describe('dedupDeviceIds', () => {
  it('should fix duplicate IDs within a floor', () => {
    const project = {
      floors: [{
        id: 'f1',
        devices: [
          { id: 'dup1', key: 'cam_ip_bullet_2mp', name: 'A' },
          { id: 'dup1', key: 'cam_ip_dome_2mp', name: 'B' },
        ],
        connections: [],
      }],
    };
    dedupDeviceIds(project);
    const ids = project.floors[0].devices.map(d => d.id);
    expect(new Set(ids).size).toBe(2); // all unique
  });
});

// ========================================================
// findDevDef
// ========================================================
describe('findDevDef', () => {
  it('should find camera by key', () => {
    const def = findDevDef('cam_ip_bullet_2mp');
    expect(def).toBeTruthy();
    expect(def.key).toBe('cam_ip_bullet_2mp');
  });

  it('should return null for unknown key', () => {
    expect(findDevDef('nonexistent_device_key_xyz')).toBeNull();
  });

  it('should find NVR', () => {
    const def = findDevDef('nvr_4ch');
    expect(def).toBeTruthy();
  });
});

// ========================================================
// calcPPSection
// ========================================================
describe('calcPPSection', () => {
  it('should return object with secao, id, label for short distances', () => {
    const result = calcPPSection(10);
    expect(result.secao).toBe(0.5);
    expect(result.id).toContain('pp2v');
    expect(result.label).toContain('PP');
  });

  it('should return larger section for longer distances', () => {
    const result = calcPPSection(150);
    expect(result.secao).toBeGreaterThan(0.5);
  });

  it('should scale section with distance', () => {
    expect(calcPPSection(10).secao).toBe(0.5);
    expect(calcPPSection(50).secao).toBe(1.0);
    expect(calcPPSection(80).secao).toBe(1.5);
    expect(calcPPSection(150).secao).toBe(2.5);
  });

  it('should handle 4 vias', () => {
    const result = calcPPSection(50, 4);
    expect(result).toBeTruthy();
    expect(result.label).toContain('4');
  });
});

// ========================================================
// uid / syncUid
// ========================================================
describe('uid / syncUid', () => {
  it('should generate unique IDs', () => {
    const id1 = uid();
    const id2 = uid();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^d\d+$/);
  });

  it('should sync UID counter from project', () => {
    const project = {
      floors: [{
        devices: [{ id: 'd999' }, { id: 'd1000' }],
        connections: [{ id: 'd500' }],
        environments: [],
        dimensions: [],
        racks: [{ id: 'd300', devices: [] }],
        quadros: [{ id: 'd200', devices: [] }],
      }],
    };
    syncUid(project);
    const next = uid();
    const num = parseInt(next.replace('d', ''));
    expect(num).toBeGreaterThan(1000);
  });
});

// ========================================================
// KEY_MIGRATION_MAP
// ========================================================
describe('KEY_MIGRATION_MAP', () => {
  it('should map deleted families to null', () => {
    expect(KEY_MIGRATION_MAP['cam_mhd_bullet_2mp']).toBeNull();
    expect(KEY_MIGRATION_MAP['dvr_4ch']).toBeNull();
  });

  it('should not contain active device keys', () => {
    expect(KEY_MIGRATION_MAP['cam_ip_bullet_2mp']).toBeUndefined();
    expect(KEY_MIGRATION_MAP['nvr_4ch']).toBeUndefined();
  });
});
