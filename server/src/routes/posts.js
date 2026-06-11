/**
 * Posts Routes — CRUD de posts agendados + publicação manual
 */
const express = require('express');
const router = express.Router();
const firebaseService = require('../services/firebaseService');
const instagramService = require('../services/instagramService');
const { requireAuth } = require('../middleware/auth');
const { publishLimiter } = require('../middleware/rateLimiter');

/**
 * GET /posts
 * Lista todos os posts (filtro opcional por status)
 * Query: ?status=scheduled|publishing|published|failed&limit=50
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, limit } = req.query;
    const posts = await firebaseService.getPosts(status, parseInt(limit) || 50);

    // Também retornar contagem diária
    const dailyCount = await firebaseService.getDailyCount();
    const maxDaily = parseInt(process.env.MAX_POSTS_PER_DAY) || 10;

    res.json({
      success: true,
      data: posts,
      meta: {
        total: posts.length,
        dailyCount,
        maxDaily,
        remainingToday: Math.max(0, maxDaily - dailyCount),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /posts/stats
 * Estatísticas gerais de posts
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const [scheduled, published, failed] = await Promise.all([
      firebaseService.getPosts('scheduled'),
      firebaseService.getPosts('published'),
      firebaseService.getPosts('failed'),
    ]);

    const dailyCount = await firebaseService.getDailyCount();

    res.json({
      success: true,
      data: {
        scheduled: scheduled.length,
        published: published.length,
        failed: failed.length,
        total: scheduled.length + published.length + failed.length,
        dailyCount,
        maxDaily: parseInt(process.env.MAX_POSTS_PER_DAY) || 10,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /posts/:id
 * Buscar um post específico
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const post = await firebaseService.getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post não encontrado.' });
    }
    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /posts/schedule
 * Agendar um novo post
 *
 * Body: { imageUrl, caption, hashtags, scheduledAt }
 */
router.post('/schedule', requireAuth, async (req, res) => {
  try {
    const { imageUrl, caption, hashtags, scheduledAt } = req.body;

    if (!imageUrl || !caption || !scheduledAt) {
      return res.status(400).json({
        error: 'Campos obrigatórios: imageUrl, caption, scheduledAt',
      });
    }

    // Validar que a data é futura
    const scheduleDate = new Date(scheduledAt);
    if (scheduleDate <= new Date()) {
      return res.status(400).json({
        error: 'A data de agendamento deve ser no futuro.',
      });
    }

    const post = await firebaseService.createPost({
      imageUrl,
      caption,
      hashtags: hashtags || '',
      scheduledAt: scheduleDate,
    });

    console.log(`📅 Post agendado: ${post.id} para ${scheduleDate.toISOString()}`);

    res.status(201).json({
      success: true,
      data: post,
      message: `Post agendado para ${scheduleDate.toLocaleString('pt-BR')}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /posts/:id
 * Atualizar um post agendado (apenas se status = 'scheduled')
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const post = await firebaseService.getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post não encontrado.' });
    }
    if (post.status !== 'scheduled') {
      return res.status(400).json({ error: 'Só é possível editar posts com status "scheduled".' });
    }

    const { imageUrl, caption, hashtags, scheduledAt } = req.body;
    const updateData = {};
    if (imageUrl) updateData.imageUrl = imageUrl;
    if (caption) updateData.caption = caption;
    if (hashtags !== undefined) updateData.hashtags = hashtags;
    if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt);

    const updated = await firebaseService.updatePost(req.params.id, updateData);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /posts/:id
 * Cancelar/deletar um post (apenas se status = 'scheduled')
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const post = await firebaseService.getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post não encontrado.' });
    }
    if (post.status !== 'scheduled' && post.status !== 'failed') {
      return res.status(400).json({ error: 'Só é possível deletar posts agendados ou com falha.' });
    }

    await firebaseService.deletePost(req.params.id);
    res.json({ success: true, message: 'Post removido.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /posts/:id/publish
 * Forçar publicação imediata de um post agendado
 */
router.post('/:id/publish', requireAuth, publishLimiter, async (req, res) => {
  try {
    const post = await firebaseService.getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post não encontrado.' });
    }
    if (post.status !== 'scheduled' && post.status !== 'failed') {
      return res.status(400).json({ error: 'Post não pode ser publicado (status atual: ' + post.status + ').' });
    }

    // Verificar limite diário
    const dailyCount = await firebaseService.getDailyCount();
    const maxDaily = parseInt(process.env.MAX_POSTS_PER_DAY) || 10;
    if (dailyCount >= maxDaily) {
      return res.status(429).json({
        error: `Limite diário atingido (${dailyCount}/${maxDaily}).`,
      });
    }

    // Marcar como publishing
    await firebaseService.updatePost(post.id, { status: 'publishing' });

    const config = req.igConfig;
    const fullCaption = post.hashtags
      ? `${post.caption}\n\n${post.hashtags}`
      : post.caption;

    // Publicar
    const result = await instagramService.publishPost(
      config.igUserId,
      post.imageUrl,
      fullCaption,
      config.accessToken
    );

    // Atualizar status
    await firebaseService.updatePost(post.id, {
      status: 'published',
      igMediaId: result.mediaId,
      publishedAt: new Date().toISOString(),
    });

    await firebaseService.incrementDailyCount();

    res.json({
      success: true,
      message: 'Post publicado com sucesso!',
      data: { mediaId: result.mediaId },
    });
  } catch (error) {
    await firebaseService.updatePost(req.params.id, {
      status: 'failed',
      error: error.response?.data?.error?.message || error.message,
    });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
