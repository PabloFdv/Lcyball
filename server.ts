import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  rooms,
  serializeRooms,
  setupGameWebSocketServer,
  Room,
} from './src/server/gameServer.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

const app = express();
app.use(express.json());

// REST API para Salas 100% Reais
app.get('/api/rooms', (req, res) => {
  res.json({ rooms: serializeRooms() });
});

app.post('/api/rooms', (req, res) => {
  const {
    name,
    mapSize = '1v1',
    teamSize = 1,
    goalLimit = 5,
    timeLimit = 5,
    password = '',
    region = 'BR',
  } = req.body;

  const validTeamSize = Math.max(1, Math.min(4, Number(teamSize) || 1)) as 1 | 2 | 3 | 4;
  const validMapSize = (['1v1', '2v2', '3v3', '4v4'].includes(mapSize)
    ? mapSize
    : `${validTeamSize}v${validTeamSize}`) as '1v1' | '2v2' | '3v3' | '4v4';

  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1';
  const maskedIp = clientIp.includes('.')
    ? clientIp.split('.').slice(0, 2).join('.') + '.*.*'
    : 'Local-IP';

  const id = `sala-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newRoom: Room = {
    id,
    name: name?.trim() || `Sala ${validMapSize} Pro`,
    mapSize: validMapSize,
    teamSize: validTeamSize,
    maxPlayers: validTeamSize * 2,
    goalLimit: Number(goalLimit) || 5,
    timeLimit: Number(timeLimit) || 5,
    password: password?.trim() || undefined,
    region: region || 'BR-SP',
    hostPing: 20,
    hostIp: maskedIp,
    balancedPing: 20,
    pingQuality: 'Excelente (Pareado)',
    bufferDelayMs: 0,
    createdAt: Date.now(),
    isMatchStarted: false,
    currentKickoffTeam: 'red',
    kickoffActive: true,
    kickoffTouchConfirmed: false,
    players: new Map(),
  };

  rooms.set(id, newRoom);
  res.status(201).json({ success: true, room: newRoom });
});

// Download do HTML Solo para testar no celular offline
app.get(['/download/futzin_mobile.html', '/download/chinaball_solo.html', '/download/ChinaBall_Solo_Mobile.html'], (req, res) => {
  const filePath = path.join(__dirname, 'public', 'futzin_1v1_mobile.html');
  res.download(filePath, 'ChinaBall_Solo_Mobile.html', (err) => {
    if (err && !res.headersSent) {
      res.status(500).send('Erro ao baixar o arquivo mobile.');
    }
  });
});

const server = http.createServer(app);
setupGameWebSocketServer(server);

// Inicia Vite em Dev ou Estáticos em Prod
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`⚽ Servidor ChinaBall Pro online na porta ${PORT}`);
  });
}

start();
