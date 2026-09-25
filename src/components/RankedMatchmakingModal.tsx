import React, { useEffect, useState } from 'react';
import { PlayerProfile } from '../game/types';
import { getSkinById } from '../game/skins';
import { X, Search, Trophy, Shield, Users, Wifi, AlertTriangle } from 'lucide-react';
import { sounds } from '../audio/soundManager';

interface RankedMatchmakingModalProps {
  isOpen: boolean;
  onCancel: () => void;
  profile: PlayerProfile;
  playersSearching: number;
  timeSearchingSec: number;
  isConnecting?: boolean;
}

export const RankedMatchmakingModal: React.FC<RankedMatchmakingModalProps> = ({
  isOpen,
  onCancel,
  profile,
  playersSearching,
  timeSearchingSec,
  isConnecting = false,
}) => {
  if (!isOpen) return null;

  const skin = getSkinById(profile.skinId || 'brazil');

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0a0e14] border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col items-center text-center overflow-hidden">
        {/* Radar animado no fundo */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
          <div className="w-80 h-80 rounded-full border border-amber-500 animate-ping [animation-duration:3s]" />
          <div className="w-60 h-60 rounded-full border border-amber-400 animate-pulse [animation-duration:2s]" />
        </div>

        {/* Topo: Ícone e Título */}
        <div className="relative z-10 w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-3xl mb-4 shadow-lg shadow-amber-500/10">
          🏆
        </div>

        <h2 className="relative z-10 text-xl font-black text-white tracking-tight">
          Ranqueada 1v1 (Players Reais)
        </h2>
        <p className="relative z-10 text-xs text-amber-300 font-semibold mt-1">
          Servidor Próprio Oficial • 100% Sem Bots ou IA
        </p>

        {/* Cartão do Jogador Procurando */}
        <div className="relative z-10 w-full mt-6 p-4 rounded-2xl bg-[#111722] border border-zinc-800 flex items-center gap-4 text-left">
          <div
            className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-sm text-white shrink-0 shadow-md relative overflow-hidden"
            style={{
              backgroundColor: skin.primaryColor,
              borderColor: skin.accentColor,
            }}
          >
            {skin.pattern === 'stripes' && (
              <div
                className="absolute inset-y-0 w-2.5"
                style={{ backgroundColor: skin.secondaryColor }}
              />
            )}
            <span className="relative z-10 font-mono">#{profile.number || '10'}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-white truncate flex items-center gap-1.5">
              <span>{profile.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {skin.shortCode}
              </span>
            </div>
            <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
              <span>{profile.rankTier || 'Ouro'}</span>
              <span>•</span>
              <span className="font-mono text-amber-400 font-bold">{profile.rankPoints || 0} ELO</span>
            </div>
          </div>
        </div>

        {/* Radar e Contador de Busca */}
        <div className="relative z-10 my-6 flex flex-col items-center">
          <div className="relative w-16 h-16 flex items-center justify-center mb-3">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400 animate-spin [animation-duration:6s]" />
            <Search className="w-7 h-7 text-amber-400 animate-pulse" />
          </div>

          <div className="text-2xl font-black font-mono text-white tracking-widest">
            {formatTimer(timeSearchingSec)}
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            {isConnecting
              ? 'Conectando ao servidor próprio...'
              : `Buscando oponente real online (${playersSearching} na fila)...`}
          </div>
        </div>

        {/* Regras da Partida Ranqueada */}
        <div className="relative z-10 w-full p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-[11px] text-zinc-400 text-left space-y-1 mb-6">
          <div className="text-zinc-300 font-bold flex items-center gap-1.5">
            <span>⚖️ Regras Competitivas Oficiais:</span>
          </div>
          <div>• Partida direta 1v1 até 3 gols ou 3 minutos</div>
          <div>• Time Vermelho inicia com a bola; depois posse é de quem tomar o gol</div>
          <div>• Vitória: +32 ELO | Derrota: -16 ELO</div>
        </div>

        {/* Botão Cancelar Busca */}
        <button
          type="button"
          onClick={() => {
            sounds.playKick();
            onCancel();
          }}
          className="relative z-10 w-full py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-extrabold text-xs tracking-wider uppercase transition-all cursor-pointer active:scale-95 shadow-lg"
        >
          Cancelar Busca
        </button>
      </div>
    </div>
  );
};
