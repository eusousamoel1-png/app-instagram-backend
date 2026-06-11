/**
 * Sidebar — Navegação lateral premium
 */
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/generate', icon: '🤖', label: 'Gerar Conteúdo' },
    { path: '/schedule', icon: '📅', label: 'Agendamentos' },
  ];

  return (
    <aside className="sidebar" id="main-sidebar">
      {/* Logo & Brand */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">📸</span>
          <div className="logo-text">
            <span className="logo-title">InstaAutoPost</span>
            <span className="logo-subtitle">Automação</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
            id={`nav-${item.path.slice(1)}`}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span className="sidebar-link-label">{item.label}</span>
            {item.path === location.pathname && (
              <span className="sidebar-link-indicator"></span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      {user && (
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.username} />
              ) : (
                <span>👤</span>
              )}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-username">@{user.username}</span>
              <span className="sidebar-followers">
                {user.followersCount?.toLocaleString('pt-BR')} seguidores
              </span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout} id="btn-logout">
            🚪 Sair
          </button>
        </div>
      )}
    </aside>
  );
}
