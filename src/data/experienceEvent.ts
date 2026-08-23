/**
 * Fonte única de verdade do Semog Experience 26. Data, horário, local, vagas e
 * o NOME da edição NÃO podem ser digitados dentro de componente: quando virar
 * a edição, muda aqui e em nenhum outro lugar.
 */
export type ScheduleItem = { time: string; label: string }
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
  seats: 200,
  priceLabel: 'Gratuito',

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

  schedule: [
    { time: '07:00', label: 'Recepção e alongamento inicial' },
    { time: '07:30', label: 'Aula de pilates' },
    { time: '08:15', label: 'Treino funcional' },
    { time: '09:00', label: 'Alongamento e relaxamento' },
    { time: '09:30', label: 'Hidratação: água de coco' },
    { time: '10:00', label: 'Avaliação física e orientações' },
    { time: '11:30', label: 'Encerramento' },
  ] satisfies ScheduleItem[],

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
