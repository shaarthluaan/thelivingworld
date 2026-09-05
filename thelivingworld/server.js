import 'dotenv/config';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { testConnection, initSchema } from './src/storage/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

export const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Endpoint GET /health
  if (req.method === 'GET' && pathname === '/health') {
    let dbStatus = { connected: false, reason: 'Not tested' };
    try {
      dbStatus = await testConnection();
    } catch (err) {
      dbStatus = { connected: false, reason: err.message };
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'the-living-world',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: dbStatus,
      websocket: {
        clients: wss ? wss.clients.size : 0
      }
    }));
    return;
  }

  // Endpoint GET /env.js
  if (req.method === 'GET' && pathname === '/env.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    const backendUrl = process.env.BACKEND_URL || '';
    const wsUrl = process.env.WS_URL || (backendUrl ? backendUrl.replace(/^http/, 'ws') : `ws://${req.headers.host || 'localhost:3000'}`);
    res.end(`window.ENV = { BACKEND_URL: ${JSON.stringify(backendUrl)}, WS_URL: ${JSON.stringify(wsUrl)} };`);
    return;
  }

  // Static file serving
  let targetPath = pathname === '/' ? '/index.html' : pathname;
  let filePath = path.normalize(path.join(__dirname, targetPath));

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

export const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    kind: 'status',
    status: {
      status: 'CONNECTED',
      username: 'server-bridge',
      eventsReceived: 0,
      eventsProcessed: 0
    }
  }));

  ws.on('message', (message) => {
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === ws.OPEN) {
        client.send(message.toString());
      }
    });
  });
});


const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isMainModule) {
  server.listen(PORT, HOST, async () => {
    console.log(`[The Living World] Server listening on http://${HOST}:${PORT}`);
    console.log(`[The Living World] Health endpoint: http://${HOST}:${PORT}/health`);
    console.log(`[The Living World] WebSocket endpoint: ws://${HOST}:${PORT}`);
    const initResult = await initSchema();
    if (initResult.initialized) {
      console.log('[The Living World] PostgreSQL schema initialized successfully.');
    } else {
      console.log(`[The Living World] PostgreSQL schema status: ${initResult.reason}`);
    }
  });
}
