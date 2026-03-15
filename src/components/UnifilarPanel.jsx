import React from 'react';
import { findDevDef } from '@/lib/helpers';
import { needsACPower, needsDCPower } from '@/data/device-interfaces';

/**
 * Diagrama Unifilar Elétrico panel for the right sidebar.
 */
export default function UnifilarPanel({ devices }) {
  const tensao = 230;
  const fp = 0.92;
  const circuits = [];
  let circNum = 1;
  const envGroups = {};
  devices.forEach(d => {
    const envName = d.ambiente || 'Geral';
    if (!envGroups[envName]) envGroups[envName] = [];
    envGroups[envName].push(d);
  });
  Object.entries(envGroups).forEach(([envName, devs]) => {
    const poeDevs = devs.filter(d => { const def = findDevDef(d.key); return def?.poe; });
    const acDevs = devs.filter(d => needsACPower(d.key));
    const dcDevs = devs.filter(d => needsDCPower(d.key) && !findDevDef(d.key)?.poe);
    if (poeDevs.length > 0) {
      const totalW = poeDevs.reduce((s, d) => { const def = findDevDef(d.key); return s + (def?.poeW || 15); }, 0);
      const corrente = (totalW / (tensao * fp)).toFixed(1);
      const secao = totalW < 400 ? '1.5' : totalW < 800 ? '2.5' : '4.0';
      const disj = corrente < 10 ? 10 : corrente < 16 ? 16 : corrente < 20 ? 20 : corrente < 25 ? 25 : 32;
      circuits.push({ num: circNum++, env: envName, desc: `CFTV/PoE (${poeDevs.length} câm.)`, potencia: totalW, tensao, corrente, secao, disj, idr: true, dps: true, devs: poeDevs });
    }
    if (acDevs.length > 0) {
      const totalW = acDevs.reduce((s, d) => { const def = findDevDef(d.key); const p = parseInt(def?.props?.potencia) || 100; return s + p; }, 0);
      const corrente = (totalW / (tensao * fp)).toFixed(1);
      const secao = totalW < 400 ? '1.5' : totalW < 800 ? '2.5' : totalW < 1500 ? '4.0' : '6.0';
      const disj = corrente < 10 ? 10 : corrente < 16 ? 16 : corrente < 20 ? 20 : corrente < 25 ? 25 : corrente < 32 ? 32 : 40;
      circuits.push({ num: circNum++, env: envName, desc: `Equip. AC (${acDevs.length} un.)`, potencia: totalW, tensao, corrente, secao, disj, idr: true, dps: true, devs: acDevs });
    }
    if (dcDevs.length > 0) {
      const totalW = dcDevs.length * 5;
      circuits.push({ num: circNum++, env: envName, desc: `Sensores/DC (${dcDevs.length} un.)`, potencia: totalW, tensao: 12, corrente: (totalW / 12).toFixed(1), secao: '0.75', disj: 6, idr: false, dps: false, devs: dcDevs });
    }
  });
  const totalPot = circuits.reduce((s, c) => s + c.potencia, 0);
  const totalCorr = (totalPot / (tensao * fp)).toFixed(1);
  const djGeral = totalCorr < 25 ? 25 : totalCorr < 32 ? 32 : totalCorr < 40 ? 40 : totalCorr < 50 ? 50 : 63;

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--azul)', marginBottom: 8 }}>⚡ Diagrama Unifilar</div>
      {devices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 20, color: 'var(--cinza)', fontSize: 11 }}>
          Adicione dispositivos para gerar o unifilar</div>
      ) : (
        <div>
          <div style={{ background: '#F0F5FA', borderRadius: 6, padding: 8, marginBottom: 8, color: '#1e293b', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>QGBT — Quadro Geral</div>
            <div style={{ fontSize: 9, color: '#94a3b8', lineHeight: 1.6 }}>
              Pot. Total: {totalPot}W ({(totalPot / 1000).toFixed(1)}kW)<br />
              Corrente: {totalCorr}A @ {tensao}V<br />
              DJ Geral: {djGeral}A tripolar<br />
              IDR Geral: 30mA<br />
              DPS Classe II: Sim<br />
              Circuitos: {circuits.length}
            </div>
          </div>
          <div style={{ fontSize: 9, marginBottom: 8 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '24px 1fr 50px 40px 32px 28px', gap: 2,
              padding: '4px 0', borderBottom: '2px solid var(--azul)', fontWeight: 700, color: 'var(--azul)'
            }}>
              <span>#</span><span>Circuito</span><span>W</span><span>mm²</span><span>DJ</span><span>IDR</span>
            </div>
            {circuits.map(c => (
              <div key={c.num} style={{
                display: 'grid', gridTemplateColumns: '24px 1fr 50px 40px 32px 28px', gap: 2,
                padding: '3px 0', borderBottom: '1px solid #eee', alignItems: 'center'
              }}>
                <span style={{ fontWeight: 700, color: 'var(--azul)' }}>{c.num}</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{c.desc}</div>
                  <div style={{ fontSize: 8, color: '#94a3b8' }}>{c.env}</div>
                </div>
                <span>{c.potencia}</span>
                <span>{c.secao}</span>
                <span>{c.disj}A</span>
                <span>{c.idr ? '✓' : '—'}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 8, color: '#94a3b8', lineHeight: 1.5, borderTop: '1px solid #eee', paddingTop: 6 }}>
            <strong>Normas:</strong> NBR 5410 · IEC 60617<br />
            <strong>Condutor:</strong> Seção nominal (mm²) c/ queda tensão ≤4%<br />
            <strong>IDR:</strong> 30mA · <strong>DPS:</strong> Classe II em todos circuitos<br />
            <strong>Condutor Terra:</strong> Verde-amarelo em todos
          </div>
        </div>
      )}
    </div>
  );
}
