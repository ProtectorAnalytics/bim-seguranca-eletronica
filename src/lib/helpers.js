// ====================================================================
// PERSISTENCE HELPERS
// ====================================================================
export function getSavedProjects(){
  try{ return JSON.parse(localStorage.getItem('bim_projects')||'[]'); }catch{ return []; }
}
export function saveProjects(projects){
  try{ localStorage.setItem('bim_projects',JSON.stringify(projects)); }
  catch(e){ console.warn('[storage] Falha ao salvar projetos locais:',e.message); }
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
  }catch(_e){
    return [];
  }
}

export function saveCustomDevices(devices){
  localStorage.setItem('bim_custom_devices',JSON.stringify(devices));
}

// ====================================================================
// DEFAULT DEVICE OVERRIDES & HIDDEN
// ====================================================================
export function getDeviceOverrides(){
  try{ return JSON.parse(localStorage.getItem('bim_device_overrides')||'{}'); }catch{ return {}; }
}
export function saveDeviceOverrides(overrides){
  localStorage.setItem('bim_device_overrides',JSON.stringify(overrides));
}
export function getHiddenDevices(){
  try{ return JSON.parse(localStorage.getItem('bim_device_hidden')||'[]'); }catch{ return []; }
}
export function saveHiddenDevices(hidden){
  localStorage.setItem('bim_device_hidden',JSON.stringify(hidden));
}

// ====================================================================
// HIDDEN FAMILIES (categories) — toggle entire device families
// ====================================================================
export function getHiddenFamilies(){
  try{ return JSON.parse(localStorage.getItem('bim_hidden_families')||'[]'); }catch{ return []; }
}
export function saveHiddenFamilies(hidden){
  localStorage.setItem('bim_hidden_families',JSON.stringify(hidden));
}

// ====================================================================
// CLOUD PROJECT CACHE (offline fallback for cloud projects)
// ====================================================================
export function getCachedCloudProjects(){
  try{ return JSON.parse(localStorage.getItem('bim_cloud_projects_meta')||'[]'); }catch{ return []; }
}
export function setCachedCloudProjects(projects){
  try{ localStorage.setItem('bim_cloud_projects_meta',JSON.stringify(projects)); }
  catch(e){ console.warn('[storage] Cache de projetos cloud ignorado (quota):',e.message); }
}
export function getCachedProject(id){
  try{ return JSON.parse(localStorage.getItem(`bim_cloud_proj_${id}`)||'null'); }catch{ return null; }
}
export function setCachedProject(id, data){
  if(data){
    try{ localStorage.setItem(`bim_cloud_proj_${id}`,JSON.stringify(data)); }
    catch(e){
      // Quota exceeded — limpar caches antigos e tentar novamente
      console.warn('[storage] Quota excedida ao cachear projeto, limpando caches antigos...');
      _evictOldCaches(id);
      try{ localStorage.setItem(`bim_cloud_proj_${id}`,JSON.stringify(data)); }
      catch{ console.warn('[storage] Cache do projeto ignorado (quota persistente)'); }
    }
  } else {
    localStorage.removeItem(`bim_cloud_proj_${id}`);
  }
}
/** Remove caches de projetos cloud antigos para liberar espaço */
function _evictOldCaches(keepId){
  const keys=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&k.startsWith('bim_cloud_proj_')&&k!=='bim_cloud_projects_meta'&&k!==`bim_cloud_proj_${keepId}`){
      keys.push(k);
    }
  }
  // Remove os caches mais antigos (todos exceto o atual)
  keys.forEach(k=>localStorage.removeItem(k));
}
export function removeCachedProject(id){
  localStorage.removeItem(`bim_cloud_proj_${id}`);
}

export function getDeviceIconKey(deviceKey){
  if(deviceKey.startsWith('custom_')){
    const custom=getCustomDevices().find(c=>c.key===deviceKey);
    if(custom?.customIcon) return custom.customIcon;
    return custom?custom.deviceType:deviceKey;
  }
  // Check overrides for customIcon
  const ov=getDeviceOverrides()[deviceKey];
  if(ov?.customIcon) return ov.customIcon;
  const def=findDevDef(deviceKey);
  return def?.icon||deviceKey;
}

export function getDeviceColor(deviceKey){
  if(deviceKey.startsWith('custom_')){
    const custom=getCustomDevices().find(c=>c.key===deviceKey);
    if(custom?.customColor) return custom.customColor;
  }
  const ov=getDeviceOverrides()[deviceKey];
  if(ov?.customColor) return ov.customColor;
  return null;
}

// ====================================================================
// KEY MIGRATION MAP — v3.19.0 catalog refactoring
// Maps deleted family keys → null (device removed, marked as legacy in projects)
// All kept families retain their original resolution-specific keys.
// ====================================================================
export const KEY_MIGRATION_MAP = {
  // CFTV Multi HD (deleted)
  'cam_mhd_bullet_1mp':null,'cam_mhd_bullet_2mp':null,'cam_mhd_bullet_2mp_fc':null,
  'cam_mhd_bullet_3mp':null,'cam_mhd_bullet_4k':null,
  'cam_mhd_dome_1mp':null,'cam_mhd_dome_2mp':null,'cam_mhd_dome_2mp_fc':null,
  'cam_mhd_dome_4k':null,'cam_mhd_mini_2mp':null,
  'cam_mhd_vf_2mp':null,'cam_mhd_speed_2mp':null,
  // CFTV Multi HD - DVR (deleted)
  'dvr_4ch':null,'dvr_8ch':null,'dvr_16ch':null,'dvr_32ch':null,
  // CFTV HDCVI (deleted)
  'cam_hdcvi_bullet_1mp':null,'cam_hdcvi_bullet_2mp':null,'cam_hdcvi_bullet_3mp':null,
  'cam_hdcvi_dome_1mp':null,'cam_hdcvi_dome_2mp':null,'cam_hdcvi_dome_5mp':null,
  // Solução Veicular (deleted)
  'gravador_veicular':null,'cam_veicular_int':null,'cam_veicular_ext':null,
  // Intrusão - Centrais (deleted)
  'alarme_nao_monit':null,'alarme_monit_basica':null,'alarme_monit_inter':null,
  'alarme_monit_avanc':null,'alarme_sem_fio':null,
  // Intrusão - Sensores PIR (deleted)
  'pir_int_basico':null,'pir_int_pet':null,'pir_int_pet_smart':null,
  'pir_teto':null,'pir_cortina':null,'pir_dupla_tech':null,
  'pir_externo':null,'pir_ext_dupla':null,
  'pir_longa_dist':null,'pir_ld_dupla':null,'pir_alta_perf':null,
  // Intrusão - Eletrificadores (deleted)
  'eletri_basico':null,'eletri_net':null,'eletri_high':null,'eletri_extensor':null,
  // Intrusão - Periféricos (deleted)
  'teclado_led':null,'teclado_lcd':null,
  'comunicador_eth':null,'comunicador_gprs':null,
  'receptor_rf':null,'controle_remoto':null,
  'sirene_int':null,'sirene_ext':null,
  'sensor_abertura':null,'modulo_pgm':null,
  // Sistema 8000 Sem Fio (deleted)
  's8k_central':null,'s8k_abertura':null,'s8k_pir':null,'s8k_pir_ext':null,
  's8k_barreira':null,'s8k_sirene':null,'s8k_teclado':null,
  // Incêndio Convencional (deleted)
  'fogo_central_conv':null,'fogo_det_fumaca_conv':null,'fogo_det_temp_conv':null,
  'fogo_acionador_conv':null,'fogo_sinalizador_conv':null,'fogo_det_linear':null,
  // Incêndio Endereçável (deleted)
  'fogo_central_end':null,'fogo_det_fumaca_end':null,'fogo_det_temp_end':null,
  'fogo_acionador_end':null,'fogo_mod_isolador':null,'fogo_mod_entrada':null,
  'fogo_mod_es':null,'fogo_mod_zona':null,'fogo_gateway':null,
  // Incêndio Especiais (deleted)
  'fogo_det_autonomo':null,'fogo_det_gas':null,
  'fogo_det_chama_ir':null,'fogo_det_chama_uvir':null,'fogo_aspiracao':null,
  // Linha Morley (deleted)
  'morley_central':null,'morley_detector':null,
  // Iluminação Emergência (deleted)
  'emerg_bloco':null,'emerg_luminaria':null,'emerg_lum_potencia':null,'emerg_central_psa':null,
  // Quadro Conectividade (removed in v3.20.0 — replaced by QC entity)
  'quadro':null,
};

/**
 * Migrate project device keys from deleted families (v3.19.0 catalog refactoring).
 * Deleted keys (→null): marks device._legacy = true, keeps in project with visual badge.
 * All kept families retain their original keys — no unification needed.
 * @param {Object} project - The project object with floors[].devices[]
 * @returns {Object} The mutated project
 */
export function migrateProjectKeys(project){
  if(!project?.floors) return project;
  let legacied=0;
  project.floors.forEach(f=>{
    (f.devices||[]).forEach(d=>{
      if(!d.key) return;
      if(!(d.key in KEY_MIGRATION_MAP)) return;
      const newKey=KEY_MIGRATION_MAP[d.key];
      if(newKey===null){
        // Deleted family → mark as legacy
        d._legacy=true;
        d._originalKey=d.key;
        legacied++;
      }
    });
  });
  if(legacied){
    console.log(`[migrate] v3.19.1: ${legacied} device(s) from deleted families marked as legacy`);
  }
  return project;
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
  // Check overrides first (edited default devices)
  const overrides=getDeviceOverrides();
  if(overrides[key]) return {...overrides[key], key, _overridden:true};
  // Check default library
  for(const cat of DEVICE_LIB) for(const item of cat.items) if(item.key===key) return item;
  // Check custom devices
  try {
    const custom=JSON.parse(localStorage.getItem('bim_custom_devices')||'[]');
    const found=custom.find(c=>c.key===key);
    if(found) return found;
  }catch(_e){ /* ignore */ }
  return null;
}

// ====================================================================
// CABLE DISTANCE — real distance along waypoint path
// ====================================================================
export function calcCableDistance(x1, y1, x2, y2, waypoints = [], pxPerMeter = 40, bgScale = 1) {
  const pts = [{x:x1,y:y1}, ...waypoints, {x:x2,y:y2}];
  let totalPx = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i-1].x;
    const dy = pts[i].y - pts[i-1].y;
    totalPx += Math.sqrt(dx*dx + dy*dy);
  }
  const effectivePxPerMeter = pxPerMeter * (bgScale || 1);
  return Math.max(1, Math.round(totalPx / effectivePxPerMeter));
}

// ====================================================================
// IP / VLAN VALIDATION
// ====================================================================
export function isValidIPv4(ip) {
  if (!ip || typeof ip !== 'string') return false;
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => {
    if (!/^\d{1,3}$/.test(p)) return false;
    const n = parseInt(p, 10);
    return n >= 0 && n <= 255 && String(n) === p;
  });
}

export function isValidSubnetMask(mask) {
  if (!isValidIPv4(mask)) return false;
  const num = mask.split('.').reduce((acc, o) => (acc << 8) + parseInt(o), 0) >>> 0;
  if (num === 0) return false;
  const inv = ~num >>> 0;
  return (inv & (inv + 1)) === 0;
}

export function isValidVLAN(vlan) {
  const n = parseInt(vlan, 10);
  return Number.isInteger(n) && n >= 1 && n <= 4094;
}

export function findDuplicateIPs(devices) {
  const ipMap = new Map(); // ip -> [device names]
  devices.forEach(d => {
    const ip = d.config?.ipAddress;
    if (!ip || !isValidIPv4(ip)) return;
    if (!ipMap.has(ip)) ipMap.set(ip, []);
    ipMap.get(ip).push(d.name || d.key);
  });
  const dupes = [];
  ipMap.forEach((names, ip) => {
    if (names.length > 1) dupes.push({ ip, devices: names });
  });
  return dupes;
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
    automation_in:'Automação (entrada)',automation_out:'Automação (saída)',passthrough:'Passagem',
    video_out:'Vídeo (HDMI/VGA)',rs485:'RS-485 (serial)',wiegand:'Wiegand',
    fiber_in:'Fibra (SFP)',alarm_zone:'Zona de alarme',wifi_client:'WiFi'};
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
        // data_io connects to anything data (including fiber_in)
        (fi.type === 'data_io' && (ti.type === 'data_in' || ti.type === 'data_io' || ti.type === 'fiber_in')) ||
        (ti.type === 'data_io' && (fi.type === 'data_in' || fi.type === 'data_io' || fi.type === 'fiber_in')) ||
        // fiber_in connects to data_io (switch SFP, ONT)
        (fi.type === 'fiber_in' && ti.type === 'data_io') ||
        (ti.type === 'fiber_in' && fi.type === 'data_io') ||
        // power_out connects to power_in
        (fi.type === 'power_out' && ti.type === 'power_in') ||
        (ti.type === 'power_out' && fi.type === 'power_in') ||
        // power_io connects to power_out, power_in, or another power_io (bateria ↔ fonte/nobreak)
        (fi.type === 'power_io' && (ti.type === 'power_out' || ti.type === 'power_in' || ti.type === 'power_io')) ||
        (ti.type === 'power_io' && (fi.type === 'power_out' || fi.type === 'power_in' || fi.type === 'power_io')) ||
        // signal_out connects to signal_in or alarm_zone
        (fi.type === 'signal_out' && (ti.type === 'signal_in' || ti.type === 'alarm_zone')) ||
        (ti.type === 'signal_out' && (fi.type === 'signal_in' || fi.type === 'alarm_zone')) ||
        // alarm_zone connects to signal_out
        (fi.type === 'alarm_zone' && ti.type === 'signal_out') ||
        (ti.type === 'alarm_zone' && fi.type === 'signal_out') ||
        // automation_out connects to automation_in
        (fi.type === 'automation_out' && ti.type === 'automation_in') ||
        (ti.type === 'automation_out' && fi.type === 'automation_in') ||
        // video_out connects to video_out (monitor ↔ NVR)
        (fi.type === 'video_out' && ti.type === 'video_out') ||
        // rs485 connects to rs485 (bus)
        (fi.type === 'rs485' && ti.type === 'rs485') ||
        // wiegand connects to wiegand
        (fi.type === 'wiegand' && ti.type === 'wiegand') ||
        // wifi_client connects to data_io (AP)
        (fi.type === 'wifi_client' && ti.type === 'data_io') ||
        (ti.type === 'wifi_client' && fi.type === 'data_io') ||
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

      const types = fi.type + '|' + ti.type;
      const purpose = types.includes('power') ? 'energia' :
                      types.includes('automation') ? 'automação' :
                      types.includes('signal') || types.includes('alarm_zone') || types.includes('wiegand') ? 'sinal' :
                      types.includes('video') ? 'vídeo' :
                      types.includes('rs485') ? 'serial' : 'dados';

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
