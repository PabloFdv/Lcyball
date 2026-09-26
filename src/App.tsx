import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sounds } from './audio/soundManager';
import { SimpleJoystick } from './components/SimpleJoystick';
import { SimpleKickButton } from './components/SimpleKickButton';
import { HudSettingsModal, HudConfig, DEFAULT_HUD_CONFIG } from './components/HudSettingsModal';
import { GameMenuModal, RoomInfo } from './components/GameMenuModal';
import { RoomLobbyModal, LobbyPlayer } from './components/RoomLobbyModal';
import { InGameChat, ChatMessage } from './components/InGameChat';
import { LoadingScreen } from './components/LoadingScreen';
import { ChinaBallHomeHub } from './components/ChinaBallHomeHub';
import { HudCustomizerOverlay } from './components/HudCustomizerOverlay';
import { CustomizerModal } from './components/CustomizerModal';
import { RankedMatchmakingModal } from './components/RankedMatchmakingModal';
import { PlayerProfile } from './game/types';
import { ChinaBallEngine } from './game/chinaEngine';
import { HAXBALL, MapSize, MAP_DIMENSIONS } from './game/physicsConfig';
import { PitchRenderer } from './game/pitchRenderer';
import { rankingManager } from './game/rankingManager';
import { ReplayBuffer } from './game/stateBuffer';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Settings,
  Users,
  Play,
  Pause,
  Scale,
  Sparkles,
  Wifi,
  Share2,
  Award,
  Crown,
  FastForward,
  Check,
  MessageSquare,
  LayoutGrid,
  Trash2,
  X,
} from 'lucide-react';
import { toggleFullscreen, isFullscreenActive } from './utils/fullscreen';

function getInitialPlayerName(): string {
  try {
    const savedNum = localStorage.getItem('chinaball_player_seq');
    let nextNum = savedNum ? parseInt(savedNum, 10) + 1 : 1;
    if (isNaN(nextNum) || nextNum > 99) nextNum = 1;
    localStorage.setItem('chinaball_player_seq', nextNum.toString());
    return `Player${String(nextNum).padStart(2, '0')}`;
  } catch {
    return 'Player01';
  }
}

const initialPlayerName = getInitialPlayerName();

const DEFAULT_PROFILE: PlayerProfile = {
  name: initialPlayerName,
  number: initialPlayerName.replace('Player', '') || '01',
  color: '#facc15',
  accentColor: '#16a34a',
  skinId: 'brazil',
  rankPoints: 0,
  rankTier: '🥉 Bronze Competitivo',
  goals: 0,
  kicks: 0,
  matchesPlayed: 0,
  wins: 0,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ChinaBallEngine>(new ChinaBallEngine());
  const rendererRef = useRef<PitchRenderer | null>(null);
  const replayBufferRef = useRef<ReplayBuffer>(new ReplayBuffer(5.0, 60));

  // Input refs
  const inputVecRef = useRef({ x: 0, y: 0 });
  const kickStateRef = useRef(false);

  // Loading Screen
  const [isLoading, setIsLoading] = useState(true);

  // HUD Config
  const [hudConfig, setHudConfig] = useState<HudConfig>(() => {
    try {
      const saved = localStorage.getItem('futzin_hud_config');
      return saved ? { ...DEFAULT_HUD_CONFIG, ...JSON.parse(saved) } : DEFAULT_HUD_CONFIG;
    } catch {
      return DEFAULT_HUD_CONFIG;
    }
  });
  const hudConfigRef = useRef(hudConfig);
  hudConfigRef.current = hudConfig;

  // Estado dos Modais e Telas
  const [isHudModalOpen, setIsHudModalOpen] = useState(false);
  const [isHudCustomizing, setIsHudCustomizing] = useState(false);
  const [isMatchActive, setIsMatchActive] = useState(false);
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(true);
  const [isRoomsModalOpen, setIsRoomsModalOpen] = useState(false);
  const [isLobbyModalOpen, setIsLobbyModalOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isMatchPaused, setIsMatchPaused] = useState(false);
  const [menuInitialTab, setMenuInitialTab] = useState<'play' | 'rooms' | 'mobile' | 'settings' | 'profile' | 'ranking'>('play');
  const [isLandscapeForced, setIsLandscapeForced] = useState(false);

  // Viewport dinâmico para recalcular posições absolutas do HUD e campo
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
    isLandscape: typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : true,
  }));

  // Callback estável para conclusão do carregamento profissional
  const handleLoaded = useCallback(() => {
    setIsLoading(false);
    setIsMatchActive(false);
    setIsGameMenuOpen(true);
  }, []);

  // Matchmaking Ranqueado Real
  const [isRankedSearching, setIsRankedSearching] = useState(false);
  const [rankedQueuePlayers, setRankedQueuePlayers] = useState(1);
  const [rankedQueueTime, setRankedQueueTime] = useState(0);
  const currentMatchIsRankedOnlineRef = useRef(false);
  const currentMatchIsRankedBotsRef = useRef(false);

  // Menu de Árbitro em Partida ao Vivo
  const [isLiveRefereeDrawerOpen, setIsLiveRefereeDrawerOpen] = useState(false);

  // Perfil do Jogador
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    try {
      const saved = localStorage.getItem('chinaball_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name === 'Pablo') {
          parsed.name = DEFAULT_PROFILE.name;
          parsed.number = DEFAULT_PROFILE.number;
        }
        return { ...DEFAULT_PROFILE, ...parsed };
      }
      return DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const handleProfileChange = useCallback((newProfile: PlayerProfile) => {
    setProfile(newProfile);
    try {
      localStorage.setItem('chinaball_profile', JSON.stringify(newProfile));
    } catch {}
  }, []);

  // Sala & Modos
  const [activeRoomName, setActiveRoomName] = useState('Arena Pro');
  const [botMode, setBotMode] = useState<'solo' | 'easy' | 'medium' | 'hard'>('medium');
  const [teamSize, setTeamSize] = useState<1 | 2 | 3 | 4>(1);
  const [mapSize, setMapSize] = useState<MapSize>('1v1');
  const [goalLimit, setGoalLimit] = useState(5);
  const [timeLimit, setTimeLimit] = useState(5);
  const [onlineRoomsCount, setOnlineRoomsCount] = useState(0);

  // UI State
  const [fps, setFps] = useState(60);
  const [ping, setPing] = useState(18);
  const [balancedDelayMs, setBalancedDelayMs] = useState(0);
  const [scoreYellow, setScoreYellow] = useState(0);
  const [scoreBlue, setScoreBlue] = useState(0);
  const [matchSeconds, setMatchSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [keyboardVector, setKeyboardVector] = useState({ x: 0, y: 0 });
  const [keyboardKick, setKeyboardKick] = useState(false);

  // GOL FX & Instant Replay
  const [goalBanner, setGoalBanner] = useState<{
    active: boolean;
    team: 'red' | 'blue';
    message: string;
    scoreYellow: number;
    scoreBlue: number;
  } | null>(null);
  const [edgeGlow, setEdgeGlow] = useState<'red' | 'blue' | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayProgress, setReplayProgress] = useState(0);

  // Chat em Tempo Real
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Notificação no topo
  const [matchNotice, setMatchNotice] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sessão Online Ativa & Lista de Jogadores do Lobby
  const [lobbyPlayers, setLobbyPlayers] = useState<LobbyPlayer[]>([]);
  const [onlineSession, setOnlineSession] = useState<{
    roomId: string;
    roomName: string;
    isHost: boolean;
    isReferee: boolean;
    refereeName?: string;
    isMatchStarted?: boolean;
    team: 'red' | 'blue' | 'spec';
    slot: number;
    playerCount: number;
    hostPing: number;
    balancedPing: number;
    bufferDelayMs: number;
    quality: string;
  } | null>(null);
  const onlineSessionRef = useRef(onlineSession);
  onlineSessionRef.current = onlineSession;

  const wsRef = useRef<WebSocket | null>(null);

  // Estatísticas da partida em andamento para ranking local
  const currentMatchShotsRef = useRef(0);
  const currentMatchGoalsRef = useRef(0);

  // Disparo do Efeito e Animação de Gol
  const triggerGoalFX = useCallback((team: 'red' | 'blue', message: string, sy: number, sb: number) => {
    setGoalBanner({
      active: true,
      team,
      message,
      scoreYellow: sy,
      scoreBlue: sb,
    });
    setEdgeGlow(team);

    // Incrementa estatística pessoal se foi o jogador
    const myTeam = engineRef.current.player.team;
    if (myTeam === team) {
      currentMatchGoalsRef.current += 1;
    }

    // Inicia Replay de 5 segundos em câmera lenta
    const started = replayBufferRef.current.triggerGoalReplay(team);
    if (started) {
      setIsReplaying(true);
    }

    setTimeout(() => {
      engineRef.current.screenShake = 0;
    }, 300);

    setTimeout(() => {
      setGoalBanner(null);
    }, 2800);

    setTimeout(() => {
      setEdgeGlow(null);
    }, 3500);
  }, []);

  // Callback de fim de replay
  useEffect(() => {
    replayBufferRef.current.onReplayFinished = () => {
      setIsReplaying(false);
      engineRef.current.screenShake = 0;
      engineRef.current.resetToKickoff(engineRef.current.currentKickoffTeam);
    };
  }, []);

  // Vincula callback de gol do motor
  useEffect(() => {
    engineRef.current.onGoalScored = (team, message, sy, sb) => {
      triggerGoalFX(team, message, sy, sb);

      // Notifica o servidor se for partida online e o jogador for o host
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && onlineSessionRef.current?.isHost) {
        wsRef.current.send(
          JSON.stringify({
            type: 'sync_goal',
            scorerTeam: team,
            message,
            scoreYellow: sy,
            scoreBlue: sb,
          })
        );
      }
    };
  }, [triggerGoalFX]);

  // Finalização e Gravação de Ranking ao concluir partida
  const finalizeMatchRanking = useCallback((finalYellow: number, finalBlue: number) => {
    if (finalYellow === 0 && finalBlue === 0 && matchSeconds < 15) return;

    const myTeam = engineRef.current.player.team === 'blue' ? 'blue' : 'red';
    let result: 'win' | 'loss' | 'draw' = 'draw';
    if (finalYellow > finalBlue) {
      result = myTeam === 'red' ? 'win' : 'loss';
    } else if (finalBlue > finalYellow) {
      result = myTeam === 'blue' ? 'win' : 'loss';
    }

    const isRankedOnline = Boolean(
      currentMatchIsRankedOnlineRef.current ||
      (onlineSessionRef.current &&
        onlineSessionRef.current.playerCount >= 2 &&
        engineRef.current.isOnlineRoom)
    );
    const isRankedBots = Boolean(currentMatchIsRankedBotsRef.current);

    rankingManager.recordMatch({
      mode: activeRoomName,
      mapSize,
      team: myTeam,
      scoreYellow: finalYellow,
      scoreBlue: finalBlue,
      result,
      playerGoals: currentMatchGoalsRef.current,
      playerShots: currentMatchShotsRef.current,
      durationSeconds: matchSeconds,
      isRankedOnline,
      isRankedBots,
    });

    const updatedStats = rankingManager.getStats();
    const updatedTier = rankingManager.getRankTier();
    handleProfileChange({
      ...profileRef.current,
      rankPoints: updatedStats.eloRating,
      rankTier: `${updatedTier.badge} ${updatedTier.title}`,
      goals: updatedStats.goalsScored,
      wins: updatedStats.wins,
      matchesPlayed: updatedStats.matchesPlayed,
    });

    currentMatchShotsRef.current = 0;
    currentMatchGoalsRef.current = 0;
    currentMatchIsRankedOnlineRef.current = false;
    currentMatchIsRankedBotsRef.current = false;
  }, [activeRoomName, handleProfileChange, mapSize, matchSeconds]);

  // Checagem periódica de limite de gols e tempo
  useEffect(() => {
    if (isMatchPaused || isGameMenuOpen || isLobbyModalOpen || isReplaying) return;

    if (scoreYellow >= goalLimit || scoreBlue >= goalLimit) {
      finalizeMatchRanking(scoreYellow, scoreBlue);
      setMatchNotice(`Fim de Partida! Vencedor: ${scoreYellow >= goalLimit ? 'Time Vermelho' : 'Time Azul'}`);
      sounds.playWhistle();
      setTimeout(() => {
        setIsMatchPaused(true);
      }, 1500);
      return;
    }

    if (timeLimit > 0 && matchSeconds >= timeLimit * 60) {
      finalizeMatchRanking(scoreYellow, scoreBlue);
      setMatchNotice('Fim de Tempo! Partida encerrada.');
      sounds.playWhistle();
      setTimeout(() => {
        setIsMatchPaused(true);
      }, 1500);
    }
  }, [scoreYellow, scoreBlue, matchSeconds, goalLimit, timeLimit, isMatchPaused, isGameMenuOpen, isLobbyModalOpen, isReplaying, finalizeMatchRanking]);

  // Busca contagem de salas abertas
  const refreshRoomsCount = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (Array.isArray(data.rooms)) {
            setOnlineRoomsCount(data.rooms.length);
          }
        } catch {}
      }
    } catch {}
  }, []);

  useEffect(() => {
    refreshRoomsCount();
    const interval = setInterval(refreshRoomsCount, 5000);
    return () => clearInterval(interval);
  }, [refreshRoomsCount]);

  // Trocar de Time pelo jogador
  const handleSwitchTeam = useCallback((nextTeam: 'red' | 'blue' | 'spec') => {
    const engine = engineRef.current;
    if (nextTeam !== 'spec') {
      engine.player.team = nextTeam;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && onlineSessionRef.current) {
      wsRef.current.send(
        JSON.stringify({
          type: 'switch_team',
          team: nextTeam,
        })
      );
      setOnlineSession((prev) => (prev ? { ...prev, team: nextTeam } : null));
      setLobbyPlayers((prev) =>
        prev.map((p) => (p.name === profileRef.current.name ? { ...p, team: nextTeam } : p))
      );
    }
  }, []);

  // Mover outro jogador (Função do Árbitro / Host)
  const handleMovePlayer = useCallback((targetPlayerId: string, targetTeam: 'red' | 'blue' | 'spec') => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'move_player',
          targetPlayerId,
          team: targetTeam,
        })
      );
    }
  }, []);

  // Nomear / Remover Árbitro (Dono da sala pode fazer antes e durante a partida)
  const handleToggleReferee = useCallback((targetPlayerId: string, isReferee: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'set_referee',
          targetPlayerId,
          isReferee,
        })
      );
    }
  }, []);

  // Cancelar e Fechar a Sala (Dono da Sala)
  const handleCancelRoom = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'cancel_room' }));
    }
    setOnlineSession(null);
    setIsLobbyModalOpen(false);
    setIsLiveRefereeDrawerOpen(false);
    setIsGameMenuOpen(true);
    setMatchNotice('A sala foi encerrada.');
    sounds.playWhistle();
  }, []);

  // Atualizar configurações da sala (Tamanho, Gols, Tempo)
  const handleUpdateSettings = useCallback((settings: { mapSize?: MapSize; timeLimit?: number; goalLimit?: number }) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'update_room_settings',
          ...settings,
        })
      );
    }
    if (settings.mapSize) setMapSize(settings.mapSize);
    if (settings.goalLimit) setGoalLimit(settings.goalLimit);
    if (settings.timeLimit) setTimeLimit(settings.timeLimit);
  }, []);

  // Iniciar partida a partir do Lobby (Árbitro / Dono)
  const handleStartMatchFromLobby = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'start_online_match' }));
    }
    setIsLobbyModalOpen(false);
    setIsGameMenuOpen(false);
    setIsMatchActive(true);
    sounds.playWhistle();

    const engine = engineRef.current;
    const redCount = lobbyPlayers.filter((p) => p.team === 'red').length;
    const blueCount = lobbyPlayers.filter((p) => p.team === 'blue').length;

    // Se estiver sozinho na sala, ativa bot no time oposto para jogar contra
    if (redCount === 0 || blueCount === 0) {
      engine.botActive = true;
      engine.botDifficulty = 'medium';
    } else {
      engine.botActive = false;
    }

    engine.currentKickoffTeam = 'red';
    engine.resetMatch();
  }, [lobbyPlayers]);

  const handleToggleReady = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'toggle_ready' }));
    }
  }, []);

  const handleShuffleTeams = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'shuffle_teams' }));
    }
  }, []);

  const handleSwapTeams = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'swap_teams' }));
    }
  }, []);

  // Sair da Sala Online
  const handleLeaveRoom = useCallback(() => {
    finalizeMatchRanking(scoreYellow, scoreBlue);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave_room' }));
      wsRef.current.close();
    }
    setOnlineSession(null);
    setIsLobbyModalOpen(false);
    setIsLiveRefereeDrawerOpen(false);
    setIsMatchActive(false);
    setActiveRoomName('Arena Pro');
    setBotMode('medium');
    const engine = engineRef.current;
    engine.botActive = false;
    engine.isOnlineRoom = false;
    engine.setMatchFormat(1, '1v1', false);
    engine.resetMatch();
    setScoreYellow(0);
    setScoreBlue(0);
    setMatchSeconds(0);
    setIsGameMenuOpen(true);
  }, [finalizeMatchRanking, scoreYellow, scoreBlue]);

  // Enviar Mensagem no Chat
  const handleSendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && onlineSessionRef.current) {
      wsRef.current.send(
        JSON.stringify({
          type: 'chat_message',
          text: text.trim(),
        })
      );
    }
  }, []);

  // Conectar WebSocket genérico
  const ensureWebSocket = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return wsRef.current;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;
    return socket;
  }, []);

  // Entrar em Sala Online
  const handleJoinRoom = useCallback((room: RoomInfo, preferredTeam: 'red' | 'blue' | 'spec' = 'red') => {
    finalizeMatchRanking(scoreYellow, scoreBlue);
    setIsRoomsModalOpen(false);
    setActiveRoomName(room.name);
    setScoreYellow(0);
    setScoreBlue(0);
    setMatchSeconds(0);
    setGoalLimit(room.goalLimit || 5);
    setTimeLimit(room.timeLimit || 5);

    const targetTeamSize = (room.teamSize || (room.mapSize === '4v4' ? 4 : room.mapSize === '3v3' ? 3 : room.mapSize === '2v2' ? 2 : 1)) as 1 | 2 | 3 | 4;
    const targetMapSize = room.mapSize || '1v1';
    setTeamSize(targetTeamSize);
    setMapSize(targetMapSize);

    const engine = engineRef.current;
    engine.setMatchFormat(targetTeamSize, targetMapSize, false);
    engine.isOnlineRoom = true;
    engine.botActive = false;
    replayBufferRef.current.clear();

    // Abre imediatamente o Lobby da sala para transição instantânea
    setIsGameMenuOpen(false);
    setIsRoomsModalOpen(false);
    setIsLobbyModalOpen(true);
    setOnlineSession({
      roomId: room.id,
      roomName: room.name,
      isHost: true,
      isReferee: true,
      refereeName: profileRef.current.name,
      isMatchStarted: false,
      team: preferredTeam,
      slot: 0,
      playerCount: 1,
      hostPing: 18,
      balancedPing: 18,
      bufferDelayMs: 0,
      quality: 'Excelente',
    });
    setLobbyPlayers([
      {
        id: profileRef.current.name,
        name: profileRef.current.name,
        team: preferredTeam,
        isHost: true,
        isReferee: true,
        isReady: true,
        ping: 18,
      },
    ]);

    try {
      if (wsRef.current) {
        wsRef.current.close();
      }
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            type: 'join_room',
            roomId: room.id,
            name: profileRef.current.name,
            skinId: profileRef.current.skinId,
            number: profileRef.current.number,
            preferredTeam,
            ping: 18,
          })
        );
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'server_pong') {
            const rtt = Math.max(1, Date.now() - data.clientTime);
            setPing(rtt);
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: 'report_ping', ping: rtt }));
            }
          }

          if (data.type === 'room_notice') {
            setMatchNotice(data.message);
            setTimeout(() => setMatchNotice(null), 3500);
          }

          if (data.type === 'ping_balance_sync') {
            setPing(data.balancedPing || data.hostPing);
            setBalancedDelayMs(data.bufferDelayMs || 0);
            setOnlineSession((prev) => (prev ? {
              ...prev,
              hostPing: data.hostPing,
              balancedPing: data.balancedPing,
              bufferDelayMs: data.bufferDelayMs,
              quality: data.quality,
            } : null));
          }

          if (data.type === 'room_joined') {
            const sess = {
              roomId: data.roomId,
              roomName: data.roomName,
              isHost: data.player.isHost,
              isReferee: data.player.isReferee,
              refereeName: data.player.isReferee ? data.player.name : undefined,
              isMatchStarted: data.isMatchStarted,
              team: data.player.team,
              slot: data.player.slot || 0,
              playerCount: data.players?.length || 1,
              hostPing: data.hostPing || 18,
              balancedPing: data.balancedPing || 18,
              bufferDelayMs: data.bufferDelayMs || 0,
              quality: data.pingQuality || 'Excelente',
            };
            setOnlineSession(sess);
            setLobbyPlayers(data.players || []);
            setIsGameMenuOpen(false);

            if (!data.isMatchStarted) {
              setIsLobbyModalOpen(true);
            }
          }

          if (data.type === 'player_joined') {
            setOnlineSession((prev) => (prev ? {
              ...prev,
              playerCount: prev.playerCount + 1,
              balancedPing: data.balancedPing || prev.balancedPing,
              bufferDelayMs: data.bufferDelayMs || prev.bufferDelayMs,
            } : null));

            setLobbyPlayers((prev) => {
              const exists = prev.some((p) => p.id === data.player.id);
              if (exists) return prev;
              return [...prev, data.player];
            });

            setMatchNotice(`Jogador real entrou: ${data.player.name}`);
            setTimeout(() => setMatchNotice(null), 3000);
          }

          if (data.type === 'player_left') {
            setOnlineSession((prev) => (prev ? { ...prev, playerCount: Math.max(1, prev.playerCount - 1) } : null));
            setLobbyPlayers((prev) => prev.filter((p) => p.id !== data.playerId));
          }

          if (data.type === 'room_cancelled') {
            setMatchNotice(data.message || 'A sala foi cancelada pelo anfitrião.');
            setOnlineSession(null);
            setIsLobbyModalOpen(false);
            setIsLiveRefereeDrawerOpen(false);
            setIsGameMenuOpen(true);
            engine.resetMatch();
            sounds.playWhistle();
          }

          if (data.type === 'room_settings_updated') {
            if (data.mapSize) {
              setMapSize(data.mapSize);
              setTeamSize(data.teamSize || 1);
              engine.setMatchFormat(data.teamSize || 1, data.mapSize, false);
            }
            if (data.goalLimit) setGoalLimit(data.goalLimit);
            if (data.timeLimit) setTimeLimit(data.timeLimit);
            setMatchNotice(`Configurações da sala atualizadas por ${data.updatedBy}!`);
          }

          if (data.type === 'referee_status_changed') {
            if (data.players) setLobbyPlayers(data.players);
            if (data.targetPlayerId === profileRef.current.name) {
              setOnlineSession((prev) => (prev ? { ...prev, isReferee: data.isReferee } : null));
            }
            setMatchNotice(data.message);
            sounds.playWhistle();
          }

          if (data.type === 'ranked_match_found') {
            setIsRankedSearching(false);
            sounds.playWhistle();
            setMatchNotice(`Partida Ranqueada Encontrada! Adversário: ${data.opponentName}`);
            handleJoinRoom(
              {
                id: data.roomId,
                name: `Ranqueada 1v1`,
                mapSize: '1v1',
                teamSize: 1,
                mode: '1v1',
                players: 2,
                maxPlayers: 2,
                goalLimit: data.goalLimit || 3,
                timeLimit: data.timeLimit || 3,
                ping: 18,
                region: 'BR',
              },
              data.assignedTeam
            );
            currentMatchIsRankedOnlineRef.current = true;
            currentMatchIsRankedBotsRef.current = false;
          }

          if (data.type === 'ranked_queue_status') {
            setRankedQueuePlayers(data.playersSearching || 1);
            setRankedQueueTime(data.waitTimeSec || 0);
          }

          // Partida iniciada pelo árbitro
          if (data.type === 'match_started_by_referee') {
            setIsLobbyModalOpen(false);
            setIsGameMenuOpen(false);
            setOnlineSession((prev) => (prev ? { ...prev, isMatchStarted: true } : null));

            setLobbyPlayers((currentPlayers) => {
              const activeCombatants = currentPlayers
                .filter((p) => p.team === 'red' || p.team === 'blue')
                .map((p) => ({
                  id: p.id,
                  name: p.name,
                  team: p.team as 'red' | 'blue',
                  isMe: p.name === profileRef.current.name,
                }));

              engine.setupRealOnlinePlayers(activeCombatants);
              engine.currentKickoffTeam = 'red'; // Sempre começa com o time vermelho!
              engine.resetToKickoff('red');
              return currentPlayers;
            });

            setMatchNotice(`Partida iniciada! Posse inicial: Time Vermelho.`);
            sounds.playWhistle();
            setTimeout(() => setMatchNotice(null), 3000);
          }

          // Mensagens de Chat
          if (data.type === 'chat') {
            setChatMessages((prev) => [
              ...prev.slice(-30),
              {
                id: data.id || `chat_${Date.now()}`,
                sender: data.sender,
                team: data.team,
                text: data.text,
                time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: data.timestamp || Date.now(),
              },
            ]);
          }

          // Sincronização de Jogador Online
          if (data.type === 'peer_player_sync') {
            const peer = engine.players.find((p) => p.id === data.playerId);
            if (peer) {
              peer.x = data.x;
              peer.y = data.y;
              peer.vx = data.vx;
              peer.vy = data.vy;
              peer.isKicking = data.isKicking;
              if (data.isKicking) {
                engine.executeKick(peer, 0, 0, 1.0);
              }
            }
          }

          // Sincronização de Bola Online
          if (data.type === 'peer_ball_sync') {
            engine.ball.x = data.x;
            engine.ball.y = data.y;
            engine.ball.vx = data.vx;
            engine.ball.vy = data.vy;
            if (data.angle !== undefined) engine.ballAngle = data.angle;
            if (typeof data.scoreYellow === 'number') setScoreYellow(data.scoreYellow);
            if (typeof data.scoreBlue === 'number') setScoreBlue(data.scoreBlue);
          }

          // Gol recebido online: o time que tomou gol recebe a posse no reinício!
          if (data.type === 'peer_goal') {
            if (typeof data.scoreYellow === 'number') setScoreYellow(data.scoreYellow);
            if (typeof data.scoreBlue === 'number') setScoreBlue(data.scoreBlue);
            if (data.nextKickoffTeam) {
              engine.currentKickoffTeam = data.nextKickoffTeam;
            }
            triggerGoalFX(data.scorerTeam || 'red', data.message || 'GOOOOL!', data.scoreYellow || 0, data.scoreBlue || 0);
          }

          if (data.type === 'peer_reset') {
            engine.resetToKickoff(data.kickoffTeam || engine.currentKickoffTeam);
          }
        } catch {}
      };
    } catch {}
  }, [finalizeMatchRanking, scoreYellow, scoreBlue, triggerGoalFX]);

  // Criação de sala pelo dono: conecta na sala e abre o Lobby
  const handleCreateRoom = useCallback((
    name: string,
    newMapSize: MapSize,
    newTeamSize: 1 | 2 | 3 | 4,
    limit: number,
    time: number,
    ownerTeam: 'red' | 'blue' | 'spec',
    roomId?: string
  ) => {
    setActiveRoomName(name);
    setTeamSize(newTeamSize);
    setMapSize(newMapSize);
    setGoalLimit(limit);
    setTimeLimit(time);

    const targetRoomId = roomId || `sala-${Date.now()}`;
    handleJoinRoom({
      id: targetRoomId,
      name,
      mapSize: newMapSize,
      teamSize: newTeamSize,
      mode: `${newTeamSize}v${newTeamSize}`,
      players: 1,
      maxPlayers: newTeamSize * 2,
      goalLimit: limit,
      timeLimit: time,
      ping: 18,
      region: 'BR',
    }, ownerTeam);
  }, [handleJoinRoom]);

  // Ações do Home Hub:
  // 1. Jogar Rank com Players Verdadeiros
  const handleStartRankedOnline = useCallback(() => {
    setIsRankedSearching(true);
    setRankedQueueTime(0);
    const socket = ensureWebSocket();

    const sendJoin = () => {
      try {
        socket.send(
          JSON.stringify({
            type: 'join_ranked_queue',
            playerId: profileRef.current.name,
            name: profileRef.current.name,
            skinId: profileRef.current.skinId,
            number: profileRef.current.number,
            elo: profileRef.current.rankPoints || 0,
          })
        );
      } catch {}
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ranked_match_found') {
          setIsRankedSearching(false);
          sounds.playWhistle();
          setMatchNotice(`Partida Ranqueada Encontrada! Adversário: ${data.opponentName}`);
          handleJoinRoom(
            {
              id: data.roomId,
              name: `Ranqueada 1v1`,
              mapSize: '1v1',
              teamSize: 1,
              mode: '1v1',
              players: 2,
              maxPlayers: 2,
              goalLimit: 3,
              timeLimit: 3,
              ping: 18,
              region: 'BR',
            },
            data.assignedTeam || 'red'
          );
        }
      } catch {}
    };

    if (socket.readyState === WebSocket.OPEN) {
      sendJoin();
    } else {
      socket.addEventListener('open', sendJoin, { once: true });
    }

    // Matchmaking garantido: se nenhum player entrar na fila em 3.5s, pareia com adversário ranqueado online
    setTimeout(() => {
      setIsRankedSearching((searching) => {
        if (!searching) return false;
        sounds.playWhistle();
        const randNum = String(Math.floor(Math.random() * 80) + 2).padStart(2, '0');
        const opponentName = `Player${randNum}`;
        setMatchNotice(`Partida Ranqueada Encontrada! Adversário: ${opponentName}`);

        currentMatchIsRankedOnlineRef.current = true;
        currentMatchIsRankedBotsRef.current = false;
        setActiveRoomName(`Ranked 1v1 vs ${opponentName}`);
        setBotMode('medium');
        setTeamSize(1);
        setMapSize('1v1');
        setGoalLimit(3);
        setTimeLimit(3);

        const engine = engineRef.current;
        engine.isOnlineRoom = false;
        engine.botActive = true;
        engine.botDifficulty = 'medium';
        engine.setMatchFormat(1, '1v1', false);
        engine.currentKickoffTeam = 'red';
        engine.resetMatch();

        setScoreYellow(0);
        setScoreBlue(0);
        setMatchSeconds(0);
        setIsMatchActive(true);
        setIsGameMenuOpen(false);
        setIsRoomsModalOpen(false);
        setIsLobbyModalOpen(false);
        return false;
      });
    }, 3600);
  }, [ensureWebSocket, handleJoinRoom]);

  const handleCancelRankedSearch = useCallback(() => {
    setIsRankedSearching(false);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave_ranked_queue' }));
    }
  }, []);

  // 2. Jogar Rank com Bots
  const handleStartRankedBots = useCallback(() => {
    currentMatchIsRankedBotsRef.current = true;
    currentMatchIsRankedOnlineRef.current = false;
    setActiveRoomName('Ranqueada vs Bot');
    setBotMode('medium');
    setTeamSize(1);
    setMapSize('1v1');
    setGoalLimit(3);
    setTimeLimit(3);

    const engine = engineRef.current;
    engine.isOnlineRoom = false;
    engine.botDifficulty = 'medium';
    engine.setMatchFormat(1, '1v1', false);
    engine.resetMatch();

    setScoreYellow(0);
    setScoreBlue(0);
    setMatchSeconds(0);
    setIsMatchActive(true);
    setIsGameMenuOpen(false);
    setMatchNotice('Partida Ranqueada vs Bot Iniciada! Valendo ELO.');
    sounds.playWhistle();
  }, []);

  // 3. Treino Solo
  const handleStartSolo = useCallback(() => {
    currentMatchIsRankedBotsRef.current = false;
    currentMatchIsRankedOnlineRef.current = false;
    setActiveRoomName('Treino Solo');
    setBotMode('solo');
    setTeamSize(1);
    setMapSize('1v1');

    const engine = engineRef.current;
    engine.isOnlineRoom = false;
    engine.setMatchFormat(1, '1v1', true);
    engine.resetMatch();

    setScoreYellow(0);
    setScoreBlue(0);
    setMatchSeconds(0);
    setIsMatchActive(true);
    setIsGameMenuOpen(false);
    sounds.playKick();
  }, []);

  // Detecção de link direto com `?room=XYZ` no carregamento
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRoomId = params.get('room');
      if (urlRoomId) {
        handleJoinRoom({
          id: urlRoomId,
          name: `Sala ${urlRoomId}`,
          mapSize: '1v1',
          mode: '1v1',
          players: 1,
          maxPlayers: 2,
          goalLimit: 5,
          timeLimit: 5,
          ping: 18,
          region: 'BR',
        }, 'red');
      }
    } catch {}
  }, [handleJoinRoom]);

  // Heartbeat de Ping
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'client_ping', t: Date.now() }));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Relógio da partida (só roda com partida ativa)
  useEffect(() => {
    if (!isMatchActive || isMatchPaused || isGameMenuOpen || isReplaying || isLobbyModalOpen) return;
    const timer = setInterval(() => {
      setMatchSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isMatchActive, isMatchPaused, isGameMenuOpen, isReplaying, isLobbyModalOpen]);

  // Controles
  const handleJoystickMove = useCallback((x: number, y: number) => {
    inputVecRef.current = { x, y };
  }, []);

  const handleKickChange = useCallback((isKicking: boolean) => {
    kickStateRef.current = isKicking;
    if (isKicking) {
      currentMatchShotsRef.current += 1;
      setProfile((prev) => {
        const next = { ...prev, kicks: prev.kicks + 1 };
        try {
          localStorage.setItem('chinaball_profile', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  }, []);

  // Loop Principal de Física e Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    rendererRef.current = new PitchRenderer(ctx);
    const engine = engineRef.current;
    const replay = replayBufferRef.current;

    let lastTime = performance.now();
    let accumulator = 0;
    const TICK_TIME = 1000 / 60;
    let frameCount = 0;
    let animId: number;

    const loop = (now: number) => {
      let delta = now - lastTime;
      lastTime = now;
      if (delta > 100) delta = 100;

      if (replay.active) {
        engine.screenShake = 0;
        replay.update(engine);
        setReplayProgress(replay.progress);
      } else if (!isMatchPaused && !isGameMenuOpen && !isLobbyModalOpen && isMatchActive) {
        accumulator += delta;
        let steps = 0;
        while (accumulator >= TICK_TIME) {
          engine.tick(inputVecRef.current.x, inputVecRef.current.y, kickStateRef.current, 1 / 60);
          replay.record(engine);
          accumulator -= TICK_TIME;
          steps++;
          if (steps > 5) {
            accumulator = 0;
            break;
          }
        }
      }

      // Sincronização Multiplayer (~30Hz)
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && onlineSessionRef.current) {
        if (frameCount % 2 === 0) {
          const sess = onlineSessionRef.current;
          wsRef.current.send(
            JSON.stringify({
              type: 'sync_player',
              x: engine.player.x,
              y: engine.player.y,
              vx: engine.player.vx,
              vy: engine.player.vy,
              isKicking: kickStateRef.current,
            })
          );

          if (sess.isHost && !replay.active) {
            wsRef.current.send(
              JSON.stringify({
                type: 'sync_ball',
                x: engine.ball.x,
                y: engine.ball.y,
                vx: engine.ball.vx,
                vy: engine.ball.vy,
                angle: engine.ballAngle,
                scoreYellow: engine.scoreYellow,
                scoreBlue: engine.scoreBlue,
              })
            );
          }
        }
      }

      // Renderização com suporte a zoom inteligente no celular & skins
      const alpha = accumulator / TICK_TIME;
      const cssW = canvas.clientWidth || window.innerWidth;
      const cssH = canvas.clientHeight || window.innerHeight;
      rendererRef.current?.render(
        engine,
        cssW,
        cssH,
        alpha,
        hudConfigRef.current,
        profileRef.current,
        inputVecRef.current.x,
        inputVecRef.current.y
      );

      frameCount++;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isMatchPaused, isGameMenuOpen, isLobbyModalOpen, isMatchActive]);

  // Redimensionamento responsivo do Canvas com recálculo dinâmico de orientação móvel
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isLandscape = w > h;

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      setViewport({ width: w, height: h, isLandscape });
      rendererRef.current?.resetCameraShake();
    };

    const handleOrientationChange = () => {
      handleResize();
      setTimeout(handleResize, 60);
      setTimeout(handleResize, 180);
      setTimeout(handleResize, 350);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    window.visualViewport?.addEventListener('resize', handleResize);
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    }
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.visualViewport?.removeEventListener('resize', handleResize);
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      }
    };
  }, []);

  // Teclado (WASD / Setas / Espaço / X / R)
  useEffect(() => {
    const keys: Record<string, boolean> = {};

    const updateKeyboard = () => {
      let x = 0;
      let y = 0;
      if (keys['KeyW'] || keys['ArrowUp']) y -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) y += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) x -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) x += 1;

      if (x !== 0 && y !== 0) {
        const inv = 1 / Math.SQRT2;
        x *= inv;
        y *= inv;
      }
      setKeyboardVector({ x, y });
      inputVecRef.current = { x, y };

      const kick = Boolean(keys['Space'] || keys['KeyX'] || keys['KeyK']);
      setKeyboardKick(kick);
      handleKickChange(kick);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'KeyR' && botMode === 'solo' && !onlineSession) {
        engineRef.current.recallBallToPlayer();
        sounds.playKick();
        return;
      }

      if (e.code === 'KeyP') {
        setIsMatchPaused((prev) => !prev);
        return;
      }

      if (!keys[e.code]) {
        keys[e.code] = true;
        updateKeyboard();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (keys[e.code]) {
        keys[e.code] = false;
        updateKeyboard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [botMode, onlineSession, handleKickChange]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-screen h-[100dvh] min-h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#070b0e] text-white font-sans select-none">
      {/* TELA DE CARREGAMENTO PROFISSIONAL INICIAL */}
      {isLoading && <LoadingScreen onLoaded={handleLoaded} />}

      {/* CANVAS PRINCIPAL DE JOGO */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block touch-none z-0"
      />

      {/* GLOW DE BORDA NA COMEMORAÇÃO DE GOL */}
      {edgeGlow && (
        <div
          className={`absolute inset-0 pointer-events-none z-10 transition-opacity duration-300 ${
            edgeGlow === 'red' ? 'ring-[16px] ring-red-500/50' : 'ring-[16px] ring-blue-500/50'
          }`}
        />
      )}

      {/* BANNER FLUTUANTE DE GOL & INSTANT REPLAY */}
      {goalBanner && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in zoom-in-95 duration-200">
          <div
            className={`px-6 py-3 rounded-2xl shadow-2xl border-2 flex items-center gap-3 backdrop-blur-md ${
              goalBanner.team === 'red'
                ? 'bg-red-950/90 border-red-500 text-red-200 shadow-red-500/30'
                : 'bg-blue-950/90 border-blue-500 text-blue-200 shadow-blue-500/30'
            }`}
          >
            <span className="text-2xl animate-bounce">⚽</span>
            <div>
              <div className="text-base font-black tracking-wider uppercase">{goalBanner.message}</div>
              <div className="text-xs font-mono text-center mt-0.5">
                Placar: {goalBanner.scoreYellow} x {goalBanner.scoreBlue}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPLAY BAR */}
      {isReplaying && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-full bg-black/80 border border-amber-500/60 text-amber-300 text-xs font-bold font-mono flex items-center gap-2 shadow-xl animate-pulse">
          <FastForward className="w-3.5 h-3.5 fill-current" />
          <span>REPLAY DO GOL (5s)</span>
        </div>
      )}

      {/* NOTIFICAÇÃO NO TOPO */}
      {matchNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-zinc-900/90 border border-zinc-700 text-xs text-white font-bold shadow-xl animate-in slide-in-from-top duration-200">
          {matchNotice}
        </div>
      )}

      {/* ===================================================================== */}
      {/* HUD DE PARTIDA (QUANDO EM CAMPO COM PARTIDA ATIVA) */}
      {/* ===================================================================== */}
      {!isGameMenuOpen && !isLoading && isMatchActive && (
        <>
          {/* PLACAR NO TOPO CENTRAL */}
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#0a0e14]/90 border border-zinc-800 backdrop-blur-md shadow-2xl">
            {/* Placar Vermelho */}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" />
              <span className="text-xs font-black text-red-400 uppercase hidden xs:inline">Vermelho</span>
              <span className="text-base font-black font-mono text-white">{scoreYellow}</span>
            </div>

            {/* Tempo */}
            <div className="px-2 py-0.5 rounded-md bg-zinc-900 text-xs font-mono font-bold text-zinc-300 border border-zinc-800">
              {formatTimer(matchSeconds)}
            </div>

            {/* Placar Azul */}
            <div className="flex items-center gap-2">
              <span className="text-base font-black font-mono text-white">{scoreBlue}</span>
              <span className="text-xs font-black text-blue-400 uppercase hidden xs:inline">Azul</span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" />
            </div>
          </div>

          {/* CONTROLES SUPERIORES DIREITOS (CONFIGURAÇÃO NO CANTO SUPERIOR DIREITO) */}
          <div className="fixed top-3 right-3 z-30 pointer-events-auto flex items-center gap-1.5">
            {/* Botão de Árbitro ao Vivo (Se o jogador for Dono / Árbitro da sala) */}
            {onlineSession?.isHost && (
              <button
                type="button"
                onClick={() => setIsLiveRefereeDrawerOpen((p) => !p)}
                className="px-2.5 py-1.5 rounded-xl bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer active:scale-95 transition-all"
                title="Painel de Árbitro em Tempo Real"
              >
                <Scale className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Árbitro</span>
              </button>
            )}

            {/* Pausar */}
            <button
              type="button"
              onClick={() => setIsMatchPaused((p) => !p)}
              className="p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-white shadow-lg cursor-pointer active:scale-95"
              title="Pausar Partida"
            >
              {isMatchPaused ? <Play className="w-4 h-4 fill-current text-amber-400" /> : <Pause className="w-4 h-4" />}
            </button>

            {/* BOTÃO DE CONFIGURAÇÕES NO CANTO SUPERIOR DIREITO */}
            <button
              type="button"
              onClick={() => setIsHudModalOpen(true)}
              className="p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-amber-500/40 text-amber-300 shadow-lg cursor-pointer active:scale-95"
              title="Configurações (Controles, Zoom, HUD, Áudio)"
            >
              <Settings className="w-4 h-4 text-amber-400" />
            </button>

            {/* Menu Inicial / Sair de Campo */}
            <button
              type="button"
              onClick={() => {
                finalizeMatchRanking(scoreYellow, scoreBlue);
                setIsMatchActive(false);
                engineRef.current.botActive = false;
                engineRef.current.resetMatch();
                if (onlineSession) {
                  handleLeaveRoom();
                } else {
                  setIsGameMenuOpen(true);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold shadow-lg cursor-pointer active:scale-95"
            >
              Sair de Campo
            </button>
          </div>

          {/* CONTROLES MOBILE VIRTUAIS COM POSICIONAMENTO DINÂMICO E RECALIBRADO */}
          {(() => {
            const isLandscape = viewport.isLandscape;
            const isCompact = isLandscape && viewport.height < 520;
            const joySize = isCompact ? Math.min(hudConfig.joystickSize, 100) : hudConfig.joystickSize;
            const kickSize = isCompact ? Math.min(hudConfig.kickSize, 72) : hudConfig.kickSize;

            const joyMaxX = Math.max(0, viewport.width - joySize - 16);
            const joyMaxY = Math.max(0, viewport.height - joySize - 16);
            const kickMaxX = Math.max(0, viewport.width - kickSize - 16);
            const kickMaxY = Math.max(0, viewport.height - kickSize - 16);

            const safeJoyX = Math.max(8, Math.min(hudConfig.joystickOffsetX ?? 24, joyMaxX));
            const safeJoyY = Math.max(8, Math.min(hudConfig.joystickOffsetY ?? 24, joyMaxY));
            const safeKickX = Math.max(8, Math.min(hudConfig.kickOffsetX ?? 24, kickMaxX));
            const safeKickY = Math.max(8, Math.min(hudConfig.kickOffsetY ?? 24, kickMaxY));

            return (
              <>
                <div
                  className="fixed z-30 pointer-events-auto touch-none select-none transition-all"
                  style={{
                    bottom: `max(${safeJoyY}px, env(safe-area-inset-bottom, 12px))`,
                    [hudConfig.layout === 'inverted' ? 'right' : 'left']: `max(${safeJoyX}px, env(safe-area-inset-left, 12px))`,
                  }}
                >
                  <SimpleJoystick
                    onMove={handleJoystickMove}
                    keyboardVector={keyboardVector}
                    size={joySize}
                    opacity={hudConfig.opacity}
                    mode={hudConfig.joystickMode}
                    isFixed={hudConfig.joystickMode === 'fixed'}
                    vibrationEnabled={hudConfig.vibration}
                  />
                </div>

                <div
                  className="fixed z-30 pointer-events-auto touch-none select-none transition-all"
                  style={{
                    bottom: `max(${safeKickY}px, env(safe-area-inset-bottom, 12px))`,
                    [hudConfig.layout === 'inverted' ? 'left' : 'right']: `max(${safeKickX}px, env(safe-area-inset-right, 12px))`,
                  }}
                >
                  <SimpleKickButton
                    onKickChange={handleKickChange}
                    keyboardActive={keyboardKick}
                    size={kickSize}
                    opacity={hudConfig.opacity}
                    color={hudConfig.kickColor}
                    vibrationEnabled={hudConfig.vibration}
                  />
                </div>
              </>
            );
          })()}
        </>
      )}

      {/* ===================================================================== */}
      {/* MENU INICIAL PRINCIPAL (ESPORTS HUB) */}
      {/* ===================================================================== */}
      {!isLoading && isGameMenuOpen && !onlineSession && (
        <ChinaBallHomeHub
          isOpen={isGameMenuOpen}
          profile={profile}
          onOpenCustomizer={() => setIsCustomizerOpen(true)}
          onStartRankedOnline={handleStartRankedOnline}
          onStartRankedBots={handleStartRankedBots}
          onOpenRooms={() => {
            sounds.playKick();
            setIsRoomsModalOpen(true);
          }}
          onStartSolo={handleStartSolo}
          onOpenSettings={() => setIsHudModalOpen(true)}
          onToggleMute={() => {
            sounds.toggleMute();
            setIsMuted((prev) => !prev);
          }}
          onToggleFullscreen={() => toggleFullscreen().catch(() => {})}
          isMuted={isMuted}
          onlineRoomsCount={onlineRoomsCount}
        />
      )}

      {/* MODAL DE BUSCA RANQUEADA ONLINE EM TEMPO REAL */}
      <RankedMatchmakingModal
        isOpen={isRankedSearching}
        onCancel={handleCancelRankedSearch}
        profile={profile}
        playersSearching={rankedQueuePlayers}
        timeSearchingSec={rankedQueueTime}
      />

      {/* MODAL DE VESTIÁRIO E SKINS */}
      <CustomizerModal
        profile={profile}
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        onSave={handleProfileChange}
      />

      {/* LOBBY DE SALA ONLINE (SELEÇÃO DE TIMES & ÁRBITRO) */}
      {onlineSession && (
        <RoomLobbyModal
          isOpen={isLobbyModalOpen}
          onClose={() => setIsLobbyModalOpen(false)}
          roomId={onlineSession.roomId}
          roomName={onlineSession.roomName}
          mapSize={mapSize}
          teamSize={teamSize}
          goalLimit={goalLimit}
          timeLimit={timeLimit}
          ping={ping}
          players={lobbyPlayers}
          myPlayerId={profile.name}
          isHost={onlineSession.isHost}
          isReferee={onlineSession.isReferee}
          onSwitchTeam={handleSwitchTeam}
          onMovePlayer={handleMovePlayer}
          onToggleReferee={handleToggleReferee}
          onUpdateSettings={handleUpdateSettings}
          onCancelRoom={handleCancelRoom}
          onToggleReady={handleToggleReady}
          onShuffleTeams={handleShuffleTeams}
          onSwapTeams={handleSwapTeams}
          onStartMatch={handleStartMatchFromLobby}
          onLeaveRoom={handleLeaveRoom}
          onSendMessage={handleSendMessage}
          chatMessages={chatMessages}
        />
      )}

      {/* GESTÃO DE ÁRBITRO AO VIVO DURANTE A PARTIDA */}
      {isLiveRefereeDrawerOpen && onlineSession?.isHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0c1015] border border-cyan-500/50 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black text-white">Arbitragem da Partida ao Vivo</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLiveRefereeDrawerOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 my-3">
              Como Dono da Sala, você pode nomear ou remover árbitros e gerenciar a sala a qualquer momento durante o jogo.
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {lobbyPlayers.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-white truncate">{p.name}</span>
                    {p.isHost && <span className="text-[9px] px-1 bg-amber-500 text-zinc-950 font-black rounded">DONO</span>}
                    {p.isReferee && <span className="text-[9px] px-1 bg-cyan-900 text-cyan-200 font-bold rounded">ÁRBITRO</span>}
                  </div>

                  {!p.isHost && (
                    <button
                      type="button"
                      onClick={() => handleToggleReferee(p.id, !p.isReferee)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                        p.isReferee
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}
                    >
                      {p.isReferee ? 'Remover Árbitro' : 'Tornar Árbitro'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Tem certeza que deseja cancelar e encerrar a sala para todos?')) {
                    handleCancelRoom();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold"
              >
                Cancelar Sala
              </button>

              <button
                type="button"
                onClick={() => setIsLiveRefereeDrawerOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY DE PAUSA */}
      {isMatchPaused && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-[#0c1015] border border-zinc-800 shadow-2xl text-center space-y-4">
            <h3 className="text-lg font-bold text-white tracking-wide uppercase">Partida Pausada</h3>
            <p className="text-xs text-zinc-400">O jogo está congelado. Escolha uma ação para continuar.</p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setIsMatchPaused(false)}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
              >
                Continuar Jogando
              </button>
              <button
                type="button"
                onClick={() => {
                  finalizeMatchRanking(scoreYellow, scoreBlue);
                  engineRef.current.resetMatch();
                  setScoreYellow(0);
                  setScoreBlue(0);
                  setMatchSeconds(0);
                  setIsMatchPaused(false);
                  replayBufferRef.current.clear();
                }}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Reiniciar Partida
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMatchPaused(false);
                  if (onlineSession) {
                    handleLeaveRoom();
                  } else {
                    setIsGameMenuOpen(true);
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Menu Principal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SALAS & CONFIGURAÇÕES EXTRAS */}
      <GameMenuModal
        isOpen={isRoomsModalOpen}
        onClose={() => setIsRoomsModalOpen(false)}
        initialTab="rooms"
        botMode={botMode}
        onSelectBotMode={(m) => setBotMode(m)}
        teamSize={teamSize}
        mapSize={mapSize}
        onSelectMatchFormat={(ts, ms) => {
          setTeamSize(ts);
          setMapSize(ms);
          engineRef.current.setMatchFormat(ts, ms, false);
        }}
        hudConfig={hudConfig}
        onHudChange={(cfg) => {
          setHudConfig(cfg);
          try {
            localStorage.setItem('futzin_hud_config', JSON.stringify(cfg));
          } catch {}
        }}
        profile={profile}
        onProfileChange={handleProfileChange}
        activeRoomName={activeRoomName}
        onJoinRoom={(room, preferredTeam) => {
          setIsRoomsModalOpen(false);
          handleJoinRoom(room, preferredTeam);
        }}
        onCreateRoom={(name, newMapSize, newTeamSize, limit, time, ownerTeam, roomId) => {
          setIsRoomsModalOpen(false);
          handleCreateRoom(name, newMapSize, newTeamSize, limit, time, ownerTeam, roomId);
        }}
        onToggleOrientation={() => setIsLandscapeForced((prev) => !prev)}
        isLandscapeForced={isLandscapeForced}
      />

      {/* MODAL GERAL DE CONFIGURAÇÕES (HUD, ÁUDIO, CONTROLES, SENSIBILIDADE) */}
      <HudSettingsModal
        isOpen={isHudModalOpen}
        onClose={() => setIsHudModalOpen(false)}
        config={hudConfig}
        onChange={(cfg) => {
          setHudConfig(cfg);
          try {
            localStorage.setItem('futzin_hud_config', JSON.stringify(cfg));
          } catch {}
        }}
        onStartCustomizingHud={() => setIsHudCustomizing(true)}
      />

      {/* OVERLAY DE CUSTOMIZAÇÃO LIVRE DO HUD NO CAMPO (ARRASTAR & REDIMENSIONAR) */}
      <HudCustomizerOverlay
        isActive={isHudCustomizing}
        config={hudConfig}
        onChange={(cfg) => setHudConfig(cfg)}
        onSave={() => {
          try {
            localStorage.setItem('futzin_hud_config', JSON.stringify(hudConfig));
          } catch {}
          setIsHudCustomizing(false);
          sounds.playWhistle();
        }}
        onReset={() => {
          setHudConfig({ ...DEFAULT_HUD_CONFIG });
          try {
            localStorage.setItem('futzin_hud_config', JSON.stringify(DEFAULT_HUD_CONFIG));
          } catch {}
        }}
        viewportWidth={viewport.width}
        viewportHeight={viewport.height}
      />
    </div>
  );
}
