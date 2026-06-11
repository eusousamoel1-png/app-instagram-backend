/**
 * PostCard — Card de post agendado/publicado
 */
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './PostCard.css';

export default function PostCard({ post, onPublish, onDelete }) {
  const statusMap = {
    scheduled: { label: 'Agendado', class: 'badge-scheduled', icon: '🕐' },
    publishing: { label: 'Publicando...', class: 'badge-publishing', icon: '🔄' },
    published: { label: 'Publicado', class: 'badge-published', icon: '✅' },
    failed: { label: 'Falhou', class: 'badge-failed', icon: '❌' },
  };

  const status = statusMap[post.status] || statusMap.scheduled;

  function formatDate(dateValue) {
    if (!dateValue) return '—';
    try {
      // Handle Firestore Timestamp or ISO string
      const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
      return format(date, "dd 'de' MMM 'às' HH:mm", { locale: ptBR });
    } catch {
      return '—';
    }
  }

  return (
    <div className="post-card animate-fadeIn" id={`post-${post.id}`}>
      {/* Image */}
      <div className="post-card-image">
        {post.imageUrl ? (
          <img src={post.imageUrl} alt="Post" loading="lazy" />
        ) : (
          <div className="post-card-image-placeholder">📷</div>
        )}
        <div className={`post-card-badge badge ${status.class}`}>
          {status.icon} {status.label}
        </div>
      </div>

      {/* Content */}
      <div className="post-card-body">
        <p className="post-card-caption">{post.caption}</p>

        {post.hashtags && (
          <p className="post-card-hashtags">{post.hashtags}</p>
        )}

        <div className="post-card-meta">
          <span className="post-card-date">
            📅 {formatDate(post.scheduledAt)}
          </span>
          {post.publishedAt && (
            <span className="post-card-date">
              ✅ {formatDate(post.publishedAt)}
            </span>
          )}
        </div>

        {/* Error message */}
        {post.error && (
          <div className="post-card-error">
            ⚠️ {post.error}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="post-card-actions">
        {(post.status === 'scheduled' || post.status === 'failed') && (
          <>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onPublish?.(post.id)}
              id={`publish-${post.id}`}
            >
              🚀 Publicar Agora
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onDelete?.(post.id)}
              id={`delete-${post.id}`}
            >
              🗑️ Remover
            </button>
          </>
        )}
        {post.status === 'published' && post.igMediaId && (
          <a
            href={`https://www.instagram.com/p/${post.igMediaId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            📸 Ver no Instagram
          </a>
        )}
      </div>
    </div>
  );
}
