import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { findDevDef } from '@/lib/helpers';
import { DEVICE_LIB } from '@/data/device-lib';

const CAT_EMOJIS = {
  'CFTV IP': '📹',
  'CFTV IP - NVR': '🖥️',
  'Controle de Acesso': '🔐',
  'Intrusão - Barreiras': '🚨',
  'Automatizadores': '⚙️',
  'Rede': '🌐',
  'Wi-Fi': '📶',
  'Infraestrutura': '🔧',
};

function getCategoryForKey(key) {
  for (const cat of DEVICE_LIB) {
    for (const item of cat.items) {
      if (item.key === key) return cat.cat;
    }
  }
  return null;
}

function getEmoji(key) {
  const cat = getCategoryForKey(key);
  return cat ? (CAT_EMOJIS[cat] || '📦') : '📦';
}

function highlightMatch(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ fontWeight: 700, color: '#046BD2' }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}

const MAX_RESULTS = 8;

export default function CanvasSearch({ devices, show, onClose, onFocus, onHighlight, onSelect }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return (devices || []).filter(d => {
      const def = findDevDef(d.key);
      const name = (d.name || def?.name || '').toLowerCase();
      const key = (d.key || '').toLowerCase();
      const model = (d.model || def?.props?.resolucao || '').toLowerCase();
      return name.includes(q) || key.includes(q) || model.includes(q);
    }).slice(0, MAX_RESULTS);
  }, [query, devices]);

  // Auto-focus input when shown
  useEffect(() => {
    if (show && inputRef.current) {
      inputRef.current.focus();
    }
    if (!show) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [show]);

  // Highlight matching devices on canvas
  useEffect(() => {
    if (!show) return;
    if (results.length > 0) {
      onHighlight(new Set(results.map(d => d.id)));
    } else if (query.trim()) {
      onHighlight(new Set());
    } else {
      onHighlight(null);
    }
  }, [results, query, show]);

  // Clean up highlight on close
  useEffect(() => {
    if (!show) {
      onHighlight(null);
    }
  }, [show]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [results.length, query]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const active = listRef.current.children[activeIndex];
      if (active) active.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const handleSelect = useCallback((device) => {
    onFocus(device);
    onSelect(device.id);
    onHighlight(null);
    onClose();
  }, [onFocus, onSelect, onHighlight, onClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onHighlight(null);
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results[activeIndex]) {
        handleSelect(results[activeIndex]);
      }
    }
  }, [results, activeIndex, handleSelect, onHighlight, onClose]);

  const handleClear = useCallback(() => {
    setQuery('');
    onHighlight(null);
    inputRef.current?.focus();
  }, [onHighlight]);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: 380,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,.2)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Search input */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', gap: 6 }}>
        <Search size={16} color="#94a3b8" style={{ flexShrink: 0, marginLeft: 4 }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar dispositivo por nome, tipo ou modelo..."
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: 13,
            border: 'none',
            outline: 'none',
            borderRadius: 10,
            background: 'transparent',
            color: '#1e293b',
            fontFamily: 'Inter, sans-serif',
          }}
        />
        {query && (
          <button
            onClick={handleClear}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              border: 'none',
              borderRadius: 6,
              background: '#F0F5FA',
              cursor: 'pointer',
              flexShrink: 0,
              padding: 0,
            }}
          >
            <X size={14} color="#64748b" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {query.trim() && (
        <div
          ref={listRef}
          style={{
            borderTop: '1px solid #E2E8F0',
            maxHeight: 320,
            overflowY: 'auto',
            padding: '4px 0',
          }}
        >
          {results.length === 0 ? (
            <div
              style={{
                padding: '12px 16px',
                fontSize: 13,
                color: '#94a3b8',
                textAlign: 'center',
              }}
            >
              Nenhum dispositivo encontrado
            </div>
          ) : (
            results.map((device, idx) => {
              const def = findDevDef(device.key);
              const emoji = getEmoji(device.key);
              const displayName = device.name || def?.name || device.key;
              const model = device.model || def?.props?.resolucao || '';
              const isActive = idx === activeIndex;

              return (
                <div
                  key={device.id}
                  onClick={() => handleSelect(device)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 12px',
                    cursor: 'pointer',
                    background: isActive ? '#F0F5FA' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0, width: 28, textAlign: 'center' }}>
                    {emoji}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: '#1e293b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {highlightMatch(displayName, query)}
                    </div>
                    {model && (
                      <div
                        style={{
                          fontSize: 11,
                          color: '#94a3b8',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: 1,
                        }}
                      >
                        {highlightMatch(model, query)}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#94a3b8',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ({Math.round(device.x)}, {Math.round(device.y)})
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
