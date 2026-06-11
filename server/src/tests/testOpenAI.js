require('dotenv').config({ path: '../../.env' });
const openaiService = require('../services/openaiService');

async function testOpenAIConnection() {
  console.log('🧪 Teste de Conexão com OpenAI\n');

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ ERRO: OPENAI_API_KEY não encontrada no .env');
    process.exit(1);
  }

  console.log('✅ Variável de ambiente OPENAI_API_KEY encontrada');
  console.log('🔄 Testando geração de legenda rápida...\n');

  try {
    const result = await openaiService.generateCaption('cápsulas de ômega 3', ['saúde', 'coração'], 'informativo');
    console.log('✅ Sucesso! Legenda gerada:\n');
    console.log(result.caption);
    console.log('\nHashtags:');
    console.log(result.hashtags.join(' '));
  } catch (error) {
    console.error('\n❌ Erro ao conectar com a OpenAI:');
    console.error(error.message);
  }

  console.log('\n✅ Teste concluído.');
  process.exit(0);
}

testOpenAIConnection();
