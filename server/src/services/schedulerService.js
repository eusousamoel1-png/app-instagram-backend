/**
 * Scheduler Service — Cron job para disparar posts automaticamente
 * Verifica a cada minuto por posts agendados prontos para publicar
 */
const cron = require('node-cron');
const firebaseService = require('./firebaseService');
const instagramService = require('./instagramService');

let isRunning = false;

/**
 * Inicializar o scheduler
 */
function initScheduler() {
  // Executar a cada minuto
  cron.schedule('* * * * *', async () => {
    if (isRunning) {
      console.log('⏭️  Scheduler já está processando, pulando ciclo...');
      return;
    }

    try {
      isRunning = true;
      await processScheduledPosts();
    } catch (error) {
      console.error('❌ Erro no scheduler:', error.message);
    } finally {
      isRunning = false;
    }
  });

  console.log('✅ Scheduler inicializado — verificando posts a cada minuto');
}

/**
 * Processar posts agendados
 */
async function processScheduledPosts() {
  // 1. Buscar posts prontos
  const posts = await firebaseService.getPostsReadyToPublish();

  if (posts.length === 0) {
    return; // Nada para publicar, silêncio no log
  }

  console.log(`\n📋 ${posts.length} post(s) prontos para publicar`);
  const maxDaily = parseInt(process.env.MAX_POSTS_PER_DAY) || 10;

  // 2. Processar cada post
  for (const post of posts) {
    const userId = post.userId;
    if (!userId) {
      console.error(`❌ Post ${post.id} não possui userId. Ignorando.`);
      continue;
    }

    // 2.1 Verificar limite diário do usuário
    const dailyCount = await firebaseService.getDailyCount(userId);
    if (dailyCount >= maxDaily) {
      console.log(`🚫 Limite diário atingido para usuário ${userId} (${dailyCount}/${maxDaily}). Ignorando post ${post.id}.`);
      continue;
    }

    // 2.2 Obter configuração do usuário (token + IG user ID)
    const config = await firebaseService.getConfig(userId);

    if (!config || !config.accessToken || !config.igUserId) {
      console.error(`❌ Configuração incompleta para usuário ${userId}. Faça login via OAuth primeiro.`);
      continue;
    }

    // 2.3 Verificar rate limit da API
    const limit = await instagramService.getPublishingLimit(config.igUserId, config.accessToken);
    if (limit) {
      console.log(`   📊 Quota usage (User ${userId}): ${JSON.stringify(limit)}`);
    }

    try {
      // Marcar como "publishing"
      await firebaseService.updatePost(userId, post.id, { status: 'publishing' });

      console.log(`\n🔄 Publicando post ${post.id} (User: ${userId})...`);

      // Montar caption completa com hashtags
      const fullCaption = post.hashtags
        ? `${post.caption}\n\n${post.hashtags}`
        : post.caption;

      // Publicar no Instagram
      const result = await instagramService.publishPost(
        config.igUserId,
        post.imageUrl,
        fullCaption,
        config.accessToken
      );

      // Sucesso — atualizar no Firestore
      await firebaseService.updatePost(userId, post.id, {
        status: 'published',
        igMediaId: result.mediaId,
        publishedAt: new Date().toISOString(),
      });

      await firebaseService.incrementDailyCount(userId);

      console.log(`✅ Post ${post.id} publicado com sucesso! Media ID: ${result.mediaId}`);

      // Delay entre posts para respeitar rate limit (30 segundos)
      if (posts.indexOf(post) < posts.length - 1) {
        console.log('   ⏳ Aguardando 30s antes do próximo post...');
        await sleep(30000);
      }

    } catch (error) {
      console.error(`❌ Erro ao publicar post ${post.id}:`, error.message);

      await firebaseService.updatePost(userId, post.id, {
        status: 'failed',
        error: error.response?.data?.error?.message || error.message,
      });
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { initScheduler, processScheduledPosts };
