/**
 * Fonte única de verdade do Semog Experience 26. Data, horário, local, vagas e
 * o NOME da edição NÃO podem ser digitados dentro de componente: quando virar
 * a edição, muda aqui e em nenhum outro lugar.
 */
export type Professional = {
  name: string
  /**
   * URL do perfil. OPCIONAL de propósito: Igor, Maria e Assis ainda não
   * mandaram o deles (24/08/2026) e a página tem que subir sem inventar link
   * — quem não tem aparece com o nome em texto, sem âncora quebrada.
   */
  instagram?: string
}

export type ScheduleItem = {
  time: string
  /** Fim do bloco. Ausente nos marcos que não são aula (recepção, encerramento). */
  endTime?: string
  label: string
  /** Quem conduz a atividade. Ausente nos marcos sem professor. */
  professional?: Professional
  /** Uma linha sobre a atividade, exibida no painel lateral da programação. */
  text?: string
  /**
   * Filename resolvido por `img()` de `content/media.ts`. Hoje é a foto da
   * MODALIDADE; quando as fotos dos professores chegarem, é aqui que trocam —
   * decisão do cliente em 24/08/2026 (foto do profissional quando houver,
   * modalidade enquanto não houver). Ausente = cai na foto do local.
   */
  image?: string
}

/**
 * O que atravessa o evento inteiro e por isso NÃO entra na linha do tempo.
 * Água de coco já foi um item das 09h30 na primeira versão da grade; virou
 * faixa contínua porque passou a ser oferta permanente, e deixá-la com hora
 * marcada faria o inscrito achar que só tem bebida naquele momento.
 */
export type Ongoing = { icon: 'drop' | 'fruit' | 'pulse'; title: string; text: string }
export type Pillar = { icon: 'lotus' | 'people' | 'heart'; title: string; text: string }

export const EXPERIENCE_EVENT = {
  /**
   * O evento é anual e a edição entra no nome com o ano abreviado — decisão do
   * cliente em 22/08/2026. Use `name` em vez de escrever "Semog Experience" na
   * mão: na virada do ano só estas duas linhas mudam.
   */
  edition: '26',
  name: 'Semog Experience 26',
  /** ISO, para `<time dateTime>` e JSON-LD. 26/09/2026 é sábado. */
  date: '2026-09-26',
  dateLabel: '26 de setembro de 2026',
  dateShort: '26.SET.2026',
  weekday: 'sábado',
  timeLabel: '07h às 12h',
  startTime: '07:00',
  endTime: '12:00',
  venue: 'Praia do Cabo Branco',
  city: 'João Pessoa',
  uf: 'PB',
  /**
   * O local ainda depende de autorização da prefeitura (24/08/2026). Enquanto
   * `venueConfirmed` for `false`, toda peça que mostra o local mostra também a
   * ressalva — hero, programação, rodapé e os PDFs de patrocínio. Quando a
   * prefeitura responder, vira `true` e a ressalva some de todo lugar de uma
   * vez. NÃO mexe no `eventStatus` do JSON-LD: o evento não está adiado nem
   * cancelado, é o endereço que está pendente.
   */
  venueConfirmed: false,
  venueNote: 'local a confirmar — aguardando retorno da prefeitura',
  seats: 200,
  priceLabel: 'Gratuito',

  /**
   * Kit entregue no credenciamento a cada um dos 200 inscritos. Entra na
   * proposta de patrocínio como contrapartida física — é onde a marca do
   * patrocinador fica com o participante depois do evento.
   */
  kit: {
    label: 'Kit praia',
    items: ['Canga', 'Camiseta', 'Boné', 'Protetor solar', 'Ecobag'],
  },

  pillars: [
    {
      icon: 'lotus',
      title: 'Bem-estar',
      text: 'Atividades físicas ao ar livre para corpo e mente.',
    },
    {
      icon: 'people',
      title: 'Conexão',
      text: 'Encontre pessoas, troque ideias e fortaleça relações.',
    },
    {
      icon: 'heart',
      title: 'Saúde',
      text: 'Cuidados que fazem diferença na sua qualidade de vida.',
    },
  ] satisfies Pillar[],

  /**
   * Grade em blocos de 45 min de aula + 15 min de virada (decisão do cliente,
   * 24/08/2026), o que fecha exatamente no `endTime` das 12h sem sobra.
   */
  schedule: [
    {
      time: '07:00',
      label: 'Recepção e credenciamento',
      text: 'Chegada, retirada do kit praia e boas-vindas do time Semog.',
    },
    {
      time: '07:30',
      endTime: '08:15',
      label: 'Pilates',
      professional: {
        name: 'Paloma Menezes',
        instagram: 'https://www.instagram.com/pilatespalomamenezes/',
      },
      text: 'Controle, respiração e força profunda — no seu ritmo, sobre a areia.',
      image: 'experience-pilates.webp',
    },
    {
      time: '08:30',
      endTime: '09:15',
      label: 'Treino funcional',
      professional: { name: 'Igor Barros' },
      text: 'Movimentos do dia a dia virando treino, com intensidade que você escolhe.',
      image: 'experience-funcional.webp',
    },
    {
      time: '09:30',
      endTime: '10:15',
      label: 'Yoga',
      professional: { name: 'Assis' },
      text: 'Respiração, equilíbrio e presença, de frente para o mar.',
      image: 'experience-yoga.webp',
    },
    {
      time: '10:30',
      endTime: '11:15',
      label: 'Alongamento e relaxamento',
      professional: { name: 'Maria' },
      text: 'O fechamento da manhã: soltar o corpo e desacelerar a cabeça.',
      image: 'experience-alongamento.webp',
    },
    {
      time: '11:30',
      endTime: '12:00',
      label: 'Confraternização e encerramento',
      text: 'Um tempo para conversar sem pressa antes de todo mundo seguir o sábado.',
    },
  ] satisfies ScheduleItem[],

  ongoing: [
    {
      icon: 'drop',
      title: 'Água e água de coco',
      text: 'Disponíveis o tempo todo, do credenciamento ao encerramento.',
    },
    {
      icon: 'fruit',
      title: 'Frutas e comida',
      text: 'Servidas durante toda a manhã, para repor antes e depois das aulas.',
    },
    {
      icon: 'pulse',
      title: 'Avaliação física e de saúde',
      text: 'Das 08h às 12h, sem hora marcada — é só chegar quando quiser.',
    },
  ] satisfies Ongoing[],

  /**
   * Edição anterior, usada como prova social. O formato mudou (2025 foi
   * campeonato de beach tennis, 2026 é manhã wellness) e a página diz isso
   * com todas as letras — ver `ExperienceVideo`.
   *
   * O plano previa `fileUrl: null` com fallback de capa clicável para o Reel;
   * o arquivo JÁ subiu para o bucket (ver "Assets já prontos" no plano e o
   * player nativo do protótipo aprovado), então aqui ficam os **filenames**,
   * resolvidos por `img()` de `content/media.ts` — que é quem sabe a base do
   * bucket e guarda o alt. Guardar a URL crua aqui duplicaria as duas coisas.
   */
  video: {
    previousYear: 2025,
    /** Mesma convenção do `name`: a edição passada é "Semog Experience 25". */
    previousEdition: '25',
    previousFormat: 'campeonato de beach tennis',
    /** Post original, mantido só como crédito/origem — o site não embute o Instagram. */
    reelUrl: 'https://www.instagram.com/reel/DRm_ivskVfC/',
    file: 'experience-2025.mp4',
    poster: 'experience-2025-poster.webp',
    /** O material é um Reel vertical: em moldura 16:9 sobram tarjas pretas. */
    aspectRatio: '9 / 16',
  },
} as const
