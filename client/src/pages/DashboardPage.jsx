/**
 * DashboardPage — Visão geral de posts e estatísticas
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getPosts, getPostStats, publishPostNow, deletePost } from '../services/api';
import PostCard from '../components/PostCard';
import toast from 'react-hot-toast';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(null);

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    try {
      setLoading(true);
      const [postsRes, statsRes] = await Promise.all([
        getPosts(filter),
        getPostStats(),
      ]);
      setPosts(postsRes.data || []);
      setStats(statsRes.data || null);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish(postId) {
    try {
      toast.loading('Publicando...', { id: 'publish' });
      await publishPostNow(postId);
      toast.success('Post publicado com sucesso!', { id: 'publish' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao publicar', { id: 'publish' });
    }
  }

  async function handleDelete(postId) {
    if (!confirm('Tem certeza que deseja remover este post?')) return;
    try {
      await deletePost(postId);
      toast.success('Post removido');
      loadData();
    } catch (error) {
      toast.error('Erro ao remover post');
    }
  }

  const statCards = stats ? [
    { icon: '📅', label: 'Agendados', value: stats.scheduled, color: 'blue' },
    { icon: '✅', label: 'Publicados', value: stats.published, color: 'green' },
    { icon: '❌', label: 'Falhas', value: stats.failed, color: 'red' },
    { icon: '📊', label: 'Hoje', value: `${stats.dailyCount}/${stats.maxDaily}`, color: 'orange' },
  ] : [];

  return (
    <div className="dashboard-page animate-fadeIn" id="dashboard-page">
      {/* Header */}
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1>Dashboard</h1>
            <p>Bem-vindo, @{user?.username} 👋</p>
          </div>
          <button className="btn btn-secondary" onClick={loadData}>
            🔄 Atualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stat-grid">
          {statCards.map((stat, i) => (
            <div className="stat-card" key={i} style={{ animationDelay: `${i * 100}ms` }}>
              <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
              <div className="stat-info">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="dashboard-filters">
        <button
          className={`btn ${filter === null ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={() => setFilter(null)}
        >
          Todos
        </button>
        <button
          className={`btn ${filter === 'scheduled' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={() => setFilter('scheduled')}
        >
          📅 Agendados
        </button>
        <button
          className={`btn ${filter === 'published' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={() => setFilter('published')}
        >
          ✅ Publicados
        </button>
        <button
          className={`btn ${filter === 'failed' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={() => setFilter('failed')}
        >
          ❌ Falhas
        </button>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>Nenhum post encontrado</h3>
          <p>Comece gerando conteúdo com IA na aba "Gerar Conteúdo"</p>
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onPublish={handlePublish}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
