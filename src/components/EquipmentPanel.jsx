import React, { useState, useMemo } from 'react';
import { Download, DollarSign, ChevronDown, ChevronRight } from 'lucide-react';

export default function EquipmentPanel({ bom, allDevices, connections, projectName }) {
  const [showPrices, setShowPrices] = useState(false);
  const [prices, setPrices] = useState({}); // { itemKey: pricePerUnit }
  const [collapsedCats, setCollapsedCats] = useState({});

  // Group BOM by category
  const grouped = useMemo(() => {
    const groups = {};
    bom.forEach(item => {
      const cat = item.category || 'Outros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [bom]);

  const totalCableMeters = useMemo(() =>
    connections.reduce((a, c) => a + (c.distance || 0), 0), [connections]);

  const totalWithPrices = useMemo(() => {
    return bom.reduce((sum, item) => {
      const qty = item.unit === 'm' ? (item.totalMeters || item.qty) : item.qty;
      const price = prices[item.key] || 0;
      return sum + qty * price;
    }, 0);
  }, [bom, prices]);

  const handlePriceChange = (key, value) => {
    const num = parseFloat(value) || 0;
    setPrices(prev => ({ ...prev, [key]: num }));
  };

  const exportBomCsv = () => {
    const header = showPrices
      ? 'Equipamento;Modelo;Categoria;Qtd;Unidade;Preco Unit;Subtotal'
      : 'Equipamento;Modelo;Categoria;Qtd;Unidade';
    const rows = bom.map(item => {
      const qty = item.unit === 'm' ? (item.totalMeters || item.qty) : item.qty;
      const base = `${item.name};${item.model || item.key};${item.category || ''};${qty};${item.unit}`;
      if (showPrices) {
        const price = prices[item.key] || 0;
        return `${base};${price.toFixed(2)};${(qty * price).toFixed(2)}`;
      }
      return base;
    });
    if (showPrices) {
      rows.push(`;;;;;;${totalWithPrices.toFixed(2)}`);
    }
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BOM_${(projectName || 'projeto').replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleCat = (cat) => setCollapsedCats(prev => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--azul)' }}>
          Lista de Materiais (BOM)
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setShowPrices(!showPrices)} style={{
            background: showPrices ? 'rgba(4,107,210,.15)' : 'transparent',
            border: '1px solid #E2E8F0', borderRadius: 6, padding: '3px 8px',
            fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
            color: showPrices ? '#046BD2' : '#64748b',
          }} title="Mostrar preços">
            <DollarSign size={11} /> Preços
          </button>
          <button onClick={exportBomCsv} style={{
            background: 'transparent', border: '1px solid #E2E8F0', borderRadius: 6,
            padding: '3px 8px', fontSize: 10, cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: 3, color: '#64748b',
          }} title="Exportar CSV">
            <Download size={11} /> CSV
          </button>
        </div>
      </div>

      {bom.length > 0 ? (
        <>
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: 6 }}>
              <div onClick={() => toggleCat(cat)} style={{
                display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
                fontSize: 10, fontWeight: 700, color: '#64748b', padding: '4px 0',
                borderBottom: '1px solid #f1f5f9',
              }}>
                {collapsedCats[cat] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                {cat} ({items.length})
              </div>
              {!collapsedCats[cat] && (
                <table className="eq-table" style={{ marginTop: 2 }}>
                  <thead><tr>
                    <th>Equipamento</th><th style={{ width: 40 }}>Qtd</th>
                    {showPrices && <th style={{ width: 70 }}>R$ Unit</th>}
                    {showPrices && <th style={{ width: 70 }}>Subtotal</th>}
                  </tr></thead>
                  <tbody>
                    {items.map(item => {
                      const qty = item.unit === 'm' ? (item.totalMeters || item.qty) : item.qty;
                      const unitPrice = prices[item.key] || 0;
                      return (
                        <tr key={item.key}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 11 }}>{item.name}</div>
                            <div style={{ fontSize: 9, color: 'var(--cinza)' }}>
                              {item.model || item.key}{item.unit === 'm' ? ` · ${qty}m` : ''}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>{qty}{item.unit === 'm' ? 'm' : ''}</td>
                          {showPrices && (
                            <td>
                              <input type="number" value={unitPrice || ''} min="0" step="0.01"
                                onChange={e => handlePriceChange(item.key, e.target.value)}
                                placeholder="0,00"
                                style={{
                                  width: '100%', padding: '2px 4px', fontSize: 10, border: '1px solid #E2E8F0',
                                  borderRadius: 4, background: '#F0F5FA', color: '#1e293b', textAlign: 'right',
                                }} />
                            </td>
                          )}
                          {showPrices && (
                            <td style={{ textAlign: 'right', fontSize: 10, fontWeight: 600, color: unitPrice > 0 ? '#1e293b' : '#cbd5e1' }}>
                              {unitPrice > 0 ? `R$ ${(qty * unitPrice).toFixed(2)}` : '—'}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ))}

          <div className="eq-footer" style={{ marginTop: 8 }}>
            <div className="ef-row"><span>Itens únicos:</span><span>{bom.length}</span></div>
            <div className="ef-row"><span>Total dispositivos:</span><span>{allDevices.length}</span></div>
            <div className="ef-row"><span>Cabos estimados:</span><span>{totalCableMeters}m</span></div>
            {showPrices && (
              <div className="ef-row total" style={{ color: totalWithPrices > 0 ? '#046BD2' : undefined }}>
                <span>Total estimado:</span>
                <span>{totalWithPrices > 0 ? `R$ ${totalWithPrices.toFixed(2)}` : 'Preencha preços'}</span>
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 20, color: 'var(--cinza)', fontSize: 11 }}>
          Adicione dispositivos para gerar BOM
        </div>
      )}
    </div>
  );
}
