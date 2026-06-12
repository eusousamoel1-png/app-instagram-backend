/**
 * ContentPreview — Preview do conteúdo gerado antes de agendar
 */
import { useAuth } from '../contexts/AuthContext';
import './ContentPreview.css';

export default function ContentPreview({ content, onSchedule, onRegenerate, loading }) {
  const { instagramData } = useAuth();
  const username = instagramData?.username || 'seu_perfil';
  if (!content) return null;

  return (
    <div className="content-preview animate-fadeIn" id="content-preview">
      <div className="content-preview-header">
        <h3>✨ Conteúdo Gerado</h3>
        <div className="flex-row gap-8">
          <button
            className="btn btn-secondary btn-sm"
            onClick={onRegenerate}
            disabled={loading}
          >
            🔄 Gerar Novo
          </button>
        </div>
      </div>

      <div className="content-preview-body">
        {/* Phone Mockup */}
        <div className="phone-mockup">
          <div className="phone-notch"></div>
          <div className="phone-screen">
            {/* Instagram Header */}
            <div className="ig-header">
              <div className="ig-avatar-small"></div>
              <span className="ig-username">{username}</span>
              <span className="ig-dots">•••</span>
            </div>

            {/* Image */}
            <div className="ig-image">
              {content.imageUrl ? (
                <img src={content.imageUrl} alt="Preview" />
              ) : (
                <div className="ig-image-placeholder">🖼️</div>
              )}
            </div>

            {/* Actions */}
            <div className="ig-actions">
              <span>❤️</span>
              <span>💬</span>
              <span>📤</span>
            </div>

            {/* Caption */}
            <div className="ig-caption">
              <strong>{username}</strong> {content.caption}
            </div>

            {/* Hashtags */}
            {content.hashtags && content.hashtags.length > 0 && (
              <div className="ig-hashtags">
                {content.hashtags.join(' ')}
              </div>
            )}
          </div>
        </div>

        {/* Details Panel */}
        <div className="content-details">
          <div className="detail-section">
            <label>📝 Legenda</label>
            <p>{content.caption}</p>
          </div>

          <div className="detail-section">
            <label># Hashtags ({content.hashtags?.length || 0})</label>
            <div className="hashtag-list">
              {content.hashtags?.map((tag, i) => (
                <span key={i} className="hashtag-chip">{tag}</span>
              ))}
            </div>
          </div>

          {content.revisedPrompt && (
            <div className="detail-section">
              <label>🎨 Prompt da Imagem (revisado pela IA)</label>
              <p className="text-muted text-sm">{content.revisedPrompt}</p>
            </div>
          )}

          <button
            className="btn btn-primary btn-lg"
            onClick={() => onSchedule?.(content)}
            style={{ width: '100%', marginTop: '16px' }}
            id="btn-schedule-content"
          >
            📅 Agendar Este Post
          </button>
        </div>
      </div>
    </div>
  );
}
