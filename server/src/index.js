require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { generalLimiter } = require('./middleware/rateLimiter');
const { initScheduler } = require('./services/schedulerService');

const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const postsRoutes = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares ────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 }, // 7 dias
}));

app.use(generalLimiter);

// ── Rotas ──────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/content', contentRoutes);
app.use('/posts', postsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Inicializar servidor ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📸 Instagram: @${process.env.INSTAGRAM_USERNAME || 'powerencapsulados'}`);
  console.log('');

  // Iniciar o scheduler de postagens automáticas
  initScheduler();
  console.log('⏱️  Scheduler de postagens ativado\n');
});

module.exports = app;
