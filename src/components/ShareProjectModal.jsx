import React, { useState, useEffect } from 'react';
import { X, Copy, Mail, MessageCircle, Link2, Eye, Pencil, Shield, Clock, Users, Trash2, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { createShare, listShares, revokeShare, getShareUrl, getWhatsAppShareUrl, getEmailShareUrl } from '@/lib/projectSharing';
import { useAuth } from '../contexts/AuthContext';

const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 9999,
  background: 'rgba(0,0,0,0.5)', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  fontFamily: 'Inter, sans-serif',
};

const modalStyle = {
  background: '#fff', borderRadius: 16, width: '95%', maxWidth: 520,
  maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
};

const btnPrimary = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '10px 20px', borderRadius: 10, border: 'none',
  background: '#046BD2', color: '#fff', fontSize: 14,
  fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  transition: 'background 0.15s',
};

const btnOutline = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 8,
  border: '1.5px solid #E2E8F0', background: '#fff',
  color: '#333', fontSize: 13, cursor: 'pointer',
  fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
};

const selectStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1.5px solid #E2E8F0', fontSize: 13,
  fontFamily: 'Inter, sans-serif', background: '#fff',
  color: '#333', outline: 'none',
};

const inputStyle = {
  ...selectStyle, boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: 12, fontWeight: 600, color: '#555',
  marginBottom: 4, display: 'block',
};

export default function ShareProjectModal({ projectId, projectName, onClose }) {
  const { user, getAccessToken } = useAuth();
  const [permission, setPermission] = useState('view');
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [expiresIn, setExpiresIn] = useState('never');
  const [maxUses, setMaxUses] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdShare, setCreatedShare] = useState(null);
  const [copied, setCopied] = useState(false);
  const [shares, setShares] = useState([]);
  const [_loadingShares, setLoadingShares] = useState(false);
  const [showExisting, setShowExisting] = useState(false);
  const [error, setError] = useState('');

  // Load existing shares
  useEffect(() => {
    (async () => {
      setLoadingShares(true);
      const token = await getAccessToken();
      if (token) {
        const { shares: s } = await listShares(projectId, token);
        setShares(s.filter(sh => sh.is_active));
      }
      setLoadingShares(false);
    })();
  }, [projectId]);

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const token = await getAccessToken();
      if (!token) { setError('Sessão expirada'); setCreating(false); return; }

      let expiresAt = null;
      if (expiresIn === '1h') expiresAt = new Date(Date.now() + 3600000).toISOString();
      else if (expiresIn === '24h') expiresAt = new Date(Date.now() + 86400000).toISOString();
      else if (expiresIn === '7d') expiresAt = new Date(Date.now() + 604800000).toISOString();
      else if (expiresIn === '30d') expiresAt = new Date(Date.now() + 2592000000).toISOString();

      const { share, error: err } = await createShare(projectId, user.id, token, {
        permission,
        requiresAuth,
        expiresAt,
        maxUses: maxUses ? parseInt(maxUses) : null,
      });

      if (err) { setError(err.message || 'Erro ao criar link'); setCreating(false); return; }
      setCreatedShare(share);
      setShares(prev => [share, ...prev]);
    } catch (e) {
      setError(e.message);
    }
    setCreating(false);
  };

  const handleCopy = async () => {
    if (!createdShare) return;
    try {
      await navigator.clipboard.writeText(getShareUrl(createdShare.token));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const handleRevoke = async (shareId) => {
    const token = await getAccessToken();
    if (!token) return;
    await revokeShare(shareId, token);
    setShares(prev => prev.filter(s => s.id !== shareId));
  };

  const shareUrl = createdShare ? getShareUrl(createdShare.token) : '';

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 16px', borderBottom: '1px solid #E2E8F0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: '#046BD2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Link2 size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: '#1e293b' }}>Compartilhar Projeto</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{projectName}</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            borderRadius: 6, color: '#94a3b8',
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Created share — share actions */}
        {createdShare ? (
          <div style={{ padding: '20px 24px' }}>
            {/* Link display */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#F0F5FA', borderRadius: 10, padding: '10px 14px',
              border: '1px solid #E2E8F0', marginBottom: 20,
            }}>
              <Link2 size={14} color="#046BD2" />
              <span style={{
                flex: 1, fontSize: 12, color: '#333', wordBreak: 'break-all',
                fontFamily: 'monospace',
              }}>
                {shareUrl}
              </span>
            </div>

            {/* Permission badge */}
            <div style={{
              display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap',
            }}>
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
                padding: '4px 10px', borderRadius: 20, fontWeight: 600,
                background: permission === 'edit' ? '#dcfce7' : '#eff6ff',
                color: permission === 'edit' ? '#16a34a' : '#046BD2',
              }}>
                {permission === 'edit' ? <Pencil size={12} /> : <Eye size={12} />}
                {permission === 'edit' ? 'Edição' : 'Visualização'}
              </span>
              {requiresAuth && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
                  padding: '4px 10px', borderRadius: 20, fontWeight: 600,
                  background: '#fef3c7', color: '#d97706',
                }}>
                  <Shield size={12} /> Requer login
                </span>
              )}
            </div>

            {/* 3 Share buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleCopy} style={{
                ...btnPrimary, justifyContent: 'center', width: '100%',
                background: copied ? '#16a34a' : '#046BD2',
              }}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copiado!' : 'Copiar Link'}
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <a
                  href={getEmailShareUrl(createdShare.token, projectName, user?.user_metadata?.full_name)}
                  style={{
                    ...btnOutline, flex: 1, justifyContent: 'center',
                    textDecoration: 'none', color: '#333',
                  }}
                >
                  <Mail size={15} color="#ea4335" />
                  E-mail
                </a>
                <a
                  href={getWhatsAppShareUrl(createdShare.token, projectName)}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    ...btnOutline, flex: 1, justifyContent: 'center',
                    textDecoration: 'none', color: '#333',
                  }}
                >
                  <MessageCircle size={15} color="#25D366" />
                  WhatsApp
                </a>
              </div>
            </div>

            {/* New link button */}
            <button onClick={() => setCreatedShare(null)} style={{
              ...btnOutline, width: '100%', justifyContent: 'center',
              marginTop: 16, color: '#046BD2', borderColor: '#046BD2',
            }}>
              Criar novo link
            </button>
          </div>
        ) : (
          /* Config form */
          <div style={{ padding: '20px 24px' }}>
            {/* Permission */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Permissão</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPermission('view')} style={{
                  ...btnOutline, flex: 1, justifyContent: 'center',
                  ...(permission === 'view' ? {
                    background: '#eff6ff', borderColor: '#046BD2', color: '#046BD2',
                  } : {}),
                }}>
                  <Eye size={14} /> Visualizar
                </button>
                <button onClick={() => setPermission('edit')} style={{
                  ...btnOutline, flex: 1, justifyContent: 'center',
                  ...(permission === 'edit' ? {
                    background: '#dcfce7', borderColor: '#16a34a', color: '#16a34a',
                  } : {}),
                }}>
                  <Pencil size={14} /> Editar
                </button>
              </div>
            </div>

            {/* Requires auth */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: '#333', cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={requiresAuth}
                  onChange={e => setRequiresAuth(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#046BD2' }}
                />
                <Shield size={14} color="#d97706" />
                Exigir login para acessar
              </label>
              <p style={{ margin: '4px 0 0 32px', fontSize: 11, color: '#94a3b8' }}>
                {requiresAuth
                  ? 'Apenas usuários logados podem acessar'
                  : 'Qualquer pessoa com o link pode acessar'}
              </p>
            </div>

            {/* Expiration */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>
                <Clock size={12} style={{ marginRight: 4, verticalAlign: -2 }} />
                Expiração
              </label>
              <select value={expiresIn} onChange={e => setExpiresIn(e.target.value)} style={selectStyle}>
                <option value="never">Sem expiração</option>
                <option value="1h">1 hora</option>
                <option value="24h">24 horas</option>
                <option value="7d">7 dias</option>
                <option value="30d">30 dias</option>
              </select>
            </div>

            {/* Max uses */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>
                <Users size={12} style={{ marginRight: 4, verticalAlign: -2 }} />
                Limite de acessos (opcional)
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ilimitado"
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                style={inputStyle}
              />
            </div>

            {error && (
              <div style={{
                padding: '8px 12px', borderRadius: 8, marginBottom: 12,
                background: '#fef2f2', color: '#dc2626', fontSize: 12,
              }}>
                {error}
              </div>
            )}

            <button onClick={handleCreate} disabled={creating} style={{
              ...btnPrimary, width: '100%', justifyContent: 'center',
              opacity: creating ? 0.7 : 1,
            }}>
              {creating ? <Loader2 size={16} className="spin" /> : <Link2 size={16} />}
              {creating ? 'Criando...' : 'Gerar Link de Compartilhamento'}
            </button>
          </div>
        )}

        {/* Existing shares */}
        {shares.length > 0 && (
          <div style={{ borderTop: '1px solid #E2E8F0' }}>
            <button
              onClick={() => setShowExisting(!showExisting)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '12px 24px', background: 'none',
                border: 'none', cursor: 'pointer', fontSize: 13,
                color: '#64748b', fontFamily: 'Inter, sans-serif',
              }}
            >
              <span>Links ativos ({shares.length})</span>
              {showExisting ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showExisting && (
              <div style={{ padding: '0 24px 16px' }}>
                {shares.map(s => (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', borderRadius: 8, marginBottom: 6,
                    background: '#F0F5FA', border: '1px solid #E2E8F0',
                  }}>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 4, fontSize: 10,
                      padding: '2px 8px', borderRadius: 12, fontWeight: 600,
                      background: s.permission === 'edit' ? '#dcfce7' : '#eff6ff',
                      color: s.permission === 'edit' ? '#16a34a' : '#046BD2',
                    }}>
                      {s.permission === 'edit' ? 'Edição' : 'Leitura'}
                    </span>
                    <span style={{ flex: 1, fontSize: 10, color: '#888', fontFamily: 'monospace' }}>
                      ...{s.token?.slice(-8)}
                    </span>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>
                      {s.used_count || 0} uso{(s.used_count || 0) !== 1 ? 's' : ''}
                    </span>
                    <button onClick={() => {
                      navigator.clipboard.writeText(getShareUrl(s.token));
                    }} style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                      color: '#046BD2',
                    }} title="Copiar link">
                      <Copy size={12} />
                    </button>
                    <button onClick={() => handleRevoke(s.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                      color: '#ef4444',
                    }} title="Revogar">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
