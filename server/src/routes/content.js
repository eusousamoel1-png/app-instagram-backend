/**
 * Content Routes — Geração de conteúdo com IA
 */
const express = require('express');
const router = express.Router();
const openaiService = require('../services/openaiService');
const { requireAuth } = require('../middleware/authMiddleware');
const { contentGenerationLimiter } = require('../middleware/rateLimiter');

/**
 * POST /content/generate
 * Gera conteúdo completo (imagem + legenda + hashtags) com IA
 *
 * Body: { niche, keywords[], tone, style }
 */
router.post('/generate', requireAuth, contentGenerationLimiter, async (req, res) => {
  try {
    const {
      niche = process.env.DEFAULT_NICHE || 'capsulas naturais e suplementos',
      keywords = [],
      tone = 'profissional e motivador',
      style = 'vibrant',
    } = req.body;

    console.log(`\n🤖 Gerando conteúdo IA para nicho: "${niche}"`);

    const content = await openaiService.generateFullContent(niche, keywords, tone, style);

    res.json({
      success: true,
      data: content,
    });

  } catch (error) {
    console.error('❌ Erro ao gerar conteúdo:', error.message);
    res.status(500).json({
      error: 'Erro ao gerar conteúdo com IA.',
      details: error.message,
    });
  }
});

/**
 * POST /content/generate-caption
 * Gera apenas legenda + hashtags (sem imagem)
 *
 * Body: { niche, keywords[], tone }
 */
router.post('/generate-caption', requireAuth, contentGenerationLimiter, async (req, res) => {
  try {
    const {
      niche = process.env.DEFAULT_NICHE,
      keywords = [],
      tone = 'profissional e motivador',
    } = req.body;

    const result = await openaiService.generateCaption(niche, keywords, tone);

    res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('❌ Erro ao gerar legenda:', error.message);
    res.status(500).json({
      error: 'Erro ao gerar legenda.',
      details: error.message,
    });
  }
});

/**
 * POST /content/generate-image
 * Gera apenas imagem
 *
 * Body: { niche, style }
 */
router.post('/generate-image', requireAuth, contentGenerationLimiter, async (req, res) => {
  try {
    const {
      niche = process.env.DEFAULT_NICHE,
      style = 'vibrant',
    } = req.body;

    const result = await openaiService.generateImage(niche, style);

    res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('❌ Erro ao gerar imagem:', error.message);
    res.status(500).json({
      error: 'Erro ao gerar imagem.',
      details: error.message,
    });
  }
});

/**
 * POST /content/generate-batch
 * Gera um lote de posts (apenas texto + imagePrompt)
 *
 * Body: { niche, keywords[], tone, count }
 */
router.post('/generate-batch', requireAuth, contentGenerationLimiter, async (req, res) => {
  try {
    const {
      niche = process.env.DEFAULT_NICHE,
      keywords = [],
      tone = 'profissional e motivador',
      count = 7
    } = req.body;

    const posts = await openaiService.generateBatchCaptions(niche, count, keywords, tone);

    // Map to include a temporary ID for the frontend to manage them
    const dataWithIds = posts.map(p => ({
      id: Math.random().toString(36).substr(2, 9),
      caption: p.caption,
      hashtags: p.hashtags,
      imagePrompt: p.imagePrompt,
      imageUrl: null, // to be generated later
      status: 'draft'
    }));

    res.json({
      success: true,
      data: dataWithIds,
    });

  } catch (error) {
    console.error('❌ Erro ao gerar lote:', error.message);
    res.status(500).json({
      error: 'Erro ao gerar lote de posts.',
      details: error.message,
    });
  }
});

module.exports = router;
