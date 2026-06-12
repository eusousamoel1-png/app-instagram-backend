/**
 * LoginPage — Tela de login com OAuth Instagram
 */
import { useSearchParams, useNavigate } from 'react-router-dom';
import { signInWithPopup, auth, googleProvider } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const error = searchParams.get('error');
  const { user } = useAuth();

  // Se o usuário já estiver logado (mesmo que sem Instagram), mandar pro dashboard
  if (user) {
    navigate('/dashboard');
    return null;
  }

  const errorMessages = {
    no_pages: 'Nenhuma página do Facebook encontrada. Vincule uma página ao app.',
    no_instagram: 'Nenhuma conta Instagram Business vinculada. Configure no Facebook.',
    auth_failed: 'Falha na autenticação. Tente novamente.',
    no_code: 'Código de autorização não recebido.',
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (err) {
      console.error('Erro ao fazer login com o Google:', err);
      alert('Falha ao fazer login com o Google: ' + err.message);
    }
  };

  return (
    <div className="login-page" id="login-page">
      {/* Animated Background */}
      <div className="login-bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="login-container animate-fadeIn">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">📸</div>
          <h1 className="login-title">InstaAutoPost</h1>
          <p className="login-subtitle">Automação inteligente de conteúdo</p>
        </div>

        {/* Description */}
        <div className="login-description">
          <div className="login-feature">
            <span>🤖</span>
            <p>Geração automática de imagens e legendas com IA</p>
          </div>
          <div className="login-feature">
            <span>📅</span>
            <p>Agendamento de posts com calendário visual</p>
          </div>
          <div className="login-feature">
            <span>🚀</span>
            <p>Publicação automática no horário agendado</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="login-error">
            ⚠️ {errorMessages[error] || 'Erro desconhecido. Tente novamente.'}
          </div>
        )}

        {/* Login Button */}
        <button onClick={handleGoogleLogin} className="btn btn-primary btn-lg login-btn" id="btn-login" style={{backgroundColor: '#fff', color: '#000', border: '1px solid #ccc'}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '10px'}}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Entrar com Google
        </button>
      </div>
    </div>
  );
}
