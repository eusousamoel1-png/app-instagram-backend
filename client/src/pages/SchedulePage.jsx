/**
 * SchedulePage — Lista de posts agendados com visualização em timeline
 */
import { useState, useEffect } from 'react';
import { getPosts, publishPostNow, deletePost } from '../services/api';
import PostCard from '../components/PostCard';
import toast from 'react-hot-toast';
import './SchedulePage.css';

export default function SchedulePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      setLoading(true);
      const result = await getPosts('scheduled');
      setPosts(result.data || []);
    } catch (error) {
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish(postId) {
    try {
      toast.loading('Publicando...', { id: 'pub' });
      await publishPostNow(postId);
      toast.success('Publicado!', { id: 'pub' });
      loadPosts();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro', { id: 'pub' });
    }
  }

  async function handleDelete(postId) {
    if (!confirm('Remover este agendamento?')) return;
    try {
      await deletePost(postId);
      toast.success('Agendamento removido');
      loadPosts();
    } catch (error) {
      toast.error('Erro ao remover');
    }
  }

  function groupPostsByDate(posts) {
    const groups = {};
    posts.forEach(post => {
      let dateKey;
      try {
        const date = post.scheduledAt?.toDate
          ? post.scheduledAt.toDate()
          : new Date(post.scheduledAt);
        dateKey = date.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });
      } catch {
        dateKey = 'Data indefinida';
      }
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(post);
    });
    return groups;
  }

  const grouped = groupPostsByDate(posts);

  return (
    <div className="schedule-page animate-fadeIn" id="schedule-page">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1>Agendamentos</h1>
            <p>{posts.length} post(s) agendado(s)</p>
          </div>
          <button className="btn btn-secondary" onClick={loadPosts}>
            🔄 Atualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando agendamentos...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📅</div>
          <h3>Nenhum post agendado</h3>
          <p>Gere conteúdo com IA e agende seus primeiros posts!</p>
        </div>
      ) : (
        <div className="schedule-timeline">
          {Object.entries(grouped).map(([dateLabel, datePosts]) => (
            <div className="timeline-group" key={dateLabel}>
              <div className="timeline-date">
                <div className="timeline-dot"></div>
                <h3>{dateLabel}</h3>
              </div>
              <div className="timeline-posts">
                {datePosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onPublish={handlePublish}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
