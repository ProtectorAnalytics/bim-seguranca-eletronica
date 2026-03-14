import React, { useState } from 'react';
import { MessageCircle, Check, Trash2, Plus } from 'lucide-react';

/**
 * CommentsPanel — sidebar panel listing all floor comments.
 * Props:
 *   comments: array of { id, x, y, text, author, resolved, createdAt }
 *   onAdd: (text) => void — add new comment (placed at center of viewport)
 *   onResolve: (commentId) => void
 *   onDelete: (commentId) => void
 *   onFocus: (comment) => void — pan canvas to comment location
 */
export default function CommentsPanel({ comments = [], onAdd, onResolve, onDelete, onFocus }) {
  const [newText, setNewText] = useState('');
  const [filter, setFilter] = useState('open'); // 'open' | 'all'

  const filtered = filter === 'open' ? comments.filter(c => !c.resolved) : comments;
  const openCount = comments.filter(c => !c.resolved).length;

  const handleAdd = () => {
    if (!newText.trim()) return;
    onAdd(newText.trim());
    setNewText('');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--azul)' }}>
          <MessageCircle size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Comentários {openCount > 0 && <span style={{
            background: '#046BD2', color: '#fff', borderRadius: 10,
            padding: '1px 6px', fontSize: 9, fontWeight: 700, marginLeft: 4,
          }}>{openCount}</span>}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setFilter('open')} style={{
            padding: '2px 8px', fontSize: 9, borderRadius: 4, cursor: 'pointer',
            background: filter === 'open' ? '#046BD2' : 'transparent',
            color: filter === 'open' ? '#fff' : '#64748b',
            border: filter === 'open' ? 'none' : '1px solid #E2E8F0',
          }}>Abertos</button>
          <button onClick={() => setFilter('all')} style={{
            padding: '2px 8px', fontSize: 9, borderRadius: 4, cursor: 'pointer',
            background: filter === 'all' ? '#046BD2' : 'transparent',
            color: filter === 'all' ? '#fff' : '#64748b',
            border: filter === 'all' ? 'none' : '1px solid #E2E8F0',
          }}>Todos</button>
        </div>
      </div>

      {/* New comment input */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        <input value={newText} onChange={e => setNewText(e.target.value)}
          placeholder="Novo comentário..."
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          style={{
            flex: 1, padding: '6px 10px', fontSize: 11, border: '1px solid #E2E8F0',
            borderRadius: 6, background: '#F0F5FA', color: '#1e293b', outline: 'none',
          }} />
        <button onClick={handleAdd} disabled={!newText.trim()} style={{
          background: '#046BD2', color: '#fff', border: 'none', borderRadius: 6,
          padding: '6px 10px', cursor: 'pointer', opacity: newText.trim() ? 1 : 0.4,
          display: 'flex', alignItems: 'center',
        }}>
          <Plus size={13} />
        </button>
      </div>

      {/* Comment list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 16, color: '#94a3b8', fontSize: 11 }}>
          {filter === 'open' ? 'Nenhum comentário aberto' : 'Nenhum comentário'}
          <div style={{ fontSize: 10, marginTop: 4 }}>
            Use a ferramenta de comentário no toolbar ou digite acima
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(c => (
            <div key={c.id} onClick={() => onFocus?.(c)} style={{
              padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
              background: c.resolved ? '#f8fafc' : '#fff',
              border: `1px solid ${c.resolved ? '#f1f5f9' : '#E2E8F0'}`,
              opacity: c.resolved ? 0.6 : 1,
              transition: 'all .15s',
            }}>
              <div style={{ fontSize: 11, color: '#1e293b', lineHeight: 1.4,
                textDecoration: c.resolved ? 'line-through' : 'none' }}>
                {c.text}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 9, color: '#94a3b8' }}>
                  {c.author || 'Você'} · {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                </span>
                <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                  {!c.resolved && (
                    <button onClick={() => onResolve(c.id)} title="Resolver" style={{
                      background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.3)',
                      borderRadius: 4, padding: '2px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    }}>
                      <Check size={10} color="#22c55e" />
                    </button>
                  )}
                  <button onClick={() => onDelete(c.id)} title="Excluir" style={{
                    background: 'rgba(239,68,68,.05)', border: '1px solid rgba(239,68,68,.2)',
                    borderRadius: 4, padding: '2px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  }}>
                    <Trash2 size={10} color="#ef4444" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
