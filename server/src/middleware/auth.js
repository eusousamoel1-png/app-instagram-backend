/**
 * Auth Middleware
 * Verifica se existe um token do Instagram configurado antes de permitir operações
 */
const firebaseService = require('../services/firebaseService');

async function requireAuth(req, res, next) {
  try {
    const config = await firebaseService.getConfig();

    if (!config || !config.accessToken) {
      return res.status(401).json({
        error: 'Não autenticado. Faça login com o Instagram primeiro.',
        requiresLogin: true,
      });
    }

    // Verificar se o token não expirou
    if (config.tokenExpiresAt) {
      const expiresAt = new Date(config.tokenExpiresAt);
      if (expiresAt < new Date()) {
        return res.status(401).json({
          error: 'Token expirado. Faça login novamente.',
          requiresLogin: true,
          tokenExpired: true,
        });
      }
    }

    // Anexar config ao request para uso nas rotas
    req.igConfig = config;
    next();
  } catch (error) {
    console.error('Erro no middleware de auth:', error.message);
    res.status(500).json({ error: 'Erro ao verificar autenticação.' });
  }
}

module.exports = { requireAuth };
