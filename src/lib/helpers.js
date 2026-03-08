// ====================================================================
// PERSISTENCE HELPERS
// ====================================================================
export function getSavedProjects(){
  try{ return JSON.parse(localStorage.getItem('bim_projects')||'[]'); }catch{ return []; }
}
export function saveProjects(projects){
  localStorage.setItem('bim_projects',JSON.stringify(projects));
}
export function getSavedClients(){
  try{ return JSON.parse(localStorage.getItem('bim_clients')||'[]'); }catch{ return []; }
}
export function saveClients(clients){
  localStorage.setItem('bim_clients',JSON.stringify(clients));
}
export function getSettings(){
  try{ return JSON.parse(localStorage.getItem('bim_settings')||'{}'); }catch{ return {}; }
}
export function saveSettings(settings){
  localStorage.setItem('bim_settings',JSON.stringify(settings));
}

// ====================================================================
// CUSTOM DEVICES
// ====================================================================
export function getCustomDevices(){
  try {
    return JSON.parse(localStorage.getItem('bim_custom_devices')||'[]');
  }catch(e){
    return [];
  }
}

export function saveCustomDevices(devices){
  localStorage.setItem('bim_custom_devices',JSON.stringify(devices));
}

export function getDeviceIconKey(deviceKey){
  if(deviceKey.startsWith('custom_')){
    const custom=getCustomDevices().find(c=>c.key===deviceKey);
    return custom?custom.deviceType:deviceKey;
  }
  return deviceKey;
}

// ====================================================================
// UNIQUE ID GENERATOR
// ====================================================================
let _uid=0;
export const uid=()=>'d'+(++_uid);
export const syncUid=(project)=>{
  let max=0;
  if(project?.floors){
    project.floors.forEach(f=>{
      (f.devices||[]).forEach(d=>{const m=d.id?.match(/^d(\d+)$/);if(m) max=Math.max(max,parseInt(m[1]));});
      (f.connections||[]).forEach(c=>{const m=c.id?.match(/^d(\d+)$/);if(m) max=Math.max(max,parseInt(m[1]));});
    });
  }
  if(max>=_uid) _uid=max;
};
export const dedupDeviceIds=(project)=>{
  if(!project?.floors) return project;
  let changed=false;
  project.floors.forEach(f=>{
    const seen=new Map(); // id → device
    (f.devices||[]).forEach(d=>{
      if(seen.has(d.id)){
        const oldId=d.id;
        const origDev=seen.get(d.id);
        const newId=uid();
        console.warn('[dedup] Device "'+d.name+'" had duplicate id='+oldId+' → reassigned to '+newId);
        d.id=newId;
        changed=true;
        // Smart connection remapping based on cable type vs device type
        const isNetDev=(key)=>key&&(key.startsWith('sw_')||key.startsWith('nvr_')||key.startsWith('cam_')||key.startsWith('ap_'));
        const isDataCable=(type)=>type&&(type==='cat6'||type==='cat5e'||type==='fibra_sm'||type==='fibra_mm');
        (f.connections||[]).forEach(c=>{
          // If this is a data cable and the dup device is a network device but the original is NOT
          if(isDataCable(c.type)&&isNetDev(d.key)&&!isNetDev(origDev.key)){
            if(c.from===oldId) c.from=newId;
            if(c.to===oldId) c.to=newId;
          }
          // If this is a power cable and the dup device is NOT a network device but the original IS
          if(!isDataCable(c.type)&&!isNetDev(d.key)&&isNetDev(origDev.key)){
            if(c.from===oldId) c.from=newId;
            if(c.to===oldId) c.to=newId;
          }
        });
      }
      seen.set(d.id,d);
    });
  });
  if(changed) syncUid(project);
  return project;
};

// ====================================================================
// DEVICE LOOKUP
// ====================================================================
import { DEVICE_LIB } from '@/data/device-lib';
import { CABLE_TYPES } from '@/data/cable-types';
import { resolveInterfacesByKey } from '@/data/device-interfaces';

export function findDevDef(key){
  for(const cat of DEVICE_LIB) for(const item of cat.items) if(item.key===key) return item;
  // Check custom devices
  try {
    const custom=JSON.parse(localStorage.getItem('bim_custom_devices')||'[]');
    const found=custom.find(c=>c.key===key);
    if(found) return found;
  }catch(e){}
  return null;
}

// ====================================================================
// PP CABLE SECTION CALCULATOR
// ====================================================================
export const calcPPSection = (distMeters, vias=2) => {
  let secao = 0.5;
  if(distMeters > 100) secao = 2.5;
  else if(distMeters > 60) secao = 1.5;
  else if(distMeters > 30) secao = 1.0;
  const secStr = secao.toFixed(1).replace('.',',');
  const id = `pp${vias}v_${String(secao*10).replace('.','').padStart(2,'0')}`;
  return { secao, id, label: `PP ${vias}×${secStr}mm²` };
};

// ====================================================================
// DEVICE INTERFACES
// ====================================================================
export const getDeviceInterfaces = (device) => {
  // For custom devices, use the base device type's interfaces
  const key = (typeof device === 'string') ? device : (device.key.startsWith('custom_') ? getDeviceIconKey(device.key) : device.key);
  if (typeof device === 'string') return resolveInterfacesByKey(key) || [];
  const base = [...(resolveInterfacesByKey(key) || [])];
  // For nobreak_ac, add SNMP interface only if config.snmp is true
  if (key === 'nobreak_ac' && device.config?.snmp) {
    base.push({type:'data_io',cables:['cat5e','cat6'],label:'SNMP (placa de rede)',required:false,
      targets:['sw_poe','sw_normal','router']});
  }
  // Append custom interfaces from custom devices (wizard step 4)
  if (device.customIfaces && Array.isArray(device.customIfaces)) {
    device.customIfaces.forEach(ci => {
      if (ci.label) base.push({type:ci.type||'signal_in', cables:ci.cables||[], label:ci.label, required:!!ci.required});
    });
  }
  return base;
};

// CSS class for interface type dot color
export const getPortDotClass = (type) => {
  if (type === 'power_in') return 'ch-power-in';
  if (type === 'power_out') return 'ch-power-out';
  if (type === 'signal_in') return 'ch-signal-in';
  if (type === 'signal_out') return 'ch-signal-out';
  if (type === 'automation_in') return 'ch-automation-in';
  if (type === 'automation_out') return 'ch-automation-out';
  if (type === 'passthrough') return 'ch-passthrough';
  return 'ch-data';
};

// Human-readable type name
export const getPortTypeName = (type) => {
  const map = {data_in:'Dados (entrada)',data_io:'Dados (bidirecional)',power_in:'Energia (entrada)',
    power_out:'Energia (saída)',signal_in:'Sinal (entrada)',signal_out:'Sinal (saída)',
    automation_in:'Automação (entrada)',automation_out:'Automação (saída)',passthrough:'Passagem'};
  return map[type]||type;
};

// ====================================================================
// CONNECTION VALIDATION
// ====================================================================
export const validateConnection = (fromKey, toKey, cableId) => {
  // Support both string keys and device objects
  let fromIfaces, toIfaces;

  if (typeof fromKey === 'object' && fromKey !== null) {
    fromIfaces = getDeviceInterfaces(fromKey);
    fromKey = fromKey.key;
  } else {
    fromIfaces = resolveInterfacesByKey(fromKey) || [];
  }
  if (typeof toKey === 'object' && toKey !== null) {
    toIfaces = getDeviceInterfaces(toKey);
    toKey = toKey.key;
  } else {
    toIfaces = resolveInterfacesByKey(toKey) || [];
  }

  // Collect all valid cable options between these two devices
  const validCombos = [];

  fromIfaces.forEach(fi => {
    toIfaces.forEach(ti => {
      // Check interface compatibility
      const compatible = (
        // data_io connects to anything data
        (fi.type === 'data_io' && (ti.type === 'data_in' || ti.type === 'data_io')) ||
        (ti.type === 'data_io' && (fi.type === 'data_in' || fi.type === 'data_io')) ||
        // power_out connects to power_in
        (fi.type === 'power_out' && ti.type === 'power_in') ||
        (ti.type === 'power_out' && fi.type === 'power_in') ||
        // signal_out connects to signal_in
        (fi.type === 'signal_out' && ti.type === 'signal_in') ||
        (ti.type === 'signal_out' && fi.type === 'signal_in') ||
        // automation_out connects to automation_in
        (fi.type === 'automation_out' && ti.type === 'automation_in') ||
        (ti.type === 'automation_out' && fi.type === 'automation_in') ||
        // passthrough connects to anything
        fi.type === 'passthrough' || ti.type === 'passthrough'
      );
      if (!compatible) return;

      // Check target restrictions (e.g., nobreak SNMP only connects to switches)
      if (fi.targets && !fi.targets.includes(toKey)) return;
      if (ti.targets && !ti.targets.includes(fromKey)) return;

      // Find common cables between the two interfaces
      if(!fi.cables?.length || !ti.cables?.length) return;
      const commonCables = fi.cables.filter(c => ti.cables.includes(c));
      if (commonCables.length === 0) return;

      const purpose = fi.type.includes('power') || ti.type.includes('power') ? 'energia' :
                      fi.type.includes('automation') || ti.type.includes('automation') ? 'automação' :
                      fi.type.includes('signal') || ti.type.includes('signal') ? 'sinal' : 'dados';

      commonCables.forEach(cab => {
        validCombos.push({ cable: cab, purpose, fromIface: fi, toIface: ti });
      });
    });
  });

  if (validCombos.length === 0) {
    return { valid: false, cables: [], reason: `Não há interface compatível entre ${fromKey} e ${toKey}`, purpose: null };
  }

  // If a specific cable was requested, check if it's in valid combos
  if (cableId) {
    const match = validCombos.find(vc => vc.cable === cableId);
    if (match) {
      return { valid: true, cables: [cableId], reason: `${match.purpose}: ${match.fromIface.label} ↔ ${match.toIface.label}`, purpose: match.purpose };
    }
    // Cable requested is invalid for this pair
    const suggestedCables = [...new Set(validCombos.map(vc => vc.cable))];
    const ct = CABLE_TYPES.find(c => c.id === cableId);
    return {
      valid: false,
      cables: suggestedCables,
      reason: `${ct?.name || cableId} não é válido para ${fromKey}↔${toKey}. Use: ${suggestedCables.map(c => CABLE_TYPES.find(t=>t.id===c)?.name).join(', ')}`,
      purpose: validCombos[0]?.purpose
    };
  }

  // No specific cable — return all valid options
  const suggestedCables = [...new Set(validCombos.map(vc => vc.cable))];
  return { valid: true, cables: suggestedCables, reason: validCombos.map(vc => `${vc.purpose}: ${vc.fromIface.label}↔${vc.toIface.label}`).join(' | '), purpose: validCombos[0]?.purpose };
};

// Get the best default cable for a device pair
export const getDefaultCable = (fromKey, toKey) => {
  const result = validateConnection(fromKey, toKey, null);
  if (!result.valid || result.cables.length === 0) return null;
  // Priority: prefer data cables for data devices, power for power devices
  const priority = ['cat6','cat6a','cat5e','smf','mmf','ac_power','pp_flex','pp2v_10','pp2v_15','pp2v_25','pp2v_05','pp4v_10','pp4v_15','pp4v_25','pp4v_05','coaxial','wireless','sb50_48v','sb50_12v'];
  return result.cables.sort((a,b) => priority.indexOf(a) - priority.indexOf(b))[0];
};
