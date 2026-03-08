import { ICONS } from '@/icons';
import { DEVICE_THUMBNAILS } from './device-thumbnails';

// ====================================================================
// DEVICE LIBRARY - Catálogo Genérico Segurança Eletrônica (160 dispositivos)
// Ref: Catálogo Intelbras 12ª Edição 2025 + mercado geral
// ====================================================================
export const DEVICE_LIB = [
  // ================================================================
  // CFTV IP - CÂMERAS (20 tipos)
  // ================================================================
  {cat:'CFTV IP',color:'#f59e0b',items:[
    {key:'cam_ip_bullet_2mp',name:'Câmera IP Bullet 2MP',icon:'cam_bullet',poe:true,poeW:12,ports:1,nvrCh:1,props:{resolucao:'2MP (1080p)',ir:'30m',lente:'3.6mm',ip:'IP67',compressao:'H.265+'},ref:'VIP 1220 B G4, VIP 1230 B G5, VIP 3230 B G3, VIPC 1230 B G2'},
    {key:'cam_ip_bullet_2mp_fc',name:'Câmera IP Bullet 2MP Full Color',icon:'cam_bullet',poe:true,poeW:12,ports:1,nvrCh:1,props:{resolucao:'2MP (1080p)',ir:'30m LED',lente:'2.8mm',ip:'IP67',visao:'Full Color'},ref:'VIP 1220 B Full Color G4'},
    {key:'cam_ip_bullet_3mp',name:'Câmera IP Bullet 3MP',icon:'cam_bullet',poe:true,poeW:12,ports:1,nvrCh:1,props:{resolucao:'3MP (2304x1296)',ir:'30m',lente:'2.8mm',ip:'IP67',compressao:'H.265+'},ref:'VIP 1230 B G5'},
    {key:'cam_ip_bullet_4mp',name:'Câmera IP Bullet 4MP',icon:'cam_bullet',poe:true,poeW:12,ports:1,nvrCh:1,props:{resolucao:'4MP (2560x1440)',ir:'30m',lente:'2.8mm',ip:'IP67',ia:'Sim'},ref:'VIP 3430 B IA'},
    {key:'cam_ip_bullet_8mp',name:'Câmera IP Bullet 8MP (4K)',icon:'cam_bullet',poe:true,poeW:15,ports:1,nvrCh:1,props:{resolucao:'8MP (3840x2160)',ir:'50m',lente:'2.8mm',ip:'IP67',ia:'Sim'},ref:'VIP 3830 IA'},
    {key:'cam_ip_dome_2mp',name:'Câmera IP Dome 2MP',icon:'cam_dome',poe:true,poeW:12,ports:1,nvrCh:1,props:{resolucao:'2MP (1080p)',ir:'30m',lente:'2.8mm',ip:'IP67',compressao:'H.265+'},ref:'VIP 1220 D G4, VIP 3230 D G3, VIPC 1230 D G2'},
    {key:'cam_ip_dome_2mp_fc',name:'Câmera IP Dome 2MP Full Color',icon:'cam_dome',poe:true,poeW:12,ports:1,nvrCh:1,props:{resolucao:'2MP (1080p)',ir:'30m LED',lente:'2.8mm',ip:'IP67',visao:'Full Color'},ref:'VIP 1220 D FC+'},
    {key:'cam_ip_dome_4mp',name:'Câmera IP Dome 4MP',icon:'cam_dome',poe:true,poeW:12,ports:1,nvrCh:1,props:{resolucao:'4MP (2560x1440)',ir:'30m',lente:'2.8mm',ip:'IP67/IK10',ia:'Sim'},ref:'VIP 1430 D G2, VIP 3430 D IA'},
    {key:'cam_ip_dome_vf_2mp',name:'Câmera IP Dome VF 2MP',icon:'cam_dome',poe:true,poeW:12,ports:1,nvrCh:1,props:{resolucao:'2MP (1080p)',ir:'40m',lente:'2.7-13.5mm MFZ',ip:'IP67',ia:'Sim'},ref:'VIP 3240 D Z G3'},
    {key:'cam_ip_dome_vf_4mp',name:'Câmera IP Dome VF 4MP',icon:'cam_dome',poe:true,poeW:12,ports:1,nvrCh:1,props:{resolucao:'4MP',ir:'50m',lente:'2.7-13.5mm MFZ',ip:'IP67',ia:'Sim'},ref:'VIP 3240 D IA G2, VIP 5440 D Z IA'},
    {key:'cam_ip_bullet_vf_2mp',name:'Câmera IP Bullet VF 2MP',icon:'cam_bullet',poe:true,poeW:12,ports:1,nvrCh:1,props:{resolucao:'2MP (1080p)',ir:'60m',lente:'2.7-13.5mm MFZ',ip:'IP67',ia:'Sim'},ref:'VIP 3250 AL IA'},
    {key:'cam_ip_bullet_vf_4mp',name:'Câmera IP Bullet VF 4MP',icon:'cam_bullet',poe:true,poeW:15,ports:1,nvrCh:1,props:{resolucao:'4MP',ir:'60m',lente:'2.7-13.5mm MFZ',ip:'IP67',ia:'Sim'},ref:'VIP 5460 Z IA'},
    {key:'cam_ip_speed_2mp',name:'Câmera IP Speed Dome 2MP',icon:'cam_ptz',poe:true,poeW:25,ports:1,nvrCh:1,props:{resolucao:'2MP (1080p)',zoom:'16x',ir:'100m',ip:'IP66',ptz:'Pan 360°/Tilt 90°'},ref:'VIP 3216 SD IR IA'},
    {key:'cam_ip_speed_4mp',name:'Câmera IP Speed Dome 4MP',icon:'cam_ptz',poe:true,poeW:25,ports:1,nvrCh:1,props:{resolucao:'4MP',zoom:'25x',ir:'150m',ip:'IP66',ia:'Sim'},ref:'VIP 3225 SD IR IA G2, VIP 5232 SD IA G2'},
    {key:'cam_ip_mini_2mp',name:'Câmera IP Mini 2MP',icon:'cam_dome',poe:true,poeW:6,ports:1,nvrCh:1,props:{resolucao:'2MP (1080p)',ir:'10m',lente:'2.8mm',ip:'IP67',compacta:'Sim'},ref:'VIP 1300 MINI SD'},
    {key:'cam_ip_fisheye_5mp',name:'Câmera IP Fisheye 5MP',icon:'cam_fisheye',poe:true,poeW:12,ports:1,nvrCh:1,props:{resolucao:'5MP',fov:'360°',ir:'15m',ip:'IP67',ia:'Sim'},ref:'VIP 5500 F IA'},
    {key:'cam_ip_wifi_bullet_2mp',name:'Câmera IP Wi-Fi Bullet 2MP',icon:'cam_wifi',poe:false,ports:0,nvrCh:1,ampDC:0.5,props:{resolucao:'2MP (1080p)',ir:'30m',lente:'3.6mm',wifi:'2.4GHz',ip:'IP67'},ref:'VIPW 1230 B'},
    {key:'cam_ip_wifi_bullet_4mp',name:'Câmera IP Wi-Fi Bullet 4MP',icon:'cam_wifi',poe:false,ports:0,nvrCh:1,ampDC:0.5,props:{resolucao:'4MP',ir:'30m',lente:'2.8mm',wifi:'2.4/5GHz',ip:'IP67'},ref:'VIPW 1430 B'},
    {key:'cam_ip_wifi_dome_2mp',name:'Câmera IP Wi-Fi Dome 2MP',icon:'cam_wifi',poe:false,ports:0,nvrCh:1,ampDC:0.5,props:{resolucao:'2MP (1080p)',ir:'30m',lente:'2.8mm',wifi:'2.4GHz',ip:'IP67'},ref:'VIPW 1230 D'},
    {key:'cam_ip_wifi_dome_4mp',name:'Câmera IP Wi-Fi Dome 4MP',icon:'cam_wifi',poe:false,ports:0,nvrCh:1,ampDC:0.5,props:{resolucao:'4MP',ir:'30m',lente:'2.8mm',wifi:'2.4/5GHz',ip:'IP67'},ref:'VIPW 1430 D'},
  ]},
  // ================================================================
  // CFTV IP - GRAVADORES NVR (6 tipos)
  // ================================================================
  {cat:'CFTV IP - NVR',color:'#059669',items:[
    {key:'nvr_4ch',name:'NVR IP 4 Canais',icon:'nvr',poe:false,ports:1,props:{canais:'4 IP',resolMax:'4K (8MP)',hd:'1 SATA (até 10TB)',saida:'1 HDMI + 1 VGA'},ref:'NVD 1404'},
    {key:'nvr_8ch',name:'NVR IP 8 Canais',icon:'nvr',poe:false,ports:1,props:{canais:'8 IP',resolMax:'4K (8MP)',hd:'1 SATA (até 10TB)',saida:'1 HDMI + 1 VGA'},ref:'NVD 1408'},
    {key:'nvr_8ch_poe',name:'NVR IP 8 Canais PoE',icon:'nvr',poe:false,ports:1,props:{canais:'8 IP',resolMax:'4K',hd:'1 SATA',poePorts:'8 PoE'},ref:'NVD 1408-P, NVD 3308-P'},
    {key:'nvr_16ch',name:'NVR IP 16 Canais',icon:'nvr',poe:false,ports:1,props:{canais:'16 IP',resolMax:'4K',hd:'2 SATA (até 20TB)',saida:'1 HDMI + 1 VGA'},ref:'NVD 1416, iNVD 3016'},
    {key:'nvr_16ch_poe',name:'NVR IP 16 Canais PoE',icon:'nvr',poe:false,ports:1,props:{canais:'16 IP',resolMax:'4K',hd:'2 SATA',poePorts:'16 PoE'},ref:'NVD 3316-P'},
    {key:'nvr_32ch',name:'NVR IP 32 Canais',icon:'nvr',poe:false,ports:1,props:{canais:'32 IP',resolMax:'4K',hd:'2 SATA',saida:'2 HDMI + 1 VGA',ia:'Sim'},ref:'NVD 1432, iNVD 3032, iNVD 5232'},
  ]},
  // ================================================================
  // CFTV MULTI HD - CÂMERAS (12 tipos)
  // ================================================================
  {cat:'CFTV Multi HD',color:'#d97706',items:[
    {key:'cam_mhd_bullet_1mp',name:'Câmera Multi HD Bullet 1MP',icon:'cam_bullet',poe:false,ports:0,nvrCh:1,ampDC:0.4,props:{resolucao:'1MP (720p)',ir:'20m',lente:'3.6mm',tech:'HDCVI/AHD/TVI/CVBS'},ref:'VHD 1120 B Full Color'},
    {key:'cam_mhd_bullet_2mp',name:'Câmera Multi HD Bullet 2MP',icon:'cam_bullet',poe:false,ports:0,nvrCh:1,ampDC:0.4,props:{resolucao:'2MP (1080p)',ir:'30m',lente:'3.6mm',tech:'Multi HD'},ref:'VHD 1220 B G8, VHD 1230 B G7, VHD 3230 B G7'},
    {key:'cam_mhd_bullet_2mp_fc',name:'Câmera Multi HD Bullet 2MP FC',icon:'cam_bullet',poe:false,ports:0,nvrCh:1,ampDC:0.4,props:{resolucao:'2MP',ir:'20m LED',lente:'2.8mm',visao:'Full Color'},ref:'VHD 1220 B FC G8, VHD 3240 FC G6'},
    {key:'cam_mhd_bullet_3mp',name:'Câmera Multi HD Bullet 3MP',icon:'cam_bullet',poe:false,ports:0,nvrCh:1,ampDC:0.4,props:{resolucao:'3MP',ir:'30m',lente:'2.8mm',tech:'Multi HD'},ref:'VHD 3130 B G7'},
    {key:'cam_mhd_dome_1mp',name:'Câmera Multi HD Dome 1MP',icon:'cam_dome',poe:false,ports:0,nvrCh:1,ampDC:0.3,props:{resolucao:'1MP (720p)',ir:'20m',lente:'2.8mm',tech:'Multi HD'},ref:'VHD 1120 D FC, VHD 1120 D G7'},
    {key:'cam_mhd_dome_2mp',name:'Câmera Multi HD Dome 2MP',icon:'cam_dome',poe:false,ports:0,nvrCh:1,ampDC:0.3,props:{resolucao:'2MP (1080p)',ir:'30m',lente:'2.8mm',tech:'Multi HD'},ref:'VHD 1220 D G7, VHD 3230 D G7'},
    {key:'cam_mhd_dome_2mp_fc',name:'Câmera Multi HD Dome 2MP FC',icon:'cam_dome',poe:false,ports:0,nvrCh:1,ampDC:0.3,props:{resolucao:'2MP',ir:'20m LED',visao:'Full Color'},ref:'VHD 1220 D FC G8, VHD 3240 FC G6+'},
    {key:'cam_mhd_mini_2mp',name:'Câmera Multi HD Mini Dome 2MP',icon:'cam_dome',poe:false,ports:0,nvrCh:1,ampDC:0.3,props:{resolucao:'2MP',ir:'20m',compacta:'Sim'},ref:'VHD 3200 MINI SD, VHD 3220 MINI D'},
    {key:'cam_mhd_vf_2mp',name:'Câmera Multi HD VF 2MP',icon:'cam_dome',poe:false,ports:0,nvrCh:1,ampDC:0.4,props:{resolucao:'2MP',ir:'40m',lente:'2.7-12mm'},ref:'VHD 3250 VF G7'},
    {key:'cam_mhd_speed_2mp',name:'Câmera Multi HD Speed Dome 2MP',icon:'cam_ptz',poe:false,ports:0,nvrCh:1,ampDC:1.5,props:{resolucao:'2MP',zoom:'20x',ir:'100m'},ref:'VHD 5220 SD, VHD 5225 SD IR'},
    {key:'cam_mhd_bullet_4k',name:'Câmera Multi HD Bullet 4K',icon:'cam_bullet',poe:false,ports:0,nvrCh:1,ampDC:0.5,props:{resolucao:'8MP (4K)',ir:'30m',lente:'2.8mm'},ref:'VHD 5830 B 4K'},
    {key:'cam_mhd_dome_4k',name:'Câmera Multi HD Dome 4K',icon:'cam_dome',poe:false,ports:0,nvrCh:1,ampDC:0.5,props:{resolucao:'8MP (4K)',ir:'30m',lente:'2.8mm'},ref:'VHD 5820 D 4K'},
  ]},
  // ================================================================
  // CFTV MULTI HD - DVR (4 tipos)
  // ================================================================
  {cat:'CFTV Multi HD - DVR',color:'#b45309',items:[
    {key:'dvr_4ch',name:'DVR Multi HD 4 Canais',icon:'dvr',poe:false,ports:1,props:{canais:'4 BNC + 2 IP',resolMax:'5MP',hd:'1 SATA',tech:'HDCVI/AHD/TVI/CVBS/IP'},ref:'MHDX 1104-C, MHDX 1304, MHDX 3104-C'},
    {key:'dvr_8ch',name:'DVR Multi HD 8 Canais',icon:'dvr',poe:false,ports:1,props:{canais:'8 BNC + 4 IP',resolMax:'5MP',hd:'1 SATA'},ref:'MHDX 1108-C, MHDX 1308, MHDX 3108-C, iMHDX 3108'},
    {key:'dvr_16ch',name:'DVR Multi HD 16 Canais',icon:'dvr',poe:false,ports:1,props:{canais:'16 BNC + 8 IP',resolMax:'5MP',hd:'2 SATA'},ref:'MHDX 1116-C, MHDX 1316, MHDX 3116-C, iMHDX 3116'},
    {key:'dvr_32ch',name:'DVR Multi HD 32 Canais',icon:'dvr',poe:false,ports:1,props:{canais:'32 BNC + 16 IP',resolMax:'5MP',hd:'2 SATA',ia:'Sim'},ref:'iMHDX 3132, iMHDX 5108, iMHDX 5116'},
  ]},
  // ================================================================
  // CFTV HDCVI (6 tipos)
  // ================================================================
  {cat:'CFTV HDCVI',color:'#92400e',items:[
    {key:'cam_hdcvi_bullet_1mp',name:'Câmera HDCVI Bullet 1MP',icon:'cam_bullet',poe:false,ports:0,nvrCh:1,ampDC:0.3,props:{resolucao:'1MP (720p)',ir:'20m',tech:'HDCVI'},ref:'VHL 1120 B, VHL 1120 B G2'},
    {key:'cam_hdcvi_bullet_2mp',name:'Câmera HDCVI Bullet 2MP',icon:'cam_bullet',poe:false,ports:0,nvrCh:1,ampDC:0.3,props:{resolucao:'2MP',ir:'30m',tech:'HDCVI'},ref:'VHL 1220 B G2, VHD 3520 B'},
    {key:'cam_hdcvi_dome_1mp',name:'Câmera HDCVI Dome 1MP',icon:'cam_dome',poe:false,ports:0,nvrCh:1,ampDC:0.3,props:{resolucao:'1MP (720p)',ir:'20m',tech:'HDCVI'},ref:'VHL 1120 D, VHL 1120 D G2'},
    {key:'cam_hdcvi_dome_2mp',name:'Câmera HDCVI Dome 2MP',icon:'cam_dome',poe:false,ports:0,nvrCh:1,ampDC:0.3,props:{resolucao:'2MP',ir:'30m',tech:'HDCVI'},ref:'VHL 1220 D G2'},
    {key:'cam_hdcvi_dome_5mp',name:'Câmera HDCVI Dome 5MP',icon:'cam_dome',poe:false,ports:0,nvrCh:1,ampDC:0.4,props:{resolucao:'5MP',ir:'20m',tech:'HDCVI'},ref:'VHD 1520 D'},
    {key:'cam_hdcvi_bullet_3mp',name:'Câmera HDCVI Bullet 3MP',icon:'cam_bullet',poe:false,ports:0,nvrCh:1,ampDC:0.3,props:{resolucao:'3MP',ir:'30m',tech:'HDCVI'},ref:'VHD 3530 B'},
  ]},
  // ================================================================
  // SOLUÇÃO VEICULAR (3 tipos)
  // ================================================================
  {cat:'Solução Veicular',color:'#78350f',items:[
    {key:'gravador_veicular',name:'Gravador Veicular (MVD)',icon:'nvr',poe:false,ports:1,props:{canais:'4-8',armazenamento:'SD/SSD',gps:'Sim','4g':'Sim'},ref:'MVD 1104, MVD 1108'},
    {key:'cam_veicular_int',name:'Câmera Veicular Interna',icon:'cam_dome',poe:false,ports:0,nvrCh:1,ampDC:0.3,props:{resolucao:'2MP',ir:'10m',audio:'Sim'},ref:'DC 3102'},
    {key:'cam_veicular_ext',name:'Câmera Veicular Externa',icon:'cam_bullet',poe:false,ports:0,nvrCh:1,ampDC:0.3,props:{resolucao:'2MP',ir:'20m',ip:'IP67'},ref:'DC 3101'},
  ]},
  // ================================================================
  // CONTROLE DE ACESSO (9 tipos)
  // ================================================================
  {cat:'Controle de Acesso',color:'#8b5cf6',items:[
    {key:'leitor_facial',name:'Leitor Facial',icon:'leitor_facial',poe:false,ports:1,ampDC:0.5,props:{faces:'50.000',tela:'4.3"',temp:'Sim',ip:'IP65'},ref:'SS 3540 MF FACE, SS 3530 MF FACE'},
    {key:'leitor_biometrico',name:'Leitor Biométrico',icon:'leitor_facial',poe:false,ports:1,ampDC:0.3,props:{digitais:'10.000',protocolo:'Wiegand/RS485',ip:'IP65'},ref:'SS 411 E, SS 420 MF'},
    {key:'leitor_rfid',name:'Leitor RFID/Proximidade',icon:'leitor_tag',poe:false,ports:0,ampDC:0.15,props:{frequencia:'125kHz/13.56MHz',protocolo:'Wiegand 26/34'},ref:'LE 130 MF, LE 230 MF'},
    {key:'controladora',name:'Controladora de Acesso',icon:'controladora',poe:false,ports:1,props:{portas:'4',wiegand:'Sim',relay:'4',rede:'TCP/IP'},ref:'CT 500 4PB, CT 500 2PB'},
    {key:'fechadura',name:'Fechadura Eletromagnética',icon:'fechadura',poe:false,ampDC:0.3,ports:0,props:{forca:'280kg',tipo:'Fail-safe'},ref:'FE 20150, FE 20300'},
    {key:'eletroima',name:'Eletroímã',icon:'fechadura',poe:false,ampDC:0.5,ports:0,props:{forca:'150-300kg',tipo:'Fail-safe'},ref:'EL 150, EL 300'},
    {key:'motor',name:'Motor Portão/Acesso',icon:'motor',poe:false,ports:0,props:{tipo:'Deslizante',peso:'até 600kg'},ref:'DR 400, DR 600'},
    {key:'cam_lpr',name:'Câmera LPR',icon:'cam_lpr',poe:true,poeW:15,ports:1,nvrCh:1,props:{resolucao:'2MP',ir:'12m',lente:'2.8-12mm',funcao:'Reconhecimento Placa'},ref:'VIP 3240 D IA G2 (OCR)'},
    {key:'leitor_tag',name:'Leitor Tag UHF',icon:'leitor_tag',poe:false,ports:0,ampDC:0.3,props:{frequencia:'915MHz',alcance:'até 8m',protocolo:'Wiegand/RS485'},ref:'LE 170, LR 100 UHF'},
  ]},
  // ================================================================
  // INTRUSÃO - CENTRAIS (5 tipos)
  // ================================================================
  {cat:'Intrusão - Centrais',color:'#ef4444',items:[
    {key:'alarme_nao_monit',name:'Central Alarme Não Monitorada',icon:'alarme_central',poe:false,ports:1,props:{zonas:'24 (8+16 sem fio)',com:'Ethernet/Wi-Fi',tipo:'Não monitorada'},ref:'ANM 24 NET G2'},
    {key:'alarme_monit_basica',name:'Central Alarme Monitorada Básica',icon:'alarme_central',poe:false,ports:1,props:{zonas:'até 36',particoes:'2',com:'TCP/IP + GSM'},ref:'AMT 1000 SMART'},
    {key:'alarme_monit_inter',name:'Central Alarme Monitorada Intermediária',icon:'alarme_central',poe:false,ports:1,props:{zonas:'até 48',particoes:'4',com:'TCP/IP + GPRS'},ref:'AMT 2018 E, AMT 2018 EG, AMT 2018 E SMART'},
    {key:'alarme_monit_avanc',name:'Central Alarme Monitorada Avançada',icon:'alarme_central',poe:false,ports:1,props:{zonas:'até 64',particoes:'4',com:'TCP/IP + GPRS + Wi-Fi'},ref:'AMT 4010 SMART'},
    {key:'alarme_sem_fio',name:'Central Alarme Sem Fio (Sist. 8000)',icon:'alarme_central',poe:false,ports:1,props:{zonas:'até 64 sem fio',com:'TCP/IP + 4G + Wi-Fi',tipo:'100% sem fio'},ref:'AMT 8000, AMT 8000 PRO, AMT 8000 LITE'},
  ]},
  // ================================================================
  // INTRUSÃO - SENSORES PIR (11 tipos)
  // ================================================================
  {cat:'Intrusão - Sensores PIR',color:'#dc2626',items:[
    {key:'pir_int_basico',name:'Sensor PIR Interno Básico',icon:'sensor_presenca',poe:false,ports:0,props:{alcance:'12m',angulo:'90°',pet:'Não'},ref:'IVP 2000 SF'},
    {key:'pir_int_pet',name:'Sensor PIR Interno Pet',icon:'sensor_presenca',poe:false,ports:0,props:{alcance:'12m',angulo:'90°',pet:'Sim (20kg)'},ref:'IVP 1000 PET, IVP 1000 PET SF, IVP 3000 PET'},
    {key:'pir_int_pet_smart',name:'Sensor PIR Interno Pet Smart',icon:'sensor_presenca',poe:false,ports:0,props:{alcance:'12m',pet:'Sim',sem_fio:'433MHz'},ref:'IVP 1000 PET SMART, IVP 4101 PET SMART'},
    {key:'pir_teto',name:'Sensor PIR de Teto',icon:'sensor_presenca',poe:false,ports:0,props:{alcance:'360° / 6m raio',instalacao:'Teto 2.4-3.6m'},ref:'IVP 3011 TETO'},
    {key:'pir_cortina',name:'Sensor PIR Cortina',icon:'sensor_presenca',poe:false,ports:0,props:{alcance:'15m',angulo:'10°',instalacao:'Abertura'},ref:'IVP 3011 CORTINA'},
    {key:'pir_dupla_tech',name:'Sensor PIR Dupla Tecnologia (MW)',icon:'sensor_presenca',poe:false,ports:0,props:{alcance:'15m',tecnologia:'PIR + Microondas',pet:'Sim'},ref:'IVP 3000 MW EX, IVP 5311 MW PET, IVP 5002 PET'},
    {key:'pir_externo',name:'Sensor PIR Externo',icon:'sensor_presenca',poe:false,ports:0,props:{alcance:'15m',ip:'IP55',instalacao:'Externo'},ref:'IVP 7000 EX, IVP 7000 SMART EX'},
    {key:'pir_ext_dupla',name:'Sensor PIR Externo Dupla Tecnologia',icon:'sensor_presenca',poe:false,ports:0,props:{alcance:'15m',ip:'IP55',tecnologia:'PIR + MW'},ref:'IVP 7000 MW EX, IVP 7001 MW PET'},
    {key:'pir_longa_dist',name:'Sensor PIR Longa Distância',icon:'sensor_presenca',poe:false,ports:0,props:{alcance:'30m+',tipo:'Cortina longa'},ref:'IVP 5000 LD, IVP 5000 SMART LD'},
    {key:'pir_ld_dupla',name:'Sensor PIR LD Dupla Tecnologia',icon:'sensor_presenca',poe:false,ports:0,props:{alcance:'30m+',tecnologia:'PIR + MW'},ref:'IVP 5000 MW LD, IVP 7000 MW MASK LD'},
    {key:'pir_alta_perf',name:'Sensor PIR Alta Performance',icon:'sensor_presenca',poe:false,ports:0,props:{alcance:'18m',angulo:'110°',tecnologia:'PIR + MW',antimasking:'Sim'},ref:'IVP 9000 MW, IVP 9000 MW MASK'},
  ]},
  // ================================================================
  // INTRUSÃO - BARREIRAS (5 tipos)
  // ================================================================
  {cat:'Intrusão - Barreiras',color:'#b91c1c',items:[
    {key:'barreira_digital',name:'Barreira IR Digital',icon:'sensor_barreira',poe:false,ports:0,props:{alcance:'até 150m',feixes:'1',ip:'IP66'},ref:'IVA 5015 DIGITAL'},
    {key:'barreira_ativa',name:'Barreira IR Ativa',icon:'sensor_barreira',poe:false,ports:0,props:{alcance:'até 100m',feixes:'2',ip:'IP66'},ref:'IVA 3070 X, IVA 3110 X'},
    {key:'barreira_at',name:'Barreira IR Anti-Tamper',icon:'sensor_barreira',poe:false,ports:0,props:{alcance:'até 80m',feixes:'2',antitamper:'Sim'},ref:'IVA 5040 AT, IVA 5080 AT'},
    {key:'barreira_multi',name:'Barreira IR Multi-Feixe',icon:'sensor_barreira',poe:false,ports:0,props:{alcance:'até 100m',feixes:'4/6/8'},ref:'IVA 7100 DUAL, QUAD, HEXA, OCTA'},
    {key:'barreira_tripla',name:'Barreira IR Tripla Tecnologia',icon:'sensor_barreira',poe:false,ports:0,props:{alcance:'até 100m',tecnologia:'IR + MW + Lógica'},ref:'IVA 9100 TRI'},
  ]},
  // ================================================================
  // INTRUSÃO - ELETRIFICADORES (4 tipos)
  // ================================================================
  {cat:'Intrusão - Eletrificadores',color:'#991b1b',items:[
    {key:'eletri_basico',name:'Eletrificador Básico',icon:'eletrificador',poe:false,ports:0,props:{tensao:'8.000V',setores:'1',alarme:'Sirene + PGM'},ref:'ELC 5001'},
    {key:'eletri_net',name:'Eletrificador com Monitoramento',icon:'eletrificador',poe:false,ports:1,props:{tensao:'12.000V',setores:'2',com:'TCP/IP'},ref:'ELC 6012, ELC 6012 NET'},
    {key:'eletri_high',name:'Eletrificador High Power',icon:'eletrificador',poe:false,ports:0,props:{tensao:'18.000V',setores:'4',potencia:'Alta'},ref:'HIGH POWER ELC 5002, ELC 5003'},
    {key:'eletri_extensor',name:'Extensor de Cerca Elétrica',icon:'eletrificador',poe:false,ports:0,props:{funcao:'Amplificador de sinal',bus:'Sim'},ref:'XEL 5001'},
  ]},
  // ================================================================
  // INTRUSÃO - PERIFÉRICOS (10 tipos)
  // ================================================================
  {cat:'Intrusão - Periféricos',color:'#f87171',items:[
    {key:'teclado_led',name:'Teclado LED para Central',icon:'teclado_alarme',poe:false,ports:0,ampDC:0.1,props:{tipo:'LED',bus:'Sim'},ref:'XAT 3000 LED'},
    {key:'teclado_lcd',name:'Teclado LCD para Central',icon:'teclado_alarme',poe:false,ports:0,ampDC:0.1,props:{tipo:'LCD 16x2',programacao:'Sim'},ref:'XAT 4000 LCD'},
    {key:'comunicador_eth',name:'Comunicador Ethernet',icon:'comunicador',poe:false,ports:1,props:{protocolo:'Contact ID via TCP/IP'},ref:'XEG 4000 SMART'},
    {key:'comunicador_gprs',name:'Comunicador GPRS/4G',icon:'comunicador',poe:false,ports:0,props:{protocolo:'Contact ID via GPRS/4G'},ref:'XE 4000 SMART'},
    {key:'receptor_rf',name:'Receptor RF',icon:'receptor_rf',poe:false,ports:0,ampDC:0.1,props:{frequencia:'433MHz',canais:'até 128'},ref:'XAR 3060 UN, XAR 4000 SMART'},
    {key:'controle_remoto',name:'Controle Remoto',icon:'controle_remoto',poe:false,ports:0,props:{frequencia:'433MHz',botoes:'4',alcance:'50m'},ref:'XAC 4000 SMART, XAC 2000'},
    {key:'sirene_int',name:'Sirene Interna',icon:'sirene',poe:false,ports:0,ampDC:0.3,props:{db:'85-100dB',flash:'Não'},ref:'SIR 1000'},
    {key:'sirene_ext',name:'Sirene Externa',icon:'sirene',poe:false,ports:0,ampDC:0.5,props:{db:'110-120dB',flash:'Sim LED',ip:'IP54'},ref:'SIR 2000, SIR 3000'},
    {key:'sensor_abertura',name:'Sensor de Abertura Magnético',icon:'sensor_abertura',poe:false,ports:0,props:{tipo:'Magnético NF',gap:'25mm'},ref:'XAS 4010 SMART, XAS 1001, XAS 8000'},
    {key:'modulo_pgm',name:'Módulo PGM / Expansão',icon:'modulo_incendio',poe:false,ports:0,props:{saidas:'Relé NA/NF',funcao:'Automação/expansão'},ref:'XEP 4004 SMART'},
  ]},
  // ================================================================
  // SISTEMA 8000 SEM FIO (7 tipos)
  // ================================================================
  {cat:'Sistema 8000 Sem Fio',color:'#fca5a5',items:[
    {key:'s8k_central',name:'Central Sem Fio Sistema 8000',icon:'alarme_central',poe:false,ports:1,props:{zonas:'até 64 sem fio',com:'TCP/IP + 4G + Wi-Fi',painel:'Touch'},ref:'AMT 8000, AMT 8000 PRO'},
    {key:'s8k_abertura',name:'Sensor Abertura SF 8000',icon:'sensor_abertura',poe:false,ports:0,props:{frequencia:'868MHz',bateria:'CR123A (3 anos)'},ref:'XAS 8000'},
    {key:'s8k_pir',name:'Sensor PIR SF 8000',icon:'sensor_presenca',poe:false,ports:0,props:{alcance:'12m',pet:'Sim',frequencia:'868MHz'},ref:'IVP 8000 PET'},
    {key:'s8k_pir_ext',name:'Sensor PIR Ext SF 8000',icon:'sensor_presenca',poe:false,ports:0,props:{alcance:'15m',ip:'IP55',frequencia:'868MHz'},ref:'IVP 8000 EX'},
    {key:'s8k_barreira',name:'Barreira SF 8000',icon:'sensor_barreira',poe:false,ports:0,props:{alcance:'até 40m',feixes:'2',frequencia:'868MHz'},ref:'IVA 8040 AT'},
    {key:'s8k_sirene',name:'Sirene SF 8000',icon:'sirene',poe:false,ports:0,props:{db:'95dB',flash:'Sim',frequencia:'868MHz'},ref:'XSS 8000'},
    {key:'s8k_teclado',name:'Teclado SF 8000',icon:'teclado_alarme',poe:false,ports:0,props:{display:'LCD Touch',frequencia:'868MHz'},ref:'XAT 8000'},
  ]},
  // ================================================================
  // AUTOMATIZADORES (7 tipos)
  // ================================================================
  {cat:'Automatizadores',color:'#ea580c',items:[
    {key:'auto_desl_leve',name:'Automatizador Deslizante Leve',icon:'motor',poe:false,ports:0,props:{capacidade:'até 400kg',motor:'DC',receptor:'433MHz'},ref:'DR 300 NY, DR 350 FAST, DR 400 NY'},
    {key:'auto_desl_pesado',name:'Automatizador Deslizante Pesado',icon:'motor',poe:false,ports:0,props:{capacidade:'até 800kg',motor:'DC'},ref:'DR 400 AL, DR 600, DC 800 FAST'},
    {key:'auto_basc_leve',name:'Automatizador Basculante Leve',icon:'motor',poe:false,ports:0,props:{capacidade:'até 300kg',tipo:'Basculante'},ref:'BR 300, BR 300 FAST'},
    {key:'auto_basc_pesado',name:'Automatizador Basculante Pesado',icon:'motor',poe:false,ports:0,props:{capacidade:'até 500kg',tipo:'Basculante'},ref:'BR 400, BR 400 FAST, BC 500, BC 500 FAST'},
    {key:'cancela_veicular',name:'Cancela Veicular',icon:'cancela',poe:false,ports:0,props:{braco:'até 3m',velocidade:'1.5s'},ref:'AF 3000'},
    {key:'auto_pivotante',name:'Automatizador Pivotante',icon:'motor',poe:false,ports:0,props:{capacidade:'até 200kg/folha',tipo:'Pivotante'},ref:'PP 200'},
    {key:'auto_porta_desl',name:'Automatizador Porta Deslizante',icon:'motor',poe:false,ports:0,props:{capacidade:'até 300kg',tipo:'Porta deslizante'},ref:'PD 300'},
  ]},
  // ================================================================
  // INCÊNDIO CONVENCIONAL (6 tipos)
  // ================================================================
  {cat:'Incêndio Convencional',color:'#7f1d1d',items:[
    {key:'fogo_central_conv',name:'Central Incêndio Convencional',icon:'alarme_central',poe:false,ports:1,props:{lacos:'6/12/24',norma:'NBR 17240',bateria:'24V'},ref:'CIC 06L, CIC 12L, CIC 24L'},
    {key:'fogo_det_fumaca_conv',name:'Detector Fumaça Óptico Conv.',icon:'detector_fumaca',poe:false,ports:0,props:{tipo:'Óptico pontual',norma:'EN 54-7'},ref:'DFC 421 UN'},
    {key:'fogo_det_temp_conv',name:'Detector Temperatura Conv.',icon:'detector_fumaca',poe:false,ports:0,props:{tipo:'Termovelocimétrico',ativacao:'57°C'},ref:'DTC 421 UN'},
    {key:'fogo_acionador_conv',name:'Acionador Manual Conv.',icon:'acionador_manual',poe:false,ports:0,props:{tipo:'Rearmável',norma:'EN 54-11'},ref:'AMC 421, AMC 422, AMC 466'},
    {key:'fogo_sinalizador_conv',name:'Sinalizador Audiovisual Conv.',icon:'sirene',poe:false,ports:0,props:{db:'85dB+',flash:'LED Xenon'},ref:'SAV 420C'},
    {key:'fogo_det_linear',name:'Detector Linear de Fumaça',icon:'sensor_barreira',poe:false,ports:0,props:{alcance:'até 100m',tipo:'Reflexivo',norma:'EN 54-12'},ref:'DFL 3100'},
  ]},
  // ================================================================
  // INCÊNDIO ENDEREÇÁVEL (9 tipos)
  // ================================================================
  {cat:'Incêndio Endereçável',color:'#881337',items:[
    {key:'fogo_central_end',name:'Central Incêndio Endereçável',icon:'alarme_central',poe:false,ports:1,props:{lacos:'1-4',dispositivos:'até 250/laço',norma:'NBR 17240 / EN 54'},ref:'CIE 1060, CIE 1125, CIE 1250, CIE 2500'},
    {key:'fogo_det_fumaca_end',name:'Detector Fumaça Endereçável',icon:'detector_fumaca',poe:false,ports:0,props:{tipo:'Óptico endereçável',norma:'EN 54-7'},ref:'DFE 521, DFE 522L'},
    {key:'fogo_det_temp_end',name:'Detector Temp. Endereçável',icon:'detector_fumaca',poe:false,ports:0,props:{tipo:'Termovelocimétrico end.',norma:'EN 54-5'},ref:'DTE 521, DTE 522L'},
    {key:'fogo_acionador_end',name:'Acionador Manual Endereçável',icon:'acionador_manual',poe:false,ports:0,props:{tipo:'Rearmável endereçável',norma:'EN 54-11'},ref:'AME 521, AME 522, AME 566'},
    {key:'fogo_mod_isolador',name:'Módulo Isolador de Laço',icon:'modulo_incendio',poe:false,ports:0,props:{funcao:'Isolar curto no laço SLC'},ref:'IDL 521'},
    {key:'fogo_mod_entrada',name:'Módulo de Entrada (Monitor)',icon:'modulo_incendio',poe:false,ports:0,props:{funcao:'Monitorar zona conv.',entradas:'1-2'},ref:'MDI 521'},
    {key:'fogo_mod_es',name:'Módulo de Entrada/Saída',icon:'modulo_incendio',poe:false,ports:0,props:{funcao:'Monitor + Acionamento',saidas:'1 relay'},ref:'MIO 521'},
    {key:'fogo_mod_zona',name:'Módulo de Zona',icon:'modulo_incendio',poe:false,ports:0,props:{funcao:'Expandir zonas conv.',zonas:'2'},ref:'MDZ 521'},
    {key:'fogo_gateway',name:'Gateway Comunicação Incêndio',icon:'controladora',poe:false,ports:1,props:{funcao:'RS-485 → TCP/IP'},ref:'GW 521'},
  ]},
  // ================================================================
  // INCÊNDIO ESPECIAIS (5 tipos)
  // ================================================================
  {cat:'Incêndio Especiais',color:'#be123c',items:[
    {key:'fogo_det_autonomo',name:'Detector Fumaça Autônomo',icon:'detector_fumaca',poe:false,ports:0,props:{tipo:'Óptico autônomo',alimentacao:'Bateria',sirene:'85dB integrada'},ref:'DFA 623'},
    {key:'fogo_det_gas',name:'Detector de Gás Autônomo',icon:'detector_fumaca',poe:false,ports:0,props:{gas:'GLP/Gás Natural',alimentacao:'220V AC'},ref:'DGA 623'},
    {key:'fogo_det_chama_ir',name:'Detector de Chama IR',icon:'detector_fumaca',poe:false,ports:0,props:{tipo:'Infravermelho',alcance:'até 10m',ip:'IP55'},ref:'DCH 7110'},
    {key:'fogo_det_chama_uvir',name:'Detector de Chama UV/IR',icon:'detector_fumaca',poe:false,ports:0,props:{tipo:'UV + IR',alcance:'até 25m',ip:'IP55'},ref:'DCH 7210'},
    {key:'fogo_aspiracao',name:'Sistema de Aspiração',icon:'modulo_incendio',poe:false,ports:1,props:{tipo:'ASD',tubulacao:'até 200m',pontos:'até 120'},ref:'CAS 7100, CAS 7200'},
  ]},
  // ================================================================
  // LINHA MORLEY (2 tipos)
  // ================================================================
  {cat:'Incêndio Linha Morley',color:'#9f1239',items:[
    {key:'morley_central',name:'Central Morley Analógica',icon:'alarme_central',poe:false,ports:1,props:{lacos:'2-8',norma:'EN 54-2/4',protocolo:'Morley-IAS'},ref:'MA 2000, MA 8000'},
    {key:'morley_detector',name:'Detector Morley Multi-Sensor',icon:'detector_fumaca',poe:false,ports:0,props:{tipo:'Multi-sensor',norma:'EN 54-5/7'},ref:'Detectores Morley EN54'},
  ]},
  // ================================================================
  // ILUMINAÇÃO EMERGÊNCIA (4 tipos)
  // ================================================================
  {cat:'Iluminação Emergência',color:'#e11d48',items:[
    {key:'emerg_bloco',name:'Bloco Autônomo LED',icon:'luminaria_emerg',poe:false,ports:0,props:{lumens:'400-3000',autonomia:'3h',norma:'NBR 10898'},ref:'BLA 400, BLA 600, BLA 1202, BLA 2202, BLA 3000'},
    {key:'emerg_luminaria',name:'Luminária de Emergência',icon:'luminaria_emerg',poe:false,ports:0,props:{lumens:'30 LEDs',autonomia:'6h'},ref:'LDE 30L'},
    {key:'emerg_lum_potencia',name:'Luminária Emerg. Alta Potência',icon:'luminaria_emerg',poe:false,ports:0,props:{lumens:'1000-3000',ip:'IP65'},ref:'LEA 31, LEA 150'},
    {key:'emerg_central_psa',name:'Central Iluminação PSA',icon:'modulo_incendio',poe:false,ports:1,props:{circuitos:'8-16',monitoramento:'TCP/IP',norma:'NBR 10898'},ref:'PSA 125, PSA 225'},
  ]},
  // ================================================================
  // REDE / SWITCHES (6 tipos)
  // ================================================================
  {cat:'Rede',color:'#2563eb',items:[
    {key:'sw_poe',name:'Switch PoE Gerenciável',icon:'sw_poe',poe:false,ports:0,props:{portas:'8+2 SFP',poeTotal:'120W',vlan:'Sim'},ref:'SG 1002 MR PoE, SF 910 PAC'},
    {key:'sw_poe_16',name:'Switch PoE 16 Portas',icon:'sw_poe',poe:false,ports:0,props:{portas:'16+2 SFP',poeTotal:'240W',vlan:'Sim'},ref:'SG 1602 MR PoE, SF 1822 PoE'},
    {key:'sw_poe_24',name:'Switch PoE 24 Portas',icon:'sw_poe',poe:false,ports:0,props:{portas:'24+2 SFP',poeTotal:'370W',gerenciavel:'Sim'},ref:'SG 2404 MR PoE'},
    {key:'sw_normal',name:'Switch Não-PoE',icon:'sw_normal',poe:false,ports:0,props:{portas:'8',velocidade:'1Gbps'},ref:'SG 800 Q+, SF 800 Q+'},
    {key:'sw_normal_16',name:'Switch Não-PoE 16 Portas',icon:'sw_normal',poe:false,ports:0,props:{portas:'16',velocidade:'1Gbps'},ref:'SG 1600 Q+'},
    {key:'router',name:'Gateway / Router',icon:'router',poe:false,ports:0,props:{wan:'2',lan:'4',vpn:'Sim',firewall:'Sim'},ref:'RG 1200, SR 1041E'},
  ]},
  // ================================================================
  // WI-FI (6 tipos)
  // ================================================================
  {cat:'Wi-Fi',color:'#3b82f6',items:[
    {key:'wifi_router_5',name:'Roteador Wi-Fi 5 (AC)',icon:'router',poe:false,ports:0,props:{padrao:'Wi-Fi 5 (802.11ac)',velocidade:'1200Mbps'},ref:'W5-1200GS, Twibi Force'},
    {key:'wifi_router_6',name:'Roteador Wi-Fi 6 (AX)',icon:'router',poe:false,ports:0,props:{padrao:'Wi-Fi 6 (802.11ax)',velocidade:'1500Mbps'},ref:'W6-1500, RX 3000'},
    {key:'wifi_mesh',name:'Sistema Mesh Wi-Fi',icon:'ap_wifi',poe:false,ports:0,props:{cobertura:'até 300m²/un.',seamless:'Sim'},ref:'Twibi Force, IH 3000, IH 3001'},
    {key:'wifi_router_5g',name:'Roteador 5G',icon:'router',poe:false,ports:0,props:{padrao:'5G Sub-6GHz',wifi:'Wi-Fi 6'},ref:'GX 1001C, GX 3000'},
    {key:'wifi_ap_interno',name:'Access Point Interno',icon:'ap_wifi',poe:true,poeW:15,ports:0,props:{velocidade:'1200-1800Mbps',gerenciavel:'Sim'},ref:'AP 1250 AC MAX, AP 1350 AC-S, AP 1800 AX'},
    {key:'wifi_ap_externo',name:'Access Point Externo',icon:'ap_wifi',poe:true,poeW:15,ports:0,props:{ip:'IP65',velocidade:'1200Mbps'},ref:'AP 1250 AC Outdoor'},
  ]},
  // ================================================================
  // INFRAESTRUTURA (13 tipos)
  // ================================================================
  {cat:'Infraestrutura',color:'#6b7280',items:[
    {key:'quadro',name:'Quadro Conectividade',icon:'quadro',poe:false,ports:0,isContainer:true,configurable:true,configFields:['vagas'],props:{material:'PVC IP65',trilho:'DIN',vagas:'12-36 módulos'}},
    {key:'rack',name:'Rack',icon:'rack',poe:false,ports:0,isContainer:true,configurable:true,configFields:['alturaU','profundidade','acessorios'],props:{altura:'5U-42U',profundidade:'450-600mm'}},
    {key:'nobreak_ac',name:'Nobreak AC',icon:'nobreak_ac',poe:false,ports:0,configurable:true,configFields:['snmp','tomadas_10a','tomadas_20a','potenciaVA','batExterna'],props:{potencia:'600-3000VA',tipo:'AC Interativo/Senoidal'},ref:'SNB 3000 VA BI, ATTIV SEG BI+'},
    {key:'nobreak_dc',name:'Nobreak DC',icon:'nobreak_dc',poe:false,ports:0,configurable:true,configFields:['correnteSaida','batInterna','batExterna'],props:{potencia:'60-120W',tipo:'DC 12V',saida:'12.8Vcc'},ref:'FON1407, FON1388, FON1358'},
    {key:'bateria_ext',name:'Bateria Externa',icon:'bateria_ext',poe:false,ports:0,configurable:true,configFields:['tensao','capacidade','modelo'],props:{tensao:'12V',tipo:'Estacionária VRLA'},ref:'EB 1245, EB 1236'},
    {key:'modulo_bat',name:'Módulo de Baterias',icon:'modulo_bat',poe:false,ports:0,configurable:true,configFields:['qtdBaterias','tensaoBarramento'],props:{tipo:'Gabinete com baterias'},ref:'MB 0445 48V, MB 0145 12V'},
    {key:'cabo_engate',name:'Cabo Engate Rápido',icon:'cabo_engate',poe:false,ports:0,props:{conector:'SB 50 Anderson Power'}},
    {key:'fonte',name:'Fonte 12V',icon:'fonte',poe:false,ports:0,props:{corrente:'10A',entrada:'90-240Vac'},ref:'EF 1210+, EF 1205'},
    {key:'dio',name:'DIO / Roseta Óptica',icon:'dio',poe:false,ports:0,props:{fibras:'6-12',tipo:'SC/APC'}},
    {key:'borne_sak',name:'Borne SAK',icon:'borne_sak',poe:false,ports:0,props:{tipo:'Trilho DIN',vias:'2-16',uso:'Emenda automação/sinal'}},
    {key:'patch_panel',name:'Patch Panel',icon:'dio',poe:false,ports:0,props:{portas:'24/48',categoria:'CAT6'},ref:'Patch Panel CAT6 24P'},
    {key:'conversor_midia',name:'Conversor de Mídia',icon:'dio',poe:false,ports:0,props:{entrada:'RJ45 Gbps',saida:'SFP/SC'},ref:'KGSD 1120 A, KGSD 1120 B'},
    {key:'dps_rede',name:'DPS / Protetor de Surto',icon:'borne_sak',poe:false,ports:0,props:{tipo:'Proteção rede/energia'},ref:'SPD 204, iSPD 204'},
    {key:'tomada_dupla',name:'Tomada Dupla 10A',icon:'tomada',poe:false,ports:0,props:{tipo:'2P+T 10A',padrao:'NBR 14136',uso:'Alimentação AC equipamentos'}},
    {key:'quadro_eletrico',name:'Quadro Elétrico',icon:'quadro_eletrico',poe:false,ports:0,isContainer:true,configurable:true,configFields:['disjuntores','dps','idr'],props:{tipo:'Quadro de distribuição',padrao:'NBR 5410',protecao:'Disjuntores + IDR + DPS'}},
  ]},
];
