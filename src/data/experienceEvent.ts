/**
 * Fonte única de verdade do Semog Experience 26. Data, horário, local, vagas e
 * o NOME da edição NÃO podem ser digitados dentro de componente: quando virar
 * a edição, muda aqui e em nenhum outro lugar.
 */
export type Professional = {
  name: string
  /**
   * URL do perfil. OPCIONAL de propósito: Igor e Assis ainda não mandaram o
   * deles (24/08/2026) e a página tem que subir sem inventar link — quem não
   * tem aparece com o nome em texto, sem âncora quebrada.
   */
  instagram?: string
}

export type ScheduleItem = {
  time: string
  /** Fim do bloco. Opcional porque marco sem duração (recepção, encerramento) já existiu na grade e pode voltar. */
  endTime?: string
  label: string
  /** Quem conduz a atividade. Ausente num marco que não seja aula. */
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
  timeLabel: '07h30 às 10h',
  startTime: '07:30',
  endTime: '10:00',
  /**
   * Local CONFIRMADO em 14/09/2026 — saiu a ressalva "aguardando retorno da
   * prefeitura" que acompanhava o local em hero, programação e rodapé, junto
   * com o par `venueConfirmed`/`venueNote` que a ligava.
   */
  venue: 'Centro de Atendimento ao Turista Adaptado',
  /**
   * Logradouro, confirmado em 15/09/2026. A avenida e o bairro se chamam
   * igual — "Avenida Cabo Branco, Cabo Branco" parece redundância e não é:
   * é assim que o endereço se escreve, e sem a avenida quem não conhece a
   * orla fica só com o nome de um prédio público.
   */
  street: 'Avenida Cabo Branco',
  /** Bairro. Anda junto da cidade em toda peça: "Cabo Branco — João Pessoa, PB". */
  district: 'Cabo Branco',
  /**
   * O que de fato orienta quem vai chegar: o Centro de Atendimento ao Turista
   * fica na orla e o nome sozinho não coloca ninguém no lugar certo. Não é
   * enfeite — é parte do endereço, e por isso aparece no painel da programação
   * e na confirmação por e-mail, não só uma vez na página.
   */
  venueReference: "em frente à Sapore D'Italia",
  city: 'João Pessoa',
  uf: 'PB',
  seats: 200,
  priceLabel: 'Gratuito',

  /**
   * Kit entregue a cada um dos 200 inscritos. Entra na proposta de patrocínio
   * como contrapartida física — é onde a marca do patrocinador fica com o
   * participante depois do evento.
   *
   * A retirada é ANTECIPADA e só na filial: não há entrega no dia do evento
   * (decisão do cliente, 14/09/2026). O endereço da filial NÃO é digitado
   * aqui — sai de `site.company.addresses`, a mesma fonte do rodapé, casando
   * pela cidade do evento. Ver `ExperienceKit`.
   */
  kit: {
    label: 'Kit praia',
    items: ['Canga', 'Camiseta', 'Boné', 'Protetor solar', 'Ecobag'],
    pickup: {
      /** ISO, para `<time dateTime>`. 23/09/2026 é quarta, três dias antes. */
      fromDate: '2026-09-23',
      fromDateLabel: '23 de setembro',
      fromWeekday: 'quarta',
    },
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
   * A manhã são TRÊS aulas e nada mais (decisão do cliente, 14/09/2026):
   * saíram o credenciamento das 07h, o alongamento e a confraternização, e
   * Yoga passou à frente do funcional. Blocos de 45 min com 5 min de virada,
   * o que fecha 09h55 e cabe no `endTime` das 10h.
   */
  schedule: [
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
      time: '08:20',
      endTime: '09:05',
      label: 'Yoga',
      professional: { name: 'Assis' },
      text: 'Respiração, equilíbrio e presença, de frente para o mar.',
      image: 'experience-yoga.webp',
    },
    {
      time: '09:10',
      endTime: '09:55',
      label: 'Treino funcional',
      professional: { name: 'Igor Barros' },
      text: 'Movimentos do dia a dia virando treino, com intensidade que você escolhe.',
      image: 'experience-funcional.webp',
    },
  ] satisfies ScheduleItem[],

  /**
   * O café da manhã entrou em 14/09/2026 e absorveu o antigo "Frutas e comida":
   * são a mesma mesa, e anunciar as duas coisas separadas faria parecer que há
   * dois serviços.
   *
   * **A água de coco nunca vem com quantidade** — decisão do cliente em
   * 14/09/2026, não é cálculo sobre o número de vagas. Ela é item da oferta,
   * como a água: número anunciado aqui vira promessa cobrável no dia.
   */
  ongoing: [
    {
      icon: 'drop',
      title: 'Água e água de coco',
      text: 'Disponíveis o tempo todo, do começo ao fim da manhã.',
    },
    {
      icon: 'fruit',
      title: 'Café da manhã e frutas',
      text: 'Mesa servida durante toda a manhã, para repor antes e depois das aulas.',
    },
    {
      icon: 'pulse',
      title: 'Avaliação física e de saúde',
      text: 'Das 07h30 às 10h, sem hora marcada — é só chegar quando quiser.',
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
