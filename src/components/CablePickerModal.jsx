import React from 'react';
import { CABLE_TYPES } from '@/data/cable-types';

/**
 * Modal for choosing a compatible cable when the selected type is incompatible.
 */
export default function CablePickerModal({ cablePicker, onConfirm, onCancel }) {
  if (!cablePicker) return null;
  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
      background: '#fff', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,.25)', padding: 20,
      zIndex: 40, minWidth: 'min(320px, calc(100vw - 32px))', maxWidth: 'min(420px, calc(100vw - 32px))'
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--azul)', marginBottom: 4 }}>
        Cabo Incompatível
      </div>
      <div style={{ fontSize: 11, color: 'var(--cinza)', marginBottom: 12, lineHeight: 1.5 }}>
        {cablePicker.reason}
      </div>
      <div style={{
        fontSize: 10, fontWeight: 700, color: 'var(--cinza)', textTransform: 'uppercase',
        letterSpacing: .5, marginBottom: 8
      }}>Cabos compatíveis:</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {cablePicker.cables.map(cabId => {
          const ct = CABLE_TYPES.find(c => c.id === cabId);
          return (
            <button key={cabId} onClick={() => onConfirm(cabId)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                border: '1px solid #e5e7eb', borderRadius: 8, background: '#fafafa',
                cursor: 'pointer', transition: '.15s', fontSize: 11, textAlign: 'left'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#EBF5FB'}
              onMouseOut={e => e.currentTarget.style.background = '#fafafa'}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: ct?.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontWeight: 600 }}>{ct?.name}</span>
              <span style={{ color: 'var(--cinza)', fontSize: 9 }}>{ct?.speed} · max {ct?.maxLen}m</span>
              <span style={{ color: 'var(--cinza)', fontSize: 9 }}>
                {ct?.group === 'power' ? '⚡ Energia' : ct?.group === 'signal' ? '📡 Sinal' : '🌐 Dados'}
              </span>
            </button>
          );
        })}
      </div>
      <button onClick={onCancel}
        style={{
          marginTop: 12, width: '100%', padding: '6px', border: '1px solid #e5e7eb',
          borderRadius: 6, background: 'transparent', color: 'var(--cinza)', fontSize: 10, cursor: 'pointer'
        }}>
        Cancelar
      </button>
    </div>
  );
}
