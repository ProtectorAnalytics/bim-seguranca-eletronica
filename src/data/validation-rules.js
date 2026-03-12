import { DEVICE_LIB } from './device-lib';
import { CABLE_TYPES } from './cable-types';
import { isValidIPv4, findDuplicateIPs } from '../lib/helpers';
import { needsIPConfig } from './device-interfaces';

// ====================================================================
// DEVICE KEY CLASSIFICATION HELPERS (imported from device-interfaces for validation)
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
export const isInfra = k => ['rack','quadro','quadro_eletrico','dio','borne_sak','bateria_ext','modulo_bat','cabo_engate','tomada_dupla'].includes(k);
export const needsPoE = k => isCameraIP(k) || isAP(k);
export const needsNetwork = k => needsPoE(k) || isGravador(k) || isCentralAlarme(k) || k === 'controladora' || k === 'leitor_facial' || k === 'router' || isSwitch(k);
export const needsACPower = k => isSwitch(k) || isGravador(k) || k === 'router' || isEletrificador(k) || isCentralIncendio(k) || isAutomatizador(k) || isNobreak(k) || isLuminaria(k) || k.startsWith('catraca_') || k.startsWith('torniquete_');
export const needsDCPower = k => k === 'leitor_facial' || k === 'fechadura' || isSirene(k) || k === 'leitor_tag' || k.startsWith('biometrico_') || k.startsWith('tag_uhf_');

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

// ====================================================================
// DEVICE LOOKUP
// ====================================================================
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

// Scenarios
export const SCENARIOS = [
  {id:'condominio',name:'Condomínio',icon:'\u{1F3D8}\u{FE0F}',desc:'Residencial, comercial'},
  {id:'empresa',name:'Empresa/Escritório',icon:'\u{1F3E2}',desc:'Corporativo'},
  {id:'industria',name:'Indústria/Fábrica',icon:'\u{1F3ED}',desc:'Área fabril'},
  {id:'comercio',name:'Comércio/Loja',icon:'\u{1F3EA}',desc:'Varejo'},
  {id:'escola',name:'Escola/Campus',icon:'\u{1F393}',desc:'Educacional'},
  {id:'hospital',name:'Hospital/Clínica',icon:'\u{1F3E5}',desc:'Saúde'},
  {id:'hotel',name:'Hotel/Pousada',icon:'\u{1F3E8}',desc:'Hospitalidade'},
  {id:'custom',name:'Personalizado',icon:'\u{2699}\u{FE0F}',desc:'Projeto livre'},
];

// Environment colors
export const ENV_COLORS = [
  {name:'Recepção',color:'#3b82f6',bg:'rgba(59,130,246,.08)'},
  {name:'Corredor',color:'#6b7280',bg:'rgba(107,114,128,.08)'},
  {name:'Sala Técnica',color:'#ef4444',bg:'rgba(239,68,68,.08)'},
  {name:'Estacionamento',color:'#f59e0b',bg:'rgba(245,158,11,.08)'},
  {name:'Perímetro',color:'#10b981',bg:'rgba(16,185,129,.08)'},
  {name:'Área Comum',color:'#8b5cf6',bg:'rgba(139,92,246,.08)'},
  {name:'Escritório',color:'#06b6d4',bg:'rgba(6,182,212,.08)'},
  {name:'Depósito',color:'#78716c',bg:'rgba(120,113,108,.08)'},
];

// ====================================================================
// VALIDATION RULES
// ====================================================================
export const REGRAS=[
  {cat:'Elétrica',regra:'Consumo PoE total vs capacidade do switch',sev:'CRÍTICA',
    check:(devices)=>{
      const sws=devices.filter(d=>isSwitchPoE(d.key));
      if(!sws.length) return null;
      const totalPoe=devices.filter(d=>{const def=findDevDef(d.key);return def?.poe}).reduce((a,d)=>{const def=findDevDef(d.key);return a+(def?.poeW||15)},0);
      const swCap=sws.reduce((a,d)=>{const def=findDevDef(d.key);return a+parseInt(def?.props?.poe_budget||def?.props?.poeTotal||'120')},0);
      if(totalPoe>swCap) return `Consumo PoE ${totalPoe}W > Capacidade ${swCap}W`;
      if(totalPoe>swCap*0.8) return `Consumo PoE ${totalPoe}W > 80% da capacidade (${swCap}W)`;
      return null;
    }},
  {cat:'Infraestrutura',regra:'Nobreak AC deve ter bateria externa ou módulo',sev:'OBRIGATÓRIA',
    check:(devices)=>{
      const nbAcs=devices.filter(d=>d.key==='nobreak_ac');
      if(!nbAcs.length) return null;
      const needsBat=nbAcs.filter(nb=>!nb.config?.batExterna);
      if(needsBat.length) return `${needsBat.length} Nobreak AC requer bateria externa configurada`;
      return null;
    }},
  {cat:'Rede',regra:'Portas: dispositivos + uplink + 20% reserva',sev:'ALTA',
    check:(devices)=>{
      const sws=devices.filter(d=>isSwitch(d.key));
      if(!sws.length) return null;
      const ports=sws.reduce((a,d)=>a+parseInt(findDevDef(d.key)?.props?.portas?.split('+')[0]||'8'),0);
      const needed=devices.filter(d=>{const def=findDevDef(d.key);return (def?.ports||0)>0}).length;
      const total=Math.ceil(needed*1.2)+sws.length;
      if(total>ports) return `${needed} dispositivos (+20%+uplinks) = ${total} portas necessárias > ${ports} disponíveis`;
      return null;
    }},
  {cat:'CFTV',regra:'Gravador: canais vs câmeras',sev:'CRÍTICA',
    check:(devices)=>{
      const cams=devices.filter(d=>isCamera(d.key)).length;
      const gravadores=devices.filter(d=>isGravador(d.key));
      if(!cams||!gravadores.length) return null;
      const ch=gravadores.reduce((a,d)=>a+parseInt(findDevDef(d.key)?.props?.canais||findDevDef(d.key)?.nvrCh||'16'),0);
      if(cams>ch) return `${cams} câmeras > ${ch} canais gravador(es)`;
      return null;
    }},
  {cat:'Acesso',regra:'Dispositivo IP de acesso precisa de switch/rede',sev:'ALTA',
    check:(devices)=>{
      const accessIP=devices.filter(d=>d.key==='leitor_facial'||d.key==='controladora'||d.key.startsWith('catraca_')||d.key.startsWith('torniquete_')).length;
      const sw=devices.filter(d=>isSwitch(d.key)).length;
      if(accessIP>0&&sw===0) return `${accessIP} dispositivo(s) de acesso IP sem switch de rede`;
      return null;
    }},
  {cat:'Infra',regra:'Nobreak obrigatório para sistemas críticos',sev:'ALTA',
    check:(devices)=>{
      const nb=devices.filter(d=>isNobreak(d.key)).length;
      const cams=devices.filter(d=>isCamera(d.key)).length;
      if(cams>0&&nb===0) return `${cams} câmeras sem nobreak = sem gravação no blackout`;
      return null;
    }},
  {cat:'Arquitetura',regra:'> 2 switches: avaliar rack',sev:'ALTA',
    check:(devices,connections,racks)=>{
      const sw=devices.filter(d=>isSwitch(d.key)).length;
      const rackCount=(racks||[]).length;
      if(sw>2&&rackCount===0) return `${sw} switches. Considerar rack 5U+ em vez de quadro`;
      return null;
    }},
  {cat:'Energia',regra:'Dispositivos sem alimentação elétrica',sev:'CRÍTICA',
    check:(devices,connections)=>{
      const issues=[];
      devices.filter(d=>needsACPower(d.key)).forEach(dev=>{
        const hasPowerConn=connections?.some(c=>{
          const otherId=c.from===dev.id?c.to:c.from;
          const ct=CABLE_TYPES.find(t=>t.id===c.type);
          return ct?.group==='power';
        });
        if(!hasPowerConn) issues.push(dev.name);
      });
      if(issues.length>0) return `Sem cabo de energia: ${issues.slice(0,3).join(', ')}${issues.length>3?` +${issues.length-3}`:''}`;
      return null;
    }},
  {cat:'Alimentação',regra:'Dispositivo DC sem fonte 12V',sev:'ALTA',
    check:(devices,connections)=>{
      const fontes=devices.filter(d=>isFonte(d.key));
      if(!fontes.length){
        const dcDevs=devices.filter(d=>needsDCPower(d.key));
        if(dcDevs.length>0) return `${dcDevs.length} dispositivo(s) DC sem fonte 12V no projeto`;
      }
      return null;
    }},
  {cat:'Rede',regra:'Portas RJ45 ocupadas em switch (por dispositivo)',sev:'CRÍTICA',
    check:(devices,connections)=>{
      const dataTypes=new Set(['cat6','cat5e','smf','mmf']);
      const issues=[];
      devices.filter(d=>isSwitch(d.key)||isGravador(d.key)).forEach(nd=>{
        const capacity=getSwitchPorts(nd);
        let used=0;
        connections.filter(c=>(c.from===nd.id||c.to===nd.id)&&dataTypes.has(c.type)).forEach(c=>{
          const oid=c.from===nd.id?c.to:c.from;
          const other=devices.find(d=>d.id===oid);
          if(other) used+=(isCamera(other.key)?(other.qty||1):1);
        });
        if(used>capacity) issues.push(`${nd.name}: ${used}/${capacity} portas`);
      });
      if(issues.length) return `Excesso de portas: ${issues.join('; ')}`;
      return null;
    }},
  {cat:'CFTV',regra:'Canais CFTV: câmeras atribuídas excede capacidade do NVR',sev:'CRÍTICA',
    check:(devices)=>{
      const issues=[];
      devices.filter(d=>isGravador(d.key)).forEach(nvr=>{
        const ch=getNvrChannels(nvr);
        const used=getNvrUsedChannels(nvr.id,devices);
        if(used>ch) issues.push(`${nvr.name}: ${used}/${ch} canais`);
      });
      if(issues.length) return `Excesso de canais CFTV: ${issues.join('; ')}`;
      return null;
    }},
  {cat:'Rede',regra:'IP duplicado entre dispositivos',sev:'ALTA',
    check:(devices)=>{
      const dupes=findDuplicateIPs(devices);
      if(dupes.length===0) return null;
      return dupes.map(d=>`IP ${d.ip} usado em: ${d.devices.join(', ')}`).join('; ');
    }},
  {cat:'Rede',regra:'IP inválido configurado em dispositivo',sev:'ALTA',
    check:(devices)=>{
      const issues=[];
      devices.forEach(d=>{
        if(!needsIPConfig(d.key)) return;
        const ip=d.config?.ipAddress;
        if(ip && !isValidIPv4(ip)) issues.push(`${d.name}: "${ip}"`);
      });
      if(issues.length) return `IP inválido: ${issues.slice(0,3).join(', ')}${issues.length>3?` +${issues.length-3}`:''}`;
      return null;
    }},
];
