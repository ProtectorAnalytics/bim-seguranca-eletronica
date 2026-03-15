import React, { useState } from 'react';
import { APP_VERSION, SCENARIOS } from '@/data/constants';
import { Cloud, HardDrive } from 'lucide-react';

export default function ClientForm({data,setData,onStart,onBack,storageMode,onStorageModeChange}){
  const upd=(k,v)=>setData(d=>({...d,[k]:v}));
  const canProceed=data.tipo==='pj'?(data.razaoSocial||data.nome):data.nome;
  const [cnpjLoading,setCnpjLoading]=useState(false);
  const [cnpjStatus,setCnpjStatus]=useState(null);
  const [cepLoading,setCepLoading]=useState(false);
  const [cepStatus,setCepStatus]=useState(null);
  const [selectedScenario,setSelectedScenario]=useState(null);

  const fetchCNPJ=async(cnpjRaw)=>{
    const digits=cnpjRaw.replace(/\D/g,'');
    if(digits.length!==14){setCnpjStatus(null);return}
    setCnpjLoading(true);setCnpjStatus(null);
    try{
      const res=await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if(!res.ok) throw new Error(res.status===404?'notfound':'error');
      const d=await res.json();
      const updates={};
      if(d.razao_social) updates.razaoSocial=d.razao_social;
      if(d.nome_fantasia) updates.nome=d.nome_fantasia;
      const addr=[d.logradouro,d.numero,d.complemento].filter(Boolean).join(', ');
      if(addr) updates.endereco=addr;
      if(d.municipio) updates.cidade=d.municipio;
      if(d.uf) updates.uf=d.uf;
      if(d.cep) updates.cep=d.cep.replace(/(\d{5})(\d{3})/,'$1-$2');
      if(d.email && d.email!=='null' && d.email.includes('@')) updates.email=d.email;
      if(d.ddd_telefone_1 && d.ddd_telefone_1.length>=10){
        const t=d.ddd_telefone_1.replace(/\D/g,'');
        if(t.length>=10) updates.telefone=`(${t.slice(0,2)}) ${t.length>10?t.slice(2,7)+'-'+t.slice(7):t.slice(2,6)+'-'+t.slice(6)}`;
      }
      setData(prev=>({...prev,...updates}));
      setCnpjStatus('success');
    }catch(err){
      setCnpjStatus(err.message==='notfound'?'notfound':'error');
    }finally{setCnpjLoading(false)}
  };

  const fetchCEP=async(cepRaw)=>{
    const digits=cepRaw.replace(/\D/g,'').slice(0,8);
    if(digits.length!==8){setCepStatus(null);return}
    setCepLoading(true);setCepStatus(null);
    try{
      const res=await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`);
      if(!res.ok) throw new Error(res.status===404?'notfound':'error');
      const d=await res.json();
      const updates={};
      if(d.street) updates.endereco=d.street;
      if(d.city) updates.cidade=d.city;
      if(d.state) updates.uf=d.state;
      if(d.neighborhood) updates.bairro=d.neighborhood;
      setData(prev=>({...prev,...updates}));
      setCepStatus('success');
    }catch(err){
      setCepStatus(err.message==='notfound'?'notfound':'error');
    }finally{setCepLoading(false)}
  };

  const maskCNPJ=(v)=>{
    const d=v.replace(/\D/g,'').slice(0,14);
    if(d.length<=2) return d;
    if(d.length<=5) return d.replace(/(\d{2})(\d)/,'$1.$2');
    if(d.length<=8) return d.replace(/(\d{2})(\d{3})(\d)/,'$1.$2.$3');
    if(d.length<=12) return d.replace(/(\d{2})(\d{3})(\d{3})(\d)/,'$1.$2.$3/$4');
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d)/,'$1.$2.$3/$4-$5');
  };
  const maskCPF=(v)=>{
    const d=v.replace(/\D/g,'').slice(0,11);
    if(d.length<=3) return d;
    if(d.length<=6) return d.replace(/(\d{3})(\d)/,'$1.$2');
    if(d.length<=9) return d.replace(/(\d{3})(\d{3})(\d)/,'$1.$2.$3');
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d)/,'$1.$2.$3-$4');
  };
  const maskCEP=(v)=>{
    const d=v.replace(/\D/g,'').slice(0,8);
    if(d.length<=5) return d;
    return d.replace(/(\d{5})(\d)/,'$1-$2');
  };
  const maskPhone=(v)=>{
    const d=v.replace(/\D/g,'').slice(0,11);
    if(d.length<=2) return d.length?`(${d}`:d;
    if(d.length<=6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    if(d.length<=10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  };

  const canCreate = canProceed && selectedScenario;

  return (
    <div className="landing">
      <img src="/logo-proti.png" alt="Protector" style={{height:48,marginBottom:8,filter:'drop-shadow(0 2px 8px rgba(0,0,0,.15))'}}/>
      <div style={{fontSize:11,color:'var(--cinza)',marginBottom:16}}>{APP_VERSION.label} · {APP_VERSION.date}</div>

      <div className="client-form">
        <div className="cf-title">Novo Projeto</div>
        <div className="cf-sub">Preencha os dados do cliente e selecione o cenário</div>

        {/* Tipo de pessoa */}
        <div style={{display:'flex',gap:8,marginBottom:16,maxWidth:400}}>
          {[{id:'pj',label:'Pessoa Jurídica',icon:'🏢'},{id:'pf',label:'Pessoa Física',icon:'👤'}].map(t=>(
            <button key={t.id} onClick={()=>upd('tipo',t.id)}
              style={{flex:1,padding:'8px',borderRadius:8,border:`2px solid ${data.tipo===t.id?'var(--azul)':'var(--cinzaM)'}`,
                background:data.tipo===t.id?'rgba(4,107,210,.08)':'var(--branco)',
                color:data.tipo===t.id?'var(--azul)':'#64748b',
                fontSize:11,fontWeight:700,cursor:'pointer',transition:'.2s'}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Layout paisagem: 2 colunas */}
        <div className="cf-landscape">
          {/* Coluna esquerda: Dados + Endereço */}
          <div className="cf-landscape-col">
            <div className="cf-section">{data.tipo==='pj'?'Dados da Empresa':'Dados Pessoais'}</div>
            <div className="cf-grid">
              {data.tipo==='pj'&&(
                <div className="cf-field" style={{gridColumn:'1/-1'}}>
                  <label>Razão Social *</label>
                  <input value={data.razaoSocial} onChange={e=>upd('razaoSocial',e.target.value)} placeholder="Nome da empresa"/>
                </div>
              )}
              <div className="cf-field" style={data.tipo==='pf'?{gridColumn:'1/-1'}:{}}>
                <label>{data.tipo==='pj'?'Nome Fantasia':'Nome Completo *'}</label>
                <input value={data.nome} onChange={e=>upd('nome',e.target.value)} placeholder={data.tipo==='pj'?'Nome fantasia':'Nome do cliente'}/>
              </div>
              <div className="cf-field">
                <label>{data.tipo==='pj'?'CNPJ':'CPF'}
                  {data.tipo==='pj'&&cnpjStatus==='success'&&<span style={{color:'#22c55e',marginLeft:6,fontSize:9}}>✓ Encontrado</span>}
                  {data.tipo==='pj'&&cnpjStatus==='notfound'&&<span style={{color:'#ef4444',marginLeft:6,fontSize:9}}>✕ Não encontrado</span>}
                  {data.tipo==='pj'&&cnpjStatus==='error'&&<span style={{color:'#ef4444',marginLeft:6,fontSize:9}}>✕ Erro na consulta</span>}
                </label>
                <div style={{display:'flex',gap:6}}>
                  <input value={data.tipo==='pj'?data.cnpj:data.cpf} style={{flex:1}}
                    onChange={e=>{
                      const val=data.tipo==='pj'?maskCNPJ(e.target.value):maskCPF(e.target.value);
                      upd(data.tipo==='pj'?'cnpj':'cpf',val);
                      if(data.tipo==='pj'&&val.replace(/\D/g,'').length===14) fetchCNPJ(val);
                    }}
                    placeholder={data.tipo==='pj'?'00.000.000/0000-00':'000.000.000-00'}/>
                  {data.tipo==='pj'&&(
                    <button onClick={()=>fetchCNPJ(data.cnpj)} disabled={cnpjLoading||data.cnpj.replace(/\D/g,'').length!==14}
                      style={{padding:'0 12px',borderRadius:8,border:'1px solid var(--cinzaM)',
                        background:cnpjLoading?'#f8fafc':'rgba(4,107,210,.06)',
                        color:cnpjLoading?'#94a3b8':'var(--azul)',fontSize:10,fontWeight:700,
                        cursor:cnpjLoading?'wait':'pointer',whiteSpace:'nowrap',transition:'.2s'}}>
                      {cnpjLoading?'⏳':'🔍'} Buscar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="cf-section">Endereço</div>
            <div className="cf-grid">
              <div className="cf-field" style={{gridColumn:'1/-1'}}>
                <label>Endereço</label>
                <input value={data.endereco} onChange={e=>upd('endereco',e.target.value)} placeholder="Rua, número, complemento"/>
              </div>
              <div className="cf-field">
                <label>Cidade</label>
                <input value={data.cidade} onChange={e=>upd('cidade',e.target.value)} placeholder="Cidade"/>
              </div>
              <div className="cf-field">
                <label>UF</label>
                <select value={data.uf} onChange={e=>upd('uf',e.target.value)}>
                  <option value="">Selecione</option>
                  {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(u=>(
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="cf-field">
                <label>CEP
                  {cepStatus==='success'&&<span style={{color:'#22c55e',marginLeft:6,fontSize:9}}>✓ Encontrado</span>}
                  {cepStatus==='notfound'&&<span style={{color:'#ef4444',marginLeft:6,fontSize:9}}>✕ Não encontrado</span>}
                  {cepStatus==='error'&&<span style={{color:'#ef4444',marginLeft:6,fontSize:9}}>✕ Erro</span>}
                </label>
                <div style={{display:'flex',gap:6}}>
                  <input value={data.cep} style={{flex:1}}
                    onChange={e=>{
                      const val=maskCEP(e.target.value);
                      upd('cep',val);
                      if(val.replace(/\D/g,'').length===8) fetchCEP(val);
                    }}
                    placeholder="00000-000"/>
                  <button onClick={()=>fetchCEP(data.cep)} disabled={cepLoading||data.cep.replace(/\D/g,'').length!==8}
                    style={{padding:'0 10px',borderRadius:8,border:'1px solid var(--cinzaM)',
                      background:cepLoading?'#f8fafc':'rgba(4,107,210,.06)',
                      color:cepLoading?'#94a3b8':'var(--azul)',fontSize:10,fontWeight:700,
                      cursor:cepLoading?'wait':'pointer',whiteSpace:'nowrap',transition:'.2s'}}>
                    {cepLoading?'⏳':'🔍'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna direita: Contato + Projeto + Cenário */}
          <div className="cf-landscape-col">
            <div className="cf-section">Contato</div>
            <div className="cf-grid">
              <div className="cf-field">
                <label>Pessoa de Contato</label>
                <input value={data.contato} onChange={e=>upd('contato',e.target.value)} placeholder="Nome do responsável"/>
              </div>
              <div className="cf-field">
                <label>Telefone</label>
                <input value={data.telefone} onChange={e=>upd('telefone',maskPhone(e.target.value))} placeholder="(00) 00000-0000"/>
              </div>
              <div className="cf-field" style={{gridColumn:'1/-1'}}>
                <label>E-mail</label>
                <input value={data.email} onChange={e=>upd('email',e.target.value)} placeholder="email@empresa.com" type="email"/>
              </div>
            </div>

            <div className="cf-section">Projeto</div>
            <div className="cf-grid">
              <div className="cf-field">
                <label>Nome do Projeto</label>
                <input value={data.projetoNome} onChange={e=>upd('projetoNome',e.target.value)} placeholder="Ex: CFTV Matriz 2026"/>
              </div>
              <div className="cf-field">
                <label>Referência / Proposta</label>
                <input value={data.projetoRef} onChange={e=>upd('projetoRef',e.target.value)} placeholder="Ex: PROP-2026-042"/>
              </div>
            </div>
            <div className="cf-grid full" style={{marginTop:8}}>
              <div className="cf-field">
                <label>Observações</label>
                <textarea value={data.obs} onChange={e=>upd('obs',e.target.value)} placeholder="Notas adicionais sobre o projeto..." rows="2"/>
              </div>
            </div>

            {/* Cenário do projeto */}
            <div className="cf-section">Cenário do Projeto</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:12}}>
              {SCENARIOS.map(s=>(
                <button key={s.id} onClick={()=>setSelectedScenario(s.id)}
                  style={{
                    padding:'12px 6px',borderRadius:10,cursor:'pointer',transition:'.2s',textAlign:'center',
                    border: selectedScenario===s.id ? '2px solid var(--azul)' : '1px solid var(--cinzaM)',
                    background: selectedScenario===s.id ? 'rgba(4,107,210,.06)' : 'var(--branco)',
                    boxShadow: selectedScenario===s.id ? '0 2px 8px rgba(4,107,210,.15)' : 'var(--sombra)',
                  }}>
                  <div style={{fontSize:24,marginBottom:4}}>{s.icon}</div>
                  <div style={{fontSize:11,fontWeight:700,color: selectedScenario===s.id ? 'var(--azul)' : '#1e293b',lineHeight:1.2}}>{s.name}</div>
                  <div style={{fontSize:9,color:'#94a3b8',marginTop:2}}>{s.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Salvar em */}
        {onStorageModeChange && (
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,marginTop:8}}>
            <span style={{fontSize:11,color:'#64748b',fontWeight:600}}>Salvar em:</span>
            <button onClick={()=>onStorageModeChange('cloud')}
              style={{display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:6,fontSize:11,cursor:'pointer',
                border: storageMode==='cloud' ? '2px solid var(--azul)' : '1px solid var(--cinzaM)',
                background: storageMode==='cloud' ? 'rgba(4,107,210,.08)' : 'var(--branco)',
                color: storageMode==='cloud' ? 'var(--azul)' : '#64748b',transition:'.2s',fontWeight:600}}>
              <Cloud size={13}/> Nuvem
            </button>
            <button onClick={()=>onStorageModeChange('local')}
              style={{display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:6,fontSize:11,cursor:'pointer',
                border: storageMode==='local' ? '2px solid #64748b' : '1px solid var(--cinzaM)',
                background: storageMode==='local' ? 'rgba(100,116,139,.08)' : 'var(--branco)',
                color: storageMode==='local' ? '#1e293b' : '#94a3b8',transition:'.2s',fontWeight:600}}>
              <HardDrive size={13}/> Local
            </button>
          </div>
        )}

        <div className="cf-actions">
          {onBack&&<button className="cf-btn secondary" onClick={onBack}>← Voltar</button>}
          <button className="cf-btn primary" onClick={()=>canCreate && onStart(selectedScenario)}
            disabled={!canCreate}
            style={{opacity:canCreate?1:.4,cursor:canCreate?'pointer':'not-allowed'}}>
            Criar Projeto →
          </button>
        </div>
      </div>
    </div>
  );
}
