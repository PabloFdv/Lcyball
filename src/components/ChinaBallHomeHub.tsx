import React from 'react';
import { PlayerProfile } from '../game/types';
import { getSkinById } from '../game/skins';
import { rankingManager } from '../game/rankingManager';
import {
  Trophy,
  Users,
  Shield,
  Play,
  RotateCcw,
  Sparkles,
  Settings,
  Shirt,
  Volume2,
  VolumeX,
  Maximize2,
  Award,
  TrendingUp,
  Percent,
  Clock,
  Wifi,
  ChevronRight,
  Flame,
  Globe,
  Sliders,
  Scale,
} from 'lucide-react';
import { sounds } from '../audio/soundManager';

interface ChinaBallHomeHubProps {
  isOpen: boolean;
  profile: PlayerProfile;
  onOpenCustomizer: () => void;
  onStartRankedOnline: () => void;
  onStartRankedBots: () => void;
  onOpenRooms: () => void;
  onStartSolo: () => void;
  onOpenSettings: () => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  isMuted: boolean;
  onlineRoomsCount: number;
}

export const ChinaBallHomeHub: React.FC<ChinaBallHomeHubProps> = ({
  isOpen,
  profile,
  onOpenCustomizer,
  onStartRankedOnline,
  onStartRankedBots,
  onOpenRooms,
  onStartSolo,
  onOpenSettings,
  onToggleMute,
  onToggleFullscreen,
  isMuted,
  onlineRoomsCount,
}) => {
  if (!isOpen) return null;

  const skin = getSkinById(profile.skinId || 'brazil');
  const stats = rankingManager.getStats();
  const rankTier = rankingManager.getRankTier();
  const winRate = rankingManager.getWinRate();
  const avgGoals = rankingManager.getAverageGoalsPerMatch();

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-between p-3 sm:p-6 bg-[#080c10]/95 backdrop-blur-xl text-white select-none overflow-y-auto">
      {/* Luzes de estádio no fundo */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.08),transparent_50%)]" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.08),transparent_50%)]" />

      {/* CABEÇALHO DO MENU PRINCIPAL */}
      <header className="relative z-10 flex items-center justify-between pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] border border-amber-300/40">
            ⚽
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight font-sans">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-400">
                  CHINA
                </span>
                <span className="text-white">BALL</span>
                <span className="ml-1.5 px-2 py-0.2 rounded-md bg-amber-500 text-zinc-950 font-black text-[10px] tracking-wider uppercase shadow-sm">
                  PRO
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Servidor Próprio Online
              </span>
              <span>•</span>
              <span>Multiplayer 2D HaxBall Refinado</span>
            </div>
          </div>
        </div>

        {/* BOTÃO DE CONFIGURAÇÕES NO CANTO SUPERIOR DIREITO */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              sounds.playKick();
              onToggleMute();
            }}
            className="p-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-md active:scale-95"
            title={isMuted ? 'Ativar Sons' : 'Silenciar Sons'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-zinc-300" />}
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playKick();
              onToggleFullscreen();
            }}
            className="hidden sm:flex p-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-md active:scale-95"
            title="Modo Tela Cheia"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* BOTÃO DE CONFIGURAÇÕES COM DESTAQUE NO CANTO SUPERIOR DIREITO */}
          <button
            type="button"
            onClick={() => {
              sounds.playKick();
              onOpenSettings();
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-800 hover:from-zinc-800 hover:to-zinc-700 border border-amber-500/40 hover:border-amber-400 text-white text-xs font-black shadow-lg shadow-amber-500/10 transition-all cursor-pointer active:scale-95"
            title="Abrir Configurações (Áudio, Controles Mobile, Sensibilidade, Câmera)"
          >
            <Settings className="w-4 h-4 text-amber-400 animate-spin [animation-duration:12s]" />
            <span className="hidden xs:inline">Configurações</span>
          </button>
        </div>
      </header>

      {/* CORPO DO MENU PRINCIPAL: PERSONAGEM + MODOS DE JOGO */}
      <main className="relative z-10 max-w-6xl w-full mx-auto my-auto py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* COLUNA ESQUERDA: PERSONAGEM 3D & ESTATÍSTICAS */}
        <section className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#111722] to-[#0a0e14] border border-zinc-800/80 p-6 shadow-2xl relative overflow-hidden text-center flex flex-col items-center">
            {/* Halo de luz atrás do avatar */}
            <div
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20"
              style={{ backgroundColor: skin.accentColor }}
            />

            {/* AVATAR DO PERSONAGEM (Disco 2D com padrão da skin) */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-black/40 border border-white/10 shadow-2xl flex items-center justify-center relative">
                {/* Anel de luz pulsante */}
                <div
                  className="absolute inset-0 rounded-full border-2 border-dashed opacity-50 animate-spin [animation-duration:14s]"
                  style={{ borderColor: skin.accentColor }}
                />

                <div
                  className="relative w-24 h-24 rounded-full border-4 flex items-center justify-center shadow-2xl overflow-hidden transition-all duration-300 transform group-hover:scale-105"
                  style={{
                    backgroundColor: skin.primaryColor,
                    borderColor: skin.accentColor,
                    boxShadow: `0 0 35px ${skin.accentColor}55`,
                  }}
                >
                  {/* Padrões Visuais da Skin */}
                  {skin.pattern === 'stripes' && (
                    <div className="absolute inset-0 flex justify-between pointer-events-none opacity-90">
                      <div className="w-3.5 h-full" style={{ backgroundColor: skin.secondaryColor }} />
                      <div className="w-3.5 h-full" style={{ backgroundColor: skin.secondaryColor }} />
                    </div>
                  )}
                  {skin.pattern === 'half' && (
                    <div
                      className="absolute right-0 top-0 w-1/2 h-full opacity-90"
                      style={{ backgroundColor: skin.secondaryColor }}
                    />
                  )}
                  {skin.pattern === 'sash' && (
                    <div
                      className="absolute w-36 h-6 -rotate-45 opacity-90 border-y border-white/30"
                      style={{ backgroundColor: skin.secondaryColor }}
                    />
                  )}
                  {skin.pattern === 'checkered' && (
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-80">
                      <div style={{ backgroundColor: skin.secondaryColor }} />
                      <div style={{ backgroundColor: skin.primaryColor }} />
                      <div style={{ backgroundColor: skin.primaryColor }} />
                      <div style={{ backgroundColor: skin.secondaryColor }} />
                    </div>
                  )}
                  {skin.pattern === 'ring' && (
                    <div
                      className="absolute w-12 h-12 rounded-full border-2"
                      style={{
                        backgroundColor: skin.secondaryColor,
                        borderColor: skin.accentColor,
                      }}
                    />
                  )}

                  {/* Reflexo 3D de Luz */}
                  <div className="absolute top-1 left-2 w-10 h-5 rounded-full bg-white/30 blur-[1px] pointer-events-none" />

                  {/* Número do Craque */}
                  <span className="relative z-10 font-black text-3xl font-mono text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                    {profile.number || '10'}
                  </span>
                </div>
              </div>
            </div>

            {/* Nome do Jogador & Skin */}
            <div className="mt-1">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">{skin.badgeEmoji || '⚽'}</span>
                <h3 className="text-lg font-black text-white tracking-tight">{profile.name}</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700">
                  #{profile.number || '10'}
                </span>
              </div>
              <p className="text-xs text-amber-400 font-semibold mt-0.5">{skin.name}</p>
            </div>

            {/* Botão de Mudar Skin */}
            <button
              type="button"
              onClick={() => {
                sounds.playKick();
                onOpenCustomizer();
              }}
              className="mt-4 w-full py-2.5 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-amber-400/60 text-zinc-200 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-2 group"
            >
              <Shirt className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Mudar Skin & Uniforme</span>
            </button>

            {/* Resumo de Ranking & Elo */}
            <div className="w-full mt-5 pt-4 border-t border-zinc-800/80 grid grid-cols-3 gap-2">
              <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                <div className="text-[10px] text-zinc-400 font-medium">Rank Elo</div>
                <div className="text-sm font-black text-amber-400 font-mono mt-0.5">
                  {stats.eloRating}
                </div>
                <div className="text-[9px] text-zinc-500 truncate">{rankTier.badge} {rankTier.title}</div>
              </div>

              <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                <div className="text-[10px] text-zinc-400 font-medium">Vitórias</div>
                <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">
                  {stats.wins}
                </div>
                <div className="text-[9px] text-zinc-500 font-mono">{winRate}% Taxa</div>
              </div>

              <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60">
                <div className="text-[10px] text-zinc-400 font-medium">Gols Feitos</div>
                <div className="text-sm font-black text-cyan-400 font-mono mt-0.5">
                  {stats.goalsScored}
                </div>
                <div className="text-[9px] text-zinc-500 font-mono">{avgGoals}/jogo</div>
              </div>
            </div>
          </div>
        </section>

        {/* COLUNA DIREITA: BOTÕES DE MODOS DE JOGO */}
        <section className="lg:col-span-7 flex flex-col gap-3.5">
          <div className="mb-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Escolha seu Modo de Jogo
            </h2>
            <p className="text-sm text-zinc-300 font-medium">
              Entre em partidas ranqueadas online, crie salas de amigos ou dispute duelos oficiais.
            </p>
          </div>

          {/* 1. BOTÃO: JOGAR RANK COM PLAYERS VERDADEIROS */}
          <button
            type="button"
            onClick={() => {
              sounds.playKick();
              onStartRankedOnline();
            }}
            className="w-full text-left p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-transparent border-2 border-amber-500/70 hover:border-amber-400 transition-all cursor-pointer shadow-xl shadow-amber-500/10 active:scale-[0.99] group relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-amber-500/15 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-zinc-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform shrink-0">
                  🏆
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                      JOGAR RANK (PLAYERS VERDADEIROS)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-[10px] font-mono font-bold">
                      100% REAL • SEM BOTS
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1 max-w-md leading-relaxed">
                    Partida 1v1 oficial contra outro jogador real no servidor próprio. Valendo ELO com regras oficiais de pontapé inicial e pós-gol!
                  </p>
                </div>
              </div>

              <ChevronRight className="w-6 h-6 text-amber-400 group-hover:translate-x-1 transition-transform shrink-0 hidden sm:block" />
            </div>
          </button>

          {/* 2. BOTÃO: JOGAR RANK COM BOTS */}
          <button
            type="button"
            onClick={() => {
              sounds.playKick();
              onStartRankedBots();
            }}
            className="w-full text-left p-4 rounded-2xl bg-gradient-to-r from-blue-500/15 to-transparent border border-blue-500/50 hover:border-blue-400 transition-all cursor-pointer shadow-lg active:scale-[0.99] group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/50 text-blue-400 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform shrink-0">
                  🤖
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-black text-white group-hover:text-blue-300 transition-colors">
                      JOGAR RANK (COM BOTS)
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-mono font-bold">
                      VALENDO ELO
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Duelo competitivo individual contra IA calibrada com subida de divisão e estatísticas.
                  </p>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform shrink-0 hidden sm:block" />
            </div>
          </button>

          {/* 3. BOTÃO: SALAS PERSONALIZADAS (LOBBY ONLINE) */}
          <button
            type="button"
            onClick={() => {
              sounds.playKick();
              onOpenRooms();
            }}
            className="w-full text-left p-4 rounded-2xl bg-gradient-to-r from-[#141b25] to-[#0f141c] border border-zinc-800 hover:border-cyan-500/60 transition-all cursor-pointer shadow-md active:scale-[0.99] group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-400 flex items-center justify-center font-bold text-xl group-hover:scale-105 transition-transform shrink-0">
                  🌐
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-black text-white group-hover:text-cyan-300 transition-colors">
                      SALAS PERSONALIZADAS (LOBBY)
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-mono">
                      {onlineRoomsCount > 0 ? `${onlineRoomsCount} Salas Abertas` : 'Somente Players Criam'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Crie sua sala com senha, controle de árbitro e mapa dinâmico de 1v1 até 4v4 (Sem bots).
                  </p>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform shrink-0 hidden sm:block" />
            </div>
          </button>

          {/* 4. BOTÃO: TREINO SOLO LIVRE */}
          <button
            type="button"
            onClick={() => {
              sounds.playKick();
              onStartSolo();
            }}
            className="w-full text-left p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer active:scale-[0.99] group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4 text-zinc-300" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-200 group-hover:text-white">
                  Treino Solo no Campo Aberto
                </span>
                <p className="text-[11px] text-zinc-500">
                  Pratique chutes, tabelas na parede e puxe a bola aos seus pés com a tecla R.
                </p>
              </div>
            </div>

            <span className="text-xs text-zinc-400 font-semibold group-hover:text-white">
              Entrar →
            </span>
          </button>
        </section>
      </main>

      {/* RODAPÉ DO MENU COM DICA E CONTROLES */}
      <footer className="relative z-10 pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[10px]">
            PC: WASD / Setas + Espaço / X
          </span>
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[10px]">
            Mobile: Joystick e Chute com Zoom Dinâmico
          </span>
        </div>

        <div className="text-[11px] text-zinc-500">
          ChinaBall Pro Oficial • 100% Responsivo no Celular e PC
        </div>
      </footer>
    </div>
  );
};
