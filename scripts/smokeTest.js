// scripts/smokeTest.js
// Prueba simple para verificar endpoints básicos de la API
const fetch = global.fetch || require('node-fetch');

const BASE = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
const endpoints = [
  '/',
  '/health',
  '/docs',
  `${API_PREFIX}/auth/verify-token`
];

(async () => {
  console.log('BASE:', BASE);
  for (const ep of endpoints) {
    const url = ep.startsWith('/') ? `${BASE}${ep}` : `${BASE}/${ep}`;
    try {
      const res = await fetch(url, { method: 'GET' });
      console.log(`${url} -> ${res.status}`);
    } catch (err) {
      console.error(`${url} -> ERROR`, err.message);
    }
  }
  console.log('Smoke test finalizado.');
})();
