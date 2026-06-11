/**
 * Rate Limiter Middleware
 * Controla limites de requisições para proteger a API e respeitar os limites do Meta
 */
const rateLimit = require('express-rate-limit');

// Limiter geral — todas as rotas
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: {
    error: 'Muitas requisições. Tente novamente em 15 minutos.',
    retryAfter: '15 minutos',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter para geração de conteúdo IA (mais restrito — custa $)
const contentGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20,
  message: {
    error: 'Limite de geração de conteúdo atingido. Máximo 20/hora.',
    retryAfter: '1 hora',
  },
});

// Limiter para publicação (respeitar Instagram rate limits)
const publishLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 25,
  message: {
    error: 'Limite de publicações atingido. Máximo 25/hora.',
    retryAfter: '1 hora',
  },
});

// Limiter para auth — proteger contra brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Muitas tentativas de login. Tente em 15 minutos.',
  },
});

module.exports = {
  generalLimiter,
  contentGenerationLimiter,
  publishLimiter,
  authLimiter,
};
