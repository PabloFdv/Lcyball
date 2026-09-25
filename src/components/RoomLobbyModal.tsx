import React, { useState } from 'react';
import {
  Users,
  Shield,
  Crown,
  Play,
  Share2,
  Check,
  RotateCcw,
  LogOut,
  ChevronRight,
  ChevronLeft,
  X,
  Scale,
  Wifi,
  AlertCircle,
  Shuffle,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  Sliders,
  Trash2,
} from 'lucide-react';
import { MapSize } from '../game/physicsConfig';
import { sounds } from '../audio/soundManager';

export interface LobbyPlayer {
  id: string;
  name: string;
  team: 'red' | 'blue' | 'spec';
  isHost: boolean;
  isReferee: boolean;
  isReady?: boolean;
  ping: number;
  ip?: string;
}

interface RoomLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  mapSize: MapSize;
  teamSize: number;
  goalLimit: number;
  timeLimit: number;
  ping: number;
  players: LobbyPlayer[];
  myPlayerId: string;
  isHost: boolean;
  isReferee: boolean;
  onSwitchTeam: (team: 'red' | 'blue' | 'spec') => void;
  onMovePlayer?: (targetPlayerId: string, team: 'red' | 'blue' | 'spec') => void;
  onToggleReferee?: (targetPlayerId: string, isReferee: boolean) => void;
  onUpdateSettings?: (settings: { mapSize?: MapSize; timeLimit?: number; goalLimit?: number }) => void;
  onCancelRoom?: () => void;
  onToggleReady?: () => void;
  onShuffleTeams?: () => void;
  onSwapTeams?: () => void;
  onStartMatch: () => void;
  onLeaveRoom: () => void;
  onSendMessage?: (text: string) => void;
  chatMessages?: { id: string; sender: string; text: string; time: string; team: string }[];
}

export const RoomLobbyModal: React.FC<RoomLobbyModalProps> = ({
  isOpen,
  onClose,
  roomId,
  roomName,
  mapSize,
  teamSize,
  goalLimit,
  timeLimit,
  ping,
  players,
  myPlayerId,
  isHost,
  isReferee,
  onSwitchTeam,
  onMovePlayer,
  onToggleReferee,
  onUpdateSettings,
  onCancelRoom,
  onToggleReady,
  onShuffleTeams,
  onSwapTeams,
  onStartMatch,
  onLeaveRoom,
  onSendMessage,
  chatMessages = [],
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [lobbyTab, setLobbyTab] = useState<'teams' | 'chat'>('teams');
  const [chatInput, setChatInput] = useState('');
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  if (!isOpen) return null;

  const redPlayers = players.filter((p) => p.team === 'red');
  const bluePlayers = players.filter((p) => p.team === 'blue');
  const specPlayers = players.filter((p) => p.team === 'spec');

  const myPlayer = players.find((p) => p.id === myPlayerId || p.name === myPlayerId);
  const canStart = redPlayers.length >= 1 && bluePlayers.length >= 1;

  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}/?room=${encodeURIComponent(roomId)}`;
    navigator.clipboard
      .writeText(inviteUrl)
      .then(() => {
        setCopiedLink(true);
        sounds.playKick();
        setTimeout(() => setCopiedLink(false), 2000);
      })
      .catch(() => {});
  };

  const handleAttemptStart = () => {
    if (!canStart) {
      setNotice('A partida só pode começar com pelo menos 1 jogador real em cada time! Sem bots.');
      setTimeout(() => setNotice(null), 3500);
      return;
    }
    sounds.playGoal();
    onStartMatch();
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && onSendMessage) {
      onSendMessage(chatInput.trim());
      setChatInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[94vh] bg-[#0c1015] border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Cabeçalho da Sala */}
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3.5 border-b border-zinc-800/80 bg-[#10151c] gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-xl shadow-md">
              🏟️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black tracking-tight text-white">{roomName}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700 font-bold">
                  {mapSize}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-400 border border-emerald-500/30 font-bold">
                  ⚖️ {ping || 18}ms
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Até {goalLimit} Gols • {timeLimit} Minutos • Servidor 100% Real (Sem Bots)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dono / Árbitro pode abrir painel de alterar tempo, gols e tamanho */}
            {(isHost || isReferee) && onUpdateSettings && (
              <button
                type="button"
                onClick={() => setShowSettingsPanel((p) => !p)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  showSettingsPanel
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                }`}
                title="Ajustar Tamanho do Mapa, Tempo e Gols"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ajustar Sala</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyInvite}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-zinc-700 active:scale-95 shadow-sm"
              title="Copiar Link de Convite da Sala"
            >
              {copiedLink ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span className="hidden xs:inline">{copiedLink ? 'Link Copiado!' : 'Convidar'}</span>
            </button>

            {/* Dono consegue cancelar a sala */}
            {isHost && onCancelRoom ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Tem certeza que deseja cancelar e fechar a sala para todos?')) {
                    onCancelRoom();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Cancelar e Fechar Sala"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Cancelar Sala</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onLeaveRoom}
                className="p-2 rounded-xl text-rose-400 hover:text-white hover:bg-rose-950/50 border border-transparent hover:border-rose-800 transition-all cursor-pointer active:scale-95"
                title="Sair da Sala"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Notificação Flutuante de Alerta */}
        {notice && (
          <div className="px-4 py-2 bg-amber-950/90 border-b border-amber-500/40 text-amber-200 text-xs flex items-center gap-2 animate-in slide-in-from-top duration-150">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* PAINEL DINÂMICO DE AJUSTAR TAMANHO DO MAPA, TEMPO E GOLS PELO DONO/ÁRBITRO */}
        {showSettingsPanel && (isHost || isReferee) && onUpdateSettings && (
          <div className="px-4 sm:px-6 py-3 bg-[#131922] border-b border-zinc-800 flex flex-wrap items-center gap-4 text-xs animate-in slide-in-from-top duration-150">
            {/* Tamanho do Campo (o mapa aumenta de acordo com os jogadores) */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 font-bold uppercase text-[10px]">Tamanho:</span>
              {(['1v1', '2v2', '3v3', '4v4'] as MapSize[]).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => {
                    sounds.playKick();
                    onUpdateSettings({ mapSize: sz });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    mapSize === sz
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>

            {/* Tempo da Partida */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 font-bold uppercase text-[10px]">Tempo:</span>
              {[3, 5, 7, 10].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    sounds.playKick();
                    onUpdateSettings({ timeLimit: t });
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    timeLimit === t
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  {t}m
                </button>
              ))}
            </div>

            {/* Limite de Gols */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 font-bold uppercase text-[10px]">Gols:</span>
              {[3, 5, 7, 10].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    sounds.playKick();
                    onUpdateSettings({ goalLimit: g });
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    goalLimit === g
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Barra de Ferramentas do Árbitro / Host */}
        <div className="px-4 sm:px-6 py-2 bg-[#0d1217] border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {/* Alternador de visualização para celular */}
            <div className="flex sm:hidden p-0.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <button
                type="button"
                onClick={() => setLobbyTab('teams')}
                className={`px-3 py-1 rounded text-[11px] font-bold transition-colors ${
                  lobbyTab === 'teams' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
                }`}
              >
                Times
              </button>
              <button
                type="button"
                onClick={() => setLobbyTab('chat')}
                className={`px-3 py-1 rounded text-[11px] font-bold transition-colors ${
                  lobbyTab === 'chat' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
                }`}
              >
                Chat ({chatMessages.length})
              </button>
            </div>

            {/* Status Pronto do Jogador */}
            {onToggleReady && (
              <button
                type="button"
                onClick={() => {
                  sounds.playKick();
                  onToggleReady();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border active:scale-95 ${
                  myPlayer?.isReady
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-white'
                }`}
              >
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    myPlayer?.isReady ? 'text-emerald-400' : 'text-zinc-500'
                  }`}
                />
                <span>{myPlayer?.isReady ? 'Estou Pronto!' : 'Marcar Pronto'}</span>
              </button>
            )}
          </div>

          {/* Ferramentas Exclusivas do Árbitro / Dono da Sala */}
          {(isHost || isReferee) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {onShuffleTeams && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playKick();
                    onShuffleTeams();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-zinc-700 active:scale-95"
                  title="Distribuir jogadores aleatoriamente entre Vermelho e Azul"
                >
                  <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xs:inline">Sortear Times</span>
                </button>
              )}

              {onSwapTeams && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playKick();
                    onSwapTeams();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-zinc-700 active:scale-95"
                  title="Inverter os lados (Vermelho ⇄ Azul)"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden xs:inline">Inverter Lados</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* CORPO DO LOBBY: SELEÇÃO DE TIMES */}
        <div className="p-3 sm:p-5 overflow-y-auto max-h-[60vh]">
          {lobbyTab === 'chat' ? (
            <div className="flex flex-col h-[340px] rounded-2xl bg-[#0f141a] border border-zinc-800 p-3">
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-zinc-500">
                    Nenhuma mensagem ainda. Diga oi para os jogadores!
                  </div>
                ) : (
                  chatMessages.map((m) => (
                    <div key={m.id} className="text-xs break-words">
                      <span className="text-[10px] text-zinc-500 font-mono mr-1.5">{m.time}</span>
                      <span
                        className={`font-bold mr-1.5 ${
                          m.team === 'red'
                            ? 'text-amber-400'
                            : m.team === 'blue'
                            ? 'text-blue-400'
                            : 'text-zinc-400'
                        }`}
                      >
                        {m.sender}:
                      </span>
                      <span className="text-zinc-200">{m.text}</span>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleChatSubmit} className="mt-2 flex items-center gap-2 pt-2 border-t border-zinc-800">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Mensagem na sala..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none"
                />
                <button type="submit" className="p-2 rounded-xl bg-amber-500 text-zinc-950 font-bold">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1. TIME VERMELHO */}
              <div className="rounded-2xl border border-red-500/40 bg-[#160f0f] p-3.5 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-red-500/20">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
                      <span className="text-xs font-black text-red-400 uppercase tracking-wider">
                        Time Vermelho ({redPlayers.length}/{teamSize})
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">Inicia com a bola</span>
                  </div>

                  <div className="space-y-2 mb-3">
                    {redPlayers.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl bg-[#221313] border border-red-500/30 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-red-400" />
                          <span className="text-xs font-bold text-white truncate">{p.name}</span>
                          {p.isHost && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-zinc-950 font-black">
                              DONO
                            </span>
                          )}
                          {p.isReferee && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40">
                              ⚖️ ÁRBITRO
                            </span>
                          )}
                        </div>

                        {/* Ações do Dono: Nomear Árbitro ou Mover */}
                        {isHost && (
                          <div className="flex items-center gap-1">
                            {onToggleReferee && !p.isHost && (
                              <button
                                type="button"
                                onClick={() => onToggleReferee(p.id, !p.isReferee)}
                                className={`p-1 rounded text-[10px] font-bold ${
                                  p.isReferee
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                                title={p.isReferee ? 'Remover Árbitro' : 'Nomear como Árbitro'}
                              >
                                ⚖️
                              </button>
                            )}
                            {onMovePlayer && (
                              <button
                                type="button"
                                onClick={() => onMovePlayer(p.id, 'blue')}
                                className="p-1 rounded bg-zinc-800 text-blue-300 text-[10px] hover:bg-zinc-700"
                                title="Mover para Time Azul"
                              >
                                → Azul
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {redPlayers.length === 0 && (
                      <div className="text-center py-6 text-xs text-zinc-500 border border-dashed border-red-900/40 rounded-xl">
                        Vazio (Sem bots)
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSwitchTeam('red')}
                  disabled={myPlayer?.team === 'red'}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    myPlayer?.team === 'red'
                      ? 'bg-red-500/20 border-red-500/50 text-red-300 cursor-default'
                      : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-white active:scale-95'
                  }`}
                >
                  {myPlayer?.team === 'red' ? 'Seu Time' : 'Entrar no Vermelho'}
                </button>
              </div>

              {/* 2. TIME AZUL */}
              <div className="rounded-2xl border border-blue-500/40 bg-[#0c131d] p-3.5 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-blue-500/20">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" />
                      <span className="text-xs font-black text-blue-400 uppercase tracking-wider">
                        Time Azul ({bluePlayers.length}/{teamSize})
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    {bluePlayers.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl bg-[#121c2c] border border-blue-500/30 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
                          <span className="text-xs font-bold text-white truncate">{p.name}</span>
                          {p.isHost && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-zinc-950 font-black">
                              DONO
                            </span>
                          )}
                          {p.isReferee && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40">
                              ⚖️ ÁRBITRO
                            </span>
                          )}
                        </div>

                        {isHost && (
                          <div className="flex items-center gap-1">
                            {onToggleReferee && !p.isHost && (
                              <button
                                type="button"
                                onClick={() => onToggleReferee(p.id, !p.isReferee)}
                                className={`p-1 rounded text-[10px] font-bold ${
                                  p.isReferee
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                                title={p.isReferee ? 'Remover Árbitro' : 'Nomear como Árbitro'}
                              >
                                ⚖️
                              </button>
                            )}
                            {onMovePlayer && (
                              <button
                                type="button"
                                onClick={() => onMovePlayer(p.id, 'red')}
                                className="p-1 rounded bg-zinc-800 text-red-300 text-[10px] hover:bg-zinc-700"
                                title="Mover para Time Vermelho"
                              >
                                ← Vermelho
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {bluePlayers.length === 0 && (
                      <div className="text-center py-6 text-xs text-zinc-500 border border-dashed border-blue-900/40 rounded-xl">
                        Vazio (Sem bots)
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSwitchTeam('blue')}
                  disabled={myPlayer?.team === 'blue'}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    myPlayer?.team === 'blue'
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 cursor-default'
                      : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-white active:scale-95'
                  }`}
                >
                  {myPlayer?.team === 'blue' ? 'Seu Time' : 'Entrar no Azul'}
                </button>
              </div>

              {/* 3. ESPECTADORES / BANCO */}
              <div className="rounded-2xl border border-zinc-800 bg-[#0e1217] p-3.5 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-800">
                    <span className="text-xs font-black text-zinc-400 uppercase tracking-wider">
                      Espectadores ({specPlayers.length})
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    {specPlayers.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs text-zinc-400"
                      >
                        <span className="truncate">{p.name}</span>
                        {isHost && onMovePlayer && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onMovePlayer(p.id, 'red')}
                              className="px-1.5 py-0.5 rounded bg-zinc-800 text-red-300 text-[10px]"
                            >
                              + Red
                            </button>
                            <button
                              type="button"
                              onClick={() => onMovePlayer(p.id, 'blue')}
                              className="px-1.5 py-0.5 rounded bg-zinc-800 text-blue-300 text-[10px]"
                            >
                              + Blue
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {specPlayers.length === 0 && (
                      <div className="text-center py-6 text-xs text-zinc-600">
                        Nenhum espectador
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSwitchTeam('spec')}
                  disabled={myPlayer?.team === 'spec'}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    myPlayer?.team === 'spec'
                      ? 'bg-zinc-800 border-zinc-600 text-zinc-300'
                      : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  Assistir como Espectador
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé: Ação de Início do Dono / Árbitro */}
        <div className="px-4 sm:px-6 py-4 bg-[#10151c] border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 text-center sm:text-left">
            <span className="font-bold text-zinc-300">Regra de Início:</span> O Time Vermelho
            inicia com a bola no centro do campo!
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {isHost || isReferee ? (
              <button
                type="button"
                onClick={handleAttemptStart}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>INICIAR PARTIDA OFICIAL</span>
              </button>
            ) : (
              <div className="text-xs text-zinc-400 italic">
                Aguardando o árbitro ou anfitrião iniciar a partida...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
