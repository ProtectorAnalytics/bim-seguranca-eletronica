import React, { useState } from 'react';
import { getSavedClients } from '@/lib/helpers';

export default function ClientListPage({onBack,onSelectClient}){
  const [clients,setClients]=useState(getSavedClients());
  const [search,setSearch]=useState('');

  const filtered=clients.filter(c=>c.nome.toLowerCase().includes(search.toLowerCase())||c.razaoSocial.toLowerCase().includes(search.toLowerCase()));

  const handleEdit=(client)=>{
    onSelectClient(client);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <button className="modal-back-btn" onClick={onBack}>← Voltar</button>

        <div className="dashboard-list" style={{maxWidth:'900px'}}>
          <h3>Clientes Cadastrados</h3>
          <input type="text" className="search-input" placeholder="Buscar por nome..." value={search} onChange={e=>setSearch(e.target.value)}/>

          {filtered.length===0?(
            <p style={{color:'rgba(255,255,255,.5)',fontSize:12,textAlign:'center',padding:'20px'}}>Nenhum cliente cadastrado</p>
          ):(
            filtered.map(c=>(
              <div key={c.id} className="list-item">
                <div className="list-item-info">
                  <h4>{c.razaoSocial||c.nome}</h4>
                  <p>{c.cnpj||c.cpf} · {c.telefone}</p>
                </div>
                <div className="list-actions">
                  <button className="list-btn" onClick={()=>handleEdit(c)}>Novo Projeto</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
