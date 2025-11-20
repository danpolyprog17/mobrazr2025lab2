// Скрипт для проверки подключения к API серверу
// Запустите этот скрипт в Node.js для проверки доступности сервера

const API_URLS = [
  'http://localhost:3001/api/test-db',
  'http://127.0.0.1:3001/api/test-db',
  'http://192.168.0.20:3001/api/test-db',
  'http://10.0.2.2:3001/api/test-db',
];

async function testConnection(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    console.log(`✅ ${url} - OK:`, data);
    return true;
  } catch (error) {
    console.log(`❌ ${url} - ERROR:`, error.message);
    return false;
  }
}

async function testAll() {
  console.log('Testing API server connections...\n');
  for (const url of API_URLS) {
    await testConnection(url);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

testAll();


