// ====================================================================
// CONNECTION RULES ENGINE
// Each device defines its "interfaces" — what types of connections it accepts.
// The CONNECTION_RULES matrix defines valid device↔device combos + allowed cables.
// ====================================================================

// Interface cardinality rules:
// '1:1'  — one connection per port (RJ45, HDMI, fibra SFP)
// 'N:1'  — multiple connections on same port (contato seco, botoeira, sensor)
// '1:N'  — one source to many devices (alimentação DC/AC, fonte)
export const INTERFACE_CARDINALITY = {
  data_in:        '1:1',  // RJ45 network — one cable per port
  data_io:        '1:1',  // Switch port — one cable per port (but device has N ports)
  power_in:       '1:1',  // Device has one power input
  power_out:      '1:N',  // One source feeds multiple devices (fonte, nobreak)
  power_io:       '1:1',  // Bidirectional power (bateria ↔ fonte/nobreak)
  signal_in:      'N:1',  // Multiple sensors on same zone (botoeira → facial)
  signal_out:     '1:1',  // Relay output — one target
  automation_in:  'N:1',  // Multiple triggers (botoeiras → motor)
  automation_out: '1:1',  // One automation output per target
  passthrough:    'N:1',  // Infrastructure passthrough — multiple cables
  video_out:      '1:1',  // HDMI/VGA — one monitor per port
  rs485:          'N:1',  // Serial bus — multiple devices on same bus
  wiegand:        '1:1',  // Wiegand — one reader per input
  fiber_in:       '1:1',  // SFP fiber input
  alarm_zone:     'N:1',  // Multiple sensors per zone
  wifi_client:    'N:1',  // Multiple WiFi clients per AP
};

// Device interface types
export const DEVICE_INTERFACES = {
  // CFTV — todas câmeras IP: PoE OU 12V + sensor inputs + contato seco
  cam_dome:     [{type:'data_in',cables:['cat5e','cat6','cat6a'],label:'Rede PoE (RJ45 — dados + alimentação)',required:true},
                 {type:'power_in',cables:['pp2v_10','pp2v_15'],label:'Alimentação 12VDC (alternativa ao PoE)',required:false},
                 {type:'signal_in',cables:['pp2v_05'],label:'Entrada alarme (contato NA/NF)',required:false},
                 {type:'signal_out',cables:['pp2v_05'],label:'Saída relay (contato seco)',required:false}],
  cam_bullet:   [{type:'data_in',cables:['cat5e','cat6','cat6a'],label:'Rede PoE (RJ45 — dados + alimentação)',required:true},
                 {type:'power_in',cables:['pp2v_10','pp2v_15'],label:'Alimentação 12VDC (alternativa ao PoE)',required:false},
                 {type:'signal_in',cables:['pp2v_05'],label:'Entrada alarme (contato NA/NF)',required:false},
                 {type:'signal_out',cables:['pp2v_05'],label:'Saída relay (contato seco)',required:false}],
  cam_ptz:      [{type:'data_in',cables:['cat5e','cat6','cat6a'],label:'Rede PoE (RJ45 — dados + alimentação)',required:true},
                 {type:'power_in',cables:['pp2v_10','pp2v_15','pp2v_25'],label:'Alimentação 12/24VDC (alternativa ao PoE)',required:false},
                 {type:'signal_in',cables:['pp2v_05'],label:'Entrada alarme 1 (contato NA/NF)',required:false},
                 {type:'signal_in',cables:['pp2v_05'],label:'Entrada alarme 2 (contato NA/NF)',required:false},
                 {type:'signal_out',cables:['pp2v_05'],label:'Saída relay 1 (contato seco)',required:false},
                 {type:'signal_out',cables:['pp2v_05'],label:'Saída relay 2 (contato seco)',required:false}],
  cam_fisheye:  [{type:'data_in',cables:['cat5e','cat6','cat6a'],label:'Rede PoE (RJ45 — dados + alimentação)',required:true},
                 {type:'power_in',cables:['pp2v_10','pp2v_15'],label:'Alimentação 12VDC (alternativa ao PoE)',required:false},
                 {type:'signal_in',cables:['pp2v_05'],label:'Entrada alarme (contato NA/NF)',required:false},
                 {type:'signal_out',cables:['pp2v_05'],label:'Saída relay (contato seco)',required:false}],
  // LPR Camera - PoE/12V + saída automação (contato seco p/ abrir portão) + sensors
  cam_lpr:      [{type:'data_in',cables:['cat5e','cat6','cat6a'],label:'Rede PoE (RJ45 — dados + alimentação)',required:true},
                 {type:'power_in',cables:['pp2v_10','pp2v_15'],label:'Alimentação 12VDC (alternativa ao PoE)',required:false},
                 {type:'automation_out',cables:['pp2v_10','pp4v_10','pp2v_05'],label:'Saída automação (contato seco p/ portão)',required:false},
                 {type:'signal_in',cables:['pp2v_05'],label:'Entrada alarme 1 (contato NA/NF)',required:false},
                 {type:'signal_in',cables:['pp2v_05'],label:'Entrada alarme 2 (contato NA/NF)',required:false},
                 {type:'signal_out',cables:['pp2v_05'],label:'Saída relay (contato seco)',required:false}],
  // Controle Acesso
  leitor_facial:[{type:'power_in',cables:['pp2v_10','pp2v_05'],label:'Alimentação 12VDC',required:true},
                 {type:'data_in',cables:['cat5e','cat6'],label:'Rede TCP/IP (RJ45)',required:true},
                 {type:'data_in',cables:['pp2v_05'],label:'RS-485 (barramento serial)',required:false},
                 {type:'signal_out',cables:['pp2v_05'],label:'Wiegand saída (W0/W1)',required:false},
                 {type:'signal_in',cables:['pp2v_05'],label:'Entrada alarme',required:false},
                 {type:'signal_out',cables:['pp2v_05'],label:'Saída alarme',required:false},
                 {type:'automation_out',cables:['pp2v_10','pp4v_10','pp2v_05'],label:'Saída fechadura (NC/COM)',required:false},
                 {type:'signal_in',cables:['pp2v_05'],label:'Botoeira / Sensor porta',required:false}],
  leitor_tag:   [{type:'power_in',cables:['pp2v_10','pp2v_05'],label:'Alimentação 12VDC',required:true},
                 {type:'data_in',cables:['pp2v_05'],label:'Wiegand / RS-485',required:true},
                 {type:'automation_out',cables:['pp2v_10','pp4v_10','pp2v_05'],label:'Saída automação (contato seco)',required:false}],
  controladora: [{type:'power_in',cables:['ac_power','pp_flex'],label:'Alimentação AC bivolt',required:true},
                 {type:'data_in',cables:['cat5e','cat6'],label:'Rede TCP/IP (RJ45)',required:false},
                 {type:'automation_out',cables:['pp2v_10','pp4v_10','pp2v_05'],label:'Saída fechadura / eletroímã',required:true},
                 {type:'signal_in',cables:['pp2v_05'],label:'Entrada botoeira',required:false},
                 {type:'signal_out',cables:['pp2v_05'],label:'Saída auxiliar (automação)',required:false},
                 {type:'power_out',cables:['pp2v_10'],label:'Saída bateria 12V',required:false}],
  fechadura:    [{type:'power_in',cables:['pp2v_10','pp2v_05'],label:'Alimentação 12VDC',required:true},
                 {type:'automation_in',cables:['pp2v_10','pp2v_05'],label:'Acionamento (do facial ou controladora)',required:true},
                 {type:'signal_out',cables:['pp2v_05'],label:'Sensor porta (estado aberto/fechado)',required:false}],
  // Botoeira / Sensor de saída
  botoeira:     [{type:'power_in',cables:['pp2v_10','pp2v_05'],label:'Alimentação 12VDC',required:true},
                 {type:'signal_out',cables:['pp2v_05'],label:'Saída contato (NA/NF p/ controladora)',required:true}],
  sensor_abertura:[{type:'signal_out',cables:['pp2v_05'],label:'Saída contato (NA/NF)',required:true}],
  motor:        [{type:'power_in',cables:['ac_power','pp_flex'],label:'Alimentação AC 110/220V',required:true},
                 {type:'signal_in',cables:['pp2v_05'],label:'Sinal central / controladora',required:false},
                 {type:'automation_in',cables:['pp2v_10','pp4v_10','pp2v_05'],label:'Entrada automação (botoeira/contato)',required:false}],
  // Rede
  sw_poe:       [{type:'data_io',cables:['cat5e','cat6','cat6a','smf','mmf'],label:'Portas de rede (uplink + PoE)',required:true},
                 {type:'power_in',cables:['ac_power','pp_flex'],label:'Alimentação AC bivolt',required:true},
                 {type:'power_in',cables:['pp2v_25','pp2v_15'],label:'Alimentação DC 48-54V (via conversor DC-DC)',required:false}],
  sw_normal:    [{type:'data_io',cables:['cat5e','cat6','cat6a','smf','mmf'],label:'Portas de rede',required:true},
                 {type:'power_in',cables:['ac_power','pp_flex'],label:'Alimentação AC bivolt',required:true},
                 {type:'power_in',cables:['pp2v_10','pp2v_05'],label:'Alimentação DC 12-30V (fonte/nobreak)',required:false},
                 {type:'power_in',cables:['cat5e','cat6'],label:'PoE Passivo (12-30V)',required:false}],
  // NVR padrão (sem PoE) — conecta via switch
  nvr:          [{type:'data_io',cables:['cat5e','cat6','cat6a'],label:'Porta de rede LAN (RJ45)',required:true},
                 {type:'power_in',cables:['ac_power','pp_flex'],label:'Alimentação AC bivolt',required:true},
                 {type:'video_out',cables:['hdmi'],label:'Saída HDMI (monitor)',required:false},
                 {type:'video_out',cables:['hdmi'],label:'Saída VGA (monitor)',required:false},
                 {type:'passthrough',cables:['usb'],label:'Porta USB (mouse)',required:false}],
  // NVR com PoE integrado — aceita câmeras diretamente nas portas PoE
  nvr_poe:      [{type:'data_io',cables:['cat5e','cat6','cat6a'],label:'Portas PoE integradas (câmeras diretas)',required:true},
                 {type:'data_io',cables:['cat5e','cat6','cat6a','smf','mmf'],label:'Porta uplink (rede/switch)',required:false},
                 {type:'power_in',cables:['ac_power','pp_flex'],label:'Alimentação AC bivolt',required:true},
                 {type:'video_out',cables:['hdmi'],label:'Saída HDMI (monitor)',required:false},
                 {type:'video_out',cables:['hdmi'],label:'Saída VGA (monitor)',required:false},
                 {type:'passthrough',cables:['usb'],label:'Porta USB (mouse)',required:false}],
  router:       [{type:'data_io',cables:['cat5e','cat6','cat6a','smf','mmf'],label:'Portas WAN / LAN',required:true},
                 {type:'power_in',cables:['ac_power'],label:'Alimentação AC',required:true}],
  // Infraestrutura
  ont_gpon:     [{type:'data_in',cables:['smf'],label:'Entrada fibra óptica (SC/APC)',required:true},
                 {type:'data_io',cables:['cat5e','cat6'],label:'Saída LAN (RJ45)',required:true},
                 {type:'power_in',cables:['pp2v_10','pp2v_05'],label:'Alimentação 12VDC',required:true}],
  fonte_nb:     [{type:'power_in',cables:['ac_power','pp_flex'],label:'Entrada AC bivolt',required:true},
                 {type:'power_out',cables:['pp2v_10','pp2v_05'],label:'Saída 12VDC (equipamentos)',required:true},
                 {type:'power_io',cables:['pp2v_10'],label:'Conexão bateria 12V',required:false}],
  bat_12v:      [{type:'power_out',cables:['pp2v_10'],label:'Saída DC 12V (p/ fonte nobreak)',required:true}],
  rack:         [{type:'passthrough',cables:['cat5e','cat6','cat6a','pp2v_05','pp2v_10','ac_power','smf','mmf'],label:'Passagem de cabos (rack)'}],
  nobreak_ac:   [{type:'power_in',cables:['ac_power','pp_flex'],label:'Entrada AC (rede elétrica)',required:true},
                 {type:'power_out',cables:['ac_power','pp_flex'],label:'Saída AC (tomadas)',required:true},
                 {type:'power_io',cables:['sb50_48v','sb50_12v'],label:'Conector engate rápido (bateria externa)',required:false}],
  nobreak_dc:   [{type:'power_in',cables:['ac_power'],label:'Entrada AC',required:true},
                 {type:'power_out',cables:['pp2v_10','pp2v_05'],label:'Saída DC 12V',required:true}],
  bateria_ext:  [{type:'power_out',cables:['pp2v_10'],label:'Saída DC 12V (p/ fonte nobreak — chicote direto)',required:true},
                 {type:'power_io',cables:['sb50_48v','sb50_12v'],label:'Conector engate rápido (p/ nobreak AC)',required:false}],
  modulo_bat:   [{type:'power_io',cables:['sb50_48v','sb50_12v'],label:'Conector engate rápido (p/ nobreak AC)',required:true}],
  cabo_engate:  [{type:'passthrough',cables:['sb50_48v','sb50_12v'],label:'Conexão engate rápido (nobreak ↔ bateria)'}],
  fonte:        [{type:'power_in',cables:['ac_power','pp_flex'],label:'Entrada AC',required:true},
                 {type:'power_out',cables:['pp2v_10','pp2v_05'],label:'Saída 12VDC',required:true},
                 {type:'signal_in',cables:['pp2v_05'],label:'Entrada sensor porta',required:false}],
  conversor_dc_dc:[{type:'power_in',cables:['pp2v_10','pp2v_15'],label:'Entrada 12VDC (da fonte nobreak)',required:true},
                   {type:'power_out',cables:['pp2v_25','pp2v_15'],label:'Saída 54VDC (p/ Switch PoE)',required:true}],
  dio:          [{type:'data_io',cables:['smf','mmf'],label:'Terminação fibra óptica (entrada/saída)',required:true},
                 {type:'data_io',cables:['cat5e','cat6','cat6a'],label:'Saída LAN (conversor integrado)',required:false}],
  borne_sak:    [{type:'passthrough',cables:['pp2v_10','pp4v_10','pp2v_05'],label:'Emenda / passagem cabos (trilho DIN)'}],
  tomada_dupla: [{type:'power_out',cables:['ac_power','pp_flex'],label:'Saída AC 10A (2 tomadas)',required:true},
                 {type:'power_in',cables:['ac_power','pp_flex'],label:'Entrada AC (circuito)',required:true}],
  quadro_eletrico:[{type:'power_in',cables:['ac_power','pp_flex'],label:'Entrada geral AC (QGBT)',required:true},
                   {type:'power_out',cables:['ac_power','pp_flex'],label:'Saída circuitos AC',required:true}],
  // Fechaduras Solenoide / Eletromecânica
  fechadura_sol: [{type:'power_in',cables:['pp2v_10','pp2v_05'],label:'Alimentação 12VDC',required:true},
                  {type:'automation_in',cables:['pp2v_10','pp2v_05'],label:'Acionamento (facial / controladora)',required:true},
                  {type:'signal_out',cables:['pp2v_05'],label:'Sensor porta (estado aberto/fechado)',required:false}],
  // Periféricos / Monitores
  monitor_led:  [{type:'video_out',cables:['hdmi'],label:'Entrada HDMI (vídeo)',required:true},
                 {type:'power_in',cables:['ac_power','pp_flex'],label:'Alimentação AC bivolt',required:true}],
  cabo_hdmi:    [{type:'passthrough',cables:['hdmi'],label:'HDMI (passagem vídeo NVR → Monitor)'}],
  mouse_usb:    [{type:'passthrough',cables:['usb'],label:'USB (conexão ao NVR/PC)'}],
  cabo_ext_usb: [{type:'passthrough',cables:['usb'],label:'Extensão USB (passagem)'}],
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
export const isNvrPoE = k => k.includes('_poe') && isNVR(k);
export const isControleAcesso = k => ['leitor_facial','controladora','fechadura','leitor_tag','eletroima','leitor_biometrico','leitor_rfid','sensor_abertura','fechadura_eletromecanica','fechadura_solenoide_embutir','fechadura_solenoide_sobrepor'].includes(k) || k.startsWith('botoeira') || k.startsWith('biometrico_') || k.startsWith('tag_uhf_') || k.startsWith('catraca_') || k.startsWith('torniquete_');
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
export const isFonte = k => k === 'fonte' || k.startsWith('fonte_nb_') || k.startsWith('fonte_idpower_');
export const isFonteNobreak = k => k.startsWith('fonte_nb_') || k.startsWith('fonte_idpower_');
export const isONT = k => k === 'ont_gpon' || k.startsWith('ont_');
export const isBateria = k => k === 'bateria_ext' || k.startsWith('bat_12v_');
export const isInfra = k => ['rack','quadro_eletrico','dio','borne_sak','bateria_ext','modulo_bat','cabo_engate','tomada_dupla','dps_rede','patch_panel','conversor_midia'].includes(k) || k.startsWith('ont_') || k.startsWith('fonte_nb_') || k.startsWith('fonte_idpower_') || k.startsWith('bat_12v_') || k.startsWith('conversor_dc_dc_');
export const needsPoE = k => isCameraIP(k) || isAP(k);
export const needsNetwork = k => needsPoE(k) || isGravador(k) || isCentralAlarme(k) || k === 'controladora' || k === 'leitor_facial' || k === 'router' || isSwitch(k);
/** Concentradores de rede — conexão entre eles = uplink (não ocupa porta de acesso) */
export const isConcentrador = k => isSwitch(k) || k === 'router' || isONT(k) || k === 'conversor_midia';
/** Cabos que ocupam porta RJ45/SFP do switch (ethernet + fibra óptica) */
export const DATA_PORT_CABLES = new Set(['cat5e','cat6','cat6a','smf','mmf']);
export const needsACPower = k => isSwitch(k) || isGravador(k) || k === 'router' || isEletrificador(k) || isCentralIncendio(k) || isAutomatizador(k) || isNobreak(k) || isLuminaria(k) || k.startsWith('catraca_') || k.startsWith('torniquete_') || k.startsWith('monitor_led');
export const needsDCPower = k => k === 'leitor_facial' || k === 'fechadura' || k.startsWith('fechadura_') || isSirene(k) || k === 'leitor_tag' || k.startsWith('biometrico_') || k.startsWith('tag_uhf_');
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
  if(!netDev) return {capacity:0,used:0,available:0,poe:0,access:0,uplinks:0};
  const capacity=isSwitch(netDev.key)?getSwitchPorts(netDev)
    :isGravador(netDev.key)?getSwitchPorts(netDev):0;
  let poe=0, access=0, uplinks=0;
  conns.filter(c=>(c.from===netDevId||c.to===netDevId)&&DATA_PORT_CABLES.has(c.type))
    .forEach(c=>{
      const otherId=c.from===netDevId?c.to:c.from;
      const other=devs.find(d=>d.id===otherId);
      if(!other) return;
      if(isConcentrador(other.key)){ uplinks++; }
      else if(needsPoE(other.key)){ poe+=(other.qty||1); }
      else { access++; }
    });
  const used=poe+access+uplinks;
  return {capacity,used,available:capacity-used,poe,access,uplinks};
};
/* ── Find connected network device(s) for a given device ── */
export const getConnectedNetDevices = (devId, devs, conns) => {
  return conns.filter(c=>(c.from===devId||c.to===devId)&&DATA_PORT_CABLES.has(c.type))
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
    key==='patch_panel'||isONT(key)||key.startsWith('conversor_dc_dc_');
}
// Can this device go inside a quadro conectividade (QC)?
export function canMountInQuadro(key){
  return isSwitchPoE(key)||isSwitch(key)||isONT(key)||isFonteNobreak(key)||isBateria(key)||
    key==='dps_rede'||key==='tomada_dupla'||key==='conversor_midia'||key==='borne_sak'||
    key==='dio'||key==='nobreak_dc'||isFonte(key)||key.startsWith('conversor_dc_dc_');
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
    {type:'power_in',cables:['pp2v_10','pp2v_05'],label:'Alimentação 12VDC / 5VDC',required:true}];

  // ── Camera IP → PoE + 12V alt + sensor ──
  if (isCameraIP(key)) return DEVICE_INTERFACES.cam_dome;

  // ── Camera Multi HD / HDCVI (legacy/custom devices) ──
  if (isCameraMHD(key)) return [
    {type:'data_in',cables:['coaxial'],label:'Vídeo HD (BNC / Coaxial)',required:true},
    {type:'power_in',cables:['pp2v_10','pp2v_05'],label:'Alimentação 12VDC',required:true},
    {type:'signal_in',cables:['pp2v_05'],label:'Entrada alarme (contato NA/NF)',required:false},
    {type:'signal_out',cables:['pp2v_05'],label:'Saída relay (contato seco)',required:false}];

  // ── NVR — diferenciar PoE (portas integradas) de padrão ──
  if (isNVR(key)) {
    if (key.includes('poe')) return DEVICE_INTERFACES.nvr_poe;
    return DEVICE_INTERFACES.nvr;
  }

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
  if (key.startsWith('fechadura_solenoide') || key === 'fechadura_eletromecanica') return DEVICE_INTERFACES.fechadura_sol;
  if (key === 'botoeira_nt' || key === 'botoeira_emergencia' || key.startsWith('botoeira')) return DEVICE_INTERFACES.botoeira;
  if (key === 'sensor_abertura' || key === 'sensor_porta') return DEVICE_INTERFACES.sensor_abertura;
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
    {type:'signal_out',cables:['pp2v_05'],label:'Saída zona alarme (NA/NF)',required:true},
    {type:'power_in',cables:['pp2v_10','pp2v_05'],label:'Alimentação 12VDC',required:true}];

  // ── Automatizadores ──
  if (isAutomatizador(key)) return DEVICE_INTERFACES.motor;

  // ── AP WiFi ──
  if (isAP(key)) return [
    {type:'data_in',cables:['cat5e','cat6','cat6a'],label:'Rede PoE (RJ45 — dados + alimentação)',required:true},
    {type:'power_in',cables:['pp2v_10','pp2v_15'],label:'Alimentação 12VDC (alternativa ao PoE)',required:false}];

  // ── WiFi routers/mesh ──
  if (key.startsWith('wifi_router') || key === 'wifi_mesh') return [
    {type:'data_io',cables:['cat5e','cat6'],label:'WAN/LAN (RJ45)',required:true},
    {type:'power_in',cables:['ac_power'],label:'Alimentação AC',required:true}];

  // ── Switch PoE expandidos ──
  if (isSwitchPoE(key)) return DEVICE_INTERFACES.sw_poe;

  // ── ONT GPON ──
  if (isONT(key)) return DEVICE_INTERFACES.ont_gpon;

  // ── Conversor DC-DC ──
  if (key.startsWith('conversor_dc_dc_')) return DEVICE_INTERFACES.conversor_dc_dc;

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

  // ── Monitores LED ──
  if (key.startsWith('monitor_led')) return DEVICE_INTERFACES.monitor_led;
  // ── Cabo HDMI ──
  if (key === 'cabo_hdmi') return DEVICE_INTERFACES.cabo_hdmi;
  // ── Mouse / Cabo USB ──
  if (key === 'mouse_usb') return DEVICE_INTERFACES.mouse_usb;
  if (key === 'cabo_extensor_usb') return DEVICE_INTERFACES.cabo_ext_usb;

  // ── Fallback: power interface genérica para qualquer dispositivo ──
  return [{type:'power_in',cables:['pp2v_10','pp2v_05','ac_power'],label:'Alimentação',required:false}];
}
