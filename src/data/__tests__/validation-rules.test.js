import { describe, it, expect } from 'vitest';
import { REGRAS } from '../validation-rules';

// Helper to find a specific rule by name fragment
const findRule = (fragment) => REGRAS.find(r => r.regra.toLowerCase().includes(fragment.toLowerCase()));

// ========================================================
// Structural tests
// ========================================================
describe('REGRAS structure', () => {
  it('should have at least 10 rules', () => {
    expect(REGRAS.length).toBeGreaterThanOrEqual(10);
  });

  it('every rule should have cat, regra, sev, check', () => {
    REGRAS.forEach(r => {
      expect(r).toHaveProperty('cat');
      expect(r).toHaveProperty('regra');
      expect(r).toHaveProperty('sev');
      expect(r).toHaveProperty('check');
      expect(typeof r.check).toBe('function');
    });
  });
});

// ========================================================
// CFTV: Gravador canais vs cameras
// ========================================================
describe('Rule: Gravador canais vs cameras', () => {
  const rule = findRule('canais vs');

  it('should exist', () => {
    expect(rule).toBeTruthy();
  });

  it('should pass when no cameras', () => {
    expect(rule.check([], [])).toBeNull();
  });

  it('should pass when cameras <= channels', () => {
    const devices = [
      { id: '1', key: 'cam_ip_bullet_2mp', name: 'Cam1' },
      { id: '2', key: 'cam_ip_bullet_2mp', name: 'Cam2' },
      { id: '3', key: 'nvr_4ch', name: 'NVR 4ch' },
    ];
    expect(rule.check(devices, [])).toBeNull();
  });

  it('should fail when cameras > channels', () => {
    const devices = [
      { id: '1', key: 'cam_ip_bullet_2mp', name: 'Cam1' },
      { id: '2', key: 'cam_ip_bullet_2mp', name: 'Cam2' },
      { id: '3', key: 'cam_ip_bullet_2mp', name: 'Cam3' },
      { id: '4', key: 'cam_ip_bullet_2mp', name: 'Cam4' },
      { id: '5', key: 'cam_ip_bullet_2mp', name: 'Cam5' },
      { id: '6', key: 'nvr_4ch', name: 'NVR 4ch' },
    ];
    const result = rule.check(devices, []);
    expect(result).toBeTruthy();
    expect(result).toContain('5');
    expect(result).toContain('4');
  });
});

// ========================================================
// IP duplicado
// ========================================================
describe('Rule: IP duplicado', () => {
  const rule = findRule('IP duplicado');

  it('should exist', () => {
    expect(rule).toBeTruthy();
    expect(rule.sev).toBe('ALTA');
  });

  it('should pass when no IPs', () => {
    const devices = [
      { id: '1', key: 'cam_ip_bullet_2mp', name: 'Cam1' },
    ];
    expect(rule.check(devices)).toBeNull();
  });

  it('should detect duplicate IPs', () => {
    const devices = [
      { id: '1', key: 'cam_ip_bullet_2mp', name: 'Cam1', config: { ipAddress: '10.0.0.1' } },
      { id: '2', key: 'cam_ip_dome_2mp', name: 'Cam2', config: { ipAddress: '10.0.0.1' } },
    ];
    const result = rule.check(devices);
    expect(result).toBeTruthy();
    expect(result).toContain('10.0.0.1');
  });
});

// ========================================================
// IP invalido
// ========================================================
describe('Rule: IP invalido', () => {
  const rule = findRule('IP inv');

  it('should exist', () => {
    expect(rule).toBeTruthy();
  });

  it('should pass when IP is valid', () => {
    const devices = [
      { id: '1', key: 'cam_ip_bullet_2mp', name: 'Cam1', config: { ipAddress: '192.168.1.1' } },
    ];
    expect(rule.check(devices)).toBeNull();
  });

  it('should detect invalid IP', () => {
    const devices = [
      { id: '1', key: 'cam_ip_bullet_2mp', name: 'Cam1', config: { ipAddress: '999.999.999.999' } },
    ];
    const result = rule.check(devices);
    expect(result).toBeTruthy();
    expect(result).toContain('Cam1');
  });

  it('should ignore devices that dont need IP', () => {
    const devices = [
      { id: '1', key: 'sensor_abertura', name: 'Sensor', config: { ipAddress: 'bad-ip' } },
    ];
    expect(rule.check(devices)).toBeNull();
  });
});

// ========================================================
// Nobreak obrigatorio
// ========================================================
describe('Rule: Nobreak obrigatorio', () => {
  const rule = findRule('nobreak obrig');

  it('should exist', () => {
    expect(rule).toBeTruthy();
  });

  it('should pass with no cameras', () => {
    expect(rule.check([], [])).toBeNull();
  });

  it('should warn when cameras exist without nobreak', () => {
    const devices = [
      { id: '1', key: 'cam_ip_bullet_2mp', name: 'Cam1' },
    ];
    const result = rule.check(devices, []);
    expect(result).toBeTruthy();
    expect(result).toContain('1');
  });

  it('should pass when nobreak exists', () => {
    const devices = [
      { id: '1', key: 'cam_ip_bullet_2mp', name: 'Cam1' },
      { id: '2', key: 'nobreak_ac', name: 'Nobreak' },
    ];
    expect(rule.check(devices, [])).toBeNull();
  });
});

// ========================================================
// Rack suggestion
// ========================================================
describe('Rule: > 2 switches avaliar rack', () => {
  const rule = findRule('rack');

  it('should exist', () => {
    expect(rule).toBeTruthy();
  });

  it('should pass with <= 2 switches', () => {
    const devices = [
      { id: '1', key: 'sw_8p_poe', name: 'SW1' },
      { id: '2', key: 'sw_8p_poe', name: 'SW2' },
    ];
    expect(rule.check(devices, [], [])).toBeNull();
  });

  it('should warn with > 2 switches and no rack', () => {
    const devices = [
      { id: '1', key: 'sw_8p_poe', name: 'SW1' },
      { id: '2', key: 'sw_8p_poe', name: 'SW2' },
      { id: '3', key: 'sw_16p_poe', name: 'SW3' },
    ];
    const result = rule.check(devices, [], []);
    expect(result).toBeTruthy();
    expect(result).toContain('3 switches');
  });

  it('should pass with > 2 switches and rack', () => {
    const devices = [
      { id: '1', key: 'sw_8p_poe', name: 'SW1' },
      { id: '2', key: 'sw_8p_poe', name: 'SW2' },
      { id: '3', key: 'sw_16p_poe', name: 'SW3' },
    ];
    const racks = [{ id: 'r1', name: 'Rack Principal', uHeight: 12, devices: [] }];
    expect(rule.check(devices, [], racks)).toBeNull();
  });
});
