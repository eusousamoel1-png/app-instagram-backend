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
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const isProduction = process.env.NODE_ENV === 'production' ||
  (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,      // true em produção (HTTPS)
    sameSite: isProduction ? 'none' : 'lax', // 'none' para cross-origin
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    httpOnly: true,
  },
}));

app.set('trust proxy', 1); // Necessário para Render (proxy reverso)

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
