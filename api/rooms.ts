import type { VercelRequest, VercelResponse } from '@vercel/node';

// Fallback in-memory / serverless handler for Vercel deployment
const vercelRooms: Array<{
  id: string;
  name: string;
  mapSize: '1v1' | '2v2' | '3v3' | '4v4';
  teamSize: number;
  mode: string;
  players: number;
  maxPlayers: number;
  goalLimit: number;
  timeLimit: number;
  hasPassword?: boolean;
  region: string;
  hostPing: number;
  hostIp: string;
  ping: number;
  pingQuality: string;
  bufferDelayMs: number;
  isMatchStarted: boolean;
}> = [];

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ rooms: vercelRooms });
  }

  if (req.method === 'POST') {
    const {
      name = 'Arena Pro 1v1',
      mapSize = '1v1',
      teamSize = 1,
      goalLimit = 5,
      timeLimit = 5,
      password = '',
      region = 'BR-SP',
    } = req.body || {};

    const validTeamSize = Math.max(1, Math.min(4, Number(teamSize) || 1));
    const validMapSize = (['1v1', '2v2', '3v3', '4v4'].includes(mapSize)
      ? mapSize
      : '1v1') as '1v1' | '2v2' | '3v3' | '4v4';

    const newRoom = {
      id: `sala-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: String(name).trim() || `Sala ${validMapSize} Pro`,
      mapSize: validMapSize,
      teamSize: validTeamSize,
      mode: `${validTeamSize}v${validTeamSize}`,
      players: 1,
      maxPlayers: validTeamSize * 2,
      goalLimit: Number(goalLimit) || 5,
      timeLimit: Number(timeLimit) || 5,
      hasPassword: Boolean(password),
      region: String(region || 'BR-SP'),
      hostPing: 18,
      hostIp: '187.54.*.*',
      ping: 18,
      pingQuality: 'Excelente (Pareado)',
      bufferDelayMs: 0,
      isMatchStarted: false,
    };

    vercelRooms.unshift(newRoom);
    if (vercelRooms.length > 30) {
      vercelRooms.pop();
    }

    return res.status(201).json({ success: true, room: newRoom });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
