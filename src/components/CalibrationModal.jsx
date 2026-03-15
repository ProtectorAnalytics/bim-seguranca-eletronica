import React, { useRef } from 'react';

/**
 * Modal for entering real-world distance for scale calibration.
 */
export default function CalibrationModal({ calibStart, calibEnd, floor, onConfirm, onCancel }) {
  const inputRef = useRef(null);
  if (!calibStart || !calibEnd) return null;

  const dx = calibEnd.x - calibStart.x, dy = calibEnd.y - calibStart.y;
  const pixelDist = Math.sqrt(dx * dx + dy * dy);
  const currentScale = floor?.bgScale || 1;
  const currentMeters = (pixelDist / (40 * currentScale)).toFixed(2);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 'min(340px, calc(100vw - 32px))', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#8e44ad', marginBottom: 4 }}>📐 Calibrar Escala</div>
        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 16, lineHeight: 1.4 }}>
          Distância medida na imagem: <b>{currentMeters}m</b> (escala atual)
          <br />Informe a distância real entre os dois pontos marcados.
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Distância real (metros)</label>
          <input ref={inputRef} type="number" min="0.1" step="0.1" autoFocus
            defaultValue=""
            placeholder="Ex: 12.5"
            onKeyDown={e => {
              if (e.key === 'Enter') { const v = parseFloat(e.target.value); if (v > 0) onConfirm(v); }
              if (e.key === 'Escape') onCancel();
            }}
            style={{
              width: '100%', padding: '10px 12px', fontSize: 14, border: '2px solid #8e44ad', borderRadius: 8,
              outline: 'none', boxSizing: 'border-box'
            }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel}
            style={{
              flex: 1, padding: '8px 12px', fontSize: 11, fontWeight: 600, background: '#f1f5f9', color: '#64748b',
              border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer'
            }}>
            Cancelar
          </button>
          <button onClick={() => { const v = parseFloat(inputRef.current?.value); if (v > 0) onConfirm(v); else inputRef.current?.focus(); }}
            style={{
              flex: 1, padding: '8px 12px', fontSize: 11, fontWeight: 600, background: '#8e44ad', color: '#fff',
              border: 'none', borderRadius: 6, cursor: 'pointer'
            }}>
            ✅ Aplicar Escala
          </button>
        </div>
      </div>
    </div>
  );
}
