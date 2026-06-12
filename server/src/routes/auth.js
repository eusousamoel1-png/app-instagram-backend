/**
 * Auth Routes — OAuth Instagram / Meta
 * Fluxo: Login → Facebook OAuth → Callback → Token → Long-lived token → Firestore
 */
const express = require('express');
const router = express.Router();
const instagramService = require('../services/instagramService');
const firebaseService = require('../services/firebaseService');
const { authLimiter } = require('../middleware/rateLimiter');

const { requireAuth } = require('../middleware/authMiddleware');

/**
 * GET /auth/instagram
 * Redireciona o usuário para a tela de login do Facebook/Instagram
 */
router.get('/instagram', authLimiter, (req, res) => {
  const uid = req.query.uid;
  if (!uid) {
    return res.status(400).send('UID is required to connect Instagram');
  }

  const appId = process.env.META_APP_ID;
  const redirectUri = encodeURIComponent(process.env.META_REDIRECT_URI);
  const scopes = [
    'instagram_basic',
    'instagram_content_publish',
    'pages_show_list',
    'pages_read_engagement',
  ].join(',');

  const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code&state=${uid}`;

  console.log(`🔑 Redirecionando para OAuth: ${authUrl}`);
  res.redirect(authUrl);
});

/**
 * GET /auth/callback
 * Callback do OAuth — recebe o code, troca por token, salva no Firestore
 */
router.get('/callback', authLimiter, async (req, res) => {
  const { code, error, state } = req.query;
  const uid = state; // The uid is passed back as state

  if (error) {
    console.error('❌ Erro no OAuth:', error);
    return res.redirect(`${process.env.CLIENT_URL}/login?error=${error}`);
  }

  if (!code) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=no_code`);
  }

  try {
    console.log('🔄 Trocando code por access token...');

    // 1. Trocar code por token de curto prazo
    const tokenData = await instagramService.exchangeCodeForToken(code);
    console.log('   ✅ Token de curto prazo obtido');

    // 2. Converter para token de longo prazo (60 dias)
    const longLivedData = await instagramService.getLongLivedToken(tokenData.access_token);
    console.log('   ✅ Token de longo prazo obtido (60 dias)');

    // 3. Buscar páginas do Facebook
    const pages = await instagramService.getFacebookPages(longLivedData.access_token);
    console.log(`   📄 ${pages.length} página(s) encontrada(s)`);

    if (pages.length === 0) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=no_pages`);
    }

    // 4. Usar a primeira página para obter o IG Business Account
    const page = pages[0];
    const igUserId = await instagramService.getInstagramAccountId(page.id, page.access_token);

    if (!igUserId) {
      console.error('❌ Nenhuma conta Instagram Business vinculada à página');
      return res.redirect(`${process.env.CLIENT_URL}/login?error=no_instagram`);
    }

    console.log(`   📸 Instagram Business Account: ${igUserId}`);

    // 5. Buscar perfil do Instagram
    const profile = await instagramService.getInstagramProfile(igUserId, page.access_token);
    console.log(`   👤 Perfil: @${profile.username}`);

    // 6. Salvar tudo no Firestore
    const expiresAt = new Date(Date.now() + (longLivedData.expires_in * 1000));

    if (!uid) {
      throw new Error('UID ausente no callback');
    }

    await firebaseService.saveConfig(uid, {
      accessToken: page.access_token, // page token (não expira enquanto long-lived user token for válido)
      userAccessToken: longLivedData.access_token,
      tokenExpiresAt: expiresAt.toISOString(),
      igUserId,
      pageId: page.id,
      pageName: page.name,
      username: profile.username,
      profilePicture: profile.profile_picture_url,
      followersCount: profile.followers_count,
      mediaCount: profile.media_count,
      connectedAt: new Date().toISOString(),
    });

    console.log('   💾 Configuração salva no Firestore');
    console.log(`\n🎉 Login completo! @${profile.username} conectado.\n`);

    // Redirecionar para o dashboard
    res.redirect(`${process.env.CLIENT_URL}/dashboard?connected=true`);

  } catch (error) {
    console.error('❌ Erro no callback OAuth:', error.response?.data || error.message);
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
});

/**
 * GET /auth/status
 * Retorna status de autenticação
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const config = await firebaseService.getConfig(uid);

    if (!config || !config.accessToken) {
      return res.json({ authenticated: false });
    }

    const isExpired = config.tokenExpiresAt && new Date(config.tokenExpiresAt) < new Date();

    res.json({
      authenticated: !isExpired,
      username: config.username,
      profilePicture: config.profilePicture,
      followersCount: config.followersCount,
      mediaCount: config.mediaCount,
      tokenExpiresAt: config.tokenExpiresAt,
      isExpired,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /auth/logout
 * Limpa token do Firestore
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    await firebaseService.saveConfig(uid, {
      accessToken: null,
      userAccessToken: null,
      tokenExpiresAt: null,
      igUserId: null,
    });
    res.json({ success: true, message: 'Desconectado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
