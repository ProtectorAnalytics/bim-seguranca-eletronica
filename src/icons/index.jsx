// SVG Icons - Extracted from BIM Seguranca Eletronica v3.11.0
import React from 'react'

export const ICONS = {
  // ── CFTV ──
  cam_dome:(c='#f59e0b')=><svg viewBox="0 0 48 48" width="28" height="28">
    <ellipse cx="24" cy="36" rx="12" ry="3" fill={c} opacity=".12"/>
    <path d="M10 28 Q10 22 24 18 Q38 22 38 28 L38 30 Q38 34 24 36 Q10 34 10 30Z" fill={c} opacity=".08" stroke={c} strokeWidth="2"/>
    <ellipse cx="24" cy="28" rx="14" ry="6" fill="none" stroke={c} strokeWidth="2"/>
    <circle cx="24" cy="24" r="10" fill="none" stroke={c} strokeWidth="2.2"/>
    <circle cx="24" cy="24" r="5" fill={c} opacity=".15"/>
    <circle cx="24" cy="24" r="2.5" fill={c} opacity=".4"/>
    <path d="M22 10 L24 6 L26 10" fill="none" stroke={c} strokeWidth="1.5"/>
    <circle cx="24" cy="24" r="0.8" fill={c}/>
  </svg>,
  cam_bullet:(c='#f59e0b')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="4" y="8" width="8" height="14" rx="1" fill={c} opacity=".1" stroke={c} strokeWidth="1.5"/>
    <rect x="8" y="14" width="28" height="14" rx="7" fill="none" stroke={c} strokeWidth="2.2"/>
    <circle cx="30" cy="21" r="6" fill={c} opacity=".08" stroke={c} strokeWidth="1.5"/>
    <circle cx="30" cy="21" r="3" fill={c} opacity=".2"/>
    <circle cx="30" cy="21" r="1.2" fill={c} opacity=".5"/>
    <line x1="36" y1="21" x2="42" y2="19" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    <rect x="12" y="17" width="3" height="1.5" rx=".5" fill={c} opacity=".3"/>
    <path d="M8 28 L8 36 L12 40" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>,
  cam_ptz:(c='#f59e0b')=><svg viewBox="0 0 48 48" width="28" height="28">
    <path d="M20 36 L24 44 L28 36" fill="none" stroke={c} strokeWidth="2"/>
    <line x1="18" y1="44" x2="30" y2="44" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    <rect x="16" y="30" width="16" height="8" rx="2" fill={c} opacity=".08" stroke={c} strokeWidth="1.5"/>
    <circle cx="24" cy="20" r="12" fill="none" stroke={c} strokeWidth="2.2"/>
    <circle cx="24" cy="20" r="7" fill={c} opacity=".06" stroke={c} strokeWidth="1.5"/>
    <circle cx="24" cy="20" r="3.5" fill={c} opacity=".2"/>
    <circle cx="24" cy="20" r="1.5" fill={c} opacity=".5"/>
    <path d="M6 20 L12 20" stroke={c} strokeWidth="1" opacity=".4" strokeDasharray="2 1"/>
    <path d="M36 20 L42 20" stroke={c} strokeWidth="1" opacity=".4" strokeDasharray="2 1"/>
    <path d="M24 4 L24 8" stroke={c} strokeWidth="1" opacity=".4" strokeDasharray="2 1"/>
  </svg>,
  cam_fisheye:(c='#f59e0b')=><svg viewBox="0 0 48 48" width="28" height="28">
    <circle cx="24" cy="24" r="17" fill={c} opacity=".06" stroke={c} strokeWidth="2.2"/>
    <circle cx="24" cy="24" r="12" fill="none" stroke={c} strokeWidth="1.2" opacity=".5"/>
    <circle cx="24" cy="24" r="7" fill={c} opacity=".08" stroke={c} strokeWidth="1.5"/>
    <circle cx="24" cy="24" r="3.5" fill={c} opacity=".25"/>
    <circle cx="24" cy="24" r="1" fill={c}/>
    <path d="M12 12 L16 16" stroke={c} strokeWidth=".8" opacity=".3"/>
    <path d="M36 12 L32 16" stroke={c} strokeWidth=".8" opacity=".3"/>
    <path d="M12 36 L16 32" stroke={c} strokeWidth=".8" opacity=".3"/>
    <path d="M36 36 L32 32" stroke={c} strokeWidth=".8" opacity=".3"/>
  </svg>,
  // ── CONTROLE DE ACESSO ──
  leitor_facial:(c='#8b5cf6')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="10" y="4" width="28" height="40" rx="4" fill={c} opacity=".05" stroke={c} strokeWidth="2.2"/>
    <rect x="13" y="8" width="22" height="28" rx="2" fill="none" stroke={c} strokeWidth="1.2" opacity=".4"/>
    <circle cx="24" cy="18" r="6" fill="none" stroke={c} strokeWidth="1.8"/>
    <path d="M20 18 L20 16" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M28 18 L28 16" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M21 22 Q24 25 27 22" fill="none" stroke={c} strokeWidth="1" strokeLinecap="round"/>
    <path d="M16 28 Q24 32 32 28" fill="none" stroke={c} strokeWidth="1.2" opacity=".6"/>
    <circle cx="24" cy="40" r="2" fill="none" stroke={c} strokeWidth="1.5"/>
    <rect x="14" y="6" width="4" height="1.5" rx=".5" fill={c} opacity=".3"/>
  </svg>,
  controladora:(c='#8b5cf6')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="4" y="8" width="40" height="32" rx="3" fill={c} opacity=".05" stroke={c} strokeWidth="2.2"/>
    <line x1="4" y1="14" x2="44" y2="14" stroke={c} strokeWidth="1.2" opacity=".5"/>
    <circle cx="8" cy="11" r="1.5" fill={c} opacity=".5"/>
    <circle cx="13" cy="11" r="1.5" fill={c} opacity=".3"/>
    <rect x="8" y="18" width="14" height="8" rx="1.5" fill={c} opacity=".08" stroke={c} strokeWidth="1"/>
    <rect x="8" y="28" width="14" height="8" rx="1.5" fill={c} opacity=".08" stroke={c} strokeWidth="1"/>
    <circle cx="33" cy="22" r="3" fill={c} opacity=".15" stroke={c} strokeWidth="1.2"/>
    <circle cx="33" cy="32" r="3" fill={c} opacity=".15" stroke={c} strokeWidth="1.2"/>
    <rect x="38" y="18" width="3" height="3" rx=".5" fill={c} opacity=".25"/>
    <rect x="38" y="24" width="3" height="3" rx=".5" fill={c} opacity=".25"/>
    <rect x="38" y="30" width="3" height="3" rx=".5" fill={c} opacity=".25"/>
  </svg>,
  fechadura:(c='#8b5cf6')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="8" y="18" width="32" height="26" rx="3" fill={c} opacity=".06" stroke={c} strokeWidth="2.2"/>
    <rect x="12" y="22" width="24" height="18" rx="2" fill="none" stroke={c} strokeWidth="1" opacity=".3"/>
    <path d="M18 18 V12 Q18 4 24 4 Q30 4 30 12 V18" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="24" cy="30" r="4" fill="none" stroke={c} strokeWidth="1.8"/>
    <line x1="24" y1="34" x2="24" y2="38" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="24" cy="30" r="1.5" fill={c} opacity=".4"/>
  </svg>,
  motor:(c='#ea580c')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="2" y="14" width="26" height="20" rx="3" fill={c} opacity=".06" stroke={c} strokeWidth="2.2"/>
    <circle cx="15" cy="24" r="6" fill="none" stroke={c} strokeWidth="1.5" opacity=".5"/>
    <circle cx="15" cy="24" r="2" fill={c} opacity=".3"/>
    <line x1="28" y1="24" x2="38" y2="24" stroke={c} strokeWidth="3" strokeLinecap="round"/>
    <path d="M36 18 L42 14 L42 34 L36 30" fill="none" stroke={c} strokeWidth="1.8"/>
    <line x1="8" y1="14" x2="8" y2="10" stroke={c} strokeWidth="1.5"/>
    <line x1="22" y1="14" x2="22" y2="10" stroke={c} strokeWidth="1.5"/>
    <rect x="6" y="34" width="4" height="6" rx="1" fill={c} opacity=".2"/>
    <rect x="20" y="34" width="4" height="6" rx="1" fill={c} opacity=".2"/>
  </svg>,
  // ── REDE ──
  sw_poe:(c='#2563eb')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="2" y="12" width="44" height="24" rx="3" fill={c} opacity=".05" stroke={c} strokeWidth="2.2"/>
    <line x1="2" y1="18" x2="46" y2="18" stroke={c} strokeWidth="1" opacity=".3"/>
    {[10,16,22,28,34,40].map((x,i)=><rect key={i} x={x-2} y="20" width="4" height="6" rx=".8" fill={c} opacity=".12" stroke={c} strokeWidth=".8"/>)}
    {[10,16,22,28,34,40].map((x,i)=><rect key={'b'+i} x={x-1.5} y="28" width="3" height="5" rx=".5" fill={c} opacity=".08" stroke={c} strokeWidth=".6"/>)}
    <circle cx="6" cy="15" r="1.5" fill="#22c55e" opacity=".8"/>
    <text x="44" y="16" textAnchor="end" fill={c} fontSize="5.5" fontWeight="800" opacity=".7">PoE</text>
  </svg>,
  sw_normal:(c='#2563eb')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="2" y="12" width="44" height="24" rx="3" fill={c} opacity=".05" stroke={c} strokeWidth="2.2"/>
    <line x1="2" y1="18" x2="46" y2="18" stroke={c} strokeWidth="1" opacity=".3"/>
    {[10,16,22,28,34,40].map((x,i)=><rect key={i} x={x-2} y="20" width="4" height="6" rx=".8" fill={c} opacity=".12" stroke={c} strokeWidth=".8"/>)}
    {[10,16,22,28,34,40].map((x,i)=><rect key={'b'+i} x={x-1.5} y="28" width="3" height="5" rx=".5" fill={c} opacity=".08" stroke={c} strokeWidth=".6"/>)}
    <circle cx="6" cy="15" r="1.5" fill="#22c55e" opacity=".8"/>
    <circle cx="10" cy="15" r="1" fill={c} opacity=".3"/>
  </svg>,
  nvr:(c='#059669')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="2" y="10" width="44" height="28" rx="3" fill={c} opacity=".05" stroke={c} strokeWidth="2.2"/>
    <rect x="6" y="14" width="20" height="6" rx="1" fill={c} opacity=".06" stroke={c} strokeWidth=".8"/>
    <rect x="6" y="22" width="20" height="6" rx="1" fill={c} opacity=".06" stroke={c} strokeWidth=".8"/>
    <rect x="6" y="30" width="20" height="4" rx="1" fill={c} opacity=".06" stroke={c} strokeWidth=".8"/>
    <circle cx="36" cy="20" r="5" fill="none" stroke={c} strokeWidth="1.5"/>
    <circle cx="36" cy="20" r="2" fill={c} opacity=".2"/>
    <circle cx="36" cy="30" r="2" fill={c} opacity=".3"/>
    <rect x="40" y="14" width="3" height="2" rx=".5" fill={c} opacity=".25"/>
    <rect x="40" y="18" width="3" height="2" rx=".5" fill={c} opacity=".25"/>
  </svg>,
  router:(c='#059669')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="4" y="18" width="40" height="18" rx="3" fill={c} opacity=".05" stroke={c} strokeWidth="2.2"/>
    <line x1="14" y1="4" x2="16" y2="18" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="34" y1="4" x2="32" y2="18" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="14" cy="4" r="1.5" fill={c} opacity=".5"/>
    <circle cx="34" cy="4" r="1.5" fill={c} opacity=".5"/>
    <circle cx="10" cy="27" r="1.5" fill="#22c55e" opacity=".7"/>
    <circle cx="15" cy="27" r="1.5" fill={c} opacity=".3"/>
    <circle cx="20" cy="27" r="1.5" fill={c} opacity=".3"/>
    {[28,33,38].map((x,i)=><rect key={i} x={x-1.5} y="30" width="3" height="4" rx=".5" fill={c} opacity=".15" stroke={c} strokeWidth=".5"/>)}
  </svg>,
  // ── INFRAESTRUTURA ──
  rack:(c='#6b7280')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="8" y="2" width="32" height="44" rx="2" fill={c} opacity=".04" stroke={c} strokeWidth="2.2"/>
    <rect x="11" y="6" width="26" height="8" rx="1" fill={c} opacity=".08" stroke={c} strokeWidth=".8"/>
    <rect x="11" y="16" width="26" height="8" rx="1" fill={c} opacity=".08" stroke={c} strokeWidth=".8"/>
    <rect x="11" y="26" width="26" height="8" rx="1" fill={c} opacity=".06" stroke={c} strokeWidth=".8"/>
    <rect x="11" y="36" width="26" height="8" rx="1" fill={c} opacity=".06" stroke={c} strokeWidth=".8"/>
    <circle cx="34" cy="10" r="1" fill={c} opacity=".4"/>
    <circle cx="34" cy="20" r="1" fill={c} opacity=".4"/>
    <circle cx="34" cy="30" r="1" fill={c} opacity=".4"/>
    <line x1="14" y1="10" x2="28" y2="10" stroke={c} strokeWidth="1" opacity=".3"/>
    <line x1="14" y1="20" x2="28" y2="20" stroke={c} strokeWidth="1" opacity=".3"/>
  </svg>,
  nobreak:(c='#dc2626')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="6" y="8" width="36" height="32" rx="3" fill={c} opacity=".05" stroke={c} strokeWidth="2.2"/>
    <rect x="14" y="12" width="20" height="12" rx="2" fill="none" stroke={c} strokeWidth="1.2" opacity=".4"/>
    <path d="M26 14 L22 19 L27 19 L23 24" fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
    <rect x="10" y="28" width="6" height="3" rx="1" fill={c} opacity=".15"/>
    <rect x="18" y="28" width="6" height="3" rx="1" fill={c} opacity=".15"/>
    <rect x="26" y="28" width="6" height="3" rx="1" fill={c} opacity=".15"/>
    <rect x="34" y="28" width="4" height="3" rx="1" fill={c} opacity=".15"/>
    <circle cx="12" cy="36" r="1.5" fill="#22c55e" opacity=".6"/>
    <circle cx="17" cy="36" r="1" fill={c} opacity=".3"/>
    <rect x="30" y="34" width="8" height="4" rx="1" fill="none" stroke={c} strokeWidth=".8" opacity=".4"/>
  </svg>,
  nobreak_dc:(c='#ea580c')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="6" y="8" width="36" height="32" rx="3" fill={c} opacity=".05" stroke={c} strokeWidth="2.2"/>
    <rect x="14" y="12" width="20" height="12" rx="2" fill="none" stroke={c} strokeWidth="1.2" opacity=".4"/>
    <path d="M26 14 L22 19 L27 19 L23 24" fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
    <rect x="10" y="28" width="8" height="4" rx="1" fill={c} opacity=".12" stroke={c} strokeWidth=".8"/>
    <rect x="20" y="28" width="8" height="4" rx="1" fill={c} opacity=".12" stroke={c} strokeWidth=".8"/>
    <rect x="30" y="28" width="8" height="4" rx="1" fill={c} opacity=".12" stroke={c} strokeWidth=".8"/>
    <text x="24" y="38" textAnchor="middle" fill={c} fontSize="5" fontWeight="800" opacity=".6">DC 12V</text>
  </svg>,
  bateria_ext:(c='#eab308')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="6" y="12" width="32" height="24" rx="3" fill={c} opacity=".06" stroke={c} strokeWidth="2.2"/>
    <rect x="38" y="18" width="6" height="12" rx="2" fill={c} opacity=".15" stroke={c} strokeWidth="1.5"/>
    <line x1="12" y1="20" x2="32" y2="20" stroke={c} strokeWidth="1.2" opacity=".3"/>
    <line x1="12" y1="24" x2="32" y2="24" stroke={c} strokeWidth="1.2" opacity=".2"/>
    <line x1="12" y1="28" x2="32" y2="28" stroke={c} strokeWidth="1.2" opacity=".3"/>
    <text x="14" y="33" fill={c} fontSize="4" fontWeight="700" opacity=".5">+</text>
    <text x="30" y="33" fill={c} fontSize="4" fontWeight="700" opacity=".5">{'\u2212'}</text>
    <rect x="10" y="15" width="12" height="6" rx="1" fill={c} opacity=".08"/>
  </svg>,
  modulo_bat:(c='#9333ea')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="4" y="6" width="40" height="36" rx="3" fill={c} opacity=".04" stroke={c} strokeWidth="2.2"/>
    <rect x="8" y="10" width="14" height="12" rx="2" fill={c} opacity=".08" stroke={c} strokeWidth="1"/>
    <rect x="26" y="10" width="14" height="12" rx="2" fill={c} opacity=".08" stroke={c} strokeWidth="1"/>
    <rect x="8" y="26" width="14" height="12" rx="2" fill={c} opacity=".06" stroke={c} strokeWidth="1"/>
    <rect x="26" y="26" width="14" height="12" rx="2" fill={c} opacity=".06" stroke={c} strokeWidth="1"/>
    <text x="15" y="18" textAnchor="middle" fill={c} fontSize="4" fontWeight="700" opacity=".5">12V</text>
    <text x="33" y="18" textAnchor="middle" fill={c} fontSize="4" fontWeight="700" opacity=".5">12V</text>
  </svg>,
  cabo_engate:(c='#dc2626')=><svg viewBox="0 0 48 48" width="28" height="28">
    <path d="M4 24 L14 24" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
    <rect x="14" y="18" width="8" height="12" rx="2" fill={c} opacity=".1" stroke={c} strokeWidth="1.8"/>
    <rect x="26" y="18" width="8" height="12" rx="2" fill={c} opacity=".1" stroke={c} strokeWidth="1.8"/>
    <path d="M34 24 L44 24" stroke={c} strokeWidth="3.5" strokeLinecap="round"/>
    <path d="M22 22 L26 22" stroke={c} strokeWidth="1.5" opacity=".5"/>
    <path d="M22 26 L26 26" stroke={c} strokeWidth="1.5" opacity=".5"/>
  </svg>,
  quadro:(c='#374151')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="4" y="4" width="40" height="40" rx="3" fill={c} opacity=".04" stroke={c} strokeWidth="2.2"/>
    <line x1="4" y1="10" x2="44" y2="10" stroke={c} strokeWidth="1" opacity=".3"/>
    <rect x="8" y="14" width="14" height="10" rx="1.5" fill={c} opacity=".08" stroke={c} strokeWidth=".8"/>
    <rect x="26" y="14" width="14" height="10" rx="1.5" fill={c} opacity=".08" stroke={c} strokeWidth=".8"/>
    <rect x="8" y="28" width="32" height="5" rx="1" fill={c} opacity=".06" stroke={c} strokeWidth=".8"/>
    <rect x="8" y="36" width="32" height="5" rx="1" fill={c} opacity=".06" stroke={c} strokeWidth=".8"/>
    <circle cx="40" cy="7" r="1.5" fill={c} opacity=".3"/>
  </svg>,
  // ── FONTE 12V (completamente redesenhada) ──
  fonte:(c='#eab308')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="4" y="10" width="40" height="28" rx="3" fill={c} opacity=".06" stroke={c} strokeWidth="2.2"/>
    <rect x="8" y="14" width="16" height="10" rx="1.5" fill="none" stroke={c} strokeWidth="1.2" opacity=".5"/>
    <path d="M14 16 L12 20 L16 20 L14 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
    <line x1="4" y1="28" x2="44" y2="28" stroke={c} strokeWidth="1" opacity=".3"/>
    {[10,16,22,28,34,40].map((x,i)=><circle key={i} cx={x} cy="33" r="1.8" fill={c} opacity={i<3?".25":".12"} stroke={c} strokeWidth=".6"/>)}
    <text x="32" y="22" textAnchor="middle" fill={c} fontSize="5" fontWeight="800" opacity=".6">12V</text>
    <text x="32" y="16" textAnchor="middle" fill={c} fontSize="3.5" fontWeight="600" opacity=".4">OUT</text>
    <circle cx="8" cy="33" r="1" fill="#22c55e" opacity=".7"/>
    <rect x="42" y="20" width="4" height="6" rx="1" fill={c} opacity=".1" stroke={c} strokeWidth=".8"/>
  </svg>,
  dio:(c='#0ea5e9')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="4" y="12" width="40" height="24" rx="3" fill={c} opacity=".05" stroke={c} strokeWidth="2.2"/>
    <line x1="4" y1="18" x2="44" y2="18" stroke={c} strokeWidth="1" opacity=".3"/>
    {[12,20,28,36].map((x,i)=><g key={i}><circle cx={x} cy="28" r="3.5" fill={c} opacity=".08" stroke={c} strokeWidth="1"/><circle cx={x} cy="28" r="1.2" fill={c} opacity=".3"/></g>)}
    <text x="8" y="16" fill={c} fontSize="4" fontWeight="700" opacity=".5">FO</text>
    <circle cx="40" cy="15" r="1" fill="#22c55e" opacity=".6"/>
  </svg>,
  // ── ALARME ──
  alarme_central:(c='#ef4444')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="4" y="8" width="40" height="32" rx="3" fill={c} opacity=".05" stroke={c} strokeWidth="2.2"/>
    <rect x="8" y="12" width="20" height="12" rx="2" fill="none" stroke={c} strokeWidth="1.2" opacity=".4"/>
    <text x="18" y="20" textAnchor="middle" fill={c} fontSize="5" fontWeight="700" opacity=".5">ALARM</text>
    {[10,16,22,28,34].map((x,i)=><rect key={i} x={x-1.5} y="28" width="3" height="6" rx=".5" fill={c} opacity=".1" stroke={c} strokeWidth=".6"/>)}
    <circle cx="36" cy="16" r="3" fill="none" stroke={c} strokeWidth="1.2"/>
    <circle cx="36" cy="16" r="1" fill={c} opacity=".4"/>
    <circle cx="8" cy="36" r="1.5" fill="#22c55e" opacity=".6"/>
    <path d="M24 2 L24 8" stroke={c} strokeWidth="1.5" opacity=".4"/>
    <path d="M20 4 L28 4" stroke={c} strokeWidth="1" opacity=".3"/>
  </svg>,
  sensor_presenca:(c='#ef4444')=><svg viewBox="0 0 48 48" width="28" height="28">
    <path d="M14 38 Q14 20 24 12 Q34 20 34 38" fill={c} opacity=".06" stroke={c} strokeWidth="2.2"/>
    <circle cx="24" cy="22" r="4" fill={c} opacity=".12" stroke={c} strokeWidth="1.5"/>
    <circle cx="24" cy="22" r="1.5" fill={c} opacity=".35"/>
    <path d="M18 16 Q24 8 30 16" fill="none" stroke={c} strokeWidth="1" opacity=".3"/>
    <path d="M16 14 Q24 4 32 14" fill="none" stroke={c} strokeWidth=".8" opacity=".2"/>
    <line x1="10" y1="38" x2="38" y2="38" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    <rect x="20" y="38" width="8" height="6" rx="1" fill={c} opacity=".08" stroke={c} strokeWidth=".8"/>
  </svg>,
  sensor_abertura:(c='#ef4444')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="4" y="12" width="18" height="24" rx="3" fill={c} opacity=".06" stroke={c} strokeWidth="2.2"/>
    <rect x="26" y="12" width="18" height="24" rx="3" fill={c} opacity=".04" stroke={c} strokeWidth="2.2"/>
    <circle cx="13" cy="24" r="3" fill={c} opacity=".15" stroke={c} strokeWidth="1"/>
    <circle cx="35" cy="24" r="3" fill={c} opacity=".15" stroke={c} strokeWidth="1"/>
    <path d="M22 20 L26 20" stroke={c} strokeWidth="1.2" strokeDasharray="1.5 1.5" opacity=".5"/>
    <path d="M22 24 L26 24" stroke={c} strokeWidth="1.2" strokeDasharray="1.5 1.5" opacity=".5"/>
    <path d="M22 28 L26 28" stroke={c} strokeWidth="1.2" strokeDasharray="1.5 1.5" opacity=".5"/>
    <rect x="8" y="30" width="10" height="3" rx=".5" fill={c} opacity=".1"/>
    <rect x="30" y="30" width="10" height="3" rx=".5" fill={c} opacity=".1"/>
  </svg>,
  sirene:(c='#ef4444')=><svg viewBox="0 0 48 48" width="28" height="28">
    <path d="M14 32 L16 16 Q24 6 32 16 L34 32" fill={c} opacity=".06" stroke={c} strokeWidth="2.2"/>
    <line x1="10" y1="32" x2="38" y2="32" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M8 20 L4 16" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity=".5"/>
    <path d="M40 20 L44 16" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity=".5"/>
    <path d="M6 24 L2 24" stroke={c} strokeWidth="1" strokeLinecap="round" opacity=".3"/>
    <path d="M42 24 L46 24" stroke={c} strokeWidth="1" strokeLinecap="round" opacity=".3"/>
    <path d="M24 6 L24 2" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity=".5"/>
    <circle cx="24" cy="24" r="3" fill={c} opacity=".15"/>
    <rect x="18" y="32" width="12" height="8" rx="2" fill={c} opacity=".08" stroke={c} strokeWidth=".8"/>
    <rect x="20" y="36" width="3" height="2" rx=".5" fill={c} opacity=".15"/>
    <rect x="25" y="36" width="3" height="2" rx=".5" fill={c} opacity=".15"/>
  </svg>,
  // ── LPR / TAG ──
  cam_lpr:(c='#f59e0b')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="4" y="12" width="30" height="16" rx="8" fill={c} opacity=".06" stroke={c} strokeWidth="2.2"/>
    <circle cx="28" cy="20" r="6" fill={c} opacity=".08" stroke={c} strokeWidth="1.5"/>
    <circle cx="28" cy="20" r="3" fill={c} opacity=".2"/>
    <circle cx="28" cy="20" r="1" fill={c} opacity=".5"/>
    <line x1="34" y1="20" x2="40" y2="18" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    <rect x="8" y="30" width="24" height="10" rx="2" fill="none" stroke={c} strokeWidth="1.5" opacity=".7"/>
    <text x="20" y="37" textAnchor="middle" fill={c} fontSize="5" fontWeight="800" opacity=".6">ABC-1234</text>
    <rect x="8" y="42" width="4" height="3" rx=".5" fill={c} opacity=".15"/>
  </svg>,
  leitor_tag:(c='#8b5cf6')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="8" y="8" width="32" height="22" rx="3" fill={c} opacity=".05" stroke={c} strokeWidth="2.2"/>
    <path d="M18 14 L24 10 L30 14" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M16 18 L24 13 L32 18" fill="none" stroke={c} strokeWidth="1.2" opacity=".4" strokeLinecap="round"/>
    <path d="M14 22 L24 16 L34 22" fill="none" stroke={c} strokeWidth=".8" opacity=".25" strokeLinecap="round"/>
    <line x1="24" y1="30" x2="24" y2="40" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="16" y1="40" x2="32" y2="40" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    <rect x="14" y="23" width="20" height="4" rx="1" fill={c} opacity=".08"/>
    <circle cx="20" cy="25" r="1" fill={c} opacity=".3"/>
    <circle cx="28" cy="25" r="1" fill={c} opacity=".3"/>
  </svg>,
  borne_sak:(c='#78716c')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="4" y="10" width="40" height="28" rx="2" fill={c} opacity=".04" stroke={c} strokeWidth="2.2"/>
    {[12,20,28,36].map((x,i)=><g key={i}>
      <line x1={x} y1="10" x2={x} y2="38" stroke={c} strokeWidth="1" opacity=".25"/>
      <circle cx={x-4} cy="16" r="2" fill={c} opacity=".12" stroke={c} strokeWidth=".8"/>
      <circle cx={x-4} cy="32" r="2" fill={c} opacity=".12" stroke={c} strokeWidth=".8"/>
      <rect x={x-6} y="22" width="4" height="4" rx=".5" fill={c} opacity=".08" stroke={c} strokeWidth=".5"/>
    </g>)}
    <line x1="4" y1="24" x2="44" y2="24" stroke={c} strokeWidth="1.5" opacity=".3"/>
  </svg>,
  tomada:(c='#6b7280')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="8" y="6" width="32" height="36" rx="4" fill={c} opacity=".06" stroke={c} strokeWidth="2"/>
    <rect x="12" y="10" width="24" height="14" rx="3" fill="none" stroke={c} strokeWidth="1.5" opacity=".4"/>
    <circle cx="18" cy="17" r="2" fill={c} opacity=".4"/><circle cx="30" cy="17" r="2" fill={c} opacity=".4"/>
    <line x1="24" y1="14" x2="24" y2="20" stroke={c} strokeWidth="1.5" opacity=".3"/>
    <rect x="12" y="28" width="24" height="14" rx="3" fill="none" stroke={c} strokeWidth="1.5" opacity=".4"/>
    <circle cx="18" cy="35" r="2" fill={c} opacity=".4"/><circle cx="30" cy="35" r="2" fill={c} opacity=".4"/>
    <line x1="24" y1="32" x2="24" y2="38" stroke={c} strokeWidth="1.5" opacity=".3"/>
    <text x="24" y="27" textAnchor="middle" fill={c} fontSize="4" opacity=".5" fontWeight="700">10A</text>
  </svg>,
  quadro_eletrico:(c='#6b7280')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="4" y="4" width="40" height="40" rx="3" fill={c} opacity=".06" stroke={c} strokeWidth="2.2"/>
    <line x1="24" y1="4" x2="24" y2="44" stroke={c} strokeWidth="1" opacity=".2"/>
    {[14,22,30].map((y,i)=><g key={i}>
      <rect x="8" y={y} width="14" height="5" rx="1" fill={c} opacity=".1" stroke={c} strokeWidth=".8"/>
      <rect x="26" y={y} width="14" height="5" rx="1" fill={c} opacity=".1" stroke={c} strokeWidth=".8"/>
      <circle cx="12" cy={y+2.5} r="1" fill={i===0?'#ef4444':i===1?'#f59e0b':'#22c55e'} opacity=".6"/>
      <circle cx="30" cy={y+2.5} r="1" fill={i===0?'#ef4444':i===1?'#f59e0b':'#22c55e'} opacity=".6"/>
    </g>)}
    <text x="24" y="42" textAnchor="middle" fill={c} fontSize="3.5" opacity=".5" fontWeight="700">QD</text>
  </svg>,
  nobreak_ac:(c='#dc2626')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="6" y="8" width="36" height="32" rx="3" fill={c} opacity=".05" stroke={c} strokeWidth="2.2"/>
    <rect x="14" y="12" width="20" height="12" rx="2" fill="none" stroke={c} strokeWidth="1.2" opacity=".4"/>
    <path d="M26 14 L22 19 L27 19 L23 24" fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
    <rect x="10" y="28" width="6" height="3" rx="1" fill={c} opacity=".15"/>
    <rect x="18" y="28" width="6" height="3" rx="1" fill={c} opacity=".15"/>
    <rect x="26" y="28" width="6" height="3" rx="1" fill={c} opacity=".15"/>
    <circle cx="12" cy="36" r="1.5" fill="#22c55e" opacity=".6"/>
    <text x="36" y="38" textAnchor="middle" fill={c} fontSize="4" fontWeight="700" opacity=".5">AC</text>
  </svg>,
  // ── NOVOS ICONES - CATALOGO EXPANDIDO ──
  eletrificador:(c='#ef4444')=><svg viewBox="0 0 48 48" width="28" height="28">
    <line x1="8" y1="6" x2="8" y2="42" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="40" y1="6" x2="40" y2="42" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    {[12,18,24,30,36].map((y,i)=><line key={i} x1="8" y1={y} x2="40" y2={y} stroke={c} strokeWidth="1" opacity=".3"/>)}
    <path d="M22 14 L18 22 L24 22 L20 30" fill="none" stroke={c} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
    <circle cx="24" cy="22" r="8" fill={c} opacity=".06"/>
  </svg>,
  sensor_barreira:(c='#ef4444')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="4" y="8" width="8" height="32" rx="2" fill={c} opacity=".06" stroke={c} strokeWidth="2"/>
    <rect x="36" y="8" width="8" height="32" rx="2" fill={c} opacity=".06" stroke={c} strokeWidth="2"/>
    <circle cx="8" cy="18" r="2.5" fill={c} opacity=".3"/>
    <circle cx="40" cy="18" r="2.5" fill={c} opacity=".3"/>
    <circle cx="8" cy="30" r="2.5" fill={c} opacity=".3"/>
    <circle cx="40" cy="30" r="2.5" fill={c} opacity=".3"/>
    <line x1="12" y1="18" x2="36" y2="18" stroke={c} strokeWidth="1.5" strokeDasharray="3 2" opacity=".5"/>
    <line x1="12" y1="30" x2="36" y2="30" stroke={c} strokeWidth="1.5" strokeDasharray="3 2" opacity=".5"/>
  </svg>,
  teclado_alarme:(c='#ef4444')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="8" y="4" width="32" height="40" rx="4" fill={c} opacity=".05" stroke={c} strokeWidth="2.2"/>
    <rect x="12" y="8" width="24" height="10" rx="2" fill="none" stroke={c} strokeWidth="1" opacity=".4"/>
    <text x="24" y="15" textAnchor="middle" fill={c} fontSize="5" fontWeight="700" opacity=".4">LCD</text>
    {[22,28,34].map((y,i)=>[14,22,30].map((x,j)=><rect key={i+'_'+j} x={x} y={y} width="5" height="4" rx="1" fill={c} opacity=".1" stroke={c} strokeWidth=".6"/>))}
  </svg>,
  detector_fumaca:(c='#991b1b')=><svg viewBox="0 0 48 48" width="28" height="28">
    <circle cx="24" cy="24" r="16" fill={c} opacity=".05" stroke={c} strokeWidth="2.2"/>
    <circle cx="24" cy="24" r="10" fill="none" stroke={c} strokeWidth="1.2" opacity=".3"/>
    <circle cx="24" cy="24" r="4" fill={c} opacity=".12" stroke={c} strokeWidth="1.5"/>
    <circle cx="24" cy="24" r="1.5" fill={c} opacity=".4"/>
    <path d="M20 14 Q22 10 24 14 Q26 18 28 14" fill="none" stroke={c} strokeWidth="1.2" opacity=".4"/>
    <path d="M18 12 Q21 7 24 12 Q27 17 30 12" fill="none" stroke={c} strokeWidth=".8" opacity=".25"/>
  </svg>,
  acionador_manual:(c='#991b1b')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="8" y="8" width="32" height="32" rx="4" fill={c} opacity=".08" stroke={c} strokeWidth="2.2"/>
    <rect x="12" y="12" width="24" height="24" rx="2" fill="none" stroke={c} strokeWidth="1.5" opacity=".5"/>
    <circle cx="24" cy="24" r="6" fill="none" stroke={c} strokeWidth="2"/>
    <text x="24" y="27" textAnchor="middle" fill={c} fontSize="7" fontWeight="900" opacity=".6">!</text>
    <text x="24" y="9" textAnchor="middle" fill={c} fontSize="4" fontWeight="700" opacity=".5">FIRE</text>
  </svg>,
  cancela:(c='#ea580c')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="4" y="20" width="12" height="24" rx="2" fill={c} opacity=".06" stroke={c} strokeWidth="2"/>
    <rect x="10" y="14" width="34" height="6" rx="2" fill={c} opacity=".08" stroke={c} strokeWidth="2"/>
    {[20,28,36].map((x,i)=><line key={i} x1={x} y1="14" x2={x} y2="20" stroke={c} strokeWidth="1.5" opacity=".3"/>)}
    <circle cx="10" cy="17" r="2" fill={c} opacity=".3"/>
    <rect x="6" y="36" width="8" height="4" rx="1" fill={c} opacity=".15"/>
  </svg>,
  ap_wifi:(c='#2563eb')=><svg viewBox="0 0 48 48" width="28" height="28">
    <circle cx="24" cy="32" r="10" fill={c} opacity=".05" stroke={c} strokeWidth="2.2"/>
    <circle cx="24" cy="32" r="4" fill={c} opacity=".15"/>
    <path d="M14 22 Q24 12 34 22" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    <path d="M18 26 Q24 18 30 26" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity=".6"/>
    <path d="M10 18 Q24 6 38 18" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity=".3"/>
  </svg>,
  luminaria_emerg:(c='#be123c')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="8" y="4" width="32" height="16" rx="3" fill={c} opacity=".06" stroke={c} strokeWidth="2.2"/>
    <rect x="14" y="8" width="8" height="8" rx="1" fill={c} opacity=".15"/>
    <rect x="26" y="8" width="8" height="8" rx="1" fill={c} opacity=".15"/>
    <path d="M18 20 L18 30" stroke={c} strokeWidth="2" strokeLinecap="round" opacity=".5"/>
    <path d="M30 20 L30 30" stroke={c} strokeWidth="2" strokeLinecap="round" opacity=".5"/>
    <text x="24" y="42" textAnchor="middle" fill={c} fontSize="5" fontWeight="700" opacity=".5">EXIT</text>
  </svg>,
  modulo_incendio:(c='#991b1b')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="8" y="10" width="32" height="28" rx="3" fill={c} opacity=".05" stroke={c} strokeWidth="2.2"/>
    <line x1="8" y1="16" x2="40" y2="16" stroke={c} strokeWidth="1" opacity=".3"/>
    <circle cx="14" cy="13" r="1.5" fill="#22c55e" opacity=".6"/>
    {[22,28,34].map((y,i)=><rect key={i} x="12" y={y} width="24" height="4" rx="1" fill={c} opacity=".06" stroke={c} strokeWidth=".6"/>)}
    <text x="36" y="14" textAnchor="end" fill={c} fontSize="4" fontWeight="700" opacity=".5">MOD</text>
  </svg>,
  controle_remoto:(c='#ef4444')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="14" y="4" width="20" height="40" rx="6" fill={c} opacity=".05" stroke={c} strokeWidth="2.2"/>
    <circle cx="24" cy="14" r="4" fill={c} opacity=".15" stroke={c} strokeWidth="1.2"/>
    <circle cx="20" cy="24" r="3" fill={c} opacity=".1" stroke={c} strokeWidth=".8"/>
    <circle cx="28" cy="24" r="3" fill={c} opacity=".1" stroke={c} strokeWidth=".8"/>
    <circle cx="20" cy="32" r="3" fill={c} opacity=".1" stroke={c} strokeWidth=".8"/>
    <circle cx="28" cy="32" r="3" fill={c} opacity=".1" stroke={c} strokeWidth=".8"/>
  </svg>,
  comunicador:(c='#ef4444')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="6" y="10" width="36" height="28" rx="3" fill={c} opacity=".05" stroke={c} strokeWidth="2.2"/>
    <rect x="10" y="14" width="16" height="8" rx="1.5" fill="none" stroke={c} strokeWidth="1" opacity=".4"/>
    <path d="M32 14 L36 10" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M34 16 L40 8" stroke={c} strokeWidth="1" strokeLinecap="round" opacity=".4"/>
    {[10,16,22,28,34].map((x,i)=><rect key={i} x={x} y="26" width="3" height="6" rx=".5" fill={c} opacity=".1" stroke={c} strokeWidth=".5"/>)}
    <circle cx="10" cy="34" r="1" fill="#22c55e" opacity=".6"/>
  </svg>,
  receptor_rf:(c='#ef4444')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="8" y="14" width="32" height="24" rx="3" fill={c} opacity=".05" stroke={c} strokeWidth="2.2"/>
    <line x1="20" y1="14" x2="18" y2="4" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="18" cy="4" r="1.5" fill={c} opacity=".5"/>
    <path d="M12 10 Q18 2 24 10" fill="none" stroke={c} strokeWidth="1" opacity=".3"/>
    {[14,20,26,32].map((x,i)=><circle key={i} cx={x} cy="26" r="2" fill={c} opacity=".1" stroke={c} strokeWidth=".8"/>)}
    <circle cx="36" cy="18" r="1" fill="#22c55e" opacity=".6"/>
  </svg>,
  dvr:(c='#d97706')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="2" y="10" width="44" height="28" rx="3" fill={c} opacity=".05" stroke={c} strokeWidth="2.2"/>
    <rect x="6" y="14" width="20" height="6" rx="1" fill={c} opacity=".06" stroke={c} strokeWidth=".8"/>
    <rect x="6" y="22" width="20" height="6" rx="1" fill={c} opacity=".06" stroke={c} strokeWidth=".8"/>
    <circle cx="36" cy="20" r="5" fill="none" stroke={c} strokeWidth="1.5"/>
    <circle cx="36" cy="20" r="2" fill={c} opacity=".2"/>
    <text x="36" y="32" textAnchor="middle" fill={c} fontSize="5" fontWeight="800" opacity=".5">HD</text>
  </svg>,
  cam_wifi:(c='#f59e0b')=><svg viewBox="0 0 48 48" width="28" height="28">
    <rect x="4" y="8" width="8" height="14" rx="1" fill={c} opacity=".1" stroke={c} strokeWidth="1.5"/>
    <rect x="8" y="14" width="28" height="14" rx="7" fill="none" stroke={c} strokeWidth="2.2"/>
    <circle cx="30" cy="21" r="4" fill={c} opacity=".2"/>
    <circle cx="30" cy="21" r="1.2" fill={c} opacity=".5"/>
    <path d="M36 6 Q40 2 44 6" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M38 9 Q40 6 42 9" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" opacity=".5"/>
    <circle cx="40" cy="11" r="1" fill={c} opacity=".4"/>
  </svg>,
};
