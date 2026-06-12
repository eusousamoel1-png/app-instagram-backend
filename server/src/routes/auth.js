/**
 * Auth Routes — Login Direto do Instagram
 */
const express = require('express');
const router = express.Router();
const firebaseService = require('../services/firebaseService');
const instagramPrivateService = require('../services/instagramPrivateService');
const { authLimiter } = require('../middleware/rateLimiter');
const { requireAuth } = require('../middleware/authMiddleware');

/**
 * POST /auth/login-direct
 * Recebe username e password do cliente e loga usando instagram-private-api
 */
router.post('/login-direct', authLimiter, requireAuth, async (req, res) => {
  const { username, password } = req.body;
  const uid = req.user.uid;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username e senha são obrigatórios' });
  }

  try {
    console.log(`[Auth] Iniciando login direto para o usuário ${username}...`);
    
    // Chama o serviço privado que vai simular o app do Instagram
    const result = await instagramPrivateService.loginDirect(uid, username, password);

    res.json({
      success: true,
      message: 'Login efetuado com sucesso',
      data: result,
    });
  } catch (error) {
    console.error('❌ Erro no login do Instagram:', error.message);
    
    // Identificar erro de checkpoint / 2FA
    if (error.name === 'IgCheckpointError') {
      return res.status(403).json({ error: 'O Instagram bloqueou a tentativa ou pediu confirmação. Tente fazer login pelo celular primeiro ou use senha de app.' });
    }
    
    if (error.name === 'IgLoginTwoFactorRequiredError') {
      return res.status(403).json({ error: 'Autenticação de Dois Fatores (2FA) necessária. Essa versão não suporta 2FA, por favor desative temporariamente.' });
    }

    res.status(401).json({ error: 'Falha no login. Verifique seu usuário e senha.' });
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

    if (!config || !config.igSession) {
      return res.json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      username: config.username,
      profilePicture: config.profilePicture,
      followersCount: config.followersCount,
      mediaCount: config.mediaCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /auth/logout
 * Limpa token e sessão do Firestore
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    await firebaseService.saveConfig(uid, {
      igSession: null,
      igUserId: null,
      username: null,
    });
    res.json({ success: true, message: 'Desconectado com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
