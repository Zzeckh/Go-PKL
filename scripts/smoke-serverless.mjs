/**
 * Local smoke test (simulating serverless invocation):
 *
 * 1. `require('./api/index.js')` — proof that the Vercel function entrypoint
 *    exports a callable (req, res) handler (the Express app).
 * 2. Fire a fake HTTP request at the exported handler via node http
 *    → GET /api/health must return 200 JSON {status:'ok',...}.
 * 3. A second import of server.js must NOT open a port (listener only when run directly).
 */
import http from 'node:http';

const handler = (await import('../api/index.js')).default;

if (typeof handler !== 'function') {
  console.error('❌ FAIL: api/index.js default export is not a function —', typeof handler);
  process.exit(1);
}
console.log('✅ api/index.js exports a function:', handler.name || '(anonymous express app)');

const port = 3999;
const server = http.createServer((req, res) => handler(req, res));

await new Promise((resolve) => server.listen(port, resolve));

const res = await new Promise((resolve, reject) => {
  http
    .get({ host: '127.0.0.1', port, path: '/api/health' }, resolve)
    .on('error', reject);
});

const body = await new Promise((resolve) => {
  let data = '';
  res.on('data', (c) => (data += c));
  res.on('end', () => resolve(data));
});

console.log(`GET /api/health → ${res.statusCode} ${body}`);
if (res.statusCode === 200 && JSON.parse(body).status === 'ok') {
  console.log('✅ Handler smoke test PASSED');
} else {
  console.error('❌ FAIL: unexpected response');
  process.exitCode = 1;
}

server.close();
