import React from 'react';

export default function EquipmentPanel({bom, allDevices, connections}){
  return (
    <div>
      <div style={{fontSize:11,fontWeight:700,color:'var(--azul)',marginBottom:8}}>
        Lista de Materiais — Projeto Completo
      </div>
      {bom.length>0?(
        <>
          <table className="eq-table">
            <thead><tr><th>Equipamento</th><th>Qtd</th><th>Unidade</th><th>Total</th></tr></thead>
            <tbody>
              {bom.map(item=>(
                <tr key={item.key}>
                  <td>
                    <div style={{fontWeight:600,fontSize:11}}>{item.name}</div>
                    <div style={{fontSize:9,color:'var(--cinza)'}}>{item.model||item.key}</div>
                  </td>
                  <td style={{textAlign:'center'}}>{item.unit==='m'?item.totalMeters||item.qty:item.qty}</td>
                  <td style={{textAlign:'center',fontSize:9,color:'var(--cinza)'}}>{item.unit}</td>
                  <td className="eq-total" style={{textAlign:'right'}}>{item.unit==='m'?item.totalMeters||item.qty:item.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="eq-footer">
            <div className="ef-row"><span>Itens únicos:</span><span>{bom.length}</span></div>
            <div className="ef-row"><span>Total dispositivos:</span><span>{allDevices.length}</span></div>
            <div className="ef-row"><span>Cabos estimados:</span><span>
              {connections.reduce((a,c)=>a+c.distance,0)}m</span></div>
            <div className="ef-row total"><span>Subtotal:</span><span>Sem preços definidos</span></div>
          </div>
        </>
      ):(
        <div style={{textAlign:'center',padding:20,color:'var(--cinza)',fontSize:11}}>
          Adicione dispositivos para gerar BOM</div>
      )}
    </div>
  );
}
