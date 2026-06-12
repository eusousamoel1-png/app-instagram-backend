/**
 * Firebase Admin SDK — Firestore Service
 * Projeto: app-postagem-instagram
 */
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Determine service account credentials
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    console.log('✅ Firebase admin loaded from FIREBASE_SERVICE_ACCOUNT_JSON');
  } catch (e) {
    console.warn('⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON', e);
  }
} else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
  serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || 'auto-generated',
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID || 'auto-generated',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL || ''
  };
  console.log('✅ Firebase admin built from individual env vars');
} else {
  // Fallback to file path if exists
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : path.join(__dirname, '../../firebase-service-account.json');
  try {
    const raw = fs.readFileSync(serviceAccountPath, 'utf8');
    serviceAccount = JSON.parse(raw);
    console.log('✅ Firebase admin loaded from file', serviceAccountPath);
  } catch (e) {
    console.warn('⚠️ Firebase admin not initialized: missing credentials', e.message);
  }
}

let db;
if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
  });
  db = admin.firestore();
  console.log('✅ Firebase Admin initialized');
} else {
  console.warn('⚠️ Firebase Admin failed to init – backend auth will not work');
}

// ── Posts Collection ──────────────────────────────────────────

/**
 * Criar um novo post agendado
 */
async function createPost(userId, postData) {
  if (!userId) throw new Error('userId is required to create post');
  const docRef = await db.collection('posts').add({
    ...postData,
    userId,
    status: 'scheduled',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: docRef.id, ...postData };
}

/**
 * Buscar todos os posts (com filtro opcional de status)
 */
async function getPosts(userId, status = null, limit = 50) {
  if (!userId) throw new Error('userId is required to get posts');
  let query = db.collection('posts').where('userId', '==', userId).orderBy('scheduledAt', 'asc');

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
async function getPostById(userId, postId) {
  if (!userId) throw new Error('userId is required');
  const doc = await db.collection('posts').doc(postId).get();
  if (!doc.exists) return null;
  const data = doc.data();
  if (data.userId !== userId) return null; // Ensure the post belongs to the user
  return { id: doc.id, ...data };
}

/**
 * Atualizar status e dados de um post
 */
async function updatePost(userId, postId, updateData) {
  const post = await getPostById(userId, postId);
  if (!post) throw new Error('Post not found or unauthorized');

  await db.collection('posts').doc(postId).update({
    ...updateData,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: postId, ...updateData };
}

/**
 * Deletar um post
 */
async function deletePost(userId, postId) {
  const post = await getPostById(userId, postId);
  if (!post) throw new Error('Post not found or unauthorized');

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
async function saveConfig(userId, configData) {
  if (!userId) throw new Error('userId is required to save config');
  await db.collection('users').doc(userId).collection('config').doc('main').set(configData, { merge: true });
  return configData;
}

/**
 * Buscar configuração
 */
async function getConfig(userId) {
  if (!userId) throw new Error('userId is required to get config');
  const doc = await db.collection('users').doc(userId).collection('config').doc('main').get();
  if (!doc.exists) return null;
  return doc.data();
}

/**
 * Incrementar contador diário de posts
 */
async function incrementDailyCount(userId) {
  if (!userId) throw new Error('userId is required');
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const ref = db.collection('users').doc(userId).collection('config').doc('dailyStats');
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
async function getDailyCount(userId) {
  if (!userId) return 0;
  const today = new Date().toISOString().split('T')[0];
  const doc = await db.collection('users').doc(userId).collection('config').doc('dailyStats').get();
  if (!doc.exists || doc.data().date !== today) return 0;
  return doc.data().count || 0;
}

module.exports = {
  admin,
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
