import React, { useState, useRef } from 'react';
import { APP_VERSION } from '@/data/constants';

export default function ExportModal({project, bom, allDevices, connections, onClose, onImport}){
  const [tab, setTab] = useState('export'); // export | import
  const [checks, setChecks] = useState({equipment:true, topology:true, floorplan:true});
  const [importError, setImportError] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const toggle = (k) => setChecks(c=>({...c,[k]:!c[k]}));

  // ── Export JSON ──────────────────────────────────
  const handleExportJSON = () => {
    const exportData = {
      _meta: {
        format: 'bim-protector-project',
        version: 2,
        appVersion: APP_VERSION.full,
        exportDate: new Date().toISOString(),
        deviceCount: allDevices.length,
        connectionCount: connections.length,
        floorCount: project.floors?.length || 0,
      },
      project: {
        name: project.name,
        scenario: project.scenario,
        client: project.client || {},
        floors: project.floors || [],
        activeFloor: project.activeFloor,
        settings: project.settings || {},
      }
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (project.name || 'projeto').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
    a.href = url;
    a.download = `BIM_${safeName}_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Import JSON ──────────────────────────────────
  const processFile = (file) => {
    setImportError(null);
    setImportPreview(null);

    if (!file) return;
    if (!file.name.endsWith('.json')) {
      setImportError('Arquivo deve ser .json');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setImportError('Arquivo muito grande (máx 50MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Validate structure
        if (!data._meta || data._meta.format !== 'bim-protector-project') {
          // Try legacy format (direct project object)
          if (data.floors && Array.isArray(data.floors)) {
            setImportPreview({
              projectData: data,
              meta: { version: 1, appVersion: 'desconhecida', exportDate: 'desconhecida', deviceCount: data.floors.flatMap(f=>f.devices||[]).length, connectionCount: data.floors.flatMap(f=>f.connections||[]).length, floorCount: data.floors.length },
              isLegacy: true
            });
            return;
          }
          setImportError('Arquivo não é um backup válido do BIM Protector. O formato não foi reconhecido.');
          return;
        }

        if (!data.project || !data.project.floors || !Array.isArray(data.project.floors)) {
          setImportError('Estrutura do projeto inválida: pavimentos não encontrados.');
          return;
        }

        // Validate floors have devices arrays
        for (const floor of data.project.floors) {
          if (!floor.id) { setImportError('Pavimento sem ID encontrado.'); return; }
          if (!Array.isArray(floor.devices)) floor.devices = [];
          if (!Array.isArray(floor.connections)) floor.connections = [];
          if (!Array.isArray(floor.environments)) floor.environments = [];
        }

        setImportPreview({
          projectData: data.project,
          meta: data._meta,
          isLegacy: false
        });
      } catch (err) {
        setImportError(`Erro ao ler arquivo JSON: ${err.message}`);
      }
    };
    reader.onerror = () => setImportError('Erro ao ler o arquivo.');
    reader.readAsText(file);
  };

  const handleFileChange = (e) => {
    processFile(e.target.files?.[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    processFile(file);
  };

  const confirmImport = () => {
    if (!importPreview || !onImport) return;
    onImport(importPreview.projectData);
    onClose();
  };

  const tabStyle = (t) => ({
    flex:1, padding:'8px 0', textAlign:'center', cursor:'pointer',
    fontWeight: tab===t ? 700 : 400,
    borderBottom: tab===t ? '2px solid #3498db' : '2px solid transparent',
    color: tab===t ? '#3498db' : '#888',
    fontSize: 12,
    transition: '.15s'
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e=>e.stopPropagation()} style={{maxWidth:480}}>
        <h3>📋 Projeto: Exportar / Importar</h3>

        {/* Tabs */}
        <div style={{display:'flex', borderBottom:'1px solid #eee', marginBottom:14}}>
          <div style={tabStyle('export')} onClick={()=>{setTab('export');setImportError(null);setImportPreview(null)}}>
            ⬇️ Exportar
          </div>
          <div style={tabStyle('import')} onClick={()=>setTab('import')}>
            ⬆️ Importar Backup
          </div>
        </div>

        {/* ── EXPORT TAB ── */}
        {tab==='export' && (
          <>
            <div style={{fontSize:12,color:'var(--cinza)',marginBottom:12}}>
              Projeto: <strong>{project.name}</strong> · {allDevices.length} dispositivos · {connections.length} conexões
              {project.client&&(project.client.razaoSocial||project.client.nome)&&(
                <div style={{marginTop:4}}>Cliente: <strong>{project.client.razaoSocial||project.client.nome}</strong>
                  {project.client.cnpj&&` · CNPJ: ${project.client.cnpj}`}
                  {project.client.cpf&&` · CPF: ${project.client.cpf}`}
                </div>
              )}
              {project.client?.projetoRef&&<div>Ref: {project.client.projetoRef}</div>}
            </div>

            {/* JSON Export */}
            <div style={{background:'#f0faf0', border:'1px solid #27ae60', borderRadius:6, padding:12, marginBottom:14}}>
              <div style={{fontWeight:600, fontSize:13, color:'#27ae60', marginBottom:6}}>💾 Backup JSON</div>
              <div style={{fontSize:11, color:'#666', marginBottom:8}}>
                Salva todos os dados do projeto em um arquivo JSON. Inclui pavimentos, dispositivos, conexões, ambientes e dados do cliente.
                Ideal para backup e restauração.
              </div>
              <button onClick={handleExportJSON}
                style={{width:'100%',padding:'8px 12px',background:'#27ae60',color:'#fff',border:'none',
                  borderRadius:5,cursor:'pointer',fontWeight:600,fontSize:12,transition:'.15s'}}
                onMouseOver={e=>e.currentTarget.style.background='#219a52'}
                onMouseOut={e=>e.currentTarget.style.background='#27ae60'}>
                ⬇️ Baixar Backup (.json)
              </button>
            </div>

            {/* PDF Export (placeholder) */}
            <div style={{background:'#fef9e7', border:'1px solid #f39c12', borderRadius:6, padding:12}}>
              <div style={{fontWeight:600, fontSize:13, color:'#f39c12', marginBottom:6}}>📄 Relatório PDF</div>
              <div style={{fontSize:11, color:'#666', marginBottom:8}}>
                Gera relatório profissional com planta, topologia e lista de materiais. <em>(Em breve)</em>
              </div>
              <div className="mc-row" style={{marginBottom:4}}>
                <input type="checkbox" checked={checks.equipment} onChange={()=>toggle('equipment')}/>
                <label onClick={()=>toggle('equipment')} style={{fontSize:11}}>Lista de Materiais (BOM)</label>
              </div>
              <div className="mc-row" style={{marginBottom:4}}>
                <input type="checkbox" checked={checks.topology} onChange={()=>toggle('topology')}/>
                <label onClick={()=>toggle('topology')} style={{fontSize:11}}>Topologia de Rede</label>
              </div>
              <div className="mc-row" style={{marginBottom:8}}>
                <input type="checkbox" checked={checks.floorplan} onChange={()=>toggle('floorplan')}/>
                <label onClick={()=>toggle('floorplan')} style={{fontSize:11}}>Planta por Pavimento</label>
              </div>
              <button disabled
                style={{width:'100%',padding:'8px 12px',background:'#ccc',color:'#888',border:'none',
                  borderRadius:5,cursor:'not-allowed',fontWeight:600,fontSize:12}}>
                🔒 PDF — Em breve (P0-B)
              </button>
            </div>
          </>
        )}

        {/* ── IMPORT TAB ── */}
        {tab==='import' && (
          <>
            <div style={{fontSize:11,color:'#e74c3c',background:'#fdecea',padding:8,borderRadius:5,marginBottom:12}}>
              ⚠️ Ao importar, o projeto atual será <strong>substituído</strong> pelo conteúdo do backup.
              Certifique-se de exportar o projeto atual antes se precisar mantê-lo.
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e)=>{e.preventDefault();setDragOver(true)}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={handleDrop}
              onClick={()=>fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? '#3498db' : '#ccc'}`,
                borderRadius: 8,
                padding: '28px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? '#ebf5fb' : '#fafafa',
                transition: '.15s',
                marginBottom: 12
              }}>
              <div style={{fontSize:28,marginBottom:6}}>📂</div>
              <div style={{fontSize:12,fontWeight:600,color:'#555'}}>
                Arraste o arquivo .json aqui
              </div>
              <div style={{fontSize:11,color:'#888',marginTop:4}}>
                ou clique para selecionar
              </div>
              <input ref={fileRef} type="file" accept=".json" onChange={handleFileChange}
                style={{display:'none'}}/>
            </div>

            {/* Error */}
            {importError && (
              <div style={{background:'#fdecea',border:'1px solid #e74c3c',borderRadius:5,padding:8,fontSize:11,color:'#c0392b',marginBottom:10}}>
                ❌ {importError}
              </div>
            )}

            {/* Preview */}
            {importPreview && (
              <div style={{background:'#f0faf0',border:'1px solid #27ae60',borderRadius:6,padding:12,marginBottom:10}}>
                <div style={{fontWeight:600,fontSize:13,color:'#27ae60',marginBottom:8}}>✅ Backup válido</div>
                <div style={{fontSize:11,color:'#555',lineHeight:1.6}}>
                  <div><strong>Projeto:</strong> {importPreview.projectData.name || '(sem nome)'}</div>
                  {importPreview.projectData.client?.razaoSocial && (
                    <div><strong>Cliente:</strong> {importPreview.projectData.client.razaoSocial}</div>
                  )}
                  {importPreview.projectData.client?.nome && !importPreview.projectData.client?.razaoSocial && (
                    <div><strong>Cliente:</strong> {importPreview.projectData.client.nome}</div>
                  )}
                  <div><strong>Pavimentos:</strong> {importPreview.meta.floorCount}</div>
                  <div><strong>Dispositivos:</strong> {importPreview.meta.deviceCount}</div>
                  <div><strong>Conexões:</strong> {importPreview.meta.connectionCount}</div>
                  {!importPreview.isLegacy && (
                    <>
                      <div><strong>Versão app:</strong> {importPreview.meta.appVersion}</div>
                      <div><strong>Data export:</strong> {new Date(importPreview.meta.exportDate).toLocaleString('pt-BR')}</div>
                    </>
                  )}
                  {importPreview.isLegacy && (
                    <div style={{color:'#f39c12',marginTop:4}}>⚠️ Formato legado detectado (sem metadados)</div>
                  )}
                </div>
                <button onClick={confirmImport}
                  style={{width:'100%',marginTop:10,padding:'8px 12px',background:'#3498db',color:'#fff',border:'none',
                    borderRadius:5,cursor:'pointer',fontWeight:600,fontSize:12,transition:'.15s'}}
                  onMouseOver={e=>e.currentTarget.style.background='#2980b9'}
                  onMouseOut={e=>e.currentTarget.style.background='#3498db'}>
                  ⬆️ Restaurar este backup
                </button>
              </div>
            )}
          </>
        )}

        {/* Close button */}
        <div className="mc-actions" style={{marginTop:12}}>
          <button className="mc-btn mc-btn-secondary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
