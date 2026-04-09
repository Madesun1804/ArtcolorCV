// Detecta ambiente automaticamente
window.API_URL = (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
) ? 'http://localhost:4000'
  : 'https://artcolorcv-production.up.railway.app';
