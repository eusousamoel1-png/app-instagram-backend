/**
 * GeneratePage — Geração de conteúdo com IA
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateContent, schedulePost } from '../services/api';
import NicheSelector from '../components/NicheSelector';
import ContentPreview from '../components/ContentPreview';
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

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  async function handleGenerate() {
    if (!config.niche.trim()) {
      toast.error('Informe um nicho para gerar o conteúdo');
      return;
    }

    try {
      setLoading(true);
      setContent(null);

      const keywordsArray = config.keywords
        ? config.keywords.split(',').map(k => k.trim()).filter(Boolean)
        : [];

      toast.loading('Gerando conteúdo com IA... Isso pode levar até 1 minuto.', { id: 'generate' });

      const result = await generateContent({
        niche: config.niche,
        keywords: keywordsArray,
        tone: config.tone,
        style: config.style,
      });

      setContent(result.data);
      toast.success('Conteúdo gerado com sucesso!', { id: 'generate' });
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error.response?.data?.error || 'Erro ao gerar conteúdo', { id: 'generate' });
    } finally {
      setLoading(false);
    }
  }

  function handleScheduleClick(contentData) {
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
        imageUrl: content.imageUrl,
        caption: content.caption,
        hashtags: content.hashtagsString || content.hashtags?.join(' ') || '',
        scheduledAt: new Date(scheduledAt).toISOString(),
      });

      toast.success('Post agendado com sucesso!', { id: 'schedule' });
      setContent(null);
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

        <button
          className="btn btn-primary btn-lg generate-btn"
          onClick={handleGenerate}
          disabled={loading}
          id="btn-generate"
        >
          {loading ? (
            <>
              <div className="spinner spinner-sm"></div>
              Gerando...
            </>
          ) : (
            <>🤖 Gerar Conteúdo com IA</>
          )}
        </button>
      </div>

      {/* Content Preview */}
      {content && (
        <ContentPreview
          content={content}
          onSchedule={handleScheduleClick}
          onRegenerate={handleGenerate}
          loading={loading}
        />
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
