import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Lock } from 'lucide-react';

export default function ProfilePage({ onBack }) {
  const { profile, user, refreshUserData } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [company, setCompany] = useState(profile?.company_name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

  const initials = (fullName || 'U')
    .split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), company_name: company.trim() })
        .eq('id', user.id);
      if (error) throw error;
      await refreshUserData();
      setProfileMsg({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (e) {
      setProfileMsg({ type: 'error', text: e.message || 'Erro ao salvar perfil' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'As senhas nao coincidem' });
      return;
    }
    setSavingPassword(true);
    setPasswordMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ type: 'success', text: 'Senha alterada com sucesso!' });
    } catch (e) {
      setPasswordMsg({ type: 'error', text: e.message || 'Erro ao alterar senha' });
    } finally {
      setSavingPassword(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px',
    background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)',
    borderRadius: 6, color: '#fff', fontSize: 14, fontFamily: 'inherit',
    outline: 'none', transition: 'border-color .15s', boxSizing: 'border-box',
  };

  const labelStyle = {
    fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '.5px', display: 'block', marginBottom: 6,
  };

  const sectionStyle = {
    background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
    borderRadius: 8, padding: 24, marginBottom: 20,
    boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,.08))',
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <button className="modal-back-btn" onClick={onBack}>← Voltar</button>

        <div style={{ maxWidth: 640, margin: '0 auto' }} className="anim-fade">
          {/* Header with avatar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #046bd2, #045cb4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 700, color: '#fff',
              boxShadow: '0 4px 16px rgba(4,107,210,.3)',
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Meu Perfil</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,.5)' }}>
                Gerencie suas informacoes pessoais e seguranca
              </p>
            </div>
          </div>

          {/* ── Profile Section ── */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <User size={20} color="#046bd2" strokeWidth={2} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Informacoes Pessoais</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nome Completo</label>
                <input
                  type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Seu nome completo" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#046bd2'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.15)'}
                />
              </div>
              <div>
                <label style={labelStyle}>Empresa</label>
                <input
                  type="text" value={company} onChange={e => setCompany(e.target.value)}
                  placeholder="Nome da empresa" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#046bd2'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.15)'}
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email" value={user?.email || ''} disabled
                  style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
                />
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  O email nao pode ser alterado por aqui
                </div>
              </div>
            </div>

            {profileMsg && (
              <div style={{
                marginTop: 14, padding: '10px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                background: profileMsg.type === 'success' ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)',
                color: profileMsg.type === 'success' ? '#86efac' : '#fca5a5',
                border: `1px solid ${profileMsg.type === 'success' ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}`,
              }}>
                {profileMsg.type === 'success' ? '✓' : '✕'} {profileMsg.text}
              </div>
            )}

            <button
              onClick={handleSaveProfile} disabled={savingProfile}
              style={{
                marginTop: 16, padding: '12px 28px', border: 'none', borderRadius: 6,
                background: '#046bd2', color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: savingProfile ? 'wait' : 'pointer', opacity: savingProfile ? 0.6 : 1,
                transition: 'all .2s', boxShadow: '0 2px 8px rgba(4,107,210,.25)',
              }}
            >
              {savingProfile ? 'Salvando...' : 'Salvar Alteracoes'}
            </button>
          </div>

          {/* ── Password Section ── */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Lock size={20} color="#f59e0b" strokeWidth={2} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Alterar Senha</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Nova Senha</label>
                <input
                  type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimo 6 caracteres" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.15)'}
                />
              </div>
              <div>
                <label style={labelStyle}>Confirmar Senha</label>
                <input
                  type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.15)'}
                />
              </div>
            </div>

            {passwordMsg && (
              <div style={{
                marginTop: 14, padding: '10px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                background: passwordMsg.type === 'success' ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)',
                color: passwordMsg.type === 'success' ? '#86efac' : '#fca5a5',
                border: `1px solid ${passwordMsg.type === 'success' ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'}`,
              }}>
                {passwordMsg.type === 'success' ? '✓' : '✕'} {passwordMsg.text}
              </div>
            )}

            <button
              onClick={handleChangePassword}
              disabled={savingPassword || !newPassword}
              style={{
                marginTop: 16, padding: '12px 28px', border: 'none', borderRadius: 6,
                background: '#f59e0b', color: '#000', fontSize: 14, fontWeight: 600,
                cursor: (savingPassword || !newPassword) ? 'not-allowed' : 'pointer',
                opacity: (savingPassword || !newPassword) ? 0.5 : 1,
                transition: 'all .2s',
              }}
            >
              {savingPassword ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </div>

          {/* Account info */}
          <div style={{
            ...sectionStyle, background: 'rgba(255,255,255,.03)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Conta criada em</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : '\u2014'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>ID do usuario</div>
              <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#64748b' }}>
                {user?.id?.slice(0, 12)}...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
