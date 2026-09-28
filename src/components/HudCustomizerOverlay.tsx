import React, { useRef } from 'react';
import { HudConfig } from './HudSettingsModal';
import { Check, RotateCcw, Move, Plus, Minus, ArrowLeftRight } from 'lucide-react';
import { sounds } from '../audio/soundManager';

interface HudCustomizerOverlayProps {
  isActive: boolean;
  config: HudConfig;
  onChange: (newConfig: HudConfig) => void;
  onSave: () => void;
  onReset: () => void;
  viewportWidth: number;
  viewportHeight: number;
}

export const HudCustomizerOverlay: React.FC<HudCustomizerOverlayProps> = ({
  isActive,
  config,
  onChange,
  onSave,
  onReset,
  viewportWidth,
  viewportHeight,
}) => {
  if (!isActive) return null;

  const dragTargetRef = useRef<'joy' | 'kick' | null>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; initOffsetX: number; initOffsetY: number }>({
    startX: 0,
    startY: 0,
    initOffsetX: 0,
    initOffsetY: 0,
  });

  const isLandscape = viewportWidth > viewportHeight;
  const joySize = isLandscape && viewportHeight < 520 ? Math.min(config.joystickSize, 100) : config.joystickSize;
  const kickSize = isLandscape && viewportHeight < 520 ? Math.min(config.kickSize, 72) : config.kickSize;

  const joyMaxX = Math.max(0, viewportWidth - joySize - 16);
  const joyMaxY = Math.max(0, viewportHeight - joySize - 16);
  const kickMaxX = Math.max(0, viewportWidth - kickSize - 16);
  const kickMaxY = Math.max(0, viewportHeight - kickSize - 16);

  const joyOffsetX = Math.max(8, Math.min(config.joystickOffsetX || 24, joyMaxX));
  const joyOffsetY = Math.max(8, Math.min(config.joystickOffsetY || 24, joyMaxY));
  const kickOffsetX = Math.max(8, Math.min(config.kickOffsetX || 24, kickMaxX));
  const kickOffsetY = Math.max(8, Math.min(config.kickOffsetY || 24, kickMaxY));

  const handlePointerDown = (target: 'joy' | 'kick', e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragTargetRef.current = target;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initOffsetX: target === 'joy' ? joyOffsetX : kickOffsetX,
      initOffsetY: target === 'joy' ? joyOffsetY : kickOffsetY,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragTargetRef.current) return;
    e.preventDefault();

    const target = dragTargetRef.current;
    const { startX, startY, initOffsetX, initOffsetY } = dragStartRef.current;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    if (target === 'joy') {
      const isLeft = config.layout !== 'inverted';
      const newX = isLeft ? initOffsetX + deltaX : initOffsetX - deltaX;
      const newY = initOffsetY - deltaY;
      const clampedX = Math.max(0, Math.min(joyMaxX, Math.round(newX)));
      const clampedY = Math.max(0, Math.min(joyMaxY, Math.round(newY)));

      onChange({
        ...config,
        joystickOffsetX: clampedX,
        joystickOffsetY: clampedY,
      });
    } else {
      const isRight = config.layout !== 'inverted';
      const newX = isRight ? initOffsetX - deltaX : initOffsetX + deltaX;
      const newY = initOffsetY - deltaY;
      const clampedX = Math.max(0, Math.min(kickMaxX, Math.round(newX)));
      const clampedY = Math.max(0, Math.min(kickMaxY, Math.round(newY)));

      onChange({
        ...config,
        kickOffsetX: clampedX,
        kickOffsetY: clampedY,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    dragTargetRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const adjustJoySize = (delta: number) => {
    sounds.playKick();
    const nextSize = Math.max(60, Math.min(240, config.joystickSize + delta));
    onChange({ ...config, joystickSize: nextSize });
  };

  const adjustKickSize = (delta: number) => {
    sounds.playKick();
    const nextSize = Math.max(50, Math.min(200, config.kickSize + delta));
    onChange({ ...config, kickSize: nextSize });
  };

  const toggleSides = () => {
    sounds.playKick();
    onChange({
      ...config,
      layout: config.layout === 'default' ? 'inverted' : 'default',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-auto select-none bg-black/60 backdrop-blur-sm flex flex-col justify-between overflow-hidden"
      style={{
        width: '100vw',
        height: '100dvh',
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Guia Superior com Ações de Conclusão */}
      <div className="pt-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <Move className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-black text-amber-300 uppercase tracking-wider">
              Modo de Customização Total do HUD
            </div>
            <div className="text-[11px] text-zinc-300">
              Arraste o Analógico ou o Chute para onde quiser na tela • Use [+] e [-] para redimensionar
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSides}
            className="px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-zinc-200 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow"
            title="Inverter lados (Canhoto / Destro)"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inverter Lados</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow"
            title="Redefinir Posição Padrão"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Padrão</span>
          </button>

          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Salvar HUD</span>
          </button>
        </div>
      </div>

      {/* ELEMENTO 1: ANALÓGICO ARRASTÁVEL */}
      <div
        className="absolute z-50 touch-none cursor-grab active:cursor-grabbing select-none transition-transform"
        style={{
          bottom: `max(${joyOffsetY}px, env(safe-area-inset-bottom, 12px))`,
          [config.layout === 'inverted' ? 'right' : 'left']: `max(${joyOffsetX}px, env(safe-area-inset-left, 12px))`,
        }}
        onPointerDown={(e) => handlePointerDown('joy', e)}
      >
        {/* Barra de escala rápida acima do analógico */}
        <div className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-900/95 border border-amber-400/50 shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              adjustJoySize(-8);
            }}
            className="p-1 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer active:scale-90"
            title="Diminuir Analógico"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-[10px] font-mono font-bold text-amber-400 px-1">
            {joySize}px
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              adjustJoySize(8);
            }}
            className="p-1 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer active:scale-90"
            title="Aumentar Analógico"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Disco do Analógico Estilizado */}
        <div
          className="rounded-full border-2 border-dashed border-amber-400 bg-amber-400/15 flex items-center justify-center shadow-2xl relative"
          style={{ width: joySize, height: joySize }}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-white shadow-lg flex items-center justify-center">
            <Move className="w-5 h-5 text-zinc-950" />
          </div>
          <span className="absolute bottom-2 text-[9px] font-bold text-amber-300 bg-black/60 px-1.5 py-0.5 rounded">
            ANALÓGICO
          </span>
        </div>
      </div>

      {/* ELEMENTO 2: BOTÃO DE CHUTE ARRASTÁVEL */}
      <div
        className="absolute z-50 touch-none cursor-grab active:cursor-grabbing select-none transition-transform"
        style={{
          bottom: `max(${kickOffsetY}px, env(safe-area-inset-bottom, 12px))`,
          [config.layout === 'inverted' ? 'left' : 'right']: `max(${kickOffsetX}px, env(safe-area-inset-right, 12px))`,
        }}
        onPointerDown={(e) => handlePointerDown('kick', e)}
      >
        {/* Barra de escala rápida acima do botão de chute */}
        <div className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-900/95 border border-rose-400/50 shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              adjustKickSize(-6);
            }}
            className="p-1 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer active:scale-90"
            title="Diminuir Chute"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="text-[10px] font-mono font-bold text-rose-400 px-1">
            {kickSize}px
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              adjustKickSize(6);
            }}
            className="p-1 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer active:scale-90"
            title="Aumentar Chute"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Disco do Chute Estilizado */}
        <div
          className="rounded-full border-2 border-dashed border-rose-500 bg-rose-500/15 flex items-center justify-center shadow-2xl relative"
          style={{ width: kickSize, height: kickSize }}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-rose-400 border-2 border-white shadow-lg flex items-center justify-center text-white font-black text-xs">
            CHUTE
          </div>
          <span className="absolute bottom-1.5 text-[9px] font-bold text-rose-300 bg-black/60 px-1.5 py-0.5 rounded">
            X
          </span>
        </div>
      </div>

      {/* Dica Inferior */}
      <div className="pb-4 text-center text-xs text-zinc-400 font-medium">
        Toque e arraste os botões para qualquer lugar do campo. Suas alterações ficam salvas automaticamente!
      </div>
    </div>
  );
};
