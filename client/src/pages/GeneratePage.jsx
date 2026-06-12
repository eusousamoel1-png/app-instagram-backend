/**
 * GeneratePage — Geração de conteúdo com IA
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateContent, generateBatchContent, generateImage, schedulePost } from '../services/api';
import NicheSelector from '../components/NicheSelector';
import ContentPreview from '../components/ContentPreview';
import FeedGrid from '../components/FeedGrid';
import toast from 'react-hot-toast';
import './GeneratePage.css';

export default function GeneratePage() {
  const navigate = useNavigate();

  const [config, setConfig] = useState({
    niche: 'capsulas naturais e suplementos',
    keywords: '',
    tone: 'profissional e motivador',
    style: 'vibrant',
  });

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingImages, setGeneratingImages] = useState({});
  const [selectedPost, setSelectedPost] = useState(null);
  
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  async function handleGenerateBatch() {
    if (!config.niche.trim()) {
      toast.error('Informe um nicho para gerar o conteúdo');
      return;
    }

    try {
      setLoading(true);
      setPosts([]);

      const keywordsArray = config.keywords
        ? config.keywords.split(',').map(k => k.trim()).filter(Boolean)
        : [];

      toast.loading('Analisando nicho e criando grade de conteúdo... (aprox 30s)', { id: 'generate' });

      const result = await generateBatchContent({
        niche: config.niche,
        keywords: keywordsArray,
        tone: config.tone,
        count: 7
      });

      setPosts(result.data);
      toast.success('Grade gerada com sucesso! Clique em um post para gerar a imagem.', { id: 'generate' });
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error.response?.data?.error || 'Erro ao gerar conteúdo', { id: 'generate' });
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateImageForPost(post) {
    if (post.imageUrl || generatingImages[post.id]) return;

    try {
      setGeneratingImages(prev => ({ ...prev, [post.id]: true }));
      toast.loading('Gerando imagem com DALL-E...', { id: `img-${post.id}` });

      const result = await generateImage({
        niche: config.niche,
        style: config.style,
      });

      // Update post in the list
      setPosts(prev => prev.map(p => {
        if (p.id === post.id) {
          const updated = { ...p, imageUrl: result.data.imageUrl, revisedPrompt: result.data.revisedPrompt };
          // If this post is currently selected in modal, update it there too
          if (selectedPost && selectedPost.id === post.id) setSelectedPost(updated);
          return updated;
        }
        return p;
      }));

      toast.success('Imagem gerada!', { id: `img-${post.id}` });
    } catch (error) {
      toast.error('Erro ao gerar imagem', { id: `img-${post.id}` });
    } finally {
      setGeneratingImages(prev => ({ ...prev, [post.id]: false }));
    }
  }

  function handleScheduleClick(contentData) {
    setSelectedPost(null); // close modal if open
    setShowScheduler(true);
    // Set default date to 1 hour from now
    const defaultDate = new Date(Date.now() + 60 * 60 * 1000);
    const formatted = defaultDate.toISOString().slice(0, 16);
    setScheduledAt(formatted);
  }

  async function handleConfirmSchedule() {
    if (!scheduledAt) {
      toast.error('Selecione uma data e hora');
      return;
    }

    try {
      toast.loading('Agendando post...', { id: 'schedule' });

      await schedulePost({
        imageUrl: selectedPost.imageUrl,
        caption: selectedPost.caption,
        hashtags: selectedPost.hashtags?.join(' ') || '',
        scheduledAt: new Date(scheduledAt).toISOString(),
      });

      toast.success('Post agendado com sucesso!', { id: 'schedule' });
      // Remove from list
      setPosts(prev => prev.filter(p => p.id !== selectedPost.id));
      setSelectedPost(null);
      setShowScheduler(false);
      navigate('/schedule');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao agendar', { id: 'schedule' });
    }
  }

  return (
    <div className="generate-page animate-fadeIn" id="generate-page">
      <div className="page-header">
        <h1>Gerar Conteúdo com IA</h1>
        <p>Configure o nicho e deixe a inteligência artificial criar o post perfeito</p>
      </div>

      {/* Config Form */}
      <div className="card generate-config">
        <NicheSelector config={config} onChange={setConfig} />

        <div className="flex-row gap-8 mt-4">
          <button
            className="btn btn-primary btn-lg generate-btn"
            onClick={handleGenerateBatch}
            disabled={loading}
            id="btn-generate-batch"
            style={{ flex: 1 }}
          >
            {loading ? (
              <>
                <div className="spinner spinner-sm"></div>
                Gerando Semana (7 Posts)...
              </>
            ) : (
              <>📅 Gerar Semana com IA</>
            )}
          </button>
        </div>
      </div>

      {/* Grid of Posts */}
      <FeedGrid 
        posts={posts} 
        onPostClick={(post) => setSelectedPost(post)} 
        generatingImages={generatingImages}
      />

      {/* Content Preview Modal */}
      {selectedPost && (
        <div className="schedule-modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="schedule-modal preview-modal animate-fadeIn" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <div className="flex-between mb-4">
              <h3 style={{ margin: 0 }}>Visualizar Post</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedPost(null)}>✕ Fechar</button>
            </div>
            
            <ContentPreview
              content={selectedPost}
              onSchedule={() => handleScheduleClick(selectedPost)}
              onRegenerate={() => handleGenerateImageForPost(selectedPost)}
              loading={generatingImages[selectedPost.id]}
            />
            
            {!selectedPost.imageUrl && (
              <div style={{ textAlign: 'center', padding: '16px', background: 'var(--surface)', borderRadius: '8px', marginTop: '16px' }}>
                <p>Nenhuma imagem gerada ainda para este post.</p>
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleGenerateImageForPost(selectedPost)}
                  disabled={generatingImages[selectedPost.id]}
                >
                  {generatingImages[selectedPost.id] ? 'Gerando imagem...' : '🎨 Gerar Imagem DALL-E'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduler && (
        <div className="schedule-modal-overlay" onClick={() => setShowScheduler(false)}>
          <div className="schedule-modal animate-fadeIn" onClick={e => e.stopPropagation()}>
            <h3>📅 Agendar Publicação</h3>
            <p>Escolha a data e hora para publicar este post:</p>

            <div className="input-group">
              <label>Data e Hora</label>
              <input
                type="datetime-local"
                className="input"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                id="input-schedule-date"
              />
            </div>

            <div className="flex-row gap-8" style={{ marginTop: '20px' }}>
              <button
                className="btn btn-primary"
                onClick={handleConfirmSchedule}
                id="btn-confirm-schedule"
              >
                ✅ Confirmar Agendamento
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setShowScheduler(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
