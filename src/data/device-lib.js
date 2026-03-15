// ====================================================================
// DEVICE LIBRARY - Catálogo Genérico Segurança Eletrônica (96 dispositivos)
// Fabricante: Genérico | v3.19.1
// ====================================================================
export const DEVICE_LIB = [
  // ================================================================
  // CFTV IP - CÂMERAS (20 tipos)
  // ================================================================
  {cat:'CFTV IP',color:'#f59e0b',items:[
    {key:'cam_ip_bullet_2mp',name:'Câmera IP Bullet 2MP',subcategory:'Bullet',icon:'cam_bullet',poe:true,poeW:12,ports:1,nvrCh:1,manufacturer:'Genérico',props:{resolucao:'2MP (1080p)',ir:'30m',lente:'3.6mm',ip:'IP67',compressao:'H.265+'},ref:''},
    {key:'cam_ip_bullet_2mp_fc',name:'Câmera IP Bullet 2MP Full Color',subcategory:'Bullet',icon:'cam_bullet',poe:true,poeW:12,ports:1,nvrCh:1,manufacturer:'Genérico',props:{resolucao:'2MP (1080p)',ir:'30m LED',lente:'2.8mm',ip:'IP67',visao:'Full Color'},ref:''},
    {key:'cam_ip_bullet_3mp',name:'Câmera IP Bullet 3MP',subcategory:'Bullet',icon:'cam_bullet',poe:true,poeW:12,ports:1,nvrCh:1,manufacturer:'Genérico',props:{resolucao:'3MP (2304x1296)',ir:'30m',lente:'2.8mm',ip:'IP67',compressao:'H.265+'},ref:''},
    {key:'cam_ip_bullet_4mp',name:'Câmera IP Bullet 4MP',subcategory:'Bullet',icon:'cam_bullet',poe:true,poeW:12,ports:1,nvrCh:1,manufacturer:'Genérico',props:{resolucao:'4MP (2560x1440)',ir:'30m',lente:'2.8mm',ip:'IP67',ia:'Sim'},ref:''},
    {key:'cam_ip_bullet_8mp',name:'Câmera IP Bullet 8MP (4K)',subcategory:'Bullet',icon:'cam_bullet',poe:true,poeW:15,ports:1,nvrCh:1,manufacturer:'Genérico',props:{resolucao:'8MP (3840x2160)',ir:'50m',lente:'2.8mm',ip:'IP67',ia:'Sim'},ref:''},
    {key:'cam_ip_dome_2mp',name:'Câmera IP Dome 2MP',subcategory:'Dome',icon:'cam_dome',poe:true,poeW:12,ports:1,nvrCh:1,manufacturer:'Genérico',props:{resolucao:'2MP (1080p)',ir:'30m',lente:'2.8mm',ip:'IP67',compressao:'H.265+'},ref:''},
    {key:'cam_ip_dome_2mp_fc',name:'Câmera IP Dome 2MP Full Color',subcategory:'Dome',icon:'cam_dome',poe:true,poeW:12,ports:1,nvrCh:1,manufacturer:'Genérico',props:{resolucao:'2MP (1080p)',ir:'30m LED',lente:'2.8mm',ip:'IP67',visao:'Full Color'},ref:''},
    {key:'cam_ip_dome_4mp',name:'Câmera IP Dome 4MP',subcategory:'Dome',icon:'cam_dome',poe:true,poeW:12,ports:1,nvrCh:1,manufacturer:'Genérico',props:{resolucao:'4MP (2560x1440)',ir:'30m',lente:'2.8mm',ip:'IP67/IK10',ia:'Sim'},ref:''},
    {key:'cam_ip_dome_vf_2mp',name:'Câmera IP Dome VF 2MP',subcategory:'Dome VF',icon:'cam_dome',poe:true,poeW:12,ports:1,nvrCh:1,manufacturer:'Genérico',props:{resolucao:'2MP (1080p)',ir:'40m',lente:'2.7-13.5mm MFZ',ip:'IP67',ia:'Sim'},ref:''},
    {key:'cam_ip_dome_vf_4mp',name:'Câmera IP Dome VF 4MP',subcategory:'Dome VF',icon:'cam_dome',poe:true,poeW:12,ports:1,nvrCh:1,manufacturer:'Genérico',props:{resolucao:'4MP',ir:'50m',lente:'2.7-13.5mm MFZ',ip:'IP67',ia:'Sim'},ref:''},
    {key:'cam_ip_bullet_vf_2mp',name:'Câmera IP Bullet VF 2MP',subcategory:'Bullet VF',icon:'cam_bullet',poe:true,poeW:12,ports:1,nvrCh:1,manufacturer:'Genérico',props:{resolucao:'2MP (1080p)',ir:'60m',lente:'2.7-13.5mm MFZ',ip:'IP67',ia:'Sim'},ref:''},
    {key:'cam_ip_bullet_vf_4mp',name:'Câmera IP Bullet VF 4MP',subcategory:'Bullet VF',icon:'cam_bullet',poe:true,poeW:15,ports:1,nvrCh:1,manufacturer:'Genérico',props:{resolucao:'4MP',ir:'60m',lente:'2.7-13.5mm MFZ',ip:'IP67',ia:'Sim'},ref:''},
    {key:'cam_ip_speed_2mp',name:'Câmera IP Speed Dome 2MP',subcategory:'Speed Dome',icon:'cam_ptz',poe:true,poeW:25,ports:1,nvrCh:1,manufacturer:'Genérico',props:{resolucao:'2MP (1080p)',zoom:'16x',ir:'100m',ip:'IP66',ptz:'Pan 360°/Tilt 90°'},ref:''},
    {key:'cam_ip_speed_4mp',name:'Câmera IP Speed Dome 4MP',subcategory:'Speed Dome',icon:'cam_ptz',poe:true,poeW:25,ports:1,nvrCh:1,manufacturer:'Genérico',props:{resolucao:'4MP',zoom:'25x',ir:'150m',ip:'IP66',ia:'Sim'},ref:''},
    {key:'cam_ip_mini_2mp',name:'Câmera IP Mini 2MP',subcategory:'Especiais',icon:'cam_dome',poe:true,poeW:6,ports:1,nvrCh:1,manufacturer:'Genérico',props:{resolucao:'2MP (1080p)',ir:'10m',lente:'2.8mm',ip:'IP67',compacta:'Sim'},ref:''},
    {key:'cam_ip_fisheye_5mp',name:'Câmera IP Fisheye 5MP',subcategory:'Especiais',icon:'cam_fisheye',poe:true,poeW:12,ports:1,nvrCh:1,manufacturer:'Genérico',props:{resolucao:'5MP',fov:'360°',ir:'15m',ip:'IP67',ia:'Sim'},ref:''},
    {key:'cam_ip_wifi_bullet_2mp',name:'Câmera IP Wi-Fi Bullet 2MP',subcategory:'Wi-Fi',icon:'cam_wifi',poe:false,ports:1,nvrCh:1,ampDC:0.5,manufacturer:'Genérico',props:{resolucao:'2MP (1080p)',ir:'30m',lente:'3.6mm',wifi:'2.4GHz',ip:'IP67'},ref:''},
    {key:'cam_ip_wifi_bullet_4mp',name:'Câmera IP Wi-Fi Bullet 4MP',subcategory:'Wi-Fi',icon:'cam_wifi',poe:false,ports:1,nvrCh:1,ampDC:0.5,manufacturer:'Genérico',props:{resolucao:'4MP',ir:'30m',lente:'2.8mm',wifi:'2.4/5GHz',ip:'IP67'},ref:''},
    {key:'cam_ip_wifi_dome_2mp',name:'Câmera IP Wi-Fi Dome 2MP',subcategory:'Wi-Fi',icon:'cam_wifi',poe:false,ports:1,nvrCh:1,ampDC:0.5,manufacturer:'Genérico',props:{resolucao:'2MP (1080p)',ir:'30m',lente:'2.8mm',wifi:'2.4GHz',ip:'IP67'},ref:''},
    {key:'cam_ip_wifi_dome_4mp',name:'Câmera IP Wi-Fi Dome 4MP',subcategory:'Wi-Fi',icon:'cam_wifi',poe:false,ports:1,nvrCh:1,ampDC:0.5,manufacturer:'Genérico',props:{resolucao:'4MP',ir:'30m',lente:'2.8mm',wifi:'2.4/5GHz',ip:'IP67'},ref:''},
  ]},
  // ================================================================
  // CFTV IP - GRAVADORES NVR (6 tipos)
  // ================================================================
  {cat:'CFTV IP - NVR',color:'#059669',items:[
    {key:'nvr_4ch',name:'NVR IP 4 Canais',icon:'nvr',poe:false,ports:1,configurable:true,configFields:['hdCapacityTB'],manufacturer:'Genérico',props:{canais:'4 IP',resolMax:'4K (8MP)',hd:'1 SATA (até 10TB)',saida:'1 HDMI + 1 VGA'},ref:''},
    {key:'nvr_8ch',name:'NVR IP 8 Canais',icon:'nvr',poe:false,ports:1,configurable:true,configFields:['hdCapacityTB'],manufacturer:'Genérico',props:{canais:'8 IP',resolMax:'4K (8MP)',hd:'1 SATA (até 10TB)',saida:'1 HDMI + 1 VGA'},ref:''},
    {key:'nvr_8ch_poe',name:'NVR IP 8 Canais PoE',icon:'nvr',poe:false,ports:1,configurable:true,configFields:['hdCapacityTB'],manufacturer:'Genérico',props:{canais:'8 IP',resolMax:'4K',hd:'1 SATA',poePorts:'8 PoE'},ref:''},
    {key:'nvr_16ch',name:'NVR IP 16 Canais',icon:'nvr',poe:false,ports:1,configurable:true,configFields:['hdCapacityTB'],manufacturer:'Genérico',props:{canais:'16 IP',resolMax:'4K',hd:'2 SATA (até 20TB)',saida:'1 HDMI + 1 VGA'},ref:''},
    {key:'nvr_16ch_poe',name:'NVR IP 16 Canais PoE',icon:'nvr',poe:false,ports:1,configurable:true,configFields:['hdCapacityTB'],manufacturer:'Genérico',props:{canais:'16 IP',resolMax:'4K',hd:'2 SATA',poePorts:'16 PoE'},ref:''},
    {key:'nvr_32ch',name:'NVR IP 32 Canais',icon:'nvr',poe:false,ports:1,configurable:true,configFields:['hdCapacityTB'],manufacturer:'Genérico',props:{canais:'32 IP',resolMax:'4K',hd:'2 SATA',saida:'2 HDMI + 1 VGA',ia:'Sim'},ref:''},
  ]},
  // ================================================================
  // CONTROLE DE ACESSO (20 tipos)
  // ================================================================
  {cat:'Controle de Acesso',color:'#8b5cf6',items:[
    {key:'leitor_facial',name:'Leitor Facial',icon:'leitor_facial',poe:false,ports:1,ampDC:0.5,manufacturer:'Genérico',props:{faces:'50.000',tela:'4.3"',temp:'Sim',ip:'IP65'},ref:''},
    {key:'leitor_biometrico',name:'Leitor Biométrico',icon:'leitor_facial',poe:false,ports:1,ampDC:0.3,manufacturer:'Genérico',props:{digitais:'10.000',protocolo:'Wiegand/RS485',ip:'IP65'},ref:''},
    {key:'leitor_rfid',name:'Leitor RFID/Proximidade',icon:'leitor_tag',poe:false,ports:1,ampDC:0.15,manufacturer:'Genérico',props:{frequencia:'125kHz/13.56MHz',protocolo:'Wiegand 26/34'},ref:''},
    {key:'controladora',name:'Controladora de Acesso',icon:'controladora',poe:false,ports:1,manufacturer:'Genérico',props:{portas:'4',wiegand:'Sim',relay:'4',rede:'TCP/IP'},ref:''},
    {key:'fechadura',name:'Fechadura Eletromagnética',icon:'fechadura',poe:false,ampDC:0.3,ports:1,manufacturer:'Genérico',props:{forca:'280kg',tipo:'Fail-safe'},ref:''},
    {key:'eletroima',name:'Eletroímã',icon:'fechadura',poe:false,ampDC:0.5,ports:1,manufacturer:'Genérico',props:{forca:'150-300kg',tipo:'Fail-safe'},ref:''},
    {key:'motor',name:'Motor Portão/Acesso',icon:'motor',poe:false,ports:1,manufacturer:'Genérico',props:{tipo:'Deslizante',peso:'até 600kg'},ref:''},
    {key:'cam_lpr',name:'Câmera LPR',icon:'cam_lpr',poe:true,poeW:15,ports:1,nvrCh:1,manufacturer:'Genérico',props:{resolucao:'2MP',ir:'12m',lente:'2.8-12mm',funcao:'Reconhecimento Placa'},ref:''},
    {key:'leitor_tag',name:'Leitor Tag UHF',icon:'leitor_tag',poe:false,ports:1,ampDC:0.3,manufacturer:'Genérico',props:{frequencia:'915MHz',alcance:'até 8m',protocolo:'Wiegand/RS485'},ref:''},
    {key:'fechadura_eletromecanica',name:'Fechadura Eletromecânica',icon:'fechadura_mec',poe:false,ampDC:0.8,ports:1,manufacturer:'Genérico',props:{tipo:'Eletromecânica',acionamento:'Fail-secure',tensao:'12VDC',uso:'Porta madeira/metal'},ref:''},
    {key:'fechadura_solenoide_embutir',name:'Fechadura Solenoide de Embutir',icon:'fechadura_sol',poe:false,ampDC:0.35,ports:1,manufacturer:'Genérico',props:{tipo:'Solenoide embutir',acionamento:'Fail-safe',tensao:'12VDC',uso:'Porta madeira/vidro'},ref:''},
    {key:'fechadura_solenoide_sobrepor',name:'Fechadura Solenoide de Sobrepor',icon:'fechadura_sol',poe:false,ampDC:0.35,ports:1,manufacturer:'Genérico',props:{tipo:'Solenoide sobrepor',acionamento:'Fail-safe',tensao:'12VDC',uso:'Porta metal/madeira'},ref:''},
    {key:'botoeira_nt',name:'Botoeira No-Touch',icon:'fechadura',poe:false,ports:1,ampDC:0.05,manufacturer:'Genérico',props:{tipo:'Infravermelho',saida:'NA/NF',tensao:'12VDC',ip:'IP55'},ref:''},
    {key:'botoeira_emergencia',name:'Botoeira de Emergência',icon:'fechadura',poe:false,ports:1,manufacturer:'Genérico',props:{tipo:'Pressão (break glass)',saida:'NA/NF',cor:'Vermelho'},ref:''},
    {key:'botoeira_painel_1',name:'Painel de Botoeira 22mm — 1 Posição',icon:'botoeira_painel',poe:false,ports:1,manufacturer:'Genérico',props:{posicoes:'1',furo:'22mm',material:'Plástico/Metal',saida:'NA/NF'},ref:''},
    {key:'botoeira_painel_2',name:'Painel de Botoeira 22mm — 2 Posições',icon:'botoeira_painel',poe:false,ports:1,manufacturer:'Genérico',props:{posicoes:'2',furo:'22mm',material:'Plástico/Metal',saida:'NA/NF'},ref:''},
    {key:'botoeira_painel_3',name:'Painel de Botoeira 22mm — 3 Posições',icon:'botoeira_painel',poe:false,ports:1,manufacturer:'Genérico',props:{posicoes:'3',furo:'22mm',material:'Plástico/Metal',saida:'NA/NF'},ref:''},
    {key:'botoeira_painel_4',name:'Painel de Botoeira 22mm — 4 Posições',icon:'botoeira_painel',poe:false,ports:1,manufacturer:'Genérico',props:{posicoes:'4',furo:'22mm',material:'Plástico/Metal',saida:'NA/NF'},ref:''},
    {key:'botoeira_painel_6',name:'Painel de Botoeira 22mm — 6 Posições',icon:'botoeira_painel',poe:false,ports:1,manufacturer:'Genérico',props:{posicoes:'6',furo:'22mm',material:'Plástico/Metal',saida:'NA/NF'},ref:''},
    {key:'sensor_abertura',name:'Sensor de Abertura Magnético',icon:'sensor_barreira',poe:false,ports:1,manufacturer:'Genérico',props:{tipo:'Magnético',saida:'NA/NF',gap:'até 20mm',uso:'Porta/Janela'},ref:''},
  ]},
  // ================================================================
  // INTRUSÃO - BARREIRAS (5 tipos)
  // ================================================================
  {cat:'Intrusão - Barreiras',color:'#b91c1c',items:[
    {key:'barreira_digital',name:'Barreira IR Digital',icon:'sensor_barreira',poe:false,ports:1,manufacturer:'Genérico',props:{alcance:'até 150m',feixes:'1',ip:'IP66'},ref:''},
    {key:'barreira_ativa',name:'Barreira IR Ativa',icon:'sensor_barreira',poe:false,ports:1,manufacturer:'Genérico',props:{alcance:'até 100m',feixes:'2',ip:'IP66'},ref:''},
    {key:'barreira_at',name:'Barreira IR Anti-Tamper',icon:'sensor_barreira',poe:false,ports:1,manufacturer:'Genérico',props:{alcance:'até 80m',feixes:'2',antitamper:'Sim'},ref:''},
    {key:'barreira_multi',name:'Barreira IR Multi-Feixe',icon:'sensor_barreira',poe:false,ports:1,manufacturer:'Genérico',props:{alcance:'até 100m',feixes:'4/6/8'},ref:''},
    {key:'barreira_tripla',name:'Barreira IR Tripla Tecnologia',icon:'sensor_barreira',poe:false,ports:1,manufacturer:'Genérico',props:{alcance:'até 100m',tecnologia:'IR + MW + Lógica'},ref:''},
  ]},
  // ================================================================
  // AUTOMATIZADORES (7 tipos)
  // ================================================================
  {cat:'Automatizadores',color:'#ea580c',items:[
    {key:'auto_desl_leve',name:'Automatizador Deslizante Leve',icon:'motor',poe:false,ports:1,manufacturer:'Genérico',props:{capacidade:'até 400kg',motor:'DC',receptor:'433MHz'},ref:''},
    {key:'auto_desl_pesado',name:'Automatizador Deslizante Pesado',icon:'motor',poe:false,ports:1,manufacturer:'Genérico',props:{capacidade:'até 800kg',motor:'DC'},ref:''},
    {key:'auto_basc_leve',name:'Automatizador Basculante Leve',icon:'motor',poe:false,ports:1,manufacturer:'Genérico',props:{capacidade:'até 300kg',tipo:'Basculante'},ref:''},
    {key:'auto_basc_pesado',name:'Automatizador Basculante Pesado',icon:'motor',poe:false,ports:1,manufacturer:'Genérico',props:{capacidade:'até 500kg',tipo:'Basculante'},ref:''},
    {key:'cancela_veicular',name:'Cancela Veicular',icon:'cancela',poe:false,ports:1,manufacturer:'Genérico',props:{braco:'até 3m',velocidade:'1.5s'},ref:''},
    {key:'auto_pivotante',name:'Automatizador Pivotante',icon:'motor',poe:false,ports:1,manufacturer:'Genérico',props:{capacidade:'até 200kg/folha',tipo:'Pivotante'},ref:''},
    {key:'auto_porta_desl',name:'Automatizador Porta Deslizante',icon:'motor',poe:false,ports:1,manufacturer:'Genérico',props:{capacidade:'até 300kg',tipo:'Porta deslizante'},ref:''},
  ]},
  // ================================================================
  // REDE / SWITCHES (6 tipos)
  // ================================================================
  {cat:'Rede',color:'#2563eb',items:[
    {key:'sw_poe',name:'Switch PoE Gerenciável',icon:'sw_poe',poe:false,ports:1,manufacturer:'Genérico',props:{portas:'8+2 SFP',poeTotal:'120W',vlan:'Sim'},ref:''},
    {key:'sw_poe_16',name:'Switch PoE 16 Portas',icon:'sw_poe',poe:false,ports:1,manufacturer:'Genérico',props:{portas:'16+2 SFP',poeTotal:'240W',vlan:'Sim'},ref:''},
    {key:'sw_poe_24',name:'Switch PoE 24 Portas',icon:'sw_poe',poe:false,ports:1,manufacturer:'Genérico',props:{portas:'24+2 SFP',poeTotal:'370W',gerenciavel:'Sim'},ref:''},
    {key:'sw_normal',name:'Switch Não-PoE',icon:'sw_normal',poe:false,ports:1,manufacturer:'Genérico',props:{portas:'8',velocidade:'1Gbps'},ref:''},
    {key:'sw_normal_16',name:'Switch Não-PoE 16 Portas',icon:'sw_normal',poe:false,ports:1,manufacturer:'Genérico',props:{portas:'16',velocidade:'1Gbps'},ref:''},
    {key:'router',name:'Gateway / Router',icon:'router',poe:false,ports:1,manufacturer:'Genérico',props:{wan:'2',lan:'4',vpn:'Sim',firewall:'Sim'},ref:''},
  ]},
  // ================================================================
  // WI-FI (6 tipos)
  // ================================================================
  {cat:'Wi-Fi',color:'#3b82f6',items:[
    {key:'wifi_router_5',name:'Roteador Wi-Fi 5 (AC)',icon:'router',poe:false,ports:1,manufacturer:'Genérico',props:{padrao:'Wi-Fi 5 (802.11ac)',velocidade:'1200Mbps'},ref:''},
    {key:'wifi_router_6',name:'Roteador Wi-Fi 6 (AX)',icon:'router',poe:false,ports:1,manufacturer:'Genérico',props:{padrao:'Wi-Fi 6 (802.11ax)',velocidade:'1500Mbps'},ref:''},
    {key:'wifi_mesh',name:'Sistema Mesh Wi-Fi',icon:'ap_wifi',poe:false,ports:1,manufacturer:'Genérico',props:{cobertura:'até 300m²/un.',seamless:'Sim'},ref:''},
    {key:'wifi_router_5g',name:'Roteador 5G',icon:'router',poe:false,ports:1,manufacturer:'Genérico',props:{padrao:'5G Sub-6GHz',wifi:'Wi-Fi 6'},ref:''},
    {key:'wifi_ap_interno',name:'Access Point Interno',icon:'ap_wifi',poe:true,poeW:15,ports:1,manufacturer:'Genérico',props:{velocidade:'1200-1800Mbps',gerenciavel:'Sim'},ref:''},
    {key:'wifi_ap_externo',name:'Access Point Externo',icon:'ap_wifi',poe:true,poeW:15,ports:1,manufacturer:'Genérico',props:{ip:'IP65',velocidade:'1200Mbps'},ref:''},
  ]},
  // ================================================================
  // PERIFÉRICOS / ACESSÓRIOS
  // ================================================================
  {cat:'Periféricos',color:'#374151',items:[
    {key:'monitor_led_24',name:'Monitor LED 24"',icon:'monitor_led',poe:false,ports:1,manufacturer:'Genérico',props:{tamanho:'24"',resolucao:'1920x1080 (Full HD)',entrada:'HDMI + VGA'},ref:''},
    {key:'monitor_led_27',name:'Monitor LED 27"',icon:'monitor_led',poe:false,ports:1,manufacturer:'Genérico',props:{tamanho:'27"',resolucao:'1920x1080 (Full HD)',entrada:'HDMI + VGA'},ref:''},
    {key:'monitor_led_29',name:'Monitor LED 29"',icon:'monitor_led',poe:false,ports:1,manufacturer:'Genérico',props:{tamanho:'29"',resolucao:'2560x1080 (UltraWide)',entrada:'HDMI + DP'},ref:''},
    {key:'monitor_led_32',name:'Monitor LED 32"',icon:'monitor_led',poe:false,ports:1,manufacturer:'Genérico',props:{tamanho:'32"',resolucao:'1920x1080 / 4K',entrada:'HDMI + DP'},ref:''},
    {key:'monitor_led_40',name:'Monitor LED 40"',icon:'monitor_led',poe:false,ports:1,manufacturer:'Genérico',props:{tamanho:'40"',resolucao:'1920x1080 / 4K',entrada:'HDMI'},ref:''},
    {key:'monitor_led_60',name:'Monitor LED 60"',icon:'monitor_led',poe:false,ports:1,manufacturer:'Genérico',props:{tamanho:'60"',resolucao:'4K (3840x2160)',entrada:'HDMI × 3'},ref:''},
    {key:'cabo_hdmi',name:'Cabo HDMI',icon:'cabo_hdmi',poe:false,ports:1,manufacturer:'Genérico',props:{versao:'2.0',resolMax:'4K 60Hz',comprimento:'1.5-15m'},ref:''},
    {key:'mouse_usb',name:'Mouse USB',icon:'mouse',poe:false,ports:1,manufacturer:'Genérico',props:{interface:'USB-A',tipo:'Óptico'},ref:''},
    {key:'cabo_extensor_usb',name:'Cabo Extensor USB',icon:'cabo_usb',poe:false,ports:1,manufacturer:'Genérico',props:{tipo:'USB 2.0 A-Macho/A-Fêmea',comprimento:'1.5-5m',uso:'Extensão mouse/teclado'},ref:''},
  ]},
  // ================================================================
  // INFRAESTRUTURA (15 tipos)
  // ================================================================
  {cat:'Infraestrutura',color:'#6b7280',items:[
    {key:'ont_gpon',name:'ONT GPON',icon:'dio',poe:false,ports:1,manufacturer:'Genérico',props:{tipo:'GPON',conector:'SC/APC',portas_lan:'1 GE',alimentacao:'PoE Reverso ou 12VDC'},ref:''},
    {key:'fonte_nb_5a',name:'Fonte Nobreak 12V 5A',icon:'fonte',poe:false,ports:1,manufacturer:'Genérico',props:{saida:'12V 5A (60W)',entrada:'90-240Vac',bateria:'12V compatível',tipo:'Nobreak DC'},ref:''},
    {key:'fonte_nb_6a',name:'Fonte Nobreak 12V 6A',icon:'fonte',poe:false,ports:1,manufacturer:'Genérico',props:{saida:'12V 6A (72W)',entrada:'90-240Vac',bateria:'12V compatível',tipo:'Nobreak DC'},ref:''},
    {key:'fonte_nb_10a',name:'Fonte Nobreak 12V 10A',icon:'fonte',poe:false,ports:1,manufacturer:'Genérico',props:{saida:'12V 10A (120W)',entrada:'90-240Vac',bateria:'12V compatível',tipo:'Nobreak DC'},ref:''},
    {key:'bat_12v_1_2ah',name:'Bateria 12V 1.2Ah',icon:'bateria_ext',poe:false,ports:1,manufacturer:'Genérico',props:{tensao:'12V',capacidade:'1.2Ah',tipo:'VRLA Selada'},ref:''},
    {key:'bat_12v_3ah',name:'Bateria 12V 3Ah',icon:'bateria_ext',poe:false,ports:1,manufacturer:'Genérico',props:{tensao:'12V',capacidade:'3Ah',tipo:'VRLA Selada'},ref:''},
    {key:'bat_12v_4ah',name:'Bateria 12V 4Ah',icon:'bateria_ext',poe:false,ports:1,manufacturer:'Genérico',props:{tensao:'12V',capacidade:'4Ah',tipo:'VRLA Selada'},ref:''},
    {key:'bat_12v_7ah',name:'Bateria 12V 7Ah',icon:'bateria_ext',poe:false,ports:1,manufacturer:'Genérico',props:{tensao:'12V',capacidade:'7Ah',tipo:'VRLA Selada'},ref:''},
    {key:'bat_12v_9ah',name:'Bateria 12V 9Ah',icon:'bateria_ext',poe:false,ports:1,manufacturer:'Genérico',props:{tensao:'12V',capacidade:'9Ah',tipo:'VRLA Selada'},ref:''},
    {key:'rack',name:'Rack',icon:'rack',poe:false,ports:1,isContainer:true,configurable:true,configFields:['alturaU','profundidade','acessorios'],manufacturer:'Genérico',props:{altura:'5U-42U',profundidade:'450-600mm'},deprecated:true},
    {key:'nobreak_ac',name:'Nobreak AC',icon:'nobreak_ac',poe:false,ports:1,configurable:true,configFields:['snmp','tomadas_10a','tomadas_20a','potenciaVA','batExterna'],manufacturer:'Genérico',props:{potencia:'600-3000VA',tipo:'AC Interativo/Senoidal'},ref:''},
    {key:'nobreak_dc',name:'Nobreak DC',icon:'nobreak_dc',poe:false,ports:1,configurable:true,configFields:['correnteSaida','batInterna','batExterna'],manufacturer:'Genérico',props:{potencia:'60-120W',tipo:'DC 12V',saida:'12.8Vcc'},ref:''},
    {key:'bateria_ext',name:'Bateria Externa',icon:'bateria_ext',poe:false,ports:1,configurable:true,configFields:['tensao','capacidade','modelo'],manufacturer:'Genérico',props:{tensao:'12V',tipo:'Estacionária VRLA'},ref:'',deprecated:true},
    {key:'modulo_bat',name:'Módulo de Baterias',icon:'modulo_bat',poe:false,ports:1,configurable:true,configFields:['qtdBaterias','tensaoBarramento'],manufacturer:'Genérico',props:{tipo:'Gabinete com baterias'},ref:''},
    {key:'cabo_engate',name:'Cabo Engate Rápido',icon:'cabo_engate',poe:false,ports:1,manufacturer:'Genérico',props:{conector:'SB 50 Anderson Power'}},
    {key:'fonte',name:'Fonte 12V',icon:'fonte',poe:false,ports:1,manufacturer:'Genérico',props:{corrente:'10A',entrada:'90-240Vac'},ref:'',deprecated:true},
    {key:'dio',name:'DIO / Roseta Óptica',icon:'dio',poe:false,ports:1,manufacturer:'Genérico',props:{fibras:'6-12',tipo:'SC/APC'}},
    {key:'borne_sak',name:'Borne SAK',icon:'borne_sak',poe:false,ports:1,manufacturer:'Genérico',props:{tipo:'Trilho DIN',vias:'2-16',uso:'Emenda automação/sinal'}},
    {key:'patch_panel',name:'Patch Panel',icon:'dio',poe:false,ports:1,manufacturer:'Genérico',props:{portas:'24/48',categoria:'CAT6'},ref:''},
    {key:'conversor_midia',name:'Conversor de Mídia',icon:'dio',poe:false,ports:1,manufacturer:'Genérico',props:{entrada:'RJ45 Gbps',saida:'SFP/SC'},ref:''},
    {key:'dps_rede',name:'DPS / Protetor de Surto',icon:'borne_sak',poe:false,ports:1,manufacturer:'Genérico',props:{tipo:'Proteção rede/energia'},ref:''},
    {key:'tomada_dupla',name:'Tomada Dupla 10A',icon:'tomada',poe:false,ports:1,manufacturer:'Genérico',props:{tipo:'2P+T 10A',padrao:'NBR 14136',uso:'Alimentação AC equipamentos'}},
    {key:'quadro_eletrico',name:'Quadro Elétrico',icon:'quadro_eletrico',poe:false,ports:1,isContainer:true,configurable:true,configFields:['disjuntores','dps','idr'],manufacturer:'Genérico',props:{tipo:'Quadro de distribuição',padrao:'NBR 5410',protecao:'Disjuntores + IDR + DPS'}},
  ]},
];
