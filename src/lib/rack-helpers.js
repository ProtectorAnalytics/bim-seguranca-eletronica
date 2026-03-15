// ====================================================================
// RACK HELPERS — Rack como entidade de dados (não mais device no canvas)
// ====================================================================
import { canMountInRack, getDeviceUSize, isSwitch, isGravador, isNobreak, isCentralAlarme, isCentralIncendio } from '@/data/device-interfaces';
import { uid } from './helpers';

// ── Tag auto-gerada ─────────────────────────────────────────────────
export function generateRackTag(existingTags=[]) {
  for (let i = 1; i <= 99; i++) {
    const tag = 'R' + String(i).padStart(2, '0');
    if (!existingTags.includes(tag)) return tag;
  }
  return 'R' + Date.now().toString(36).slice(-3).toUpperCase();
}

// ── Criar rack ──────────────────────────────────────────────────────
export function createRack(overrides = {}) {
  const existingTags = overrides._existingTags || [];
  return {
    id: uid(),
    name: overrides.name || 'Novo Rack',
    tag: overrides.tag || generateRackTag(existingTags),
    alturaU: overrides.alturaU || 12,
    profundidade: overrides.profundidade || '450mm',
    location: overrides.location || '',
    acessorios: overrides.acessorios || [],
    createdAt: Date.now(),
  };
}

// ── Abreviação do dispositivo para tag ──────────────────────────────
function getDeviceAbbrev(key) {
  if (!key) return 'EQ';
  if (key.startsWith('sw_poe'))    return 'SW';
  if (key.startsWith('sw_normal')) return 'SW';
  if (key.startsWith('sw_'))      return 'SW';
  if (isSwitch(key))              return 'SW';
  if (key.startsWith('nvr_'))     return 'NVR';
  if (key.startsWith('dvr_'))     return 'DVR';
  if (isGravador(key))            return 'NVR';
  if (key === 'router')           return 'RT';
  if (key === 'dio')              return 'DIO';
  if (isNobreak(key))             return 'NBK';
  if (key === 'fonte')            return 'FNT';
  if (key === 'borne_sak')        return 'SAK';
  if (key === 'bateria_ext')      return 'BAT';
  if (key === 'modulo_bat')       return 'MB';
  if (key === 'controladora')     return 'CTR';
  if (key === 'cabo_engate')      return 'CE';
  if (isCentralAlarme(key))       return 'CA';
  if (isCentralIncendio(key))     return 'CI';
  return 'EQ';
}

// ── Tag identificadora do dispositivo ───────────────────────────────
// Ex: "R01-SW01", "R01-NVR01"
export function generateDeviceTag(rackTag, device, allChildrenInRack) {
  const abbrev = getDeviceAbbrev(device.key);
  // Contar quantos do mesmo tipo existem antes deste no rack
  const sameType = allChildrenInRack
    .filter(d => getDeviceAbbrev(d.key) === abbrev)
    .sort((a, b) => (a.rackSlot || 0) - (b.rackSlot || 0));
  const idx = sameType.findIndex(d => d.id === device.id);
  const num = String((idx >= 0 ? idx : sameType.length) + 1).padStart(2, '0');
  return `${rackTag}-${abbrev}${num}`;
}

// ── Encontrar primeiro slot livre ───────────────────────────────────
export function findFirstFreeSlot(slots, size) {
  for (let u = 0; u <= slots.length - size; u++) {
    let free = true;
    for (let s = 0; s < size; s++) {
      if (slots[u + s] != null) { free = false; break; }
    }
    if (free) return u;
  }
  return -1;
}

// ── Construir mapa de slots ─────────────────────────────────────────
function buildSlotMap(rack, devices) {
  const children = devices
    .filter(d => d.parentRack === rack.id)
    .sort((a, b) => (a.rackSlot || 0) - (b.rackSlot || 0));

  const slots = new Array(rack.alturaU).fill(null);

  children.forEach(child => {
    const uSize = getDeviceUSize(child.key);
    let startU = child.rackSlot;

    if (startU == null || startU < 0 || startU + uSize > rack.alturaU) {
      startU = findFirstFreeSlot(slots, uSize);
    }

    if (startU >= 0) {
      for (let s = 0; s < uSize; s++) {
        if (startU + s < rack.alturaU) slots[startU + s] = child.id;
      }
    }
  });

  // Place accessories in remaining free slots
  const accessories = rack.acessorios || [];
  accessories.forEach((acc, i) => {
    const uSize = acc.unidades || 1;
    const startU = findFirstFreeSlot(slots, uSize);
    if (startU >= 0) {
      const accId = `__acc_${i}`;
      for (let s = 0; s < uSize; s++) {
        if (startU + s < rack.alturaU) slots[startU + s] = accId;
      }
    }
  });

  return { slots, children, accessories };
}

// ── Plano de Faces ──────────────────────────────────────────────────
// Retorna array de linhas da tabela, do topo (alturaU) até base (1)
// Cada linha: { pos, device, uSize, description, identification, isStart }
export function buildFacePlan(rack, devices) {
  if (!rack) return [];
  const { slots, children, accessories } = buildSlotMap(rack, devices);

  const plan = [];
  const visited = new Set();

  // Do topo para a base (U mais alto primeiro)
  for (let u = rack.alturaU - 1; u >= 0; u--) {
    const slotId = slots[u];

    if (!slotId) {
      plan.push({
        pos: u + 1,
        device: null,
        uSize: 1,
        description: 'LIVRE',
        identification: '',
        isStart: true,
      });
    } else if (!visited.has(slotId)) {
      visited.add(slotId);
      // Check if it's an accessory
      if (slotId.startsWith('__acc_')) {
        const accIdx = parseInt(slotId.replace('__acc_', ''), 10);
        const acc = accessories[accIdx];
        if (acc) {
          plan.push({
            pos: u + 1,
            device: null,
            accessory: acc,
            uSize: acc.unidades || 1,
            description: `🔧 ${acc.name}`,
            identification: '',
            isStart: true,
          });
        }
      } else {
        const device = children.find(c => c.id === slotId);
        if (device) {
          const uSize = getDeviceUSize(device.key);
          plan.push({
            pos: u + 1,
            device,
            uSize,
            description: device.name,
            identification: generateDeviceTag(rack.tag, device, children),
            isStart: true,
          });
        }
      }
    }
    // Slots de continuação de dispositivos multi-U são pulados
  }

  return plan;
}

// ── Ocupação do rack ────────────────────────────────────────────────
export function getRackOccupancy(rack, devices) {
  if (!rack) return { totalU: 0, usedU: 0, freeU: 0, deviceCount: 0, accessoryU: 0, percent: 0 };
  const children = devices.filter(d => d.parentRack === rack.id);
  let devU = 0;
  children.forEach(c => { devU += getDeviceUSize(c.key); });
  // Accessories also occupy U space
  let accessoryU = 0;
  (rack.acessorios || []).forEach(a => { accessoryU += (a.unidades || 1); });
  const usedU = devU + accessoryU;
  return {
    totalU: rack.alturaU,
    usedU,
    freeU: rack.alturaU - usedU,
    deviceCount: children.length,
    accessoryU,
    percent: rack.alturaU > 0 ? Math.round((usedU / rack.alturaU) * 100) : 0,
  };
}

// ── Atribuir dispositivo ao rack ────────────────────────────────────
// Retorna slot index (0-based) ou -1 se cheio
export function assignDeviceToRack(rack, device, devices) {
  if (!rack || !device) return -1;
  const uSize = getDeviceUSize(device.key);
  const { slots } = buildSlotMap(rack, devices);
  return findFirstFreeSlot(slots, uSize);
}

// ── Migração: rack devices → floor.racks[] ──────────────────────────
export function migrateRackDevices(floor) {
  if (!floor) return null;
  const rackDevices = floor.devices.filter(d => d.key === 'rack');
  if (!rackDevices.length) return null;

  const existingRacks = floor.racks || [];
  const newRacks = [...existingRacks];
  const idMap = {}; // old device ID → new rack entity ID

  rackDevices.forEach(rd => {
    const rack = createRack({
      name: rd.name || 'Rack',
      tag: generateRackTag(newRacks.map(r => r.tag)),
      alturaU: rd.config?.alturaU || 12,
      profundidade: rd.config?.profundidade || '450mm',
      acessorios: rd.config?.acessorios || [],
      _existingTags: newRacks.map(r => r.tag),
    });
    idMap[rd.id] = rack.id;
    newRacks.push(rack);
  });

  // Remover rack devices + atualizar parentRack refs
  const updatedDevices = floor.devices
    .filter(d => d.key !== 'rack')
    .map(d => {
      if (d.parentRack && idMap[d.parentRack]) {
        return { ...d, parentRack: idMap[d.parentRack] };
      }
      return d;
    });

  return { racks: newRacks, devices: updatedDevices };
}
