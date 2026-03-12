// Device Icons — Lucide React (universal) v3.36.0
import React from 'react'
import {
  Camera, Video, Webcam, Eye, ScanEye, Car, Wifi,
  ScanFace, Fingerprint, Lock, Cog,
  Network, Cable, HardDrive, Router,
  Server, BatteryCharging, Battery, Plug, Zap, LayoutGrid, CircuitBoard,
  ShieldAlert, PersonStanding, DoorOpen, ScanLine, Keyboard, Flame, CircleAlert,
  Radio, Signal, Lightbulb, Unplug, GripHorizontal, Siren
} from 'lucide-react'

const ic = (Icon, defaultColor) => (c) => (
  <Icon size={28} color={c || defaultColor} strokeWidth={1.8} />
)

export const ICONS = {
  // CFTV
  cam_dome:    ic(Webcam, '#f59e0b'),
  cam_bullet:  ic(Video, '#f59e0b'),
  cam_ptz:     ic(ScanEye, '#f59e0b'),
  cam_fisheye: ic(Eye, '#f59e0b'),
  cam_lpr:     ic(Car, '#f59e0b'),
  cam_wifi:    ic(Video, '#0ea5e9'),
  // Controle de Acesso
  leitor_facial: ic(ScanFace, '#8b5cf6'),
  controladora:  ic(Fingerprint, '#8b5cf6'),
  fechadura:     ic(Lock, '#8b5cf6'),
  motor:         ic(Cog, '#ea580c'),
  leitor_tag:    ic(Signal, '#8b5cf6'),
  cancela:       ic(Unplug, '#ea580c'),
  // Rede
  sw_poe:    ic(Network, '#2563eb'),
  sw_normal: ic(Cable, '#2563eb'),
  nvr:       ic(HardDrive, '#059669'),
  dvr:       ic(HardDrive, '#d97706'),
  router:    ic(Router, '#059669'),
  ap_wifi:   ic(Wifi, '#2563eb'),
  dio:       ic(CircuitBoard, '#0ea5e9'),
  // Infraestrutura
  rack:            ic(Server, '#6b7280'),
  nobreak:         ic(BatteryCharging, '#dc2626'),
  nobreak_dc:      ic(BatteryCharging, '#ea580c'),
  nobreak_ac:      ic(BatteryCharging, '#dc2626'),
  bateria_ext:     ic(Battery, '#eab308'),
  modulo_bat:      ic(Battery, '#9333ea'),
  fonte:           ic(Plug, '#eab308'),
  quadro:          ic(LayoutGrid, '#374151'),
  quadro_eletrico: ic(LayoutGrid, '#6b7280'),
  cabo_engate:     ic(Unplug, '#dc2626'),
  borne_sak:       ic(GripHorizontal, '#78716c'),
  tomada:          ic(Plug, '#6b7280'),
  // Alarme / Incendio
  alarme_central:   ic(ShieldAlert, '#ef4444'),
  sensor_presenca:  ic(PersonStanding, '#ef4444'),
  sensor_abertura:  ic(DoorOpen, '#ef4444'),
  sensor_barreira:  ic(ScanLine, '#ef4444'),
  sirene:           ic(Siren, '#ef4444'),
  teclado_alarme:   ic(Keyboard, '#ef4444'),
  detector_fumaca:  ic(Flame, '#991b1b'),
  acionador_manual: ic(CircleAlert, '#991b1b'),
  eletrificador:    ic(Zap, '#ef4444'),
  modulo_incendio:  ic(Flame, '#991b1b'),
  luminaria_emerg:  ic(Lightbulb, '#be123c'),
  // Comunicacao
  controle_remoto: ic(Radio, '#ef4444'),
  comunicador:     ic(Radio, '#ef4444'),
  receptor_rf:     ic(Signal, '#ef4444'),
}
