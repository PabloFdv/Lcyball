import React, { useState, useEffect, useRef } from 'react';
import { sounds } from '../audio/soundManager';
import { Play, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  onLoaded: () => void;
}

const TIPS = [
  '⭐ O Time Vermelho sempre começa com a posse de bola no pontapé inicial!',
  '⚡ A posse pós-gol pertence ao time que acabou de sofrer o gol!',
  '📱 No celular, a câmera dá zoom automático no campo e acompanha o lance!',
  '👕 Você pode vestir skins oficiais do Brasileirão, Seleções e Clubes Mundiais!',
  '⚖️ O Dono da sala pode nomear Árbitros antes e durante a partida!',
  '🚀 Chutes em movimento combinam a velocidade do jogador para disparos fulminantes!',
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoaded }) => {
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState('Iniciando motor de jogo...');
  const [tipIndex, setTipIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const hasFinishedRef = useRef(false);
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  const finishLoading = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setProgress(100);
    setStepText('Tudo pronto para entrar em campo!');
    setIsFadingOut(true);
    try {
      sounds.playWhistle();
    } catch {}
    setTimeout(() => {
      onLoadedRef.current();
      window.dispatchEvent(new Event('resize'));
    }, 280);
  };

  useEffect(() => {
    if (hasFinishedRef.current) return;

    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 2200);

    const steps = [
      { p: 25, text: 'Inicializando física canônica 2D...' },
      { p: 50, text: 'Carregando gramado e balizas oficiais...' },
      { p: 75, text: 'Sincronizando vestiário de skins e seleções...' },
      { p: 95, text: 'Calibrando buffer de latência e matchmaking...' },
      { p: 100, text: 'Tudo pronto para entrar em campo!' },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (hasFinishedRef.current) {
        clearInterval(interval);
        return;
      }
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].p);
        setStepText(steps[currentStep].text);
        currentStep++;
      } else {
        clearInterval(interval);
        finishLoading();
      }
    }, 180);

    return () => {
      clearInterval(interval);
      clearInterval(tipInterval);
    };
    // Note: empty dependency array so re-renders in parent never reset the loading flow!
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 bg-[#070b0e] text-white select-none overflow-hidden transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Luz ambiente de estádio no fundo */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.14),transparent_65%)]" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Topo: Logo & Temporada */}
      <div className="relative z-10 text-center pt-6 animate-in fade-in slide-in-from-top duration-500">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold mb-3 shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          Temporada Oficial 2026 • Servidor Ativo
        </div>
      </div>

      {/* Centro: Logo ChinaBall Pro com Bola Rolando */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto">
        <div className="relative w-28 h-28 flex items-center justify-center mb-6">
          {/* Anéis de energia */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/40 animate-spin [animation-duration:10s]" />
          <div className="absolute inset-2 rounded-full border border-emerald-400/30 animate-spin [animation-duration:6s] [animation-direction:reverse]" />

          {/* Bola estilizada 3D */}
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-zinc-200 via-white to-zinc-400 shadow-[0_0_35px_rgba(251,191,36,0.35)] flex items-center justify-center text-4xl border-2 border-white/80 animate-bounce [animation-duration:1.4s]">
            ⚽
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-2 font-sans">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 drop-shadow-[0_2px_10px_rgba(239,68,68,0.4)]">
            CHINA
          </span>
          <span className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)]">
            BALL
          </span>
          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-zinc-950 font-black text-xs uppercase tracking-widest shadow-md">
            PRO
          </span>
        </h1>

        <p className="text-xs text-zinc-400 mt-2 font-medium tracking-wide">
          Futebol 2D Multiplayer em Tempo Real • Servidor Próprio HaxBall
        </p>

        {/* Barra de Progresso Fluida */}
        <div className="w-64 sm:w-80 mt-8 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 font-bold">
            <span className="text-zinc-300">{stepText}</span>
            <span className="text-amber-400">{progress}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-zinc-900 border border-zinc-800 p-0.5 overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-200 ease-out shadow-[0_0_12px_rgba(251,191,36,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Botão de Pular Carregamento / Entrar Direto */}
        <button
          type="button"
          onClick={finishLoading}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-[11px] font-bold text-zinc-300 hover:text-white transition-all cursor-pointer shadow active:scale-95"
        >
          <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span>Entrar no Jogo</span>
        </button>
      </div>

      {/* Rodapé: Dica Dinâmica */}
      <div className="relative z-10 w-full max-w-md text-center pb-6">
        <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-sm text-xs text-zinc-300 transition-all duration-300">
          <span className="text-amber-400 font-bold mr-1.5">DICA:</span>
          <span>{TIPS[tipIndex]}</span>
        </div>
      </div>
    </div>
  );
};
