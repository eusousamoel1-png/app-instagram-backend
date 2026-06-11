/**
 * Content Routes — Geração de conteúdo com IA
 */
const express = require('express');
const router = express.Router();
const openaiService = require('../services/openaiService');
const { requireAuth } = require('../middleware/auth');
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

module.exports = router;
