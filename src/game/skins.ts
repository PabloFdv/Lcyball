export interface Skin {
  id: string;
  name: string;
  category: 'selecoes' | 'brasileirao' | 'europa' | 'classicas';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  pattern: 'solid' | 'stripes' | 'half' | 'sash' | 'checkered' | 'ring';
  shortCode: string;
  badgeEmoji?: string;
  description: string;
}

export const SKINS_CATALOG: Skin[] = [
  // --- SELEÇÕES ---
  {
    id: 'brazil',
    name: 'Brasil Canarinho',
    category: 'selecoes',
    primaryColor: '#facc15', // Amarelo
    secondaryColor: '#16a34a', // Verde
    accentColor: '#2563eb', // Azul
    pattern: 'ring',
    shortCode: 'BRA',
    badgeEmoji: '🇧🇷',
    description: 'Pentacampeã Mundial, o manto amarelo do futebol arte.',
  },
  {
    id: 'argentina',
    name: 'Argentina',
    category: 'selecoes',
    primaryColor: '#7dd3fc', // Azul celeste
    secondaryColor: '#ffffff', // Branco
    accentColor: '#f59e0b', // Sol dourado
    pattern: 'stripes',
    shortCode: 'ARG',
    badgeEmoji: '🇦🇷',
    description: 'Tricampeã Mundial, faixas alvicelestes tradicionais.',
  },
  {
    id: 'france',
    name: 'França',
    category: 'selecoes',
    primaryColor: '#1e3a8a', // Azul marinho
    secondaryColor: '#ef4444', // Vermelho
    accentColor: '#ffffff', // Branco
    pattern: 'half',
    shortCode: 'FRA',
    badgeEmoji: '🇫🇷',
    description: 'Bicampeã Mundial, Les Bleus com estilo moderno.',
  },
  {
    id: 'germany',
    name: 'Alemanha',
    category: 'selecoes',
    primaryColor: '#f8fafc', // Branco
    secondaryColor: '#0f172a', // Preto
    accentColor: '#dc2626', // Vermelho
    pattern: 'ring',
    shortCode: 'ALE',
    badgeEmoji: '🇩🇪',
    description: 'Tetracampeã Mundial, disciplina e força em campo.',
  },
  {
    id: 'portugal',
    name: 'Portugal',
    category: 'selecoes',
    primaryColor: '#dc2626', // Vermelho
    secondaryColor: '#15803d', // Verde
    accentColor: '#facc15', // Dourado
    pattern: 'half',
    shortCode: 'POR',
    badgeEmoji: '🇵🇹',
    description: 'A Seleção das Quinas com a fúria ibérica.',
  },
  {
    id: 'spain',
    name: 'Espanha',
    category: 'selecoes',
    primaryColor: '#b91c1c', // Fúria Vermelha
    secondaryColor: '#eab308', // Amarelo real
    accentColor: '#1e3a8a', // Azul royal
    pattern: 'ring',
    shortCode: 'ESP',
    badgeEmoji: '🇪🇸',
    description: 'La Furia Roja com toque refinado de posse de bola.',
  },
  {
    id: 'italy',
    name: 'Itália Azzurra',
    category: 'selecoes',
    primaryColor: '#2563eb', // Azul azzurro
    secondaryColor: '#ffffff', // Branco
    accentColor: '#16a34a', // Verde da bandeira
    pattern: 'solid',
    shortCode: 'ITA',
    badgeEmoji: '🇮🇹',
    description: 'Tetracampeã, solidez defensiva e raça inigualável.',
  },
  {
    id: 'uruguay',
    name: 'Uruguai Celeste',
    category: 'selecoes',
    primaryColor: '#38bdf8', // Celeste olímpica
    secondaryColor: '#000000', // Preto
    accentColor: '#ffffff', // Branco
    pattern: 'solid',
    shortCode: 'URU',
    badgeEmoji: '🇺🇾',
    description: 'Bicampeã Mundial da garra charrúa e tradição.',
  },
  {
    id: 'japan',
    name: 'Japão Samurai Blue',
    category: 'selecoes',
    primaryColor: '#1d4ed8', // Azul Samurai
    secondaryColor: '#ffffff', // Branco
    accentColor: '#ef4444', // Vermelho solar
    pattern: 'ring',
    shortCode: 'JPN',
    badgeEmoji: '🇯🇵',
    description: 'Samurai Blue, velocidade absurda e precisão tática.',
  },
  {
    id: 'croatia',
    name: 'Croácia',
    category: 'selecoes',
    primaryColor: '#ef4444', // Vermelho
    secondaryColor: '#ffffff', // Branco
    accentColor: '#1d4ed8', // Azul
    pattern: 'checkered',
    shortCode: 'CRO',
    badgeEmoji: '🇭🇷',
    description: 'Famoso quadriculado vermelho e branco xadrez.',
  },

  // --- BRASILEIRÃO (TIMES NACIONAIS) ---
  {
    id: 'flamengo',
    name: 'Flamengo',
    category: 'brasileirao',
    primaryColor: '#b91c1c', // Vermelho rubro-negro
    secondaryColor: '#09090b', // Preto
    accentColor: '#ffffff', // Detalhe branco
    pattern: 'stripes',
    shortCode: 'FLA',
    badgeEmoji: '🔴⚫',
    description: 'Manto Rubro-Negro com listras horizontais e raça.',
  },
  {
    id: 'palmeiras',
    name: 'Palmeiras',
    category: 'brasileirao',
    primaryColor: '#15803d', // Verde periquito
    secondaryColor: '#ffffff', // Branco
    accentColor: '#ca8a04', // Estrela dourada
    pattern: 'ring',
    shortCode: 'PAL',
    badgeEmoji: '🟢⚪',
    description: 'Alviverde imponente, tradição e precisão tática.',
  },
  {
    id: 'corinthians',
    name: 'Corinthians',
    category: 'brasileirao',
    primaryColor: '#09090b', // Preto
    secondaryColor: '#ffffff', // Branco
    accentColor: '#dc2626', // Vermelho
    pattern: 'stripes',
    shortCode: 'SCCP',
    badgeEmoji: '⚪⚫',
    description: 'Timão Alvinegro, espírito de luta e garra fiel.',
  },
  {
    id: 'saopaulo',
    name: 'São Paulo FC',
    category: 'brasileirao',
    primaryColor: '#ffffff', // Branco
    secondaryColor: '#dc2626', // Vermelho
    accentColor: '#09090b', // Preto
    pattern: 'half',
    shortCode: 'SPFC',
    badgeEmoji: '🔴⚪⚫',
    description: 'Tricolor Paulista, soberano tricampeão do mundo.',
  },
  {
    id: 'santos',
    name: 'Santos FC',
    category: 'brasileirao',
    primaryColor: '#ffffff', // Branco puro
    secondaryColor: '#0f172a', // Preto
    accentColor: '#eab308', // Estrelas douradas
    pattern: 'solid',
    shortCode: 'SAN',
    badgeEmoji: '⚪⚫',
    description: 'O manto sagrado de Pelé e dos Meninos da Vila.',
  },
  {
    id: 'gremio',
    name: 'Grêmio',
    category: 'brasileirao',
    primaryColor: '#0284c7', // Azul Celeste
    secondaryColor: '#000000', // Preto
    accentColor: '#ffffff', // Branco
    pattern: 'stripes',
    shortCode: 'GRE',
    badgeEmoji: '🔵⚫⚪',
    description: 'Tricolor Gaúcho imortal, raça e história continental.',
  },
  {
    id: 'internacional',
    name: 'Internacional',
    category: 'brasileirao',
    primaryColor: '#dc2626', // Vermelho Colorado
    secondaryColor: '#ffffff', // Branco
    accentColor: '#facc15', // Detalhes dourados
    pattern: 'ring',
    shortCode: 'INT',
    badgeEmoji: '🔴⚪',
    description: 'Colorado do Beira-Rio, campeão de tudo.',
  },
  {
    id: 'vasco',
    name: 'Vasco da Gama',
    category: 'brasileirao',
    primaryColor: '#09090b', // Preto
    secondaryColor: '#ffffff', // Branco
    accentColor: '#dc2626', // Cruz de Malta vermelha
    pattern: 'sash',
    shortCode: 'VAS',
    badgeEmoji: '⚫⚪',
    description: 'Camisa negra com a tradicional faixa transversal branca.',
  },
  {
    id: 'atleticomg',
    name: 'Atlético-MG',
    category: 'brasileirao',
    primaryColor: '#09090b', // Preto
    secondaryColor: '#ffffff', // Branco
    accentColor: '#ca8a04', // Dourado
    pattern: 'stripes',
    shortCode: 'CAM',
    badgeEmoji: '🐔⚫⚪',
    description: 'Galo Forte e Vingador com listras alvinegras.',
  },
  {
    id: 'cruzeiro',
    name: 'Cruzeiro',
    category: 'brasileirao',
    primaryColor: '#1d4ed8', // Azul royal
    secondaryColor: '#ffffff', // 5 Estrelas brancas
    accentColor: '#60a5fa', // Azul claro
    pattern: 'solid',
    shortCode: 'CRU',
    badgeEmoji: '🦊🔵⚪',
    description: 'A Raposa celeste com as 5 estrelas soltas.',
  },
  {
    id: 'botafogo',
    name: 'Botafogo',
    category: 'brasileirao',
    primaryColor: '#09090b', // Preto
    secondaryColor: '#ffffff', // Branco
    accentColor: '#e2e8f0', // Estrela Solitária
    pattern: 'stripes',
    shortCode: 'BOT',
    badgeEmoji: '⭐⚫⚪',
    description: 'Glorioso com a tradicional Estrela Solitária.',
  },
  {
    id: 'fluminense',
    name: 'Fluminense',
    category: 'brasileirao',
    primaryColor: '#991b1b', // Grená
    secondaryColor: '#166534', // Verde esperança
    accentColor: '#ffffff', // Branco
    pattern: 'stripes',
    shortCode: 'FLU',
    badgeEmoji: '🇭🇺',
    description: 'Tricolor das Laranjeiras com faixas clássicas tricolores.',
  },

  // --- EUROPA ---
  {
    id: 'realmadrid',
    name: 'Real Madrid',
    category: 'europa',
    primaryColor: '#ffffff', // Branco
    secondaryColor: '#eab308', // Ouro real
    accentColor: '#4f46e5', // Roxo histórico
    pattern: 'ring',
    shortCode: 'RMA',
    badgeEmoji: '👑⚪',
    description: 'Rei da Europa, manto blanco com acabamento em ouro.',
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    category: 'europa',
    primaryColor: '#1d4ed8', // Azul
    secondaryColor: '#991b1b', // Grená
    accentColor: '#facc15', // Amarelo Catalunha
    pattern: 'stripes',
    shortCode: 'BAR',
    badgeEmoji: '🔵🔴',
    description: 'Blaugrana clássico, tiki-taka e velocidade.',
  },
  {
    id: 'mancity',
    name: 'Manchester City',
    category: 'europa',
    primaryColor: '#38bdf8', // Sky Blue
    secondaryColor: '#ffffff', // Branco
    accentColor: '#1e293b', // Azul escuro
    pattern: 'solid',
    shortCode: 'MCI',
    badgeEmoji: '🩵',
    description: 'Azul celeste de Manchester, domínio de jogo dinâmico.',
  },
  {
    id: 'liverpool',
    name: 'Liverpool',
    category: 'europa',
    primaryColor: '#dc2626', // Vermelho puro
    secondaryColor: '#ffffff', // Branco
    accentColor: '#ca8a04', // Dourado
    pattern: 'solid',
    shortCode: 'LIV',
    badgeEmoji: '🔴',
    description: 'The Reds, You Never Walk Alone com pressão total.',
  },

  // --- CLÁSSICAS CHINA BALL ---
  {
    id: 'classic_china_red',
    name: 'China Fúria Vermelha',
    category: 'classicas',
    primaryColor: '#ef4444',
    secondaryColor: '#f59e0b',
    accentColor: '#ffffff',
    pattern: 'ring',
    shortCode: 'CHN',
    badgeEmoji: '🐉',
    description: 'O visual original lendário de ChinaBall.',
  },
  {
    id: 'classic_golden_dragon',
    name: 'Dragão Imperial Dourado',
    category: 'classicas',
    primaryColor: '#eab308',
    secondaryColor: '#b45309',
    accentColor: '#fef08a',
    pattern: 'ring',
    shortCode: 'DRG',
    badgeEmoji: '⚡',
    description: 'Ouro maciço com anéis de luz e prestígio máximo.',
  },
  {
    id: 'classic_neon_cyber',
    name: 'Cyberpunk Neon',
    category: 'classicas',
    primaryColor: '#a855f7',
    secondaryColor: '#06b6d4',
    accentColor: '#f43f5e',
    pattern: 'half',
    shortCode: 'CYB',
    badgeEmoji: '🔮',
    description: 'Estilo fluorescente futurista com brilho dinâmico.',
  },
  {
    id: 'classic_dark_obsidian',
    name: 'Obsidiana Negra',
    category: 'classicas',
    primaryColor: '#09090b',
    secondaryColor: '#38bdf8',
    accentColor: '#ffffff',
    pattern: 'ring',
    shortCode: 'OBS',
    badgeEmoji: '🖤',
    description: 'Preto profundo com anéis de luz ciano.',
  },
];

export function getSkinById(id: string): Skin {
  return SKINS_CATALOG.find((s) => s.id === id) || SKINS_CATALOG[0];
}
