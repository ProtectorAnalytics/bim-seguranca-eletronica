import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { APP_VERSION } from '@/data/constants';

/**
 * Professional user menu dropdown — Lombada white identity.
 */
export default function UserMenu({ onProfile, onSubscription, onSettings, onAdmin }) {
  const { profile, plan, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef(null);

  const userName = profile?.full_name || profile?.email || 'Usuario';
  const userEmail = profile?.email || '';
  const planName = isAdmin ? '⭐ Admin' : (plan?.name || 'Gratis');

  // Initials avatar
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (e) {
      console.error('Logout error:', e);
      setSigningOut(false);
    }
  };

  const go = (fn) => { setOpen(false); fn?.(); };

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: open ? 'rgba(4,107,210,.08)' : 'transparent',
          border: '1px solid #E2E8F0',
          borderRadius: 10, padding: '6px 14px 6px 6px', cursor: 'pointer',
          transition: 'all .2s', color: '#1e293b',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'rgba(4,107,210,.04)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Avatar circle with initials */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #046BD2, #045cb4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: '#fff',
          boxShadow: '0 2px 8px rgba(4,107,210,.25)',
          flexShrink: 0,
        }}>
          {initials || '?'}
        </div>
        <div style={{ textAlign: 'left', minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: '#1e293b',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140,
          }}>{userName}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{planName}</div>
        </div>
        {/* Chevron */}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{
          marginLeft: 2, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0)',
        }}>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 1000,
          background: '#ffffff', border: '1px solid #E2E8F0',
          borderRadius: 12, padding: 6, minWidth: 'min(260px, calc(100vw - 24px))',
          boxShadow: '0 12px 40px rgba(0,0,0,.12), 0 4px 16px rgba(0,0,0,.06)',
          animation: 'menuFadeIn .15s ease-out',
        }}>
          {/* User info header */}
          <div style={{
            padding: '12px 14px', borderBottom: '1px solid #E2E8F0', marginBottom: 4,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{userName}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{userEmail}</div>
            <div style={{
              display: 'inline-block', marginTop: 6,
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px',
              background: isAdmin ? 'rgba(245,158,11,.1)' : 'rgba(4,107,210,.08)',
              color: isAdmin ? '#d97706' : '#046BD2',
              padding: '3px 8px', borderRadius: 20,
            }}>
              {planName}
            </div>
          </div>

          {/* Menu items */}
          <MenuItem icon={IconUser} label="Meu Perfil" desc="Nome, email, senha" onClick={() => go(onProfile)} />
          <MenuItem icon={IconCreditCard} label="Assinatura" desc="Plano e licencas" onClick={() => go(onSubscription)} />
          <MenuItem icon={IconSettings} label="Configuracoes" desc="Dados da empresa" onClick={() => go(onSettings)} />

          {isAdmin && onAdmin && (
            <>
              <div style={{ height: 1, background: '#E2E8F0', margin: '4px 6px' }} />
              <MenuItem icon={IconShield} label="Admin" desc="Portal de administracao" onClick={() => go(onAdmin)} accent="#d97706" />
            </>
          )}

          <div style={{ height: 1, background: '#E2E8F0', margin: '4px 6px' }} />

          {/* Logout */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '10px 14px', border: 'none', borderRadius: 8,
              background: 'transparent', cursor: signingOut ? 'wait' : 'pointer',
              transition: 'background .15s', color: '#dc2626',
              opacity: signingOut ? 0.5 : 1,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <IconLogout />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, textAlign: 'left' }}>
                {signingOut ? 'Saindo...' : 'Sair da Conta'}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'left' }}>Encerrar sessao</div>
            </div>
          </button>

          {/* Version info */}
          <div style={{
            borderTop: '1px solid #E2E8F0', margin: '4px 6px 0', padding: '8px 8px 4px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>
              Protector <span style={{
                fontSize: 10, fontWeight: 700, color: '#fff',
                background: '#046BD2', borderRadius: 4,
                padding: '1px 5px', marginLeft: 2,
              }}>{APP_VERSION.full}</span>
            </span>
            <span style={{ fontSize: 9, color: '#cbd5e1' }}>{APP_VERSION.date}</span>
          </div>
        </div>
      )}

      <style>{`@keyframes menuFadeIn { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  );
}

function MenuItem({ icon: Icon, label, desc, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '10px 14px', border: 'none', borderRadius: 8,
        background: 'transparent', cursor: 'pointer', transition: 'background .15s',
        color: accent || '#1e293b',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#F0F5FA'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <Icon color={accent || '#64748b'} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, textAlign: 'left' }}>{label}</div>
        <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'left' }}>{desc}</div>
      </div>
    </button>
  );
}

/* ─── SVG Icons (18×18, professional) ─── */
function IconUser({ color = '#64748b' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
function IconCreditCard({ color = '#64748b' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  );
}
function IconSettings({ color = '#64748b' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}
function IconShield({ color = '#64748b' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function IconLogout({ color = '#dc2626' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}
