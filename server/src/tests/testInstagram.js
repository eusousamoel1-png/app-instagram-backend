require('dotenv').config({ path: '../../.env' });
const instagramService = require('../services/instagramService');

async function testInstagramConnection() {
  console.log('🧪 Teste de Conexão com Instagram API\n');

  if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
    console.error('❌ ERRO: META_APP_ID e META_APP_SECRET não encontrados no .env');
    process.exit(1);
  }

  console.log('✅ Variáveis de ambiente configuradas');
  console.log('⚠️ Para testar a API, você precisa autenticar pelo navegador primeiro e pegar o access_token no Firestore.');
  console.log('⚠️ Rode a aplicação, faça login e verifique a integração.');

  // This script is meant to be expanded once the user has a valid access token in Firestore.
  // It provides a foundation to test the setup.

  console.log('\n✅ Teste de ambiente concluído.');
  process.exit(0);
}

testInstagramConnection();
