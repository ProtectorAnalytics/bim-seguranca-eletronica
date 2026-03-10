// ====================================================================
// CONNECTION RULES ENGINE
// Each device defines its "interfaces" — what types of connections it accepts.
// The CONNECTION_RULES matrix defines valid device↔device combos + allowed cables.
// ====================================================================

// Device interface types
export const DEVICE_INTERFACES = {
  // CFTV — todas câmeras: PoE OU 12V + sensor inputs + contato seco
  cam_dome:     [{type:'data_in',cables:['cat5e','cat6','cat6a'],label:'PoE Data+Power (RJ45)',required:true},
                 {type:'power_in',cables:['pp2v_10','pp2v_15'],label:'Alimentação 12VDC (alternativa ao PoE)',required:false},
                 {type:'signal_in',cables:['pp2v_05'],label:'Entrada sensor alarme 1 (NA/NF)',required:false},
                 {type:'signal_out',cables:['pp2v_05'],label:'Saída contato seco (relay)',required:false}],
  cam_bullet:   [{type:'data_in',cables:['cat5e','cat6','cat6a'],label:'PoE Data+Power (RJ45)',required:true},
                 {type:'power_in',cables:['pp2v_10','pp2v_15'],label:'Alimentação 12VDC (alternativa ao PoE)',required:false},
                 {type:'signal_in',cables:['pp2v_05'],label:'Entrada sensor alarme 1 (NA/NF)',required:false},
                 {type:'signal_out',cables:['pp2v_05'],label:'Saída contato seco (relay)',required:false}],
  cam_ptz:      [{type:'data_in',cables:['cat5e','cat6','cat6a'],label:'PoE Data+Power (RJ45)',required:true},
                 {type:'power_in',cables:['pp2v_10','pp2v_15','pp2v_25'],label:'Alimentação 12/24VDC (alternativa ao PoE)',required:false},
                 {type:'signal_in',cables:['pp2v_05'],label:'Entrada sensor alarme 1 (NA/NF)',required:false},
                 {type:'signal_in',cables:['pp2v_05'],label:'Entrada sensor alarme 2 (NA/NF)',required:false},
                 {type:'signal_out',cables:['pp2v_05'],label:'Saída contato seco 1 (relay)',required:false},
                 {type:'signal_out',cables:['pp2v_05'],label:'Saída contato seco 2 (relay)',required:false}],
  cam_fisheye:  [{type:'data_in',cables:['cat5e','cat6','cat6a'],label:'PoE Data+Power (RJ45)',required:true},
                 {type:'power_in',cables:['pp2v_10','pp2v_15'],label:'Alimentação 12VDC (alternativa ao PoE)',required:false},
                 {type:'signal_in',cables:['pp2v_05'],label:'Entrada sensor alarme 1 (NA/NF)',required:false},
                 {type:'signal_out',cables:['pp2v_05'],label:'Saída contato seco (relay)',required:false}],
  // LPR Camera - PoE/12V + saída automação (contato seco p/ abrir portão) + sensors
  cam_lpr:      [{type:'data_in',cables:['cat5e','cat6','cat6a'],label:'PoE Data+Power (RJ45)',required:true},
                 {type:'power_in',cables:['pp2v_10','pp2v_15'],label:'Alimentação 12VDC (alternativa ao PoE)',required:false},
                 {type:'automation_out',cables:['pp2v_10','pp4v_10','pp2v_05'],label:'Saída automação (contato seco p/ portão)',required:false},
                 {type:'signal_in',cables:['pp2v_05'],label:'Entrada sensor alarme 1 (NA/NF)',required:false},
                 {type:'signal_in',cables:['pp2v_05'],label:'Entrada sensor alarme 2 (NA/NF)',required:false},
                 {type:'signal_out',cables:['pp2v_05'],label:'Saída contato seco (relay)',required:false}],
  // Controle Acesso
  leitor_facial:[{type:'power_in',cables:['pp2v_10','pp2v_05'],label:'Alimentação 12VDC (Grupo A: +12V/GND)',required:true},
                 {type:'data_in',cables:['cat5e','cat6'],label:'Rede TCP/IP (RJ45)',required:true},
                 {type:'data_in',cables:['pp2v_05'],label:'RS-485 (Grupo C: C1/C2)',required:false},
                 {type:'signal_out',cables:['pp2v_05'],label:'Wiegand saída (Grupo C: W0/W1)',required:false},
                 {type:'signal_in',cables:['pp2v_05'],label:'Alarme entrada (Grupo B: B1-B3)',required:false},
                 {type:'signal_out',cables:['pp2v_05'],label:'Alarme saída (Grupo B: B4-B6)',required:false},
                 {type:'automation_out',cables:['pp2v_10','pp4v_10','pp2v_05'],label:'Fechadura (Grupo D: NC/COM/NÃO)',required:false},
                 {type:'signal_in',cables:['pp2v_05'],label:'Sensor porta / Botoeira (Grupo D: SENSOR/BTN)',required:false}],
  leitor_tag:   [{type:'power_in',cables:['pp2v_10','pp2v_05'],label:'12VDC',required:true},
                 {type:'data_in',cables:['pp2v_05'],label:'Wiegand/RS485',required:true},
                 {type:'automation_out',cables:['pp2v_10','pp4v_10','pp2v_05'],label:'Saída automação (contato seco)',required:false}],
  controladora: [{type:'power_in',cables:['ac_power','pp_flex'],label:'Entrada AC Full Range',required:true},
                 {type:'data_in',cables:['cat5e','cat6'],label:'Rede TCP/IP',required:false},
                 {type:'automation_out',cables:['pp2v_10','pp4v_10','pp2v_05'],label:'Saída fechadura eletroímã (NF)',required:true},
                 {type:'signal_in',cables:['pp2v_05'],label:'Botoeira entrada',required:false},
                 {type:'signal_out',cables:['pp2v_05'],label:'Saída auxiliar 2A (automação)',required:false},
                 {type:'power_out',cables:['pp2v_10'],label:'Bateria 12V 7-9Ah',required:false}],
  fechadura:    [{type:'power_in',cables:['pp2v_10','pp2v_05'],label:'Alimentação 12VDC (Lock+/Lock−)',required:true},
                 {type:'automation_in',cables:['pp2v_10','pp2v_05'],label:'Acionamento NF/COM (do facial ou controladora)',required:true},
                 {type:'signal_out',cables:['pp2v_05'],label:'Sensor porta NF/C (estado aberto/fechado)',required:false}],
  motor:        [{type:'power_in',cables:['ac_power','pp_flex'],label:'AC 110/220V',required:true},
                 {type:'signal_in',cables:['pp2v_05'],label:'Sinal central/controladora',required:false},
                 {type:'automation_in',cables:['pp2v_10','pp4v_10','pp2v_05'],label:'Entrada automação (botoeira/contato)',required:false}],
  // Rede
  sw_poe:       [{type:'data_io',cables:['cat5e','cat6','cat6a','smf','mmf'],label:'Portas rede (uplink + PoE out)',required:true},
                 {type:'power_in',cables:['ac_power','pp_flex'],label:'Alimentação AC 100-240V (fonte bivolt)',required:true}],
  sw_normal:    [{type:'data_io',cables:['cat5e','cat6','cat6a','smf','mmf'],label:'Portas rede (8 portas Gigabit)',required:true},
                 {type:'power_in',cables:['ac_power','pp_flex'],label:'Alimentação AC 100-240V (fonte bivolt)',required:true},
                 {type:'power_in',cables:['pp2v_10','pp2v_05'],label:'Alimentação DC 12-30V (fonte/nobreak DC)',required:false},
                 {type:'power_in',cables:['cat5e','cat6'],label:'PoE Passivo porta 1 (12-30V pinos 4,5+/7,8-)',required:false}],
  nvr:          [{type:'data_in',cables:['cat5e','cat6','cat6a'],label:'Rede p/ câmeras',required:true},
                 {type:'power_in',cables:['ac_power','pp_flex'],label:'Alimentação AC',required:true}],
  router:       [{type:'data_io',cables:['cat5e','cat6','cat6a','smf','mmf'],label:'WAN/LAN',required:true},
                 {type:'power_in',cables:['ac_power'],label:'Alimentação AC',required:true}],
  // Infraestrutura
  ont_gpon:     [{type:'data_in',cables:['smf'],label:'Entrada fibra óptica (SC/APC)',required:true},
                 {type:'data_io',cables:['cat5e','cat6'],label:'Saída LAN (RJ45 GE)',required:true},
                 {type:'power_in',cables:['pp2v_10','pp2v_05'],label:'Alimentação 12VDC ou PoE Reverso',required:true}],
  fonte_nb:     [{type:'power_in',cables:['ac_power','pp_flex'],label:'Entrada AC 90-240V',required:true},
                 {type:'power_out',cables:['pp2v_10','pp2v_05'],label:'Saída 12VDC (equipamentos)',required:true},
                 {type:'power_io',cables:['pp2v_10'],label:'Conexão bateria 12V',required:false}],
  bat_12v:      [{type:'power_out',cables:['pp2v_10'],label:'Fornecimento DC 12V (para fonte nobreak)',required:true}],
  rack:         [{type:'passthrough',cables:['cat5e','cat6','cat6a','pp2v_05','pp2v_10','ac_power','smf','mmf'],label:'Rack organização'}],
  nobreak_ac:   [{type:'power_in',cables:['ac_power','pp_flex'],label:'Entrada AC (rede elétrica)',required:true},
                 {type:'power_out',cables:['ac_power','pp_flex'],label:'Saída AC (tomadas)',required:true}],
  nobreak_dc:   [{type:'power_in',cables:['ac_power'],label:'Entrada AC',required:true},
                 {type:'power_out',cables:['pp2v_10','pp2v_05'],label:'Saída DC 12V',required:true}],
  bateria_ext:  [{type:'power_out',cables:['pp2v_10'],label:'Fornecimento DC',required:true}],
  modulo_bat:   [{type:'power_out',cables:['pp2v_10','ac_power'],label:'Fornecimento energia',required:true}],
  cabo_engate:  [{type:'passthrough',cables:['pp2v_10','ac_power'],label:'Conexão nobreak↔bateria'}],
  fonte:        [{type:'power_in',cables:['ac_power','pp_flex'],label:'Entrada AC',required:true},
                 {type:'power_out',cables:['pp2v_10','pp2v_05'],label:'Saída 12VDC',required:true},
                 {type:'signal_in',cables:['pp2v_05'],label:'Entrada alarme/aterramento (sensor porta)',required:false}],
  dio:          [{type:'data_io',cables:['smf','mmf'],label:'Terminação fibra',required:true}],
  // Borne SAK - emenda/passagem de cabos de automação e sinal no quadro
  borne_sak:    [{type:'passthrough',cables:['pp2v_10','pp4v_10','pp2v_05','pp2v_10','pp2v_05'],label:'Emenda/passagem automação (trilho DIN)'}],
  tomada_dupla: [{type:'power_out',cables:['ac_power','pp_flex'],label:'Saída AC 10A (2 tomadas)',required:true},
                 {type:'power_in',cables:['ac_power','pp_flex'],label:'Entrada AC (circuito)',required:true}],
  quadro_eletrico:[{type:'power_in',cables:['ac_power','pp_flex'],label:'Entrada geral AC (QGBT)',required:true},
                   {type:'power_out',cables:['ac_power','pp_flex'],label:'Saída circuitos AC',required:true}],
};

// ====================================================================
// DEVICE KEY CLASSIFICATION HELPERS
// Kept for backward compat with custom devices and legacy projects.
// Families deleted in v3.19.0 still have classifiers (return false for
// all current catalog keys but may match custom/legacy keys).
// ====================================================================
export const isCamera = k => k.startsWith('cam_');
export const isCameraIP = k => (k.startsWith('cam_ip_') && !k.startsWith('cam_ip_wifi_')) || k === 'cam_lpr';
export const isCameraMHD = k => k.startsWith('cam_mhd_') || k.startsWith('cam_hdcvi_');
export const isCameraWiFi = k => k.startsWith('cam_wifi_') || k.startsWith('cam_ip_wifi_');
export const isCameraVeicular = k => k.startsWith('cam_veicular_');
export const isNVR = k => k.startsWith('nvr_') || k === 'nvr';
export const isDVR = k => k.startsWith('dvr_');
export const isGravador = k => isNVR(k) || isDVR(k);
export const isCentralAlarme = k => k.startsWith('alarme_');
export const isSensorPIR = k => k.startsWith('pir_');
export const isBarreira = k => k.startsWith('barreira_');
export const isSensorZona = k => isSensorPIR(k) || isBarreira(k) || k === 'sensor_abertura';
export const isSirene = k => k.startsWith('sirene_') && !k.startsWith('sirene_inc_');
export const isEletrificador = k => k.startsWith('eletrif_') || k.startsWith('eletri_');
export const isTeclado = k => k.startsWith('teclado_');
export const isSwitch = k => k.startsWith('sw_');
export const isSwitchPoE = k => k === 'sw_poe' || k.startsWith('sw_poe_');
export const isControleAcesso = k => ['leitor_facial','controladora','fechadura','leitor_tag'].includes(k) || k.startsWith('biometrico_') || k.startsWith('tag_uhf_') || k.startsWith('catraca_') || k.startsWith('torniquete_');
export const isIncendio = k => k.startsWith('central_inc_') || k.startsWith('detector_') || k.startsWith('acionador_') || k.startsWith('modulo_inc_') || k.startsWith('sirene_inc_') || k.startsWith('fogo_') || k.startsWith('morley_');
export const isCentralIncendio = k => k.startsWith('central_inc_') || k.startsWith('fogo_central_') || k === 'morley_central';
export const isDetectorIncendio = k => k.startsWith('detector_') || k.startsWith('acionador_') || k.startsWith('fogo_det_') || k.startsWith('fogo_acionador_') || k === 'morley_detector';
export const isAutomatizador = k => k.startsWith('motor_') || k.startsWith('cancela_') || k === 'motor' || k.startsWith('auto_');
export const isAP = k => k.startsWith('ap_') || k.startsWith('wifi_ap_');
export const isLuminaria = k => k.startsWith('lumin_') || k.startsWith('emerg_');
export const isComunicador = k => k.startsWith('comunicador_');
export const isExpansor = k => k.startsWith('expansor_') || k.startsWith('receptor_');
export const isPerifericoAlarme = k => isTeclado(k) || isComunicador(k) || isExpansor(k) || k.startsWith('controle_');
export const isNobreak = k => k === 'nobreak_ac' || k === 'nobreak_dc';
export const isFonte = k => k === 'fonte' || k.startsWith('fonte_nb_');
export const isFonteNobreak = k => k.startsWith('fonte_nb_');
export const isONT = k => k === 'ont_gpon' || k.startsWith('ont_');
export const isBateria = k => k === 'bateria_ext' || k.startsWith('bat_12v_');
export const isInfra = k => ['rack','quadro_eletrico','dio','borne_sak','bateria_ext','modulo_bat','cabo_engate','tomada_dupla','dps_rede','patch_panel','conversor_midia'].includes(k) || k.startsWith('ont_') || k.startsWith('fonte_nb_') || k.startsWith('bat_12v_');
export const needsPoE = k => isCameraIP(k) || isAP(k);
export const needsNetwork = k => needsPoE(k) || isGravador(k) || isCentralAlarme(k) || k === 'controladora' || k === 'leitor_facial' || k === 'router' || isSwitch(k);
export const needsACPower = k => isSwitch(k) || isGravador(k) || k === 'router' || isEletrificador(k) || isCentralIncendio(k) || isAutomatizador(k) || isNobreak(k) || isLuminaria(k) || k.startsWith('catraca_') || k.startsWith('torniquete_');
export const needsDCPower = k => k === 'leitor_facial' || k === 'fechadura' || isSirene(k) || k === 'leitor_tag' || k.startsWith('biometrico_') || k.startsWith('tag_uhf_');
export const needsIPConfig = k => needsNetwork(k) || isAP(k) || isONT(k) || k.startsWith('catraca_') || k.startsWith('torniquete_');

// ====================================================================
// NVR/SWITCH CAPACITY HELPERS
// ====================================================================
export const getNvrChannels = (dev) => {
  if(dev.config?.channels) return dev.config.channels;
  const m = dev.key.match(/(\d+)ch/);
  if(m) return parseInt(m[1]);
  const c = dev.props?.canais;
  if(c){ const n=c.match(/(\d+)/); if(n) return parseInt(n[1]); }
  return 16;
};
export const getSwitchPorts = (dev) => {
  if(dev.config?.portCount) return dev.config.portCount;
  const p = dev.props?.portas;
  if(p){ const n=p.match(/^(\d+)/); if(n) return parseInt(n[1]); }
  if(dev.key==='sw_poe') return 8;
  if(dev.key==='sw_normal') return 8;
  const m=dev.key.match(/(\d+)/);
  if(m) return parseInt(m[1]);
  return 8;
};
export const getNvrUsedChannels = (nvrId, devs) => {
  return devs.filter(d=>isCamera(d.key))
    .reduce((sum,d)=>sum+(d.nvrAssignments?.find(a=>a.nvrId===nvrId)?.qty||0),0);
};
export const getCameraUnassigned = (cam) => {
  const total=cam.qty||1;
  const assigned=(cam.nvrAssignments||[]).reduce((s,a)=>s+(a.qty||0),0);
  return total-assigned;
};
/* ── Port usage for network devices (Switch/NVR RJ45 ports) ── */
export const getPortUsage = (netDevId, devs, conns) => {
  const netDev=devs.find(d=>d.id===netDevId);
  if(!netDev) return {capacity:0,used:0,available:0};
  const capacity=isSwitch(netDev.key)?getSwitchPorts(netDev)
    :isGravador(netDev.key)?getSwitchPorts(netDev):0;
  const dataTypes=new Set(['cat6','cat5e','fibra_sm','fibra_mm']);
  let used=0;
  conns.filter(c=>(c.from===netDevId||c.to===netDevId)&&dataTypes.has(c.type))
    .forEach(c=>{
      const otherId=c.from===netDevId?c.to:c.from;
      const other=devs.find(d=>d.id===otherId);
      if(other) used+=(isCamera(other.key)?(other.qty||1):1);
    });
  return {capacity,used,available:capacity-used};
};
/* ── Find connected network device(s) for a given device ── */
export const getConnectedNetDevices = (devId, devs, conns) => {
  const dataTypes=new Set(['cat6','cat5e','fibra_sm','fibra_mm']);
  return conns.filter(c=>(c.from===devId||c.to===devId)&&dataTypes.has(c.type))
    .map(c=>{const oid=c.from===devId?c.to:c.from;return devs.find(d=>d.id===oid);})
    .filter(d=>d&&(isSwitch(d.key)||isGravador(d.key)));
};
/* ── Trim nvrAssignments when camera qty decreases ── */
export const trimNvrAssignments = (cam, newQty) => {
  const assignments=[...(cam.nvrAssignments||[])];
  let total=assignments.reduce((s,a)=>s+(a.qty||0),0);
  if(total<=newQty) return assignments;
  for(let i=assignments.length-1;i>=0&&total>newQty;i--){
    const excess=total-newQty;
    if(assignments[i].qty<=excess){total-=assignments[i].qty;assignments.splice(i,1);}
    else{assignments[i].qty-=excess;total=newQty;}
  }
  return assignments;
};

export const autoAssignCameras = (devs, conns) => {
  const updates=[];
  const nvrs=devs.filter(d=>isGravador(d.key));
  const cameras=devs.filter(d=>isCamera(d.key));
  if(!nvrs.length||!cameras.length) return updates;
  const nvrCap={};
  nvrs.forEach(n=>{nvrCap[n.id]={dev:n,total:getNvrChannels(n),used:getNvrUsedChannels(n.id,devs)}});
  cameras.forEach(cam=>{
    const unassigned=getCameraUnassigned(cam);
    if(unassigned<=0) return;
    const directConns=conns.filter(c=>c.from===cam.id||c.to===cam.id);
    const directIds=directConns.map(c=>c.from===cam.id?c.to:c.from);
    let reachableNvrs=directIds.filter(id=>nvrs.some(n=>n.id===id));
    const connSwitches=directIds.filter(id=>devs.find(d=>d.id===id&&isSwitch(d.key)));
    connSwitches.forEach(swId=>{
      const swConns=conns.filter(c=>c.from===swId||c.to===swId);
      swConns.forEach(c=>{
        const otherId=c.from===swId?c.to:c.from;
        if(nvrs.some(n=>n.id===otherId)&&!reachableNvrs.includes(otherId)){
          reachableNvrs.push(otherId);
        }
      });
    });
    if(!reachableNvrs.length) return;
    let remaining=unassigned;
    const newAssignments=[...(cam.nvrAssignments||[])];
    reachableNvrs.forEach(nvrId=>{
      if(remaining<=0) return;
      const cap=nvrCap[nvrId];
      const available=cap.total-cap.used;
      if(available<=0) return;
      const assign=Math.min(remaining,available);
      const existing=newAssignments.find(a=>a.nvrId===nvrId);
      if(existing) existing.qty+=assign;
      else newAssignments.push({nvrId,qty:assign});
      cap.used+=assign;
      remaining-=assign;
    });
    if(remaining>0 && reachableNvrs.length){
      const firstNvr=reachableNvrs[0];
      const existing=newAssignments.find(a=>a.nvrId===firstNvr);
      if(existing) existing.qty+=remaining;
      else newAssignments.push({nvrId:firstNvr,qty:remaining});
      nvrCap[firstNvr].used+=remaining;
    }
    if(JSON.stringify(newAssignments)!==JSON.stringify(cam.nvrAssignments||[])){
      updates.push({id:cam.id,nvrAssignments:newAssignments});
    }
  });
  return updates;
};

// Can this device be rack-mounted?
export function canMountInRack(key){
  return isSwitch(key)||isGravador(key)||isNobreak(key)||isFonte(key)||
    key==='router'||key==='dio'||key==='borne_sak'||isBateria(key)||
    key==='modulo_bat'||key==='controladora'||key==='cabo_engate'||
    key==='patch_panel'||isONT(key);
}
// Can this device go inside a quadro conectividade (QC)?
export function canMountInQuadro(key){
  return isSwitchPoE(key)||isSwitch(key)||isONT(key)||isFonteNobreak(key)||isBateria(key)||
    key==='dps_rede'||key==='tomada_dupla'||key==='conversor_midia'||key==='borne_sak'||
    key==='dio'||key==='nobreak_dc'||isFonte(key);
}
// Can this device go inside a quadro elétrico?
export function canMountInQuadroEletrico(key){
  return key==='nobreak_ac'||key==='nobreak_dc'||isFonte(key)||key==='dps_rede'||
    key==='tomada_dupla'||key==='borne_sak';
}

// Rack U size per device type
export function getDeviceUSize(key){
  if(isGravador(key)) return 2; // NVR/DVR = 2U
  if(isSwitch(key)) return 1;
  if(key==='nobreak_ac') return 2;
  if(key==='nobreak_dc') return 1;
  if(key==='router') return 1;
  if(key==='dio') return 1;
  if(key==='borne_sak') return 1;
  if(key==='fonte') return 1;
  if(key==='bateria_ext') return 2;
  if(key==='modulo_bat') return 3;
  if(key==='controladora') return 1;
  return 1; // default 1U
}

// Pattern-based interface resolution for expanded device library
export function resolveInterfacesByKey(key) {
  if (DEVICE_INTERFACES[key]) return DEVICE_INTERFACES[key];

  // ── WiFi cameras (check BEFORE isCameraIP to avoid false PoE match) ──
  if (isCameraWiFi(key)) return [
    {type:'power_in',cables:['pp2v_10','pp2v_05'],label:'Alimentação 12VDC/5VDC',required:true}];

  // ── Camera IP → PoE + 12V alt + sensor ──
  if (isCameraIP(key)) return DEVICE_INTERFACES.cam_dome;

  // ── Camera Multi HD / HDCVI (legacy/custom devices) ──
  if (isCameraMHD(key)) return [
    {type:'data_in',cables:['coaxial'],label:'Vídeo HD (BNC/Coaxial)',required:true},
    {type:'power_in',cables:['pp2v_10','pp2v_05'],label:'Alimentação 12VDC',required:true},
    {type:'signal_in',cables:['pp2v_05'],label:'Entrada sensor alarme (NA/NF)',required:false},
    {type:'signal_out',cables:['pp2v_05'],label:'Saída contato seco (relay)',required:false}];

  // ── NVR ──
  if (isNVR(key)) return DEVICE_INTERFACES.nvr;

  // ── DVR (legacy/custom devices) ──
  if (isDVR(key)) return [
    {type:'data_in',cables:['coaxial'],label:'Entradas vídeo (BNC)',required:true},
    {type:'data_in',cables:['cat5e','cat6'],label:'Rede TCP/IP',required:false},
    {type:'power_in',cables:['ac_power','pp_flex'],label:'Alimentação AC',required:true}];

  // ── Controle de acesso — leitores/periféricos ──
  if (key === 'leitor_biometrico') return DEVICE_INTERFACES.leitor_tag;
  if (key === 'leitor_rfid') return [
    {type:'power_in',cables:['pp2v_10','pp2v_05'],label:'12VDC',required:true},
    {type:'data_in',cables:['pp2v_05'],label:'Wiegand/RS485',required:true}];
  if (key === 'eletroima') return DEVICE_INTERFACES.fechadura;
  if (key.startsWith('biometrico_') || key.startsWith('tag_uhf_')) return DEVICE_INTERFACES.leitor_tag;
  if (key.startsWith('catraca_') || key.startsWith('torniquete_')) return [
    {type:'power_in',cables:['ac_power','pp_flex'],label:'Alimentação AC 110/220V',required:true},
    {type:'data_in',cables:['cat5e','cat6'],label:'Rede TCP/IP',required:true},
    {type:'signal_in',cables:['pp2v_05'],label:'Botoeira/acionamento',required:false}];
  if (key.startsWith('cancela_')) return [
    {type:'power_in',cables:['ac_power','pp_flex'],label:'Alimentação AC',required:true},
    {type:'signal_in',cables:['pp2v_05'],label:'Sinal abertura (botoeira/controle)',required:false},
    {type:'data_in',cables:['cat5e','cat6'],label:'Rede TCP/IP (se IP)',required:false}];

  // ── Centrais alarme (legacy/custom devices) ──
  if (isCentralAlarme(key)) return [{type:'data_in',cables:['cat5e','cat6'],label:'Rede TCP/IP',required:false},
    {type:'power_in',cables:['ac_power','pp2v_10'],label:'Alimentação',required:true},
    {type:'signal_in',cables:['pp2v_05'],label:'Entrada zonas',required:false}];

  // ── Barreiras IR ──
  if (isBarreira(key)) return [
    {type:'signal_out',cables:['pp2v_05'],label:'Saída zona (NA/NF)',required:true},
    {type:'power_in',cables:['pp2v_10','pp2v_05'],label:'Alimentação 12VDC',required:true}];

  // ── Automatizadores ──
  if (isAutomatizador(key)) return DEVICE_INTERFACES.motor;

  // ── AP WiFi ──
  if (isAP(key)) return [
    {type:'data_in',cables:['cat5e','cat6','cat6a'],label:'PoE Data+Power (RJ45)',required:true},
    {type:'power_in',cables:['pp2v_10','pp2v_15'],label:'Alimentação 12VDC (alternativa ao PoE)',required:false}];

  // ── WiFi routers/mesh ──
  if (key.startsWith('wifi_router') || key === 'wifi_mesh') return [
    {type:'data_io',cables:['cat5e','cat6'],label:'WAN/LAN (RJ45)',required:true},
    {type:'power_in',cables:['ac_power'],label:'Alimentação AC',required:true}];

  // ── Switch PoE expandidos ──
  if (isSwitchPoE(key)) return DEVICE_INTERFACES.sw_poe;

  // ── ONT GPON ──
  if (isONT(key)) return DEVICE_INTERFACES.ont_gpon;

  // ── Fonte Nobreak 12V ──
  if (isFonteNobreak(key)) return DEVICE_INTERFACES.fonte_nb;

  // ── Bateria 12V (variantes) ──
  if (isBateria(key)) return DEVICE_INTERFACES.bat_12v;

  // ── Infraestrutura extras ──
  if (key === 'patch_panel') return [
    {type:'data_io',cables:['cat5e','cat6','cat6a'],label:'Terminação cabos rede',required:true}];
  if (key === 'conversor_midia') return [
    {type:'data_io',cables:['cat5e','cat6'],label:'RJ45 Ethernet',required:true},
    {type:'data_io',cables:['smf','mmf'],label:'SFP/SC Fibra',required:true},
    {type:'power_in',cables:['ac_power','pp2v_10'],label:'Alimentação',required:true}];
  if (key === 'dps_rede') return [
    {type:'passthrough',cables:['cat5e','cat6','cat6a','ac_power','pp_flex'],label:'Proteção surto (passagem)'}];

  // ── Fallback: power interface genérica para qualquer dispositivo ──
  return [{type:'power_in',cables:['pp2v_10','pp2v_05','ac_power'],label:'Alimentação',required:false}];
}
