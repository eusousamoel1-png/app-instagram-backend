/**
 * FeedGrid — Visualização em grade dos posts gerados em lote
 */
import './FeedGrid.css';

export default function FeedGrid({ posts, onPostClick, generatingImages }) {
  if (!posts || posts.length === 0) return null;

  return (
    <div className="feed-grid-container animate-fadeIn">
      <h3>📅 Feed da Semana Gerado ({posts.length} posts)</h3>
      <p className="text-muted text-sm mb-4">Clique em um post para ver a legenda, gerar a imagem ou agendar.</p>
      
      <div className="instagram-grid">
        {posts.map((post, index) => (
          <div 
            key={post.id} 
            className="grid-item" 
            onClick={() => onPostClick(post)}
          >
            {post.imageUrl ? (
              <img src={post.imageUrl} alt={`Post ${index + 1}`} />
            ) : generatingImages?.[post.id] ? (
              <div className="grid-placeholder generating">
                <div className="spinner spinner-sm"></div>
                <span>Gerando...</span>
              </div>
            ) : (
              <div className="grid-placeholder">
                <span className="icon">🖼️</span>
                <span className="text-xs">Post {index + 1}</span>
              </div>
            )}
            
            {/* Overlay for hover */}
            <div className="grid-overlay">
              <div className="overlay-content">
                <span>💬</span>
                <span>Ver/Editar</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
