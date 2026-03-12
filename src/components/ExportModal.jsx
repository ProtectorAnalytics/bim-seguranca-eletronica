import React, { useState, useRef } from 'react';
import { APP_VERSION } from '@/data/constants';
import { exportBomCSV } from '@/lib/csv-export';
import { useSubscription } from '../hooks/useSubscription';
import UpgradeBanner from './UpgradeBanner';

export default function ExportModal({project, bom, allDevices, connections, validationResults=[], onClose, onImport}){
  const limits = useSubscription();
  const [tab, setTab] = useState('export'); // export | import
  const [checks, setChecks] = useState({equipment:true, topology:true, floorplan:true, summary:true, validation:true});
  const [author, setAuthor] = useState('Protector Sistemas');
  const [company, setCompany] = useState('Protector Sistemas');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfResult, setPdfResult] = useState(null);
  const [pngLoading, setPngLoading] = useState(false);
  const [pngResult, setPngResult] = useState(null);
  const [pngWhiteBg, setPngWhiteBg] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const [importError, setImportError] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const toggle = (k) => setChecks(c=>({...c,[k]:!c[k]}));

  // Active floor info
  const activeFloor = project.floors?.find(f => f.id === project.activeFloor);
  const floorName = activeFloor?.name || '';

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

  // ── Export PNG ──────────────────────────────────
  const handleExportPNG = async () => {
    setPngLoading(true); setPngResult(null);
    try {
      const { exportCanvasPNG } = await import('@/lib/png-export');
      const result = await exportCanvasPNG({
        projectName: project.name,
        floorName,
        whiteBg: pngWhiteBg,
      });
      setPngResult({ success: true, fileName: result.fileName });
    } catch (err) {
      console.error('PNG export error:', err);
      setPngResult({ success: false, error: err.message });
    } finally { setPngLoading(false); }
  };

  // ── Export CSV ──────────────────────────────────
  const handleExportCSV = () => {
    setCsvResult(null);
    try {
      const result = exportBomCSV({
        projectName: project.name,
        bom,
        allDevices,
        connections,
        floors: project.floors || [],
      });
      setCsvResult({ success: true, fileName: result.fileName, rows: result.rows });
    } catch (err) {
      console.error('CSV export error:', err);
      setCsvResult({ success: false, error: err.message });
    }
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

  const btnStyle = (bg, hoverBg, loading) => ({
    width:'100%',padding:'8px 12px',
    background: loading ? '#95a5a6' : bg,
    color:'#fff',border:'none',borderRadius:5,
    cursor: loading ? 'wait' : 'pointer',
    fontWeight:600,fontSize:12,transition:'.15s'
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e=>e.stopPropagation()} style={{maxWidth:500,maxHeight:'90vh',overflowY:'auto'}}>
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
            <div style={{background:'#f0faf0', border:'1px solid #27ae60', borderRadius:6, padding:12, marginBottom:10}}>
              <div style={{fontWeight:600, fontSize:13, color:'#27ae60', marginBottom:6}}>💾 Backup JSON</div>
              <div style={{fontSize:11, color:'#666', marginBottom:8}}>
                Salva todos os dados do projeto. Ideal para backup e restauração.
              </div>
              <button onClick={handleExportJSON}
                style={btnStyle('#27ae60','#219a52',false)}
                onMouseOver={e=>e.currentTarget.style.background='#219a52'}
                onMouseOut={e=>e.currentTarget.style.background='#27ae60'}>
                ⬇️ Baixar Backup (.json)
              </button>
            </div>

            {/* PDF Export */}
            {!limits.canExportPdf && (
              <UpgradeBanner message="Exportação PDF disponível nos planos Básico e Pro." />
            )}
            <div style={{background:'#ebf5fb', border:'1px solid #3498db', borderRadius:6, padding:12, marginBottom:10, opacity: limits.canExportPdf ? 1 : 0.5, pointerEvents: limits.canExportPdf ? 'auto' : 'none'}}>
              <div style={{fontWeight:600, fontSize:13, color:'#3498db', marginBottom:6}}>📄 Relatório PDF</div>
              <div style={{fontSize:11, color:'#666', marginBottom:8}}>
                Relatório profissional com capa, resumo executivo, BOM, topologia, planta e validações.
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2px 12px',marginBottom:6}}>
                <div className="mc-row" style={{marginBottom:2}}>
                  <input type="checkbox" checked={checks.summary} onChange={()=>toggle('summary')}/>
                  <label style={{fontSize:11}}>Resumo Executivo</label>
                </div>
                <div className="mc-row" style={{marginBottom:2}}>
                  <input type="checkbox" checked={checks.equipment} onChange={()=>toggle('equipment')}/>
                  <label style={{fontSize:11}}>Lista de Materiais</label>
                </div>
                <div className="mc-row" style={{marginBottom:2}}>
                  <input type="checkbox" checked={checks.topology} onChange={()=>toggle('topology')}/>
                  <label style={{fontSize:11}}>Topologia de Rede</label>
                </div>
                <div className="mc-row" style={{marginBottom:2}}>
                  <input type="checkbox" checked={checks.floorplan} onChange={()=>toggle('floorplan')}/>
                  <label style={{fontSize:11}}>Planta do Pavimento</label>
                </div>
                <div className="mc-row" style={{marginBottom:2}}>
                  <input type="checkbox" checked={checks.validation} onChange={()=>toggle('validation')}/>
                  <label style={{fontSize:11}}>Alertas de Validação</label>
                </div>
              </div>
              <div style={{display:'flex',gap:8,marginBottom:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:'#888',marginBottom:2}}>Autor</div>
                  <input value={author} onChange={e=>setAuthor(e.target.value)}
                    style={{width:'100%',padding:'4px 6px',fontSize:11,border:'1px solid #ddd',borderRadius:3,boxSizing:'border-box'}}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:'#888',marginBottom:2}}>Empresa</div>
                  <input value={company} onChange={e=>setCompany(e.target.value)}
                    style={{width:'100%',padding:'4px 6px',fontSize:11,border:'1px solid #ddd',borderRadius:3,boxSizing:'border-box'}}/>
                </div>
              </div>
              <button onClick={async()=>{
                  setPdfLoading(true);setPdfResult(null);
                  try{
                    const {exportProjectPDF}=await import('@/lib/pdf-export');
                    const result=await exportProjectPDF({project,bom,allDevices,connections,validationResults,options:{
                      includeEquipment:checks.equipment,includeTopology:checks.topology,
                      includeFloorplan:checks.floorplan,includeSummary:checks.summary,
                      includeValidation:checks.validation,author,company}});
                    setPdfResult({success:true,pages:result.pages,fileName:result.fileName});
                  }catch(err){
                    console.error('PDF export error:',err);
                    setPdfResult({success:false,error:err.message});
                  }finally{setPdfLoading(false)}
                }}
                disabled={pdfLoading}
                style={btnStyle('#3498db','#2980b9',pdfLoading)}
                onMouseOver={e=>{if(!pdfLoading)e.currentTarget.style.background='#2980b9'}}
                onMouseOut={e=>{if(!pdfLoading)e.currentTarget.style.background='#3498db'}}>
                {pdfLoading?'⏳ Gerando PDF...':'📄 Gerar e Baixar PDF'}
              </button>
              {pdfResult&&pdfResult.success&&(
                <div style={{marginTop:6,fontSize:10,color:'#27ae60',fontWeight:600}}>
                  ✅ PDF gerado: {pdfResult.fileName} ({pdfResult.pages} páginas)
                </div>
              )}
              {pdfResult&&!pdfResult.success&&(
                <div style={{marginTop:6,fontSize:10,color:'#e74c3c'}}>
                  ❌ Erro: {pdfResult.error}
                </div>
              )}
            </div>

            {/* PNG + CSV section */}
            <div style={{display:'flex',gap:8}}>
              {/* PNG Export */}
              <div style={{flex:1,background:'#fef9ef',border:'1px solid #f39c12',borderRadius:6,padding:10}}>
                <div style={{fontWeight:600, fontSize:12, color:'#f39c12', marginBottom:4}}>📷 Imagem PNG</div>
                <div style={{fontSize:10, color:'#666', marginBottom:6}}>
                  Captura da planta{floorName?` (${floorName})`:''} como imagem.
                </div>
                <div className="mc-row" style={{marginBottom:6}}>
                  <input type="checkbox" checked={pngWhiteBg} onChange={()=>setPngWhiteBg(v=>!v)}/>
                  <label style={{fontSize:10}}>Fundo branco</label>
                </div>
                <button onClick={handleExportPNG}
                  disabled={pngLoading}
                  style={{...btnStyle('#f39c12','#e67e22',pngLoading),fontSize:11,padding:'6px 10px'}}
                  onMouseOver={e=>{if(!pngLoading)e.currentTarget.style.background='#e67e22'}}
                  onMouseOut={e=>{if(!pngLoading)e.currentTarget.style.background='#f39c12'}}>
                  {pngLoading?'⏳ Capturando...':'📷 Baixar PNG'}
                </button>
                {pngResult&&pngResult.success&&(
                  <div style={{marginTop:4,fontSize:9,color:'#27ae60',fontWeight:600}}>✅ {pngResult.fileName}</div>
                )}
                {pngResult&&!pngResult.success&&(
                  <div style={{marginTop:4,fontSize:9,color:'#e74c3c'}}>❌ {pngResult.error}</div>
                )}
              </div>

              {/* CSV Export */}
              <div style={{flex:1,background:'#f0fdf4',border:'1px solid #22c55e',borderRadius:6,padding:10}}>
                <div style={{fontWeight:600, fontSize:12, color:'#22c55e', marginBottom:4}}>📊 BOM CSV</div>
                <div style={{fontSize:10, color:'#666', marginBottom:6}}>
                  Lista de materiais para Excel/planilha.
                </div>
                <div style={{fontSize:9,color:'#888',marginBottom:6}}>
                  {bom.length} itens · sep: ponto-e-vírgula
                </div>
                <button onClick={handleExportCSV}
                  style={{...btnStyle('#22c55e','#16a34a',false),fontSize:11,padding:'6px 10px'}}
                  onMouseOver={e=>e.currentTarget.style.background='#16a34a'}
                  onMouseOut={e=>e.currentTarget.style.background='#22c55e'}>
                  📊 Baixar CSV
                </button>
                {csvResult&&csvResult.success&&(
                  <div style={{marginTop:4,fontSize:9,color:'#27ae60',fontWeight:600}}>✅ {csvResult.fileName}</div>
                )}
                {csvResult&&!csvResult.success&&(
                  <div style={{marginTop:4,fontSize:9,color:'#e74c3c'}}>❌ {csvResult.error}</div>
                )}
              </div>
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
