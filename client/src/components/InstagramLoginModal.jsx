import React, { useState } from 'react';
import { loginInstagramDirect } from '../services/api';
import toast from 'react-hot-toast';

export default function InstagramLoginModal({ onClose, onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    try {
      toast.loading('Conectando ao Instagram...', { id: 'ig-login' });
      await loginInstagramDirect(username, password);
      toast.success('Instagram conectado com sucesso!', { id: 'ig-login' });
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao conectar. Verifique seu usuário e senha.', { id: 'ig-login' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="schedule-modal-overlay" onClick={onClose} style={{zIndex: 9999}}>
      <div className="schedule-modal animate-fadeIn" onClick={e => e.stopPropagation()} style={{maxWidth: '400px'}}>
        <div className="flex-between mb-4">
          <h3 style={{ margin: 0 }}>Conectar Instagram</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={loading}>✕</button>
        </div>
        
        <p style={{marginBottom: '20px', fontSize: '14px', color: 'var(--text-secondary)'}}>
          Faça login com seu usuário e senha do Instagram para autorizar a publicação automática.
        </p>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Usuário (ex: neymarjr)</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Digite seu @usuário"
              disabled={loading}
              required
            />
          </div>

          <div className="input-group">
            <label>Senha</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              disabled={loading}
              required
            />
          </div>

          <div className="flex-row gap-8" style={{ marginTop: '20px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !username || !password}
              style={{flex: 1}}
            >
              {loading ? 'Conectando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
