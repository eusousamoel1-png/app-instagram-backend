/**
 * OpenAI Service — Geração de conteúdo com IA
 * DALL-E 3 para imagens + GPT-4o para legendas e hashtags
 */
const OpenAI = require('openai');

// Validate API key
const apiKey = process.env.OPENAI_API_KEY;
const isValidKey = apiKey && !apiKey.includes('dummy') && !apiKey.includes('SEU_') && apiKey.startsWith('sk-');

if (!isValidKey) {
  console.warn('⚠️  OpenAI API Key não configurada ou inválida. Geração de conteúdo com IA estará desativada.');
  console.warn('   Configure OPENAI_API_KEY no arquivo .env com uma chave válida.');
}

const openai = isValidKey ? new OpenAI({ apiKey }) : null;

function ensureOpenAI() {
  if (!openai) {
    throw new Error('OpenAI não configurada. Defina OPENAI_API_KEY com uma chave válida no .env');
  }
}

/**
 * Gerar imagem com DALL-E 3 baseada no nicho
 * Retorna URL temporária da imagem (válida por ~1h)
 */
async function generateImage(niche, style = 'vibrant') {
  ensureOpenAI();
  const prompt = buildImagePrompt(niche, style);

  console.log(`🎨 Gerando imagem para nicho: "${niche}"...`);

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'hd',
    style: 'vivid',
  });

  const imageUrl = response.data[0].url;
  const revisedPrompt = response.data[0].revised_prompt;

  console.log(`   ✅ Imagem gerada com sucesso`);

  return { imageUrl, revisedPrompt };
}

/**
 * Gerar legenda e hashtags com GPT-4o
 */
async function generateCaption(niche, keywords = [], tone = 'profissional e motivador') {
  ensureOpenAI();
  console.log(`✍️  Gerando legenda para nicho: "${niche}"...`);

  const systemPrompt = `Você é um social media manager especialista em Instagram para marcas brasileiras do nicho de ${niche}. 
Seu trabalho é criar legendas virais, engajantes e autênticas para posts no Instagram.

Regras:
- Escreva em português brasileiro
- Use emojis estrategicamente (não exagere)
- A legenda deve ter entre 100 e 300 caracteres
- Inclua um CTA (call-to-action) sutil
- Tom: ${tone}
- NÃO inclua hashtags na legenda (elas vêm separadas)`;

  const userPrompt = `Crie uma legenda para um post no Instagram sobre: ${niche}.
${keywords.length > 0 ? `Palavras-chave para incorporar: ${keywords.join(', ')}` : ''}

Responda EXATAMENTE neste formato JSON (sem markdown):
{
  "caption": "texto da legenda aqui",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8", "#hashtag9", "#hashtag10"]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  const parsed = JSON.parse(content);

  console.log(`   ✅ Legenda gerada com ${parsed.hashtags?.length || 0} hashtags`);

  return {
    caption: parsed.caption,
    hashtags: parsed.hashtags || [],
  };
}

/**
 * Gerar conteúdo completo (imagem + legenda + hashtags)
 */
async function generateFullContent(niche, keywords = [], tone = 'profissional e motivador', style = 'vibrant') {
  // Gerar em paralelo para economizar tempo
  const [imageResult, captionResult] = await Promise.all([
    generateImage(niche, style),
    generateCaption(niche, keywords, tone),
  ]);

  const hashtagsString = captionResult.hashtags.join(' ');
  const fullCaption = `${captionResult.caption}\n\n${hashtagsString}`;

  return {
    imageUrl: imageResult.imageUrl,
    revisedPrompt: imageResult.revisedPrompt,
    caption: captionResult.caption,
    hashtags: captionResult.hashtags,
    hashtagsString,
    fullCaption,
  };
}

/**
 * Construir prompt otimizado para DALL-E baseado no nicho
 */
function buildImagePrompt(niche, style) {
  const styleGuide = {
    vibrant: 'cores vibrantes e saturadas, iluminação dramática, estilo moderno de marketing',
    minimal: 'design minimalista, fundo clean, cores suaves, estilo elegante',
    natural: 'estilo natural e orgânico, tons terrosos, iluminação suave',
    tech: 'estilo futurista e tecnológico, cores neon, fundo escuro',
    luxury: 'estilo luxuoso e premium, dourado e preto, iluminação cinematográfica',
  };

  const selectedStyle = styleGuide[style] || styleGuide.vibrant;

  return `Crie uma imagem profissional de alta qualidade para um post de Instagram sobre "${niche}". 
Estilo visual: ${selectedStyle}. 
A imagem deve ser adequada para uma marca profissional brasileira. 
NÃO inclua texto, logos ou marcas d'água na imagem. 
Formato: quadrado (1:1), fotografia profissional ou ilustração digital de alta qualidade.
A imagem deve transmitir confiança, saúde e qualidade de vida.`;
}

module.exports = {
  generateImage,
  generateCaption,
  generateFullContent,
};
