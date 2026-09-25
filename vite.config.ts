import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import {
  rooms,
  serializeRooms,
  setupGameWebSocketServer,
  Room,
} from './src/server/gameServer.ts';

function gameServerPlugin(): Plugin {
  return {
    name: 'chinaball-game-server',
    configureServer(server) {
      if (server.httpServer) {
        setupGameWebSocketServer(server.httpServer as any);
      }

      server.middlewares.use('/api/rooms', (req, res) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ rooms: serializeRooms() }));
        } else if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              const validTeamSize = Math.max(1, Math.min(4, Number(data.teamSize) || 1)) as 1 | 2 | 3 | 4;
              const validMapSize = (['1v1', '2v2', '3v3', '4v4'].includes(data.mapSize)
                ? data.mapSize
                : `${validTeamSize}v${validTeamSize}`) as '1v1' | '2v2' | '3v3' | '4v4';

              const id = `sala-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
              const newRoom: Room = {
                id,
                name: data.name?.trim() || `Sala ${validMapSize} Pro`,
                mapSize: validMapSize,
                teamSize: validTeamSize,
                maxPlayers: validTeamSize * 2,
                goalLimit: Number(data.goalLimit) || 5,
                timeLimit: Number(data.timeLimit) || 5,
                password: data.password?.trim() || undefined,
                region: data.region || 'BR-SP',
                hostPing: 18,
                hostIp: 'Local-IP',
                balancedPing: 18,
                pingQuality: 'Excelente (Pareado)',
                bufferDelayMs: 0,
                createdAt: Date.now(),
                isMatchStarted: false,
                currentKickoffTeam: 'red',
                players: new Map(),
              };

              rooms.set(id, newRoom);
              res.statusCode = 201;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, room: newRoom }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), gameServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
