/**
 * Instagram Private API Service
 * Endpoint para logar com usuário e senha diretamente e simular um aparelho celular.
 */
const { IgApiClient } = require('instagram-private-api');
const firebaseService = require('./firebaseService');

async function loginDirect(uid, username, password) {
  const ig = new IgApiClient();
  // Simula um dispositivo único com base no username
  ig.state.generateDevice(username);

  console.log(`[IG] Tentando login direto para o usuário: ${username}`);
  
  // Realiza o login (isso pode falhar se pedir challenge/2FA)
  const authResponse = await ig.account.login(username, password);
  console.log(`[IG] Login com sucesso para ID: ${authResponse.pk}`);

  // Serializar o estado da sessão (cookies, device, auth tokens)
  const serializedSession = await ig.state.serialize();

  // Buscar detalhes básicos da conta recém conectada
  const userInfo = await ig.user.info(authResponse.pk);

  // Salvar no banco (mesmo formato que esperávamos antes, mais o serializedSession)
  await firebaseService.saveConfig(uid, {
    igUserId: authResponse.pk,
    username: userInfo.username,
    profilePicture: userInfo.profile_pic_url,
    followersCount: userInfo.follower_count,
    mediaCount: userInfo.media_count,
    connectedAt: new Date().toISOString(),
    // Armazenar sessão serializada no Firestore para usar na hora de publicar
    igSession: JSON.stringify(serializedSession),
  });

  return {
    success: true,
    pk: authResponse.pk,
    username: userInfo.username,
    profilePicture: userInfo.profile_pic_url,
  };
}

/**
 * Função utilitária para recriar o client com a sessão logada a partir do banco
 */
async function getIgClientForUser(uid) {
  const config = await firebaseService.getConfig(uid);
  if (!config || !config.igSession) {
    throw new Error('Sessão do Instagram não encontrada para este usuário.');
  }

  const ig = new IgApiClient();
  
  // É importante gerar o device novamente (usando a mesma seed) ou desserializar as constantes
  const state = JSON.parse(config.igSession);
  
  // Desserializa o estado antigo para recuperar cookies e tokens
  await ig.state.deserialize(state);

  return ig;
}

/**
 * Publicar foto na conta do usuário usando a sessão guardada
 */
async function publishPhoto(uid, imageBuffer, caption) {
  const ig = await getIgClientForUser(uid);
  
  console.log(`[IG] Iniciando publicação para o usuário UID: ${uid}`);

  const publishResult = await ig.publish.photo({
    file: imageBuffer, // precisa ser buffer jpg!
    caption: caption,
  });

  console.log(`[IG] Foto publicada! Media ID: ${publishResult.media.id}`);
  
  // Retorna os mesmos formatos para a base
  return {
    mediaId: publishResult.media.id,
    containerId: publishResult.media.code // url path
  };
}

module.exports = {
  loginDirect,
  getIgClientForUser,
  publishPhoto,
};
