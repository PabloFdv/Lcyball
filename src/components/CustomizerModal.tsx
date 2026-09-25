import React, { useState } from 'react';
import { PlayerProfile } from '../game/types';
import { SKINS_CATALOG, Skin, getSkinById } from '../game/skins';
import { X, Check, Sparkles, Shirt, Award, Globe, Shield } from 'lucide-react';
import { sounds } from '../audio/soundManager';

interface CustomizerModalProps {
  profile: PlayerProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: PlayerProfile) => void;
}

export const CustomizerModal: React.FC<CustomizerModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(profile.name || 'Jogador');
  const [number, setNumber] = useState(profile.number || '10');
  const [selectedSkinId, setSelectedSkinId] = useState(profile.skinId || 'brazil');
  const [activeCategory, setActiveCategory] = useState<'brasileirao' | 'selecoes' | 'europa' | 'classicas'>('brasileirao');

  if (!isOpen) return null;

  const currentSkin: Skin = getSkinById(selectedSkinId);

  const filteredSkins = SKINS_CATALOG.filter((s) => s.category === activeCategory);

  const handleSelectSkin = (skin: Skin) => {
    setSelectedSkinId(skin.id);
    sounds.playKick();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playGoal();
    onSave({
      ...profile,
      name: name.trim() || 'Jogador',
      number: number.trim().slice(0, 2) || '10',
      skinId: currentSkin.id,
      color: currentSkin.primaryColor,
      accentColor: currentSkin.accentColor,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0c1015] border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg shadow-sm">
              👕
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Vestiário & Skins Oficiais
              </h2>
              <p className="text-[11px] text-zinc-400">
                Personalize seu uniforme de clubes e seleções para entrar em campo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pré-visualização do Personagem (Grande disco esportivo com padrão) */}
        <div className="py-4 px-3 my-3 rounded-2xl bg-gradient-to-b from-[#131a24] to-[#0a0d12] border border-zinc-800/80 flex flex-col sm:flex-row items-center justify-center gap-6">
          <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-black/40 border border-white/10 shadow-2xl">
            {/* Disco estético */}
            <div
              className="relative w-20 h-20 rounded-full border-4 flex items-center justify-center shadow-2xl overflow-hidden transition-all duration-300"
              style={{
                backgroundColor: currentSkin.primaryColor,
                borderColor: currentSkin.accentColor,
                boxShadow: `0 0 25px ${currentSkin.accentColor}44`,
              }}
            >
              {/* Padrões Visuais */}
              {currentSkin.pattern === 'stripes' && (
                <div className="absolute inset-0 flex justify-between pointer-events-none opacity-90">
                  <div
                    className="w-3 h-full"
                    style={{ backgroundColor: currentSkin.secondaryColor }}
                  />
                  <div
                    className="w-3 h-full"
                    style={{ backgroundColor: currentSkin.secondaryColor }}
                  />
                </div>
              )}
              {currentSkin.pattern === 'half' && (
                <div
                  className="absolute right-0 top-0 w-1/2 h-full opacity-90"
                  style={{ backgroundColor: currentSkin.secondaryColor }}
                />
              )}
              {currentSkin.pattern === 'sash' && (
                <div
                  className="absolute w-28 h-5 -rotate-45 opacity-90 border-y border-white/30"
                  style={{ backgroundColor: currentSkin.secondaryColor }}
                />
              )}
              {currentSkin.pattern === 'checkered' && (
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-80">
                  <div style={{ backgroundColor: currentSkin.secondaryColor }} />
                  <div style={{ backgroundColor: currentSkin.primaryColor }} />
                  <div style={{ backgroundColor: currentSkin.primaryColor }} />
                  <div style={{ backgroundColor: currentSkin.secondaryColor }} />
                </div>
              )}
              {currentSkin.pattern === 'ring' && (
                <div
                  className="absolute w-10 h-10 rounded-full border-2"
                  style={{
                    backgroundColor: currentSkin.secondaryColor,
                    borderColor: currentSkin.accentColor,
                  }}
                />
              )}

              {/* Reflexo 3D */}
              <div className="absolute top-1 left-2 w-8 h-4 rounded-full bg-white/30 blur-[1px] pointer-events-none" />

              {/* Número da Camisa */}
              <span className="relative z-10 font-black text-2xl font-mono text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                {number || '10'}
              </span>
            </div>
          </div>

          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-lg">{currentSkin.badgeEmoji || '⚽'}</span>
              <span className="text-sm font-extrabold text-white">{currentSkin.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-300 font-bold border border-zinc-700">
                {currentSkin.shortCode}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs">{currentSkin.description}</p>
            <div className="mt-2 text-[11px] text-zinc-500 font-medium">
              Jogador: <strong className="text-zinc-200">{name || 'Jogador'}</strong> • Camisa:{' '}
              <strong className="text-zinc-200">#{number || '10'}</strong>
            </div>
          </div>
        </div>

        {/* Inputs de Nome e Número */}
        <form onSubmit={handleSave} className="space-y-4 flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Nome do Craque
              </label>
              <input
                type="text"
                maxLength={14}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu Nickname"
                className="w-full bg-[#11161f] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Número da Camisa (0 - 99)
              </label>
              <input
                type="text"
                maxLength={2}
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="10"
                className="w-full bg-[#11161f] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 outline-none font-mono font-bold"
              />
            </div>
          </div>

          {/* Abas de Categorias de Skins */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Escolha sua Skin / Time
              </label>
              <span className="text-[10px] text-zinc-500">
                {filteredSkins.length} opções disponíveis
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800/80 mb-3">
              <button
                type="button"
                onClick={() => setActiveCategory('brasileirao')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer truncate ${
                  activeCategory === 'brasileirao'
                    ? 'bg-zinc-800 text-amber-400 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🇧🇷 Brasileirão
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('selecoes')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer truncate ${
                  activeCategory === 'selecoes'
                    ? 'bg-zinc-800 text-amber-400 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🌎 Seleções
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('europa')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer truncate ${
                  activeCategory === 'europa'
                    ? 'bg-zinc-800 text-amber-400 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🏆 Europa
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('classicas')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer truncate ${
                  activeCategory === 'classicas'
                    ? 'bg-zinc-800 text-amber-400 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                ⚡ Clássicas
              </button>
            </div>

            {/* Grid de Skins */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {filteredSkins.map((skin) => {
                const isSelected = selectedSkinId === skin.id;
                return (
                  <button
                    key={skin.id}
                    type="button"
                    onClick={() => handleSelectSkin(skin)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 relative group ${
                      isSelected
                        ? 'bg-zinc-800 border-amber-400 text-white shadow-md ring-1 ring-amber-400/40'
                        : 'bg-[#10151c] border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/50'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full shrink-0 border-2 flex items-center justify-center font-bold text-[9px] shadow-sm relative overflow-hidden"
                      style={{
                        backgroundColor: skin.primaryColor,
                        borderColor: skin.accentColor,
                      }}
                    >
                      {skin.pattern === 'stripes' && (
                        <div
                          className="absolute inset-y-0 w-2"
                          style={{ backgroundColor: skin.secondaryColor }}
                        />
                      )}
                      {skin.pattern === 'half' && (
                        <div
                          className="absolute right-0 inset-y-0 w-1/2"
                          style={{ backgroundColor: skin.secondaryColor }}
                        />
                      )}
                      <span className="relative z-10 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {skin.shortCode.slice(0, 3)}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate flex items-center gap-1">
                        <span>{skin.name}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono truncate">
                        {skin.pattern}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer border border-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-black tracking-wide bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Uniforme</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
