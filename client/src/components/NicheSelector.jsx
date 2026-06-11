/**
 * NicheSelector — Seletor de nicho com presets e campo customizado
 */
import './NicheSelector.css';

const PRESET_NICHES = [
  { value: 'capsulas naturais e suplementos', label: '💊 Cápsulas Naturais', icon: '💊' },
  { value: 'saude e bem-estar', label: '🌿 Saúde e Bem-estar', icon: '🌿' },
  { value: 'emagrecimento saudável', label: '⚖️ Emagrecimento', icon: '⚖️' },
  { value: 'energia e vitalidade', label: '⚡ Energia e Vitalidade', icon: '⚡' },
  { value: 'beleza e skincare natural', label: '✨ Beleza Natural', icon: '✨' },
  { value: 'qualidade de vida e longevidade', label: '🧬 Qualidade de Vida', icon: '🧬' },
];

const TONES = [
  { value: 'profissional e motivador', label: '💼 Profissional' },
  { value: 'informal e descontraído', label: '😊 Descontraído' },
  { value: 'educativo e informativo', label: '📚 Educativo' },
  { value: 'urgente e promocional', label: '🔥 Promocional' },
];

const STYLES = [
  { value: 'vibrant', label: '🎨 Vibrante' },
  { value: 'minimal', label: '🤍 Minimalista' },
  { value: 'natural', label: '🌱 Natural' },
  { value: 'luxury', label: '✨ Luxo' },
  { value: 'tech', label: '🔬 Tecnológico' },
];

export default function NicheSelector({ config, onChange }) {
  function handleChange(field, value) {
    onChange({ ...config, [field]: value });
  }

  return (
    <div className="niche-selector" id="niche-selector">
      {/* Niche Presets */}
      <div className="input-group">
        <label>🎯 Nicho do Conteúdo</label>
        <div className="niche-chips">
          {PRESET_NICHES.map(niche => (
            <button
              key={niche.value}
              className={`niche-chip ${config.niche === niche.value ? 'active' : ''}`}
              onClick={() => handleChange('niche', niche.value)}
              type="button"
            >
              {niche.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="input"
          placeholder="Ou digite um nicho customizado..."
          value={config.niche || ''}
          onChange={e => handleChange('niche', e.target.value)}
        />
      </div>

      {/* Keywords */}
      <div className="input-group">
        <label>🔑 Palavras-chave (separadas por vírgula)</label>
        <input
          type="text"
          className="input"
          placeholder="ex: saúde, energia, natural, cápsulas"
          value={config.keywords || ''}
          onChange={e => handleChange('keywords', e.target.value)}
        />
      </div>

      {/* Tone */}
      <div className="input-group">
        <label>🗣️ Tom da Legenda</label>
        <div className="niche-chips">
          {TONES.map(tone => (
            <button
              key={tone.value}
              className={`niche-chip ${config.tone === tone.value ? 'active' : ''}`}
              onClick={() => handleChange('tone', tone.value)}
              type="button"
            >
              {tone.label}
            </button>
          ))}
        </div>
      </div>

      {/* Image Style */}
      <div className="input-group">
        <label>🎨 Estilo da Imagem</label>
        <div className="niche-chips">
          {STYLES.map(style => (
            <button
              key={style.value}
              className={`niche-chip ${config.style === style.value ? 'active' : ''}`}
              onClick={() => handleChange('style', style.value)}
              type="button"
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
