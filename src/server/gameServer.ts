import type { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage, ServerResponse } from 'http';

export interface RoomPlayer {
  id: string;
  name: string;
  team: 'red' | 'blue' | 'spec';
  slot: number;
  isHost: boolean;
  isReferee: boolean;
  isReady?: boolean;
  skinId?: string;
  number?: string;
  joinedAt: number;
  ping: number;
  ip: string;
  lastPingAt: number;
  ws?: WebSocket;
}

export interface Room {
  id: string;
  name: string;
  mapSize: '1v1' | '2v2' | '3v3' | '4v4';
  teamSize: 1 | 2 | 3 | 4;
  maxPlayers: number;
  goalLimit: number;
  timeLimit: number;
  password?: string;
  region: string;
  hostPing: number;
  hostIp: string;
  balancedPing: number;
  pingQuality: 'Excelente (Pareado)' | 'Bom (Sincronizado)' | 'Ajustado com Buffer';
  bufferDelayMs: number;
  createdAt: number;
  isMatchStarted: boolean;
  currentKickoffTeam: 'red' | 'blue';
  kickoffActive?: boolean;
  kickoffTouchConfirmed?: boolean;
  kickoffFrozenUntil?: number;
  isGoalTransition?: boolean;
  ball: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    angle: number;
    lastUpdate: number;
  };
  scoreYellow: number;
  scoreBlue: number;
  players: Map<string, RoomPlayer>;
}

export interface RankedQueuePlayer {
  ws: WebSocket;
  playerId: string;
  name: string;
  skinId?: string;
  number?: string;
  elo: number;
  joinedAt: number;
}

// Armazenamento em memória das salas 100% REAIS criadas por jogadores (Sem bots)
export const rooms = new Map<string, Room>();
export const rankedQueue: RankedQueuePlayer[] = [];

export function recalculateRoomPingBalance(room: Room) {
  const playerList = Array.from(room.players.values());
  if (playerList.length === 0) return;

  const host = playerList.find((p) => p.isHost) || playerList[0];
  const pings = playerList.map((p) => (p.ping > 0 ? p.ping : 25));
  const hostPing = host.ping > 0 ? host.ping : 20;
  const avgPing = Math.round(pings.reduce((sum, p) => sum + p, 0) / pings.length);
  const minPing = Math.min(...pings);
  const maxPing = Math.max(...pings);
  const pingDiff = maxPing - minPing;

  const bufferDelayMs = Math.min(30, Math.round(pingDiff / 2));
  let quality: Room['pingQuality'] = 'Excelente (Pareado)';
  if (pingDiff > 40) {
    quality = 'Ajustado com Buffer';
  } else if (pingDiff > 18) {
    quality = 'Bom (Sincronizado)';
  }

  room.hostPing = hostPing;
  room.hostIp = host.ip;
  room.balancedPing = avgPing;
  room.pingQuality = quality;
  room.bufferDelayMs = bufferDelayMs;

  broadcastToRoom(room, {
    type: 'ping_balance_sync',
    hostPing,
    balancedPing: avgPing,
    pingDiff,
    bufferDelayMs,
    quality,
    timestamp: Date.now(),
  });
}

export function serializeRooms() {
  const list = [];
  for (const [, r] of rooms) {
    list.push({
      id: r.id,
      name: r.name,
      mapSize: r.mapSize,
      teamSize: r.teamSize,
      mode: `${r.teamSize}v${r.teamSize}`,
      players: r.players.size,
      maxPlayers: r.maxPlayers,
      goalLimit: r.goalLimit,
      timeLimit: r.timeLimit,
      hasPassword: Boolean(r.password),
      region: r.region,
      hostPing: r.hostPing,
      hostIp: r.hostIp,
      ping: r.balancedPing,
      pingQuality: r.pingQuality,
      bufferDelayMs: r.bufferDelayMs,
      isMatchStarted: r.isMatchStarted,
    });
  }
  return list;
}

export function broadcastToRoom(room: Room, msg: object, excludePlayerId?: string) {
  const json = JSON.stringify(msg);
  for (const [id, p] of room.players) {
    if (excludePlayerId && id === excludePlayerId) continue;
    if (p.ws && p.ws.readyState === WebSocket.OPEN) {
      try {
        p.ws.send(json);
      } catch {
        // Socket error handled in close
      }
    }
  }
}

export function handleRankedMatchmaking() {
  // Se houver 2 ou mais jogadores na fila ranqueada, emparelha os dois primeiros
  while (rankedQueue.length >= 2) {
    const p1 = rankedQueue.shift()!;
    const p2 = rankedQueue.shift()!;

    if (p1.ws.readyState !== WebSocket.OPEN) {
      if (p2.ws.readyState === WebSocket.OPEN) rankedQueue.unshift(p2);
      continue;
    }
    if (p2.ws.readyState !== WebSocket.OPEN) {
      rankedQueue.unshift(p1);
      continue;
    }

    const roomId = `ranked-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const room: Room = {
      id: roomId,
      name: `Ranked 1v1: ${p1.name} vs ${p2.name}`,
      mapSize: '1v1',
      teamSize: 1,
      maxPlayers: 2,
      goalLimit: 3,
      timeLimit: 3,
      region: 'BR-Ranked',
      hostPing: 18,
      hostIp: 'Servidor-Oficial',
      balancedPing: 20,
      pingQuality: 'Excelente (Pareado)',
      bufferDelayMs: 0,
      createdAt: Date.now(),
      isMatchStarted: true,
      currentKickoffTeam: 'red',
      kickoffActive: true,
      kickoffTouchConfirmed: false,
      kickoffFrozenUntil: Date.now() + 1200,
      isGoalTransition: false,
      ball: { x: 0, y: 0, vx: 0, vy: 0, angle: 0, lastUpdate: Date.now() },
      scoreYellow: 0,
      scoreBlue: 0,
      players: new Map(),
    };

    rooms.set(roomId, room);

    // Notifica ambos os jogadores do pareamento
    const matchDataP1 = {
      type: 'ranked_match_found',
      roomId,
      assignedTeam: 'red',
      opponentName: p2.name,
      opponentElo: p2.elo,
      mapSize: '1v1',
      goalLimit: 3,
      timeLimit: 3,
    };
    const matchDataP2 = {
      type: 'ranked_match_found',
      roomId,
      assignedTeam: 'blue',
      opponentName: p1.name,
      opponentElo: p1.elo,
      mapSize: '1v1',
      goalLimit: 3,
      timeLimit: 3,
    };

    try {
      p1.ws.send(JSON.stringify(matchDataP1));
      p2.ws.send(JSON.stringify(matchDataP2));
    } catch {
      // Handled
    }
  }

  // Notifica quem ainda estiver na fila sobre o status
  for (const q of rankedQueue) {
    if (q.ws.readyState === WebSocket.OPEN) {
      try {
        q.ws.send(
          JSON.stringify({
            type: 'ranked_queue_status',
            inQueue: true,
            playersSearching: rankedQueue.length,
            waitTimeSec: Math.floor((Date.now() - q.joinedAt) / 1000),
          })
        );
      } catch {
        // Handled
      }
    }
  }
}

let globalWss: WebSocketServer | null = null;

export function broadcastRoomList() {
  if (!globalWss) return;
  const payload = JSON.stringify({
    type: 'room_list_update',
    rooms: serializeRooms(),
  });
  for (const client of globalWss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch {}
    }
  }
}

export function setupGameWebSocketServer(httpServer: HttpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  globalWss = wss;

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    let currentRoomId: string | null = null;
    let playerId: string | null = null;

    const rawIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    const playerIp = rawIp.includes('.')
      ? rawIp.split('.').slice(0, 2).join('.') + '.*.*'
      : '127.0.*.*';

    // Ao conectar, envia imediatamente a lista atualizada de salas abertas
    ws.send(JSON.stringify({
      type: 'room_list_update',
      rooms: serializeRooms(),
    }));

    ws.on('message', (data: string) => {
      try {
        const msg = JSON.parse(data.toString());

        // Heartbeat Latência RTT
        if (msg.type === 'client_ping') {
          ws.send(JSON.stringify({ type: 'server_pong', clientTime: msg.t, serverTime: Date.now() }));
          return;
        }

        // Solicitação manual da lista de salas
        if (msg.type === 'get_rooms') {
          ws.send(JSON.stringify({
            type: 'room_list_update',
            rooms: serializeRooms(),
          }));
          return;
        }

        // Relatório de Ping do cliente
        if (msg.type === 'report_ping' && currentRoomId && playerId) {
          const room = rooms.get(currentRoomId);
          if (room) {
            const p = room.players.get(playerId);
            if (p && typeof msg.ping === 'number') {
              p.ping = Math.max(1, Math.min(500, Math.round(msg.ping)));
              p.lastPingAt = Date.now();
              recalculateRoomPingBalance(room);
            }
          }
          return;
        }

        // Entrar na Fila Ranqueada Real
        if (msg.type === 'join_ranked_queue') {
          const pId = msg.playerId || `rank_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          // Remove duplicata anterior se houver
          const existingIdx = rankedQueue.findIndex((q) => q.playerId === pId || q.ws === ws);
          if (existingIdx !== -1) rankedQueue.splice(existingIdx, 1);

          rankedQueue.push({
            ws,
            playerId: pId,
            name: msg.name || 'Jogador Pro',
            skinId: msg.skinId,
            number: msg.number,
            elo: Number(msg.elo) || 1000,
            joinedAt: Date.now(),
          });

          ws.send(
            JSON.stringify({
              type: 'ranked_queue_joined',
              playersSearching: rankedQueue.length,
            })
          );

          handleRankedMatchmaking();
          return;
        }

        // Sair da Fila Ranqueada Real
        if (msg.type === 'leave_ranked_queue') {
          const idx = rankedQueue.findIndex((q) => q.ws === ws || (playerId && q.playerId === playerId));
          if (idx !== -1) {
            rankedQueue.splice(idx, 1);
          }
          ws.send(JSON.stringify({ type: 'ranked_queue_left' }));
          return;
        }

        // Criar Sala Diretamente via WebSocket
        if (msg.type === 'create_room') {
          const roomId = msg.roomId || `sala-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const teamSize = Math.max(1, Math.min(4, Number(msg.teamSize) || 1)) as 1 | 2 | 3 | 4;
          const mapSize = (['1v1', '2v2', '3v3', '4v4'].includes(msg.mapSize) ? msg.mapSize : `${teamSize}v${teamSize}`) as any;

          const room: Room = {
            id: roomId,
            name: msg.name?.trim() || `Sala ${mapSize} Pro`,
            mapSize,
            teamSize,
            maxPlayers: teamSize * 2,
            goalLimit: Number(msg.goalLimit) || 5,
            timeLimit: Number(msg.timeLimit) || 5,
            password: msg.password?.trim() || undefined,
            region: msg.region || 'BR',
            hostPing: 18,
            hostIp: playerIp,
            balancedPing: 18,
            pingQuality: 'Excelente (Pareado)',
            bufferDelayMs: 0,
            createdAt: Date.now(),
            isMatchStarted: false,
            currentKickoffTeam: 'red',
            kickoffActive: true,
            kickoffTouchConfirmed: false,
            kickoffFrozenUntil: Date.now() + 1200,
            isGoalTransition: false,
            ball: { x: 0, y: 0, vx: 0, vy: 0, angle: 0, lastUpdate: Date.now() },
            scoreYellow: 0,
            scoreBlue: 0,
            players: new Map(),
          };

          rooms.set(roomId, room);
          currentRoomId = roomId;
          const assignedPlayerId: string = msg.playerId || `p_${Date.now()}_${Math.floor(Math.random() * 100)}`;
          playerId = assignedPlayerId;

          const hostPlayer: RoomPlayer = {
            id: assignedPlayerId,
            name: msg.name || 'Jogador',
            team: msg.preferredTeam || 'red',
            slot: 0,
            isHost: true,
            isReferee: true,
            skinId: msg.skinId,
            number: msg.number,
            joinedAt: Date.now(),
            ping: 18,
            ip: playerIp,
            lastPingAt: Date.now(),
            ws,
          };

          room.players.set(assignedPlayerId, hostPlayer);

          ws.send(
            JSON.stringify({
              type: 'room_joined',
              roomId: room.id,
              roomName: room.name,
              mapSize: room.mapSize,
              teamSize: room.teamSize,
              goalLimit: room.goalLimit,
              timeLimit: room.timeLimit,
              isMatchStarted: room.isMatchStarted,
              player: {
                id: hostPlayer.id,
                name: hostPlayer.name,
                team: hostPlayer.team,
                isHost: true,
                isReferee: true,
                ping: 18,
                ip: playerIp,
              },
              balancedPing: 18,
              hostPing: 18,
              bufferDelayMs: 0,
              pingQuality: 'Excelente (Pareado)',
              players: [
                {
                  id: hostPlayer.id,
                  name: hostPlayer.name,
                  team: hostPlayer.team,
                  isHost: true,
                  isReferee: true,
                  isReady: true,
                  ping: 18,
                },
              ],
            })
          );

          broadcastRoomList();
          return;
        }

        // Entrar em Sala
        if (msg.type === 'join_room') {
          let room = rooms.get(msg.roomId);
          if (!room) {
            // Se a sala não existe no servidor (ex: criada pelo host via websocket ou link direto), cria na hora!
            const teamSize = Math.max(1, Math.min(4, Number(msg.teamSize) || 1)) as 1 | 2 | 3 | 4;
            const mapSize = msg.mapSize || (teamSize === 4 ? '4v4' : teamSize === 3 ? '3v3' : teamSize === 2 ? '2v2' : '1v1');
            room = {
              id: msg.roomId,
              name: msg.roomName || (msg.name ? `Sala de ${msg.name}` : `Arena ${mapSize} Pro`),
              mapSize: mapSize as any,
              teamSize,
              maxPlayers: teamSize * 2,
              goalLimit: Number(msg.goalLimit) || 5,
              timeLimit: Number(msg.timeLimit) || 5,
              password: msg.password?.trim() || undefined,
              region: 'BR',
              hostPing: 18,
              hostIp: playerIp,
              balancedPing: 18,
              pingQuality: 'Excelente (Pareado)',
              bufferDelayMs: 0,
              createdAt: Date.now(),
              isMatchStarted: false,
              currentKickoffTeam: 'red',
              kickoffActive: true,
              kickoffTouchConfirmed: false,
              kickoffFrozenUntil: Date.now() + 1200,
              isGoalTransition: false,
              ball: { x: 0, y: 0, vx: 0, vy: 0, angle: 0, lastUpdate: Date.now() },
              scoreYellow: 0,
              scoreBlue: 0,
              players: new Map(),
            };
            rooms.set(msg.roomId, room);
          }

          if (room.password && room.password !== msg.password) {
            ws.send(JSON.stringify({ type: 'error', message: 'Senha incorreta para esta sala' }));
            return;
          }

          currentRoomId = msg.roomId;
          playerId = msg.playerId || `p_${Date.now()}_${Math.floor(Math.random() * 100)}`;

          const isHost = room.players.size === 0;
          const isReferee = isHost;
          const initialPing = typeof msg.ping === 'number' ? msg.ping : isHost ? 18 : 25;

          const redCount = Array.from(room.players.values()).filter((p) => p.team === 'red').length;
          const blueCount = Array.from(room.players.values()).filter((p) => p.team === 'blue').length;

          let assignedTeam: 'red' | 'blue' | 'spec' = msg.preferredTeam;
          if (!assignedTeam || (assignedTeam !== 'red' && assignedTeam !== 'blue' && assignedTeam !== 'spec')) {
            assignedTeam = redCount <= blueCount ? 'red' : 'blue';
          }

          const player: RoomPlayer = {
            id: playerId!,
            name: msg.name || 'Jogador',
            team: assignedTeam,
            slot: room.players.size,
            isHost,
            isReferee,
            skinId: msg.skinId,
            number: msg.number,
            joinedAt: Date.now(),
            ping: initialPing,
            ip: playerIp,
            lastPingAt: Date.now(),
            ws,
          };

          room.players.set(playerId!, player);
          recalculateRoomPingBalance(room);

          ws.send(
            JSON.stringify({
              type: 'room_joined',
              roomId: room.id,
              roomName: room.name,
              mapSize: room.mapSize,
              teamSize: room.teamSize,
              goalLimit: room.goalLimit,
              timeLimit: room.timeLimit,
              isMatchStarted: room.isMatchStarted,
              player: {
                id: player.id,
                name: player.name,
                team: player.team,
                isHost: player.isHost,
                isReferee: player.isReferee,
                ping: player.ping,
                ip: player.ip,
              },
              balancedPing: room.balancedPing,
              hostPing: room.hostPing,
              bufferDelayMs: room.bufferDelayMs,
              pingQuality: room.pingQuality,
              players: Array.from(room.players.values()).map((p) => ({
                id: p.id,
                name: p.name,
                team: p.team,
                isHost: p.isHost,
                isReferee: p.isReferee,
                isReady: p.isReady,
                ping: p.ping,
              })),
            })
          );

          broadcastRoomList();

          broadcastToRoom(
            room,
            {
              type: 'player_joined',
              player: {
                id: player.id,
                name: player.name,
                team: player.team,
                isHost: player.isHost,
                isReferee: player.isReferee,
                ping: player.ping,
              },
              balancedPing: room.balancedPing,
              bufferDelayMs: room.bufferDelayMs,
            },
            playerId!
          );
        }

        // Alterar Configurações da Sala (Tamanho do Mapa, Tempo, Gols) pelo Dono ou Árbitro
        if (msg.type === 'update_room_settings' && currentRoomId && playerId) {
          const room = rooms.get(currentRoomId);
          if (room) {
            const sender = room.players.get(playerId);
            if (sender && (sender.isHost || sender.isReferee)) {
              if (msg.mapSize && ['1v1', '2v2', '3v3', '4v4'].includes(msg.mapSize)) {
                room.mapSize = msg.mapSize;
                const sizeMap: Record<string, 1 | 2 | 3 | 4> = { '1v1': 1, '2v2': 2, '3v3': 3, '4v4': 4 };
                room.teamSize = sizeMap[msg.mapSize] || 1;
                room.maxPlayers = room.teamSize * 2;
              }
              if (msg.goalLimit) room.goalLimit = Math.max(1, Math.min(20, Number(msg.goalLimit)));
              if (msg.timeLimit) room.timeLimit = Math.max(1, Math.min(20, Number(msg.timeLimit)));

              broadcastToRoom(room, {
                type: 'room_settings_updated',
                mapSize: room.mapSize,
                teamSize: room.teamSize,
                goalLimit: room.goalLimit,
                timeLimit: room.timeLimit,
                updatedBy: sender.name,
              });
            }
          }
        }

        // Adicionar / Remover ou Transferir Árbitro (Dono pode fazer a qualquer momento, antes ou durante a partida)
        if (msg.type === 'set_referee' && currentRoomId && playerId) {
          const room = rooms.get(currentRoomId);
          if (room) {
            const sender = room.players.get(playerId);
            if (sender && sender.isHost) {
              const target = room.players.get(msg.targetPlayerId);
              if (target) {
                target.isReferee = typeof msg.isReferee === 'boolean' ? msg.isReferee : !target.isReferee;
                broadcastToRoom(room, {
                  type: 'referee_status_changed',
                  targetPlayerId: target.id,
                  isReferee: target.isReferee,
                  message: target.isReferee
                    ? `${target.name} agora é Árbitro da sala!`
                    : `${target.name} não é mais árbitro.`,
                  players: Array.from(room.players.values()).map((p) => ({
                    id: p.id,
                    name: p.name,
                    team: p.team,
                    isHost: p.isHost,
                    isReferee: p.isReferee,
                    isReady: p.isReady,
                    ping: p.ping,
                  })),
                });
              }
            }
          }
        }

        // Cancelar a Sala (Dono da sala cancela e fecha a sala para todos)
        if (msg.type === 'cancel_room' && currentRoomId && playerId) {
          const room = rooms.get(currentRoomId);
          if (room) {
            const sender = room.players.get(playerId);
            if (sender?.isHost) {
              broadcastToRoom(room, {
                type: 'room_cancelled',
                message: 'A sala foi cancelada e encerrada pelo anfitrião.',
              });
              rooms.delete(currentRoomId);
              currentRoomId = null;
            }
          }
        }

        // Transferir Árbitro
        if (msg.type === 'transfer_referee' && currentRoomId && playerId) {
          const room = rooms.get(currentRoomId);
          if (room) {
            const sender = room.players.get(playerId);
            if (sender && (sender.isHost || sender.isReferee)) {
              const target = room.players.get(msg.targetPlayerId);
              if (target) {
                sender.isReferee = false;
                target.isReferee = true;
                broadcastToRoom(room, {
                  type: 'referee_transferred',
                  refereeId: target.id,
                  refereeName: target.name,
                  message: `Árbitro transferido para ${target.name}!`,
                });
              }
            }
          }
        }

        // Iniciar Partida Online pelo Dono ou Árbitro
        // "a partida que começa com o time vermelho, depois a bola é de quem tomar o gol"
        if (msg.type === 'start_online_match' && currentRoomId && playerId) {
          const room = rooms.get(currentRoomId);
          if (room) {
            const sender = room.players.get(playerId);
            if (sender && (sender.isHost || sender.isReferee)) {
              const redCount = Array.from(room.players.values()).filter((p) => p.team === 'red').length;
              const blueCount = Array.from(room.players.values()).filter((p) => p.team === 'blue').length;

              room.isMatchStarted = true;
              room.currentKickoffTeam = 'red'; // Sempre começa com o Time Vermelho!
              room.kickoffActive = true;
              room.kickoffTouchConfirmed = false;

              broadcastToRoom(room, {
                type: 'match_started_by_referee',
                startedBy: sender.name,
                kickoffTeam: 'red',
                mapSize: room.mapSize,
                timeLimit: room.timeLimit,
                goalLimit: room.goalLimit,
                message: `Partida iniciada! Posse inicial: Time Vermelho.`,
              });
            }
          }
        }

        // Pronto / Não Pronto
        if (msg.type === 'toggle_ready' && currentRoomId && playerId) {
          const room = rooms.get(currentRoomId);
          if (room) {
            const p = room.players.get(playerId);
            if (p) {
              p.isReady = !p.isReady;
              broadcastToRoom(room, {
                type: 'player_ready_updated',
                playerId: p.id,
                isReady: p.isReady,
              });
            }
          }
        }

        // Inverter Lados (Árbitro / Dono)
        if (msg.type === 'swap_teams' && currentRoomId && playerId) {
          const room = rooms.get(currentRoomId);
          if (room) {
            const sender = room.players.get(playerId);
            if (sender && (sender.isHost || sender.isReferee)) {
              for (const p of room.players.values()) {
                if (p.team === 'red') p.team = 'blue';
                else if (p.team === 'blue') p.team = 'red';
              }
              broadcastToRoom(room, {
                type: 'teams_swapped',
                players: Array.from(room.players.values()).map((p) => ({
                  id: p.id,
                  name: p.name,
                  team: p.team,
                  isHost: p.isHost,
                  isReferee: p.isReferee,
                  isReady: p.isReady,
                  ping: p.ping,
                })),
                message: 'Lados invertidos pelo árbitro (Vermelho ⇄ Azul)!',
              });
            }
          }
        }

        // Sortear Times (Árbitro / Dono)
        if (msg.type === 'shuffle_teams' && currentRoomId && playerId) {
          const room = rooms.get(currentRoomId);
          if (room) {
            const sender = room.players.get(playerId);
            if (sender && (sender.isHost || sender.isReferee)) {
              const active = Array.from(room.players.values()).filter((p) => p.team !== 'spec');
              for (let i = active.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [active[i], active[j]] = [active[j], active[i]];
              }
              active.forEach((p, idx) => {
                p.team = idx % 2 === 0 ? 'red' : 'blue';
              });
              broadcastToRoom(room, {
                type: 'teams_shuffled',
                players: Array.from(room.players.values()).map((p) => ({
                  id: p.id,
                  name: p.name,
                  team: p.team,
                  isHost: p.isHost,
                  isReferee: p.isReferee,
                  isReady: p.isReady,
                  ping: p.ping,
                })),
                message: 'Times sorteados aleatoriamente pelo árbitro!',
              });
            }
          }
        }

        // Trocar de Time pelo próprio Jogador
        if (msg.type === 'switch_team' && currentRoomId && playerId) {
          const room = rooms.get(currentRoomId);
          if (room) {
            const p = room.players.get(playerId);
            if (p && (msg.team === 'red' || msg.team === 'blue' || msg.team === 'spec')) {
              p.team = msg.team;
              broadcastToRoom(room, {
                type: 'team_switched',
                playerId: p.id,
                team: p.team,
              });
            }
          }
        }

        // Mover outro jogador (Árbitro / Dono)
        if (msg.type === 'move_player' && currentRoomId && playerId) {
          const room = rooms.get(currentRoomId);
          if (room) {
            const sender = room.players.get(playerId);
            if (sender && (sender.isHost || sender.isReferee)) {
              const target = room.players.get(msg.targetPlayerId);
              if (target && (msg.team === 'red' || msg.team === 'blue' || msg.team === 'spec')) {
                target.team = msg.team;
                broadcastToRoom(room, {
                  type: 'player_team_updated',
                  playerId: target.id,
                  team: target.team,
                  movedBy: sender.name,
                });
              }
            }
          }
        }

        // Sincronização de Jogador (~30-60Hz)
        if (msg.type === 'sync_player' && currentRoomId && playerId) {
          const room = rooms.get(currentRoomId);
          if (room) {
            const sender = room.players.get(playerId);
            const team = sender?.team || 'red';

            let validX = typeof msg.x === 'number' && Number.isFinite(msg.x) ? msg.x : 0;
            let validY = typeof msg.y === 'number' && Number.isFinite(msg.y) ? msg.y : 0;
            let validVx = typeof msg.vx === 'number' && Number.isFinite(msg.vx) ? msg.vx : 0;
            let validVy = typeof msg.vy === 'number' && Number.isFinite(msg.vy) ? msg.vy : 0;
            let validIsKicking = Boolean(msg.isKicking);
            const now = Date.now();

            // Limite físico de velocidade para evitar desync de teleporte
            const speed = Math.hypot(validVx, validVy);
            if (speed > 4.5) {
              validVx = (validVx / speed) * 4.5;
              validVy = (validVy / speed) * 4.5;
            }

            const mapSize = room.mapSize || '1v1';
            const hw = mapSize === '4v4' ? 735 : mapSize === '3v3' ? 630 : mapSize === '2v2' ? 525 : 420;
            const hh = mapSize === '4v4' ? 360 : mapSize === '3v3' ? 310 : mapSize === '2v2' ? 260 : 210;
            const centerCircleR = mapSize === '4v4' ? 150 : mapSize === '3v3' ? 130 : mapSize === '2v2' ? 110 : 90;
            const playerRadius = 17;

            // Limites rígidos do campo
            validX = Math.max(-hw + playerRadius, Math.min(hw - playerRadius, validX));
            validY = Math.max(-hh + playerRadius, Math.min(hh - playerRadius, validY));

            // FASE 1: FREEZE ESTÁTICO CENTRAL (Anti-Jitter e Sincronização Perfeita de Início)
            if (room.kickoffFrozenUntil && room.kickoffFrozenUntil > now) {
              validVx = 0;
              validVy = 0;
              validIsKicking = false;
              if (team === 'red') {
                validX = Math.min(-hw * 0.22, validX);
              } else if (team === 'blue') {
                validX = Math.max(hw * 0.22, validX);
              }
            } else if (room.isMatchStarted && room.kickoffActive && !room.kickoffTouchConfirmed) {
              // FASE 2: PONTAPÉ INICIAL HAXBALL
              const kickoffTeam = room.currentKickoffTeam || 'red';

              if (team !== kickoffTeam && team !== 'spec') {
                // Time adversário não pode chutar nem tocar na bola antes da equipe do kickoff
                validIsKicking = false;

                // Não pode invadir o campo adversário antes do toque
                if (kickoffTeam === 'red') {
                  if (validX < playerRadius) {
                    validX = playerRadius;
                    validVx = Math.max(0, validVx);
                  }
                } else {
                  if (validX > -playerRadius) {
                    validX = -playerRadius;
                    validVx = Math.min(0, validVx);
                  }
                }

                // Não pode entrar no círculo central
                const distToCenter = Math.hypot(validX, validY);
                const minCenterDist = centerCircleR + playerRadius;
                if (distToCenter < minCenterDist && distToCenter > 1e-4) {
                  const nx = validX / distToCenter;
                  const ny = validY / distToCenter;
                  validX = nx * minCenterDist;
                  validY = ny * minCenterDist;
                  validVx = Math.max(0, validVx * nx) * nx;
                  validVy = Math.max(0, validVy * ny) * ny;
                }
              } else if (team === kickoffTeam) {
                // Apenas a equipe do kickoff libera a bola após chute ou toque válido
                if (validIsKicking || Math.hypot(validX, validY) < playerRadius + 12) {
                  room.kickoffActive = false;
                  room.kickoffTouchConfirmed = true;
                  broadcastToRoom(room, {
                    type: 'kickoff_cleared',
                    kickingTeam: kickoffTeam,
                  });
                }
              }
            }

            broadcastToRoom(
              room,
              {
                type: 'peer_player_sync',
                playerId,
                team,
                slot: sender?.slot || 0,
                x: validX,
                y: validY,
                vx: validVx,
                vy: validVy,
                isKicking: validIsKicking,
              },
              playerId
            );
          }
        }

        // Sincronização de Bola com Validação Central
        if (msg.type === 'sync_ball' && currentRoomId && playerId) {
          const room = rooms.get(currentRoomId);
          if (room) {
            const sender = room.players.get(playerId);
            const now = Date.now();

            if (sender?.isHost) {
              let bx = typeof msg.x === 'number' && Number.isFinite(msg.x) ? msg.x : 0;
              let by = typeof msg.y === 'number' && Number.isFinite(msg.y) ? msg.y : 0;
              let bvx = typeof msg.vx === 'number' && Number.isFinite(msg.vx) ? msg.vx : 0;
              let bvy = typeof msg.vy === 'number' && Number.isFinite(msg.vy) ? msg.vy : 0;
              let bAngle = typeof msg.angle === 'number' && Number.isFinite(msg.angle) ? msg.angle : 0;

              // Durante o freeze ou transição de gol, a bola fica absolutamente estática no centro (0, 0)
              if (room.kickoffFrozenUntil && room.kickoffFrozenUntil > now) {
                bx = 0;
                by = 0;
                bvx = 0;
                bvy = 0;
                bAngle = 0;
              } else if (room.kickoffActive) {
                if (Math.hypot(bx, by) > 2.5 || Math.hypot(bvx, bvy) > 0.35) {
                  room.kickoffActive = false;
                  room.kickoffTouchConfirmed = true;
                }
              }

              // Limite físico de velocidade da bola
              const bSpeed = Math.hypot(bvx, bvy);
              if (bSpeed > 8.0) {
                bvx = (bvx / bSpeed) * 8.0;
                bvy = (bvy / bSpeed) * 8.0;
              }

              room.ball = { x: bx, y: by, vx: bvx, vy: bvy, angle: bAngle, lastUpdate: now };

              broadcastToRoom(
                room,
                {
                  type: 'peer_ball_sync',
                  x: bx,
                  y: by,
                  vx: bvx,
                  vy: bvy,
                  angle: bAngle,
                  scoreYellow: room.scoreYellow,
                  scoreBlue: room.scoreBlue,
                },
                playerId
              );
            }
          }
        }

        // Gol Sincronizado com Transição Suave e Anti-Jittering
        if (msg.type === 'sync_goal' && currentRoomId) {
          const room = rooms.get(currentRoomId);
          if (room && !room.isGoalTransition) {
            room.isGoalTransition = true;
            const scorerTeam: 'red' | 'blue' = msg.scorerTeam || 'red';
            const nextPossession: 'red' | 'blue' = scorerTeam === 'red' ? 'blue' : 'red';
            room.currentKickoffTeam = nextPossession;
            room.kickoffActive = true;
            room.kickoffTouchConfirmed = false;
            room.kickoffFrozenUntil = Date.now() + 2500;
            room.ball = { x: 0, y: 0, vx: 0, vy: 0, angle: 0, lastUpdate: Date.now() };

            if (typeof msg.scoreYellow === 'number') room.scoreYellow = msg.scoreYellow;
            if (typeof msg.scoreBlue === 'number') room.scoreBlue = msg.scoreBlue;

            broadcastToRoom(room, {
              type: 'peer_goal',
              scorerTeam,
              nextKickoffTeam: nextPossession,
              message: msg.message || 'GOOOOL!',
              scoreYellow: room.scoreYellow,
              scoreBlue: room.scoreBlue,
              freezeDurationMs: 2500,
            });

            // Após o tempo de comemoração/replay curto, posiciona no centro estático
            const savedRoomId = currentRoomId;
            setTimeout(() => {
              if (savedRoomId && rooms.has(savedRoomId)) {
                room.isGoalTransition = false;
                room.kickoffFrozenUntil = Date.now() + 1000;
                room.ball = { x: 0, y: 0, vx: 0, vy: 0, angle: 0, lastUpdate: Date.now() };
                broadcastToRoom(room, {
                  type: 'peer_reset',
                  kickoffTeam: room.currentKickoffTeam,
                  freezeDurationMs: 1000,
                });
              }
            }, 2500);
          }
        }

        if (msg.type === 'sync_reset' && currentRoomId) {
          const room = rooms.get(currentRoomId);
          if (room) {
            room.kickoffActive = true;
            room.kickoffTouchConfirmed = false;
            room.kickoffFrozenUntil = Date.now() + 1000;
            room.ball = { x: 0, y: 0, vx: 0, vy: 0, angle: 0, lastUpdate: Date.now() };
            broadcastToRoom(room, {
              type: 'peer_reset',
              kickoffTeam: room.currentKickoffTeam,
              freezeDurationMs: 1000,
            });
          }
        }

        // Sair da Sala
        if (msg.type === 'leave_room' && currentRoomId && playerId) {
          const room = rooms.get(currentRoomId);
          if (room) {
            const wasHost = room.players.get(playerId)?.isHost;
            room.players.delete(playerId);
            broadcastToRoom(room, { type: 'player_left', playerId });

            if (wasHost && room.players.size > 0) {
              const sorted = Array.from(room.players.values()).sort((a, b) => a.joinedAt - b.joinedAt);
              const newHost = sorted[0];
              if (newHost) {
                newHost.isHost = true;
                newHost.isReferee = true;
                broadcastToRoom(room, {
                  type: 'host_transferred',
                  hostId: newHost.id,
                  hostName: newHost.name,
                  isReferee: true,
                  message: `${newHost.name} assumiu a liderança e arbitragem da sala!`,
                });
              }
            }

            if (room.players.size === 0) {
              rooms.delete(currentRoomId);
            }
            currentRoomId = null;
          }
        }

        // Chat
        if (msg.type === 'chat_message' && currentRoomId && playerId) {
          const room = rooms.get(currentRoomId);
          if (room) {
            const sender = room.players.get(playerId);
            broadcastToRoom(room, {
              type: 'chat',
              id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              sender: sender?.name || 'Jogador',
              team: sender?.team || 'red',
              text: String(msg.text || '').slice(0, 120),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: Date.now(),
            });
          }
        }
      } catch (err) {
        console.error('WS Error:', err);
      }
    });

    ws.on('close', () => {
      // Remove da fila ranqueada se estiver
      const qIdx = rankedQueue.findIndex((q) => q.ws === ws);
      if (qIdx !== -1) rankedQueue.splice(qIdx, 1);

      if (currentRoomId && playerId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          const wasHost = room.players.get(playerId)?.isHost;
          room.players.delete(playerId);
          broadcastToRoom(room, { type: 'player_left', playerId });

          if (wasHost && room.players.size > 0) {
            const sorted = Array.from(room.players.values()).sort((a, b) => a.joinedAt - b.joinedAt);
            const newHost = sorted[0];
            if (newHost) {
              newHost.isHost = true;
              newHost.isReferee = true;
              broadcastToRoom(room, {
                type: 'host_transferred',
                hostId: newHost.id,
                hostName: newHost.name,
                isReferee: true,
                message: `${newHost.name} assumiu a liderança e arbitragem da sala!`,
              });
            }
          }

          recalculateRoomPingBalance(room);

          if (room.players.size === 0) {
            rooms.delete(currentRoomId);
          }
          broadcastRoomList();
        }
      }
    });
  });

  // Atualizador periódico da fila ranqueada
  setInterval(() => {
    handleRankedMatchmaking();
  }, 1500);

  return wss;
}
