/**
 * Firebase Admin SDK — Firestore Service
 * Projeto: app-postagem-instagram
 */
const admin = require('firebase-admin');
const path = require('path');

const fs = require('fs');

// Inicializar Firebase Admin
// Resolve path: if env var is set use it (resolved from CWD), otherwise default to server root
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
  : path.join(__dirname, '../../firebase-service-account.json');

let db;

try {
  // Use fs + JSON.parse instead of require() to avoid caching issues and
  // properly resolve paths relative to CWD rather than __dirname
  const serviceAccountRaw = fs.readFileSync(serviceAccountPath, 'utf8');
  const serviceAccount = JSON.parse(serviceAccountRaw);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id || 'app-postagem-instagram',
  });
  db = admin.firestore();
  console.log('✅ Firebase Admin inicializado com sucesso');
  console.log(`   📁 Service account: ${serviceAccountPath}`);
} catch (error) {
  console.warn('⚠️  Firebase Admin não inicializado:', error.message);
  console.warn(`   📁 Caminho tentado: ${serviceAccountPath}`);
  console.warn('   Certifique-se de que o arquivo firebase-service-account.json existe');
}

// ── Posts Collection ──────────────────────────────────────────

/**
 * Criar um novo post agendado
 */
async function createPost(postData) {
  const docRef = await db.collection('posts').add({
    ...postData,
    status: 'scheduled',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: docRef.id, ...postData };
}

/**
 * Buscar todos os posts (com filtro opcional de status)
 */
async function getPosts(status = null, limit = 50) {
  let query = db.collection('posts').orderBy('scheduledAt', 'asc');

  if (status) {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.limit(limit).get();
  const posts = [];
  snapshot.forEach(doc => {
    posts.push({ id: doc.id, ...doc.data() });
  });
  return posts;
}

/**
 * Buscar um post por ID
 */
async function getPostById(postId) {
  const doc = await db.collection('posts').doc(postId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

/**
 * Atualizar status e dados de um post
 */
async function updatePost(postId, updateData) {
  await db.collection('posts').doc(postId).update({
    ...updateData,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: postId, ...updateData };
}

/**
 * Deletar um post
 */
async function deletePost(postId) {
  await db.collection('posts').doc(postId).delete();
  return { id: postId, deleted: true };
}

/**
 * Buscar posts prontos para publicar (agendados com data <= agora)
 */
async function getPostsReadyToPublish() {
  const now = admin.firestore.Timestamp.now();
  const snapshot = await db.collection('posts')
    .where('status', '==', 'scheduled')
    .where('scheduledAt', '<=', now)
    .orderBy('scheduledAt', 'asc')
    .limit(5) // processa até 5 por vez para evitar rate limit
    .get();

  const posts = [];
  snapshot.forEach(doc => {
    posts.push({ id: doc.id, ...doc.data() });
  });
  return posts;
}

// ── Config Collection ─────────────────────────────────────────

/**
 * Salvar ou atualizar configuração (token, conta IG, etc.)
 */
async function saveConfig(configData) {
  await db.collection('config').doc('main').set(configData, { merge: true });
  return configData;
}

/**
 * Buscar configuração
 */
async function getConfig() {
  const doc = await db.collection('config').doc('main').get();
  if (!doc.exists) return null;
  return doc.data();
}

/**
 * Incrementar contador diário de posts
 */
async function incrementDailyCount() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const ref = db.collection('config').doc('dailyStats');
  const doc = await ref.get();

  if (doc.exists && doc.data().date === today) {
    await ref.update({
      count: admin.firestore.FieldValue.increment(1),
    });
    return doc.data().count + 1;
  } else {
    await ref.set({ date: today, count: 1 });
    return 1;
  }
}

/**
 * Obter contagem diária atual
 */
async function getDailyCount() {
  const today = new Date().toISOString().split('T')[0];
  const doc = await db.collection('config').doc('dailyStats').get();
  if (!doc.exists || doc.data().date !== today) return 0;
  return doc.data().count || 0;
}

module.exports = {
  db,
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  getPostsReadyToPublish,
  saveConfig,
  getConfig,
  incrementDailyCount,
  getDailyCount,
};
