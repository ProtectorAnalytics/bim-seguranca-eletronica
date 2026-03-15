import { useState, useMemo } from 'react';
import { DEVICE_LIB } from '@/data/device-lib';
import { findDevDef } from '@/lib/helpers';
import { Search, Filter, MousePointer2 } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'name', label: 'Nome' },
  { value: 'type', label: 'Tipo' },
  { value: 'env', label: 'Ambiente' },
];

function getCategoryForKey(key) {
  for (const cat of DEVICE_LIB) {
    for (const item of cat.items) {
      if (item.key === key) return cat.cat;
    }
  }
  return 'Outros';
}

function getCategoryColor(key) {
  for (const cat of DEVICE_LIB) {
    for (const item of cat.items) {
      if (item.key === key) return cat.color;
    }
  }
  return '#888';
}

const categories = DEVICE_LIB.map(c => c.cat);

export default function DeviceListPanel({ devices, environments, onFocus, onSelect, onSelectType }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [sortBy, setSortBy] = useState('name');

  const envMap = useMemo(() => {
    const m = {};
    for (const e of environments || []) m[e.id] = e;
    return m;
  }, [environments]);

  const filtered = useMemo(() => {
    let list = (devices || []).map(d => {
      const def = findDevDef(d.key) || {};
      return { ...d, def, category: getCategoryForKey(d.key), catColor: getCategoryColor(d.key) };
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        (d.name || '').toLowerCase().includes(q) ||
        (d.model || '').toLowerCase().includes(q) ||
        (d.key || '').toLowerCase().includes(q) ||
        (d.def.name || '').toLowerCase().includes(q)
      );
    }

    if (activeCategory) {
      list = list.filter(d => d.category === activeCategory);
    }

    list.sort((a, b) => {
      if (sortBy === 'name') {
        const na = (a.def.name || a.name || '').toLowerCase();
        const nb = (b.def.name || b.name || '').toLowerCase();
        return na.localeCompare(nb, 'pt-BR');
      }
      if (sortBy === 'type') {
        const ca = a.category;
        const cb = b.category;
        if (ca !== cb) return ca.localeCompare(cb, 'pt-BR');
        return (a.key || '').localeCompare(b.key || '');
      }
      if (sortBy === 'env') {
        const ea = envMap[a.envId]?.name || '';
        const eb = envMap[b.envId]?.name || '';
        return ea.localeCompare(eb, 'pt-BR');
      }
      return 0;
    });

    return list;
  }, [devices, search, activeCategory, sortBy, envMap]);

  const typeGroups = useMemo(() => {
    const groups = {};
    for (const d of filtered) {
      if (!groups[d.key]) groups[d.key] = { key: d.key, name: d.def.name || d.name || d.key, count: 0 };
      groups[d.key].count++;
    }
    return groups;
  }, [filtered]);

  const presentCategories = useMemo(() => {
    const cats = new Set((devices || []).map(d => getCategoryForKey(d.key)));
    return categories.filter(c => cats.has(c));
  }, [devices]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#fff', fontSize: 11,
    }}>
      {/* Search */}
      <div style={{ padding: '6px 8px', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: '#F0F5FA', borderRadius: 6, padding: '4px 8px',
          border: '1px solid #E2E8F0',
        }}>
          <Search size={12} color="#888" />
          <input
            type="text"
            placeholder="Buscar dispositivo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontSize: 10, color: '#333', fontFamily: 'Inter, sans-serif',
            }}
          />
        </div>
      </div>

      {/* Sort */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '4px 8px', borderBottom: '1px solid #E2E8F0',
      }}>
        <Filter size={10} color="#888" />
        <span style={{ fontSize: 9, color: '#888', marginRight: 2 }}>Ordenar:</span>
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSortBy(opt.value)}
            style={{
              fontSize: 9, padding: '2px 6px', borderRadius: 6, border: 'none',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              background: sortBy === opt.value ? '#046BD2' : '#F0F5FA',
              color: sortBy === opt.value ? '#fff' : '#555',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Category filters */}
      {presentCategories.length > 1 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 3,
          padding: '4px 8px', borderBottom: '1px solid #E2E8F0',
        }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{
              fontSize: 9, padding: '2px 6px', borderRadius: 6, border: 'none',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              background: !activeCategory ? '#046BD2' : '#F0F5FA',
              color: !activeCategory ? '#fff' : '#555',
            }}
          >
            Todos
          </button>
          {presentCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              style={{
                fontSize: 9, padding: '2px 6px', borderRadius: 6, border: 'none',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                background: activeCategory === cat ? '#046BD2' : '#F0F5FA',
                color: activeCategory === cat ? '#fff' : '#555',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Device list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2px 0' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 16, textAlign: 'center', color: '#999', fontSize: 10 }}>
            Nenhum dispositivo encontrado
          </div>
        )}

        {sortBy === 'type' ? (
          // Grouped by type
          Object.values(typeGroups).map(group => {
            const groupDevices = filtered.filter(d => d.key === group.key);
            return (
              <div key={group.key}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '3px 8px', background: '#F0F5FA',
                  borderBottom: '1px solid #E2E8F0',
                }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: '#555' }}>
                    {group.name} ({group.count})
                  </span>
                  {onSelectType && (
                    <button
                      onClick={e => { e.stopPropagation(); onSelectType(group.key); }}
                      title="Selecionar todos deste tipo"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 2,
                        fontSize: 8, padding: '1px 5px', borderRadius: 4,
                        border: '1px solid #E2E8F0', background: '#fff',
                        cursor: 'pointer', color: '#046BD2', fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      <MousePointer2 size={8} />
                      Selecionar tipo
                    </button>
                  )}
                </div>
                {groupDevices.map(d => (
                  <DeviceRow
                    key={d.id}
                    device={d}
                    envMap={envMap}
                    onFocus={onFocus}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            );
          })
        ) : (
          filtered.map(d => (
            <DeviceRow
              key={d.id}
              device={d}
              envMap={envMap}
              onFocus={onFocus}
              onSelect={onSelect}
            />
          ))
        )}
      </div>

      {/* Footer count */}
      <div style={{
        padding: '4px 8px', borderTop: '1px solid #E2E8F0',
        fontSize: 9, color: '#888', textAlign: 'center', background: '#F0F5FA',
      }}>
        {filtered.length} dispositivo{filtered.length !== 1 ? 's' : ''}
        {filtered.length !== (devices || []).length && ` de ${(devices || []).length}`}
      </div>
    </div>
  );
}

function DeviceRow({ device, envMap, onFocus, onSelect }) {
  const env = envMap[device.envId];
  const defName = device.def?.name || device.name || device.key;
  const model = device.model || '';

  return (
    <div
      onClick={() => { onFocus?.(device); onSelect?.(device.id); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 8px', cursor: 'pointer',
        borderBottom: '1px solid #f0f0f0',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#F0F5FA'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Color dot for category */}
      <div style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: device.catColor || '#888',
      }} />

      {/* Name + model */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 10, fontWeight: 500, color: '#333',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          fontFamily: 'Inter, sans-serif',
        }}>
          {defName}
        </div>
        {model && (
          <div style={{
            fontSize: 9, color: '#888',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {model}
          </div>
        )}
      </div>

      {/* Environment */}
      {env && (
        <div style={{
          fontSize: 9, padding: '1px 5px', borderRadius: 4,
          background: (env.color || '#ccc') + '22',
          color: env.color || '#888', border: `1px solid ${(env.color || '#ccc') + '44'}`,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {env.name}
        </div>
      )}
    </div>
  );
}
