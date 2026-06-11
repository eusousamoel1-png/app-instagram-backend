/**
 * Instagram Graph API Service
 * Endpoints de Content Publishing para publicação automática
 */
const axios = require('axios');

const GRAPH_API_BASE = 'https://graph.facebook.com/v20.0';

/**
 * Trocar authorization code por access token (curto prazo)
 */
async function exchangeCodeForToken(code) {
  const response = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
    params: {
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      redirect_uri: process.env.META_REDIRECT_URI,
      code,
    },
  });
  return response.data; // { access_token, token_type, expires_in }
}

/**
 * Converter token de curto prazo para longo prazo (60 dias)
 */
async function getLongLivedToken(shortToken) {
  const response = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      fb_exchange_token: shortToken,
    },
  });
  return response.data; // { access_token, token_type, expires_in }
}

/**
 * Obter páginas do Facebook vinculadas ao usuário
 */
async function getFacebookPages(accessToken) {
  const response = await axios.get(`${GRAPH_API_BASE}/me/accounts`, {
    params: { access_token: accessToken },
  });
  return response.data.data; // Array de páginas
}

/**
 * Obter Instagram Business Account ID a partir da página do Facebook
 */
async function getInstagramAccountId(pageId, pageAccessToken) {
  const response = await axios.get(`${GRAPH_API_BASE}/${pageId}`, {
    params: {
      fields: 'instagram_business_account',
      access_token: pageAccessToken,
    },
  });
  return response.data.instagram_business_account?.id || null;
}

/**
 * Obter informações do perfil Instagram
 */
async function getInstagramProfile(igUserId, accessToken) {
  const response = await axios.get(`${GRAPH_API_BASE}/${igUserId}`, {
    params: {
      fields: 'id,username,name,profile_picture_url,followers_count,media_count',
      access_token: accessToken,
    },
  });
  return response.data;
}

/**
 * Verificar limite de publicação (rate limit)
 */
async function getPublishingLimit(igUserId, accessToken) {
  try {
    const response = await axios.get(`${GRAPH_API_BASE}/${igUserId}/content_publishing_limit`, {
      params: {
        fields: 'config,quota_usage',
        access_token: accessToken,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao verificar publishing limit:', error.response?.data || error.message);
    return null;
  }
}

/**
 * STEP 1: Criar Media Container (upload da imagem)
 * A imagem precisa estar hospedada em uma URL pública acessível pelo Facebook
 */
async function createMediaContainer(igUserId, imageUrl, caption, accessToken) {
  const response = await axios.post(`${GRAPH_API_BASE}/${igUserId}/media`, null, {
    params: {
      image_url: imageUrl,
      caption: caption,
      access_token: accessToken,
    },
  });
  return response.data; // { id: "container_id" }
}

/**
 * STEP 2: Publicar o Media Container
 */
async function publishMediaContainer(igUserId, creationId, accessToken) {
  const response = await axios.post(`${GRAPH_API_BASE}/${igUserId}/media_publish`, null, {
    params: {
      creation_id: creationId,
      access_token: accessToken,
    },
  });
  return response.data; // { id: "media_id" }
}

/**
 * Verificar status do container (para uploads grandes que demoram)
 */
async function checkContainerStatus(containerId, accessToken) {
  const response = await axios.get(`${GRAPH_API_BASE}/${containerId}`, {
    params: {
      fields: 'status_code,status',
      access_token: accessToken,
    },
  });
  return response.data; // { status_code: "FINISHED" | "IN_PROGRESS" | "ERROR" }
}

/**
 * Fluxo completo de publicação: criar container → aguardar → publicar
 */
async function publishPost(igUserId, imageUrl, caption, accessToken) {
  console.log(`📤 Iniciando publicação para @powerencapsulados...`);

  // Step 1 — Criar container
  const container = await createMediaContainer(igUserId, imageUrl, caption, accessToken);
  console.log(`   📦 Container criado: ${container.id}`);

  // Step 2 — Aguardar processamento (polling com backoff)
  let status = 'IN_PROGRESS';
  let attempts = 0;
  const maxAttempts = 20;

  while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
    await sleep(3000 + (attempts * 1000)); // backoff progressivo
    const check = await checkContainerStatus(container.id, accessToken);
    status = check.status_code;
    attempts++;
    console.log(`   ⏳ Status: ${status} (tentativa ${attempts}/${maxAttempts})`);
  }

  if (status !== 'FINISHED') {
    throw new Error(`Container não ficou pronto. Status final: ${status}`);
  }

  // Step 3 — Publicar
  const result = await publishMediaContainer(igUserId, container.id, accessToken);
  console.log(`   ✅ Post publicado! Media ID: ${result.id}`);

  return {
    mediaId: result.id,
    containerId: container.id,
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  exchangeCodeForToken,
  getLongLivedToken,
  getFacebookPages,
  getInstagramAccountId,
  getInstagramProfile,
  getPublishingLimit,
  createMediaContainer,
  publishMediaContainer,
  checkContainerStatus,
  publishPost,
};
