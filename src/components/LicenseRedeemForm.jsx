import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function LicenseRedeemForm({ onSuccess, onCancel }) {
  const { user, refreshUserData } = useAuth()
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleRedeem = async (e) => {
    e.preventDefault()
    const trimmed = key.trim().toLowerCase()
    if (!trimmed) { setError('Informe a chave de licença'); return }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // 1. Find the key
      const { data: keyData, error: keyError } = await supabase
        .from('license_keys')
        .select('*, plans(name, slug)')
        .eq('key', trimmed)
        .single()

      if (keyError || !keyData) {
        setError('Chave não encontrada. Verifique e tente novamente.')
        setLoading(false)
        return
      }

      if (keyData.status !== 'available') {
        setError(`Esta chave já foi ${keyData.status === 'redeemed' ? 'resgatada' : 'revogada'}.`)
        setLoading(false)
        return
      }

      // 2. Mark key as redeemed
      const { error: updateKeyError } = await supabase
        .from('license_keys')
        .update({
          status: 'redeemed',
          redeemed_by: user.id,
          redeemed_at: new Date().toISOString()
        })
        .eq('id', keyData.id)

      if (updateKeyError) throw updateKeyError

      // 3. Update or create subscription
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const subUpdate = {
        plan_id: keyData.plan_id,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      }

      if (existingSub) {
        const { error: subErr } = await supabase.from('subscriptions').update(subUpdate).eq('id', existingSub.id)
        if (subErr) throw new Error('Erro ao atualizar assinatura: ' + subErr.message)
      } else {
        const { error: subErr } = await supabase.from('subscriptions').insert({ user_id: user.id, ...subUpdate })
        if (subErr) throw new Error('Erro ao criar assinatura: ' + subErr.message)
      }

      setSuccess(`🎉 Plano ${keyData.plans?.name || ''} ativado com sucesso!`)
      await refreshUserData()
      setTimeout(() => onSuccess && onSuccess(), 1500)
    } catch (err) {
      setError('Erro ao resgatar chave: ' + (err.message || 'tente novamente'))
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', background: '#F0F5FA', border: '1px solid #E2E8F0',
    borderRadius: 8, color: '#1e293b', fontSize: 16, letterSpacing: 2,
    textAlign: 'center', fontFamily: 'monospace', boxSizing: 'border-box'
  }

  return (
    <div style={{
      background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24,
      maxWidth: 420, margin: '0 auto'
    }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 16, textAlign: 'center' }}>🔑 Resgatar Chave de Licença</h3>
      <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 16 }}>
        Cole sua chave de licença abaixo para ativar seu plano.
      </p>

      <form onSubmit={handleRedeem}>
        <input
          type="text"
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          style={inputStyle}
          autoFocus
          maxLength={64}
        />

        {error && (
          <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '8px 12px', borderRadius: 6, fontSize: 12, marginTop: 10 }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: '#14532d', color: '#86efac', padding: '8px 12px', borderRadius: 6, fontSize: 12, marginTop: 10 }}>
            {success}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button type="submit" disabled={loading} style={{
            flex: 1, padding: '10px 16px', background: '#22c55e', color: '#000', border: 'none',
            borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            opacity: loading ? 0.5 : 1
          }}>
            {loading ? '⏳ Validando...' : '✅ Resgatar'}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} style={{
              padding: '10px 16px', background: 'transparent', color: '#64748b', border: '1px solid #E2E8F0',
              borderRadius: 8, fontSize: 14, cursor: 'pointer'
            }}>Cancelar</button>
          )}
        </div>
      </form>
    </div>
  )
}
