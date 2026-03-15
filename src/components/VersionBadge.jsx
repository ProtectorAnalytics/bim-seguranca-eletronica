import React, { useState } from 'react';
import { APP_VERSION } from '@/data/constants';

export default function VersionBadge() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        position: 'fixed', bottom: 12, left: 12, zIndex: 9999,
        background: '#fff', borderRadius: 10,
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(0,0,0,.08)',
        padding: expanded ? '10px 14px' : '6px 10px',
        cursor: 'pointer', transition: 'all .2s ease',
        fontFamily: 'Inter, sans-serif',
        userSelect: 'none',
        maxWidth: 220,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', letterSpacing: '-0.01em' }}>
          Protector
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#fff',
          background: '#046BD2', borderRadius: 4,
          padding: '1px 6px', lineHeight: '16px',
        }}>
          {APP_VERSION.full}
        </span>
      </div>

      {expanded && (
        <div style={{ marginTop: 6, borderTop: '1px solid #f1f5f9', paddingTop: 6 }}>
          <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.6 }}>
            Build <span style={{ fontWeight: 600, color: '#1e293b' }}>#{APP_VERSION.buildNumber}</span>
            <span style={{ margin: '0 4px', opacity: 0.4 }}>·</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1e293b' }}>{APP_VERSION.commitHash}</span>
          </div>
          <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.6 }}>
            Atualizado <span style={{ fontWeight: 600, color: '#1e293b' }}>{APP_VERSION.date}</span>
          </div>
        </div>
      )}
    </div>
  );
}
