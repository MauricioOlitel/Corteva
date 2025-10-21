#!/usr/bin/env node

/**
 * Script para testar credenciais do Twilio localmente
 * Uso: 
 *   TWILIO_ACCOUNT_SID=ACxxx TWILIO_API_KEY=SKxxx TWILIO_API_SECRET=xxx node scripts/test-credentials.mjs
 * Ou configure as variáveis no .env e rode: npm run test-credentials
 */

import axios from 'axios';

const testCredentials = async () => {
  console.log('🔍 Testando credenciais do Twilio...\n');

  // Verificar se as variáveis estão definidas
  const requiredVars = {
    'TWILIO_ACCOUNT_SID': process.env.TWILIO_ACCOUNT_SID,
    'TWILIO_API_KEY': process.env.TWILIO_API_KEY,
    'TWILIO_API_SECRET': process.env.TWILIO_API_SECRET,
  };

  let hasErrors = false;

  console.log('📋 Verificando variáveis de ambiente:');
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      console.log(`❌ ${key}: NÃO DEFINIDA`);
      hasErrors = true;
    } else {
      const preview = value.substring(0, 6) + '...' + value.substring(value.length - 4);
      console.log(`✅ ${key}: ${preview}`);
    }
  }

  if (hasErrors) {
    console.log('\n❌ Erro: Variáveis de ambiente faltando');
    console.log('\nCrie um arquivo .env na raiz do projeto com:');
    console.log('TWILIO_ACCOUNT_SID=ACxxxx');
    console.log('TWILIO_API_KEY=SKxxxx');
    console.log('TWILIO_API_SECRET=seu_secret');
    process.exit(1);
  }

  console.log('\n🔐 Testando autenticação com Twilio API...');

  try {
    const response = await axios.get('https://flex-api.twilio.com/v1/Configuration', {
      auth: {
        username: process.env.TWILIO_API_KEY,
        password: process.env.TWILIO_API_SECRET
      }
    });

    const accountSid = response.data.account_sid;
    console.log(`✅ Autenticação bem-sucedida!`);
    console.log(`   Account SID retornado: ${accountSid}`);

    if (accountSid === process.env.TWILIO_ACCOUNT_SID) {
      console.log('✅ Account SID coincide com a variável de ambiente');
    } else {
      console.log('❌ ATENÇÃO: Account SID não coincide!');
      console.log(`   Esperado: ${process.env.TWILIO_ACCOUNT_SID}`);
      console.log(`   Retornado: ${accountSid}`);
      process.exit(1);
    }

    console.log('\n✨ Todas as credenciais estão corretas!');
    console.log('\n📊 Informações da conta Flex:');
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Runtime Domain: ${response.data.runtime_domain}`);
    console.log(`   UI Version: ${response.data.ui_version}`);

  } catch (error) {
    console.log('❌ Erro ao autenticar com Twilio:');
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Mensagem: ${error.response.statusText}`);
      
      if (error.response.status === 401) {
        console.log('\n💡 Erro 401 (Unauthorized) - Possíveis causas:');
        console.log('   1. API Key ou API Secret incorretos');
        console.log('   2. API Key foi deletada ou desativada');
        console.log('   3. API Key pertence a outra conta');
        console.log('\n🔧 Solução:');
        console.log('   1. Acesse: https://console.twilio.com/us1/develop/api-keys');
        console.log('   2. Crie uma nova API Key');
        console.log('   3. Atualize TWILIO_API_KEY e TWILIO_API_SECRET no .env');
      }
    } else {
      console.log(`   ${error.message}`);
    }
    
    process.exit(1);
  }
};

testCredentials();
