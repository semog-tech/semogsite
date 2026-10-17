/**
 * Textos e números do site v2: o único lugar dos fatos (substitui o conteudo.json do protótipo,
 * de onde foi gerado em 15/10/2026). Marca inexistente é erro de tipo. Fato novo entra aqui,
 * nunca escrito à mão numa seção ou cena. "A CONFIRMAR" marca o que ainda depende do Leandro.
 */
import { type OuPendente, pendente } from './pendencias'

export type NumerosDaPrestacao = { prestacoes: number; condominios: number; corte: string }
export type FotoDosSocios = { src: string; alt: string; largura: number; altura: number }
export type VideoDoExperience = {
  src: string
  poster: string
  legenda: string
  largura: number
  altura: number
}

/** Números da NOVA prestação de contas digital (lançada em maio de 2026) e a data de corte. */
const NUMEROS_DA_PRESTACAO: OuPendente<NumerosDaPrestacao> = pendente(
  'números da nova prestação de contas digital e a data de corte (o Leandro informa)',
)
/**
 * A 1ª foto do post do Instagram que o Leandro indicou em 16/10/2026 (DeR7uo5EbRX), com todos os
 * sócios. Pendente até o arquivo chegar (Tarefa 4.7, Step 4a).
 */
const FOTO_DOS_SOCIOS: OuPendente<FotoDosSocios> = pendente('foto dos sócios (arquivo do Leandro)')
/** O reel do Semog Experience 26 (DP12; post Dd4jHaQCso5, arquivo do Leandro de 16/10/2026). */
const VIDEO_DO_EXPERIENCE_26: OuPendente<VideoDoExperience> = {
  src: '/site-v2/videos/semog-experience-26.mp4',
  poster: '/site-v2/videos/semog-experience-26-poster.webp',
  legenda: 'Vídeo com momentos do Semog Experience 2026, na orla de João Pessoa.',
  largura: 720,
  altura: 1280,
}

export const conteudo = {
  marca: {
    slogan: 'Preocupe-se apenas em morar.',
    subtitulo: 'Há 35 anos, a líder do Nordeste cuida do condomínio para você cuidar da vida.',
    loginUrl: 'https://semog.superlogica.net/clients/areadocondomino',
    blogUrl: 'https://www.semog.com.br/blog',
  },
  numeros: {
    anos: {
      valor: 35,
      rotulo: 'anos de mercado',
      detalhe: 'desde 1991',
    },
    condominios: {
      valor: 650,
      prefixo: '+',
      rotulo: 'condomínios sob gestão',
    },
    clientes: {
      valor: 70,
      prefixo: '+',
      sufixo: ' mil',
      rotulo: 'clientes atendidos',
    },
    especialistas: {
      valor: 100,
      prefixo: '+',
      rotulo: 'especialistas',
    },
  },
  unidades: [
    {
      id: 'recife',
      cidade: 'Recife',
      uf: 'PE',
      url: '/administradora-de-condominios-recife',
      foto: '/site-v2/fotos/recife.webp',
      alt: 'Orla de Recife vista do alto, com a linha de edifícios à beira-mar',
    },
    {
      id: 'joao-pessoa',
      cidade: 'João Pessoa',
      uf: 'PB',
      url: '/administradora-de-condominios-joao-pessoa',
      foto: '/site-v2/fotos/joao-pessoa.webp',
      alt: 'Orla de João Pessoa vista do alto',
    },
    {
      id: 'campina-grande',
      cidade: 'Campina Grande',
      uf: 'PB',
      url: '/administradora-de-condominios-campina-grande',
      foto: '/site-v2/fotos/campina-grande.webp',
      alt: 'Campina Grande vista do alto, com o açude ao centro',
    },
    {
      id: 'belem',
      cidade: 'Belém',
      uf: 'PA',
      url: '/administradora-de-condominios-belem',
      foto: '/site-v2/fotos/belem.webp',
      alt: 'Belém vista do alto, com o porto e a orla',
    },
  ],
  unidadesSecao: {
    titulo: 'Quatro Unidades Semog, perto de cada condomínio.',
  },
  condominios: {
    titulo: 'Cada condomínio é um dado que a gente acompanha.',
    texto:
      'Mais de 650 condomínios sob gestão em Recife, João Pessoa, Campina Grande e Belém, com 35 anos de mercado e mais de 100 especialistas.',
  },
  pilares: {
    titulo: 'Tudo o que o condomínio precisa, com uma equipe só.',
    itens: [
      {
        id: 'gestao',
        titulo: 'Gestão completa',
        texto:
          'Gestão completa de comunidades residenciais, comerciais e associações, do financeiro à assembleia.',
      },
      {
        id: 'garante',
        titulo: 'Semog Garante',
        texto:
          'O condomínio recebe 100% da arrecadação prevista, todos os meses. O custo é de 1% do valor total da arrecadação.',
      },
      {
        id: 'cobranca',
        titulo: 'Cobrança com equipe própria',
        texto:
          'Quem cobra conhece o condomínio. A cobrança dos inadimplentes é feita pela equipe da Semog, que conhece o condomínio, e não por uma empresa terceirizada.',
      },
    ],
  },
  tecnologia: {
    titulo: 'Prestação de contas digital, conferida antes de sair.',
    contexto: 'Prestação de contas digital desde 2023. Em maio de 2026, lançamos a nova.',
    numerosDaPrestacao: NUMEROS_DA_PRESTACAO,
    prestacao: [
      'Os números vêm do ERP e são conferidos: se um total não bate, o documento não sai.',
      'Um PDF único e organizado: sumário, parecer, extratos, receitas, inadimplência e acordos, demonstrativo com gráficos e despesas com comprovantes.',
      'Síndico e conselho assinam digitalmente e registram o parecer.',
      'Link permanente com QR para o condômino conferir a versão atual.',
      'Se um comprovante chega depois, a prestação ganha um adendo com o histórico.',
    ],
    semogOne: {
      titulo: 'Semog One',
      texto:
        'Plataforma própria sobre o ERP, feita por uma equipe de desenvolvimento da Semog, que evolui toda semana.',
      itens: [
        'Lê comprovantes automaticamente, anexa no ERP e dá baixa.',
        'IA lê a convenção do condomínio, com conferência humana.',
        'Painel de saúde de cada condomínio, com indicadores atualizados diariamente: inadimplência, boletos pagos e gerados, prestação no prazo.',
        'Custos por categoria com IA mostram onde o condomínio gasta mais que condomínios parecidos.',
      ],
    },
    pagina: {
      abertura: {
        antes: 'Semog',
        enfase: 'One.',
        lead: 'A plataforma própria da Semog, construída sobre o ERP para o que o ERP não atende. Acompanhe um mês de condomínio e veja onde ela trabalha.',
        botao: 'Pedir proposta',
        mes: 'Ver o mês',
        linha: 'Um mês de condomínio',
        numeros: {
          prestacoes: { prefixo: '+', rotulo: 'prestações de contas na nova prestação digital' },
          condominios: { rotulo: 'condomínios com a nova prestação de contas digital' },
          semana: {
            valor: 'Toda semana',
            rotulo: 'a plataforma evolui, com equipe de desenvolvimento própria',
          },
        },
      },
      mes: {
        titulo: 'Um mês de condomínio na Semog.',
        legenda: 'Mês ilustrativo: as datas mudam de condomínio para condomínio.',
        semana: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
        calendario: {
          convencao: 'Convenção',
          regras: ['vencimento', 'multa', 'juros', 'quórum'],
          boleto: 'boleto',
          vencimento: 'vencimento',
          lembrete: 'lembrete',
          acordo: 'acordo',
          assembleia: 'assembleia',
          prestacao: 'prestação',
          seguinte: 'mês seguinte',
        },
        momentos: [
          {
            quando: 'Antes do dia 1',
            titulo: 'A convenção vira regra, conferida.',
            texto:
              'Quando o condomínio chega à Semog, a IA lê a convenção e separa o que move o mês: vencimento, multa, juros e quórum. Uma pessoa confere cada regra antes de ela valer.',
            fluxo: ['Convenção', 'IA lê', 'Pessoa confere', 'Regra valendo'],
          },
          {
            quando: 'Dia 1',
            titulo: 'Perdeu o boleto? A 2ª via está a um CPF.',
            texto:
              'No site, o condômino informa o CPF, recebe um código no e-mail e vê os boletos em aberto. No WhatsApp, o bot identifica a unidade com verificação em dois fatores e prepara a 2ª via.',
            fluxo: ['CPF', 'Código no e-mail', 'Boletos em aberto'],
          },
          {
            quando: 'Todo dia',
            titulo: 'Comprovante lido, baixa dada.',
            texto:
              'Os comprovantes que chegam são lidos, anexados no ERP e baixados, sem digitação. E o painel de saúde do condomínio se atualiza todo dia: inadimplência, boletos pagos e gerados, prestação no prazo.',
            fluxo: ['Comprovante', 'Leitura', 'Anexo no ERP', 'Baixa'],
            apoio:
              'Custos por categoria, com IA: onde o condomínio gasta mais que condomínios parecidos.',
          },
          {
            quando: 'Depois do vencimento',
            titulo: 'A cobrança tem régua. E tem gente.',
            texto:
              'Quem atrasou recebe lembretes numa régua e, depois, uma proposta de acordo. A cobrança é feita pela equipe própria da Semog, sem terceirizar.',
            fluxo: ['Lembrete', 'Lembrete', 'Proposta de acordo', 'Equipe Semog'],
          },
          {
            quando: 'Dia da assembleia',
            titulo: 'Assembleia por link, tudo registrado.',
            texto:
              'O condômino vota por link e a presença fica registrada. A ata passa por revisão, e cada passo ganha carimbo de tempo numa trilha de auditoria.',
            fluxo: ['Link', 'Presença', 'Voto', 'Ata revisada', 'Carimbo de tempo'],
            apoio:
              'A previsão orçamentária chega pronta para a assembleia, montada com referências de condomínios comparáveis da carteira Semog.',
          },
          {
            quando: 'Fim do mês',
            titulo: 'A prestação de contas sai conferida.',
            texto:
              'Os números vêm do ERP e são conferidos: se um total não bate, ela não sai. O PDF chega organizado, síndico e conselho assinam com parecer, e o condômino confere a versão atual pelo link permanente ou pelo QR.',
            fluxo: ['ERP', 'Conferência', 'PDF', 'Assinaturas', 'Link e QR'],
          },
        ],
      },
      evolucao: {
        tituloA: 'O mês seguinte começa',
        tituloB: 'com a plataforma melhor.',
        texto:
          'A Semog One é da Semog: construída sobre o ERP, para o que o ERP não atende, por uma equipe de desenvolvimento própria. E ela evolui toda semana.',
        semanas: 'Toda semana, uma evolução',
        agora: 'esta semana',
        proxima: 'Em desenvolvimento: gestão de manutenção',
        esquema: 'Esquema: cada traço é uma semana.',
      },
      conferencia: {
        tituloA: 'A IA sugere.',
        tituloB: 'A gente confere.',
        lead: 'A plataforma faz o trabalho repetitivo. O que decide, uma pessoa confere.',
        plataforma: 'A plataforma',
        pessoa: 'A pessoa',
        pares: [
          {
            maquina: 'A IA lê a convenção: vencimento, multa, juros e quórum.',
            pessoa: 'Uma pessoa da Semog confere cada regra.',
          },
          {
            maquina: 'A régua lembra quem atrasou e propõe o acordo.',
            pessoa: 'A equipe própria da Semog faz a cobrança.',
          },
          {
            maquina: 'Os números vêm do ERP e só saem se os totais baterem.',
            pessoa: 'Síndico e conselho assinam a prestação, com parecer.',
          },
        ],
      },
    },
  },
  ranking: {
    posicao: 5,
    total: 3500,
    titulo: '5º entre mais de 3.500 administradoras',
    apoio:
      'No Ranking Top 200 da Superlógica, que classifica mensalmente as administradoras da sua base por receita no portfólio, adoção de módulos, número e crescimento de unidades.',
    g20: 'No G20 Condo pelo terceiro ciclo seguido.',
    ciclos: [
      {
        ciclo: '2026/27',
        posicao: 5,
      },
      {
        ciclo: '2025/26',
        posicao: 5,
      },
      {
        ciclo: '2024/25',
        posicao: 3,
      },
    ],
    foto: '/site-v2/fotos/reconhecimento-semog.webp',
    alt: 'Equipe da Semog no palco do Superlógica Next 2026 com a placa do G20 Condo',
  },
  depoimentos: {
    titulo: 'Quem é atendido pela Semog conta.',
    itens: [
      {
        nome: 'Nicia A.',
        cidade: 'João Pessoa',
        data: 'jun/2025',
        texto:
          'Gostaria de registrar formalmente a minha imensa satisfação com os serviços prestados por vocês. Como síndica profissional, sei o valor de uma administradora competente e parceira, e a Semog tem superado as minhas expectativas.',
      },
      {
        nome: 'Izabelle A.',
        cidade: 'Belém',
        data: 'ago/2026',
        texto:
          'Me ajuda em tudo. Desde o início. Comecei como síndica sem saber nada. E eles são meu braço direito',
      },
      {
        nome: 'Ana Cláudia D.',
        cidade: 'Belém',
        data: 'set/2026',
        texto:
          'Uma administradora super competente, completa em todos os níveis desde orçamentos até uma assessoria completa nas assembléias do início ao final, garantindo pra nós síndicos uma tranquilidade e harmonia nas assembléias e em toda gestão.',
      },
      {
        nome: 'Christovam Jr.',
        cidade: 'Recife',
        data: 'mar/2026',
        texto:
          'Administradora moderna e com todos os serviços em aplicativos , para consulta dos condôminos ….',
      },
    ],
  },
  comunidade: {
    titulo: 'Mais perto de quem vive o condomínio.',
    cafe: {
      titulo: 'Café com Condomínio',
      texto: 'Encontros gratuitos organizados pela Semog em Belém.',
      mote: 'Não é mais uma palestra. Aqui o síndico é protagonista de resolução de conflitos na prática.',
      edicao:
        'A 4ª edição foi em 27/09/2026, a bordo, pela Prainha e Estação das Docas. Aguarde novas informações sobre os próximos encontros.',
      proximos: { rotulo: 'Próximos encontros', texto: 'Aguarde novas informações.' },
      foto: '/site-v2/fotos/cafe-condominio-marco-2026.webp',
      alt: 'Síndicos convidados reunidos no Café com Condomínio de março de 2026, em Belém',
      legenda: 'Encontro de 21/03/2026, em Belém.',
    },
    experience: {
      titulo: 'Semog Experience',
      texto:
        'Manhã de bem-estar gratuita na orla de João Pessoa para síndicos, conselheiros, moradores e parceiros.',
      edicao:
        'A edição 26 foi em 26/09/2026, com pilates, yoga e funcional. Em 2025, foi um campeonato de beach tennis.',
      fotos: [
        {
          src: '/site-v2/fotos/experience-2025-momento-1.webp',
          alt: 'Participante jogando beach tennis no Semog Experience 2025',
        },
        {
          src: '/site-v2/fotos/experience-2025-momento-2.webp',
          alt: 'Participante segurando o troféu de campeã no Semog Experience 2025',
        },
      ],
      legenda: 'Semog Experience 2025.',
      video26: VIDEO_DO_EXPERIENCE_26,
      // TEXTO-NOVO: legenda quando o vídeo do 26 entrar (DP12)
      legendaCom26: 'Semog Experience 2026 e 2025.',
    },
    blog: {
      titulo: 'Blog Semog',
      texto: 'Conteúdo para síndicos, escrito por quem administra condomínios há 35 anos.',
      url: 'https://www.semog.com.br/blog',
    },
  },
  proposta: {
    titulo: 'Seja Semog.',
    chamada: 'Complete os campos ao lado para pedir sua proposta Semog',
    botao: 'Pedir proposta',
    demo: 'Demonstração: nada foi enviado.',
    perfis: ['Síndico', 'Conselheiro', 'Morador', 'Construtora'],
  },
  aSemog: {
    manifesto: {
      antes:
        'A Semog existe para que síndicos e moradores nunca precisem entender de contabilidade, burocracia ou manutenção.',
      enfase: 'Esse trabalho é nosso.',
      depois: 'O de vocês é viver bem.',
    },
    numeros: {
      colaboradores: {
        valor: 100,
        prefixo: '+',
        rotulo: 'colaboradores',
      },
      estados: {
        valor: 3,
        rotulo: 'estados',
        detalhe: 'PE · PB · PA',
      },
    },
    historia: {
      titulo: 'De 1991 até aqui.',
      esquema: 'Esquema da costa, sem escala.',
      contadores: {
        unidades: 'Unidades Semog',
        estados: 'Estados',
      },
      marcos: [
        {
          data: '1991',
          ano: 1991,
          titulo: 'Fundação no Recife',
          texto:
            'A Semog nasce em Pernambuco com uma convicção: condomínio bem administrado se prova com números.',
          unidade: 'recife',
        },
        {
          data: '2000',
          ano: 2000,
          titulo: 'Liderança regional',
          texto:
            'A carteira de condomínios se multiplica e a Semog se consolida como referência no estado.',
        },
        {
          data: '2004',
          ano: 2004,
          titulo: 'Expansão pela Paraíba',
          texto: 'Chegamos a João Pessoa com equipe local e o mesmo padrão de governança.',
          unidade: 'joao-pessoa',
        },
        {
          data: '2019',
          ano: 2019,
          titulo: 'Norte no mapa',
          texto: 'A unidade de Belém do Pará leva o método Semog para além do Nordeste.',
          unidade: 'belem',
        },
        {
          data: '2019',
          ano: 2019,
          titulo: 'Chatbot de atendimento',
          texto: 'Lançamos um chatbot de atendimento.',
        },
        {
          data: '2023',
          ano: 2023,
          titulo: 'Prestação de contas digital',
          texto:
            'Lançamos a prestação de contas 100% digital, com documentos, gráficos e assinatura digital.',
        },
        {
          data: '2025',
          ano: 2025,
          titulo: 'Chegada a Campina Grande',
          texto: 'Chegamos a Campina Grande, ampliando a nossa presença na Paraíba.',
          unidade: 'campina-grande',
        },
        {
          data: '2025',
          ano: 2025,
          titulo: 'Semog Garante',
          texto:
            'Com a G5 Partners, criamos o produto que garante ao condomínio 100% da arrecadação prevista, por 1% do valor total da arrecadação.',
        },
        {
          data: '2026',
          ano: 2026,
          titulo: 'Terceiro ciclo no G20',
          texto:
            'No Superlógica Next, a Semog fica em 5º lugar no Ranking Top 200 e renova a vaga no G20: as 20 administradoras de melhor desempenho entre os clientes da plataforma.',
        },
        {
          data: 'Hoje',
          ano: 2026,
          titulo: 'Líder do Nordeste',
          texto:
            'Mais de 650 condomínios, 70 mil clientes e 100 especialistas. E seguimos crescendo.',
        },
      ],
    },
    principios: [
      {
        id: 'retidao',
        titulo: 'Retidão',
        texto:
          'Fazemos o certo mesmo quando ninguém está olhando. É assim há 35 anos, e é por isso que síndicos renovam com a gente.',
      },
      {
        id: 'transparencia',
        titulo: 'Transparência',
        texto:
          'Cada centavo do condomínio é rastreável. Prestação de contas aberta, documentos públicos para os condôminos e nada embaixo do tapete.',
      },
      {
        id: 'dinamica',
        titulo: 'Dinâmica',
        texto:
          'Condomínio não pode esperar. Respostas rápidas, processos digitais e uma equipe que resolve no primeiro contato.',
      },
    ],
    pessoas: {
      tituloA: 'Tecnologia na operação.',
      tituloB: 'Gente na relação.',
      texto:
        'Investimos pesado em tecnologia para que sobre tempo para o que importa: ouvir. Na Semog, síndico e condômino falam com quem decide.',
      itens: [
        {
          titulo: 'Acesso fácil aos sócios',
          texto: 'Sem camadas, sem protocolo, sem "vou verificar e retorno". Quem atende resolve.',
        },
        {
          titulo: 'Equipes locais de verdade',
          texto: 'Cada unidade tem gente da cidade, que conhece a rua, o clima e o jeito de lá.',
        },
        {
          titulo: 'Relacionamentos de década',
          texto: 'Boa parte dos nossos condomínios está conosco há mais de dez anos, e renova.',
        },
      ],
      legenda: 'Acesso fácil aos sócios. Regra da casa desde 1991.',
      fotoDosSocios: FOTO_DOS_SOCIOS,
    },
    assembleia: {
      rotulo: 'Pauta da assembleia · escolha da administradora',
      tituloA: 'Para levar',
      tituloB: 'à assembleia.',
      lead: 'Seis perguntas para fazer a qualquer administradora, e o que a Semog responde a cada uma.',
      colunaPergunta: 'Pergunte a qualquer administradora',
      colunaResposta: 'A Semog responde',
      itens: [
        {
          pergunta: 'Há quanto tempo vocês administram condomínios?',
          dado: '35 anos',
          resposta: 'Desde 1991, no Recife.',
          apoio: 'Hoje, mais de 650 condomínios, 70 mil clientes e 100 especialistas.',
        },
        {
          pergunta: 'Como vocês se comparam a outras administradoras?',
          dado: '5º',
          resposta: 'Entre mais de 3.500 administradoras.',
          apoio:
            'No Ranking Top 200 da Superlógica, que classifica mensalmente as administradoras da sua base por receita no portfólio, adoção de módulos, número e crescimento de unidades.',
        },
        {
          pergunta: 'Esse desempenho se repete, ou foi um ano bom?',
          dado: 'G20',
          resposta: 'No G20 Condo pelo terceiro ciclo seguido.',
          apoio: 'As 20 administradoras de melhor desempenho entre os clientes da Superlógica.',
        },
        {
          pergunta: 'Quem confere a prestação de contas antes de ela chegar ao conselho?',
          dado: 'Conferida',
          resposta: 'Prestação de contas digital, conferida antes de sair.',
          apoio:
            'Os números vêm do ERP e são conferidos: se um total não bate, o documento não sai.',
        },
        {
          pergunta: 'E se os condôminos atrasarem o pagamento?',
          dado: '100%',
          resposta: 'Da arrecadação prevista, todos os meses, com o Semog Garante.',
          apoio: 'O custo é de 1% do valor total da arrecadação.',
        },
        {
          pergunta: 'Quem cobra os inadimplentes?',
          dado: 'Equipe própria',
          resposta: 'Quem cobra conhece o condomínio.',
          apoio: 'A cobrança é feita pela equipe da Semog, e não por uma empresa terceirizada.',
        },
      ],
    },
    depoimentos: {
      origem: 'Avaliação no Google',
    },
  },
  incorporadoras: {
    abertura: {
      antes: 'O condomínio nasce',
      enfase: 'bem antes das chaves.',
      lead: 'A Semog implanta o condomínio da sua incorporadora da planta à primeira assembleia, protegendo a entrega, o cliente e a sua marca.',
      botao: 'Pedir proposta',
      percurso: 'Ver o percurso',
      fotoAlt:
        'Canteiro de obras ao anoitecer, com edifícios em construção, gruas e um técnico lendo a planta',
    },
    numeros: {
      implantados: {
        valor: 25,
        prefixo: '+',
        rotulo: 'condomínios implantados em 2025',
      },
      anos: {
        valor: 35,
        rotulo: 'anos de condomínio, desde 1991',
      },
      pracas: {
        valor: 4,
        rotulo: 'praças, cada uma com equipe local',
      },
    },
    convivencia: {
      tituloA: 'Entregar a obra é metade.',
      tituloB: 'A Semog entrega a convivência.',
      texto:
        'A experiência do comprador não termina na escritura. Os primeiros doze meses do condomínio definem como a sua marca será lembrada.',
      apoio:
        'Condomínio recém-entregue com taxa mal calculada, assembleia tumultuada e áreas comuns sem manutenção vira reclamação contra a incorporadora. Com 35 anos de condomínio, a Semog cuida para que a vida no empreendimento comece tão bem quanto a obra terminou.',
      riscosTitulo: 'O que vira reclamação, e o passo que cuida disso',
      riscos: [
        {
          risco: 'Taxa mal calculada',
          resposta: 'Previsão orçamentária ainda na planta',
        },
        {
          risco: 'Assembleia tumultuada',
          resposta: 'Assembleia de instalação assessorada',
        },
        {
          risco: 'Áreas comuns sem manutenção',
          resposta: 'Entrega organizada e pós-obra com transparência',
        },
      ],
    },
    percurso: {
      titulo: 'Da planta às chaves.',
      esquema: 'Esquema do percurso, sem escala.',
      desenho: {
        garantia: 'garantia',
        manutencao: 'manutenção',
      },
      passos: [
        {
          rotulo: 'Planta',
          titulo: 'Previsão orçamentária ainda na planta',
          texto:
            'Calculamos a taxa condominial realista antes do lançamento, com referências de condomínios comparáveis da carteira Semog, e evitamos a armadilha da taxa promocional que explode no segundo ano. Sua equipe de vendas divulga um número que se sustenta.',
          apoio: 'Estudo de custos · Dimensionamento de equipe · Referências da carteira Semog',
        },
        {
          rotulo: 'Convenção',
          titulo: 'Convenção e regimento sob medida',
          texto:
            'Coordenamos, com escritório de advocacia parceiro, a convenção e o regimento interno adequados ao perfil do empreendimento, prontos para registro e alinhados ao memorial de incorporação.',
          apoio: 'Suporte jurídico com escritório parceiro · Registro em cartório',
        },
        {
          rotulo: 'Instalação',
          titulo: 'Assembleia de instalação assessorada',
          texto:
            'Organizamos e assessoramos a assembleia que dá vida jurídica ao condomínio: eleição do síndico, aprovação da previsão e posse da administração. Com a ata, o condomínio tira o CNPJ.',
          apoio: 'Convocação dos compradores · Assessoria na assembleia · CNPJ do condomínio',
        },
        {
          rotulo: 'Entrega',
          titulo: 'Entrega das unidades organizada',
          texto:
            'Estruturamos o calendário de vistorias e de entrega de chaves junto com a sua equipe, com contratação de pessoal, implantação de portaria e áreas comuns operando desde o primeiro morador.',
          apoio: 'Vistorias · Implantação de equipe · Manual do morador',
        },
        {
          rotulo: 'Pós-obra',
          titulo: 'Pós-obra com transparência',
          texto:
            'Explicamos ao síndico e à incorporadora o que dizem a lei e as normas técnicas de garantia e de manutenção, a NBR 17170 e a NBR 5674, para que cada parte saiba o que é garantia e o que é manutenção.',
          apoio:
            'Garantia e manutenção, cada uma no seu lugar · Ferramenta própria de gestão de manutenção em desenvolvimento',
        },
      ],
    },
    ganhos: {
      titulo: 'O que a sua incorporadora ganha',
      zonas: [
        {
          titulo: 'A entrega.',
          texto:
            'Sua equipe de engenharia e de relacionamento para de responder sobre taxa de condomínio e volta a fazer o que sabe: entregar obra.',
          apoio: 'Vistorias e entrega de chaves num calendário montado junto com a sua equipe.',
        },
        {
          titulo: 'O cliente.',
          texto:
            'Números desde o dia zero: previsão orçamentária auditável e prestação de contas digital desde a instalação. O conselho do condomínio nasce confiando na gestão.',
          apoio: 'A taxa anunciada no lançamento nasce de um estudo, não de uma promoção.',
        },
        {
          titulo: 'A sua marca.',
          texto:
            'Comprador bem recebido fala bem do empreendimento, nas redes e para os amigos. É isso que chega ao próximo lançamento.',
          apoio:
            'Lançou em Recife, João Pessoa, Campina Grande ou Belém? A mesma Semog implanta, com equipe local.',
        },
      ],
    },
    instalacao: {
      tituloA: 'O que fica pronto',
      tituloB: 'no dia da instalação.',
      lead: 'A implantação roda no sistema próprio da Semog, na ordem em que cada coisa precisa acontecer.',
      itens: [
        {
          titulo: 'Assembleia de instalação',
          texto:
            'Síndico eleito, previsão orçamentária aprovada e posse da administração, registrados em ata.',
        },
        {
          titulo: 'Espelho de vendas importado',
          texto:
            'Cada unidade e cada comprador entram no sistema a partir do espelho de vendas da incorporadora.',
        },
        {
          titulo: 'CNPJ e conta do condomínio',
          texto: 'Com a ata, o condomínio ganha CNPJ e conta própria, separada da incorporadora.',
        },
        {
          titulo: 'Primeiro boleto',
          texto: 'A primeira taxa sai com o valor aprovado na assembleia.',
        },
        {
          titulo: 'Credenciais e treinamento',
          texto: 'Acessos entregues e treinamento feito para quem vai usar os canais da Semog.',
        },
        {
          titulo: 'Prestação de contas digital',
          texto: 'Conferida antes de sair, desde a primeira.',
        },
      ],
    },
    lancamento: {
      tituloA: 'Tem lançamento',
      tituloB: 'no radar?',
      texto:
        'Envolva a Semog ainda na planta e lance com a taxa certa, a convenção certa e a operação pronta.',
      botao: 'Pedir proposta',
    },
  },
  garantePagina: {
    abertura: {
      antes: 'Semog',
      enfase: 'Garante.',
      lead: 'O condomínio recebe 100% da arrecadação prevista, todos os meses. Se um condômino não paga, a Semog Garante paga o boleto ao condomínio e a equipe própria da Semog cobra quem atrasou.',
      origem: 'Criado em 2025 com a G5 Partners. Exclusivo para condomínios Semog.',
      botao: 'Pedir proposta',
      comoFunciona: 'Ver como funciona',
      fatos: {
        recebe: {
          valor: '100%',
          rotulo: 'da arrecadação prevista chega ao condomínio, todos os meses',
        },
        custo: {
          valor: '1%',
          rotulo: 'do valor total da arrecadação: é o custo do Garante',
        },
        equipe: {
          valor: 'Equipe própria',
          rotulo: 'da Semog cobra quem atrasou, sem terceirizar',
        },
      },
      linha: 'Doze meses de arrecadação prevista',
    },
    caixa: {
      titulo: 'O caixa do condomínio, mês a mês.',
      ilustracao: 'Ilustração: meses e valores fictícios, só para mostrar o mecanismo.',
      previsto: 'Arrecadação prevista',
      pago: 'Pago pelos condôminos',
      aberto: 'Em aberto',
      coberto: 'Pago pela Semog Garante',
      cobrancaA: 'Cobrança de quem atrasou:',
      cobrancaB: 'equipe própria da Semog, fora da conta do condomínio',
      custo: '1%: o custo do Garante',
      meses: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
      momentos: [
        {
          titulo: 'Sem garantia, o caixa depende de quem paga em dia.',
          texto:
            'Todo mês, parte dos boletos fica em aberto. O que falta no caixa vira obra adiada, rateio extra ou assembleia tensa.',
        },
        {
          titulo: 'Com o Garante, o que ficou em aberto é pago ao condomínio.',
          texto:
            'A Semog Garante paga integralmente os boletos em aberto. A arrecadação prevista chega inteira, na conta do próprio condomínio.',
        },
        {
          titulo: 'Depois, a Semog cobra quem atrasou.',
          texto:
            'A cobrança passa para a Semog Garante e é feita pela equipe própria da Semog: lembretes numa régua e, depois, proposta de acordo. Ela corre fora da conta do condomínio, e o síndico não participa.',
        },
        {
          titulo: 'Tudo isso por 1% do valor total da arrecadação.',
          texto:
            'É o custo do Garante, sem taxa de adesão. Em troca, a receita prevista no orçamento é a receita que entra.',
        },
      ],
    },
    papeis: {
      titulo: 'Cada um no seu papel.',
      itens: [
        {
          quem: 'O condomínio',
          faz: 'Recebe 100% da arrecadação prevista, todo mês, na conta própria. Paga 1% do valor total da arrecadação.',
        },
        {
          quem: 'A Semog Garante',
          faz: 'Paga ao condomínio os boletos que ficaram em aberto. A cobrança de quem atrasou fica com a equipe própria da Semog.',
        },
        {
          quem: 'A equipe da Semog',
          faz: 'Cobra os inadimplentes com lembretes numa régua e, depois, proposta de acordo. Sem empresa terceirizada.',
        },
        {
          quem: 'O síndico',
          faz: 'Não participa da cobrança. A conversa difícil com o vizinho deixa de ser dele.',
        },
      ],
    },
    duvidas: {
      titulo: 'O que o síndico pergunta.',
      outra: 'Ficou outra dúvida?',
      itens: [
        {
          pergunta: 'O que acontece com o condômino que não paga?',
          resposta:
            'O condomínio já recebeu o valor do boleto, pago pela Semog Garante. A cobrança desse condômino passa para a Semog Garante e é feita pela equipe própria da Semog: lembretes numa régua e, depois, proposta de acordo.',
        },
        {
          pergunta: 'Quem faz a cobrança? O síndico participa?',
          resposta:
            'A equipe própria da Semog, e não uma empresa terceirizada. O síndico não participa da cobrança, e a convivência entre vizinhos fica preservada.',
        },
        {
          pergunta: 'Onde fica o dinheiro do condomínio?',
          resposta:
            'Na conta própria do condomínio. Os boletos são emitidos nela, e é nela que a Semog Garante paga o que ficou em aberto.',
        },
        {
          pergunta: 'Como o Garante entra no orçamento?',
          resposta:
            'Como um custo de 1% do valor total da arrecadação, sem taxa de adesão, que aparece no plano de contas como “Semog Garante”. Do outro lado, a receita prevista passa a ser a receita que entra, todo mês.',
        },
        {
          pergunta: 'Tem fidelidade ou prazo mínimo?',
          resposta: 'Não. O Garante não tem prazo mínimo nem fidelidade: o contrato é mensal.',
        },
        {
          pergunta: 'Meu condomínio precisa ser administrado pela Semog?',
          resposta:
            'Sim. O Garante é exclusivo para condomínios Semog. Se o seu ainda não é, a equipe da Semog assessora a migração, sem interromper a operação.',
        },
      ],
    },
  },
  gestaoPagina: {
    abertura: {
      antes: 'Administração de condomínios,',
      enfase: 'por inteiro.',
      lead: 'Do boleto à assembleia, a Semog auxilia em toda a operação do condomínio, para o síndico decidir com tranquilidade e o morador só morar.',
      prazo: 'Proposta personalizada em até 24 horas úteis.',
      botao: 'Pedir proposta',
      mesa: 'Ver o que sai da mesa do síndico',
      contrato: 'Num contrato só',
      frentes: [
        'Financeiro e cobrança',
        'Contabilidade e fiscal',
        'Departamento pessoal',
        'Assembleias',
        'Manutenção e fornecedores',
        'Atendimento ao condômino',
        'Suporte jurídico com escritório parceiro',
      ],
      ranking: 'entre mais de 3.500 administradoras no Ranking Top 200 da Superlógica',
    },
    mesa: {
      titulo: 'O que sai da mesa do síndico.',
      mesaRotulo: 'Na mesa do síndico',
      frentesRotulo: 'Nas frentes da Semog',
      decidir: 'decidir',
      frentes: [
        {
          nome: 'Financeiro e cobrança',
          tarefas: ['boletos', 'contas a pagar', 'previsão orçamentária', 'inadimplentes'],
        },
        {
          nome: 'Contabilidade e fiscal',
          tarefas: ['balancetes', 'obrigações fiscais', 'prestação de contas'],
        },
        {
          nome: 'Departamento pessoal',
          tarefas: ['folha', 'férias', 'encargos'],
        },
        {
          nome: 'Assembleias',
          tarefas: ['convocação', 'votação', 'ata'],
        },
        {
          nome: 'Manutenção e fornecedores',
          tarefas: ['preventivas', 'orçamentos'],
        },
      ],
      momentos: [
        {
          titulo: 'Um condomínio tem mais tarefa do que parece.',
          texto:
            'Boleto, folha, balancete, assembleia, orçamento de obra. Com uma administradora que assessora de verdade, o síndico não carrega tudo isso sozinho.',
        },
        {
          titulo: 'O financeiro e a cobrança vão para a Semog.',
          texto:
            'Boletos, contas a pagar e a previsão orçamentária, montada com referências de condomínios comparáveis da carteira Semog. Quem atrasou é cobrado pela equipe própria da Semog, sem terceirizar.',
        },
        {
          titulo: 'A contabilidade fecha o mês conferida.',
          texto:
            'Balancetes e obrigações fiscais em dia. A prestação de contas sai digital e conferida: se um total não bate, ela não sai.',
        },
        {
          titulo: 'O departamento pessoal cuida de quem trabalha no prédio.',
          texto:
            'Folha, férias, encargos e as rotinas trabalhistas dos funcionários do condomínio.',
        },
        {
          titulo: 'A assembleia chega preparada.',
          texto:
            'Convocação, assessoria na assembleia e ata, presencial ou digital. Na assembleia digital, o condômino vota por link e a presença fica registrada.',
        },
        {
          titulo: 'A manutenção tem rotina, cotação e orçamento.',
          texto:
            'Manutenção preventiva, com cotações e orçamentos de fornecedores feitos pela Semog.',
        },
        {
          titulo: 'Na mesa do síndico fica o que é dele: decidir.',
          texto: 'O síndico continua decidindo. A Semog executa com método e responde por prazos.',
        },
      ],
    },
    atende: {
      tituloA: 'Perto do condomínio',
      tituloB: 'e de quem decide.',
      lead: 'Além das frentes do dia a dia, o condomínio tem canais para o condômino, equipe na própria cidade, suporte jurídico com escritório parceiro e acesso a quem decide na Semog.',
      itens: [
        {
          titulo: 'Atendimento ao condômino',
          texto:
            '2ª via do boleto pelo site e pelo WhatsApp. No aplicativo, boletos, reservas, assembleias e avisos.',
          link: 'Ver a Semog One',
        },
        {
          titulo: 'Equipe local',
          texto:
            'Unidades Semog em Recife, João Pessoa, Campina Grande e Belém, com equipe local em cada cidade.',
          link: 'Ver as Unidades',
        },
        {
          titulo: 'Acesso fácil aos sócios',
          texto: 'Quando o síndico precisa, fala com quem decide na Semog.',
        },
        {
          titulo: 'Suporte jurídico com escritório parceiro',
          texto:
            'Convenção, regimento, notificações e acordos, com escritório de advocacia parceiro.',
        },
      ],
      tipos: 'Para condomínios residenciais, comerciais e mistos, e para associações de moradores.',
      alemRotulo: 'Vá além da gestão',
      alem: [
        {
          titulo: 'Semog Garante',
          texto:
            'O condomínio recebe 100% da arrecadação prevista, todos os meses, por 1% do valor total da arrecadação.',
        },
        {
          titulo: 'Tecnologia',
          texto:
            'Semog One, a plataforma própria da Semog, e a prestação de contas digital conferida.',
        },
        {
          titulo: 'Incorporadoras',
          texto:
            'A Semog implanta o condomínio da sua incorporadora da planta à primeira assembleia.',
        },
      ],
    },
    troca: {
      tituloA: 'Trocar de administradora',
      tituloB: 'sem interromper nada.',
      linha: 'Boletos e pagamentos do condomínio seguem em dia',
      passos: [
        {
          titulo: 'Proposta',
          texto:
            'Você conta como é o condomínio e recebe uma proposta personalizada em até 24 horas úteis, sem compromisso.',
        },
        {
          titulo: 'Assembleia',
          texto: 'A troca de administradora é aprovada pelos condôminos, em assembleia.',
        },
        {
          titulo: 'Transição',
          texto:
            'A equipe da Semog assessora a migração: documentos, comunicação aos condôminos e transição financeira.',
        },
      ],
    },
    perguntas: {
      titulo: 'O que o síndico pergunta a uma administradora.',
      outra: 'Ficou outra dúvida?',
      link: 'Pergunte no pedido de proposta',
      itens: [
        {
          pergunta: 'O que faz uma administradora de condomínios?',
          resposta:
            'Ela auxilia o condomínio em toda a operação: financeiro e cobrança, contabilidade e prestação de contas, departamento pessoal, assembleias, fornecedores e manutenção. O síndico continua decidindo; a administradora executa com método e responde por prazos.',
        },
        {
          pergunta: 'Quanto custa contratar uma administradora de condomínios?',
          resposta:
            'Depende do porte do condomínio e dos serviços contratados. A Semog envia uma proposta personalizada em até 24 horas úteis, sem compromisso, com o que está incluído e os opcionais, como o Semog Garante.',
        },
        {
          pergunta: 'Como escolher a administradora certa?',
          resposta:
            'Compare tempo de mercado, carteira de condomínios, como é feita a prestação de contas, a tecnologia para o condômino e quem faz a cobrança. Converse com clientes atuais e peça a proposta por escrito.',
        },
        {
          pergunta: 'Trocar de administradora dá trabalho?',
          resposta:
            'Aprovada a troca em assembleia, a equipe da Semog assessora a migração: documentos, comunicação aos condôminos e transição financeira, sem interromper boletos nem pagamentos.',
        },
        {
          pergunta: 'Quem faz a cobrança dos inadimplentes?',
          resposta:
            'A equipe própria da Semog, e não uma empresa terceirizada. Com o Semog Garante, o condomínio recebe 100% da arrecadação prevista todos os meses, por 1% do valor total da arrecadação.',
        },
        {
          pergunta: 'A Semog atende o meu tipo de condomínio?',
          resposta:
            'Atendemos condomínios residenciais, comerciais e mistos e associações de moradores, em Recife, João Pessoa, Campina Grande, Belém e regiões. Para incorporadoras, a Semog implanta o condomínio da planta à primeira assembleia.',
        },
      ],
    },
  },
  landing: {
    cabecalho: {
      botao: 'Pedir proposta',
    },
    abertura: {
      titulo: 'Administradora de condomínios',
      formTitulo: 'Peça uma proposta para o seu condomínio',
      unidade: 'Unidade Semog',
    },
    prova: {
      rankingApoio:
        'A administradora mais bem posicionada do Norte e Nordeste no Ranking Top 200 da Superlógica.',
    },
    gestao: {
      titulo: 'O que muda no',
      enfase: 'seu condomínio.',
    },
    unidade: {
      bairros: 'Com presença forte em',
      endereco: 'Endereço',
      telefone: 'Telefone',
      horario: 'Atendimento',
      horarioTexto: 'Segunda a sexta, das 8h às 18h',
      mapa: 'Como chegar',
    },
    avaliacoes: {
      rotulo: 'Avaliações públicas no Google da Unidade',
    },
    troca: {
      titulo: 'Trocar de administradora',
      enfase: 'sem interromper nada.',
      passos: [
        {
          titulo: 'Proposta',
          texto:
            'Você conta como é o condomínio e recebe uma proposta personalizada, sem compromisso.',
        },
        {
          titulo: 'Assembleia',
          texto: 'A troca de administradora é aprovada pelos condôminos, em assembleia.',
        },
        {
          titulo: 'Transição',
          texto:
            'A equipe local assessora a migração: documentos, comunicação aos condôminos e transição financeira, sem interromper boletos nem pagamentos.',
        },
      ],
    },
    perguntas: {
      titulo: 'Perguntas de quem procura administradora',
    },
    fechamento: {
      titulo: 'Peça uma proposta para o seu condomínio',
      texto: 'Proposta personalizada e sem compromisso, em até 24 horas úteis.',
      botao: 'Pedir proposta',
    },
  },
  formulario: {
    ufsPrincipais: [
      {
        uf: 'PE',
        nome: 'Pernambuco',
      },
      {
        uf: 'PB',
        nome: 'Paraíba',
      },
      {
        uf: 'PA',
        nome: 'Pará',
      },
    ],
    ufsOutras: [
      {
        uf: 'AC',
        nome: 'Acre',
      },
      {
        uf: 'AL',
        nome: 'Alagoas',
      },
      {
        uf: 'AP',
        nome: 'Amapá',
      },
      {
        uf: 'AM',
        nome: 'Amazonas',
      },
      {
        uf: 'BA',
        nome: 'Bahia',
      },
      {
        uf: 'CE',
        nome: 'Ceará',
      },
      {
        uf: 'DF',
        nome: 'Distrito Federal',
      },
      {
        uf: 'ES',
        nome: 'Espírito Santo',
      },
      {
        uf: 'GO',
        nome: 'Goiás',
      },
      {
        uf: 'MA',
        nome: 'Maranhão',
      },
      {
        uf: 'MT',
        nome: 'Mato Grosso',
      },
      {
        uf: 'MS',
        nome: 'Mato Grosso do Sul',
      },
      {
        uf: 'MG',
        nome: 'Minas Gerais',
      },
      {
        uf: 'PR',
        nome: 'Paraná',
      },
      {
        uf: 'PI',
        nome: 'Piauí',
      },
      {
        uf: 'RJ',
        nome: 'Rio de Janeiro',
      },
      {
        uf: 'RN',
        nome: 'Rio Grande do Norte',
      },
      {
        uf: 'RS',
        nome: 'Rio Grande do Sul',
      },
      {
        uf: 'RO',
        nome: 'Rondônia',
      },
      {
        uf: 'RR',
        nome: 'Roraima',
      },
      {
        uf: 'SC',
        nome: 'Santa Catarina',
      },
      {
        uf: 'SP',
        nome: 'São Paulo',
      },
      {
        uf: 'SE',
        nome: 'Sergipe',
      },
      {
        uf: 'TO',
        nome: 'Tocantins',
      },
    ],
  },
  cidades: {
    recife: {
      nome: 'Recife',
      emCidade: 'no Recife',
      uf: 'PE',
      foto: '/site-v2/fotos/recife.webp',
      fotoMovel: '/site-v2/fotos/recife-800.webp',
      alt: 'Orla de Boa Viagem, no Recife, vista do alto, com a linha de edifícios à beira-mar',
      sub: 'Desde 1991 no Recife, com equipe própria na Madalena e prestação de contas conferida antes de sair.',
      unidadeTitulo: 'No Recife desde 1991, com equipe na Madalena.',
      contexto:
        'A Semog nasceu no Recife, em 1991. Da orla de Boa Viagem a Casa Forte, Graças e Espinheiro, a cidade é cada vez mais vertical, e a gestão do condomínio pesa no dia a dia de quem mora e no valor do imóvel. A Unidade Recife, na Madalena, reúne financeiro e contábil próprios, cobrança com equipe da casa e suporte jurídico com escritório parceiro.',
      bairros: [
        'Boa Viagem',
        'Casa Forte',
        'Graças',
        'Madalena',
        'Espinheiro',
        'Parnamirim',
        'Aflitos',
        'Pina',
        'Jaqueira',
        'Torre',
      ],
      endereco: 'R. Bartolomeu de Gusmão, 217 · Madalena · Recife/PE',
      telefone: '(81) 3316-0265',
      mapa: 'https://www.google.com/maps?cid=4494775482860487078',
      avaliacoes: [
        {
          texto:
            'Administradora moderna e com todos os serviços em aplicativos , para consulta dos condôminos ….',
          nome: 'Christovam Jr.',
          data: 'mar/2026',
        },
        {
          texto:
            'Gostaria de agradecer a equipe da Semog a atenção em me reenviar uns boletos da taxa de condomínio que eu precisava, boletos antigos. Especialmente ao funcionário Robson que muito solicito, prontamente providenciou a minha solicitação!',
          nome: 'Elisabete V.',
          data: 'mai/2026',
        },
        {
          texto:
            'Uma empresa muito estruturada e proativa nas suas prestações de serviços, funcionários excelentes sempre a disposição para qualquer necessidade dos clientes e visitantes. Referência em administração de bens.',
          nome: 'David C.',
          data: 'out/2019',
        },
      ],
      perguntas: [
        {
          pergunta: 'Qual a melhor administradora de condomínios do Recife?',
          resposta:
            'Depende do que o seu condomínio precisa, e vale comparar com dados. A Semog administra condomínios desde 1991, tem mais de 650 condomínios sob gestão e está em 5º lugar entre mais de 3.500 administradoras no Ranking Top 200 da Superlógica, a mais bem posicionada do Norte e Nordeste. No Recife, a equipe fica na Madalena.',
        },
        {
          pergunta: 'Quanto custa uma administradora de condomínios no Recife?',
          resposta:
            'Depende do porte do condomínio e dos serviços contratados. Preencha o formulário desta página e receba uma proposta personalizada em até 24 horas úteis, sem compromisso.',
        },
        {
          pergunta: 'Como funciona a troca de administradora?',
          resposta:
            'Aprovada a troca em assembleia, a equipe local assessora a migração completa: documentos, comunicação aos condôminos e transição financeira, sem interromper boletos nem pagamentos.',
        },
        {
          pergunta: 'Vocês atendem a Região Metropolitana do Recife?',
          resposta:
            'Sim. A Unidade Recife atende a capital e a Região Metropolitana, como Olinda, Jaboatão dos Guararapes e Paulista, com equipe local do financeiro à assembleia.',
        },
        {
          pergunta: 'O que é o Semog Garante?',
          resposta:
            'Com o Semog Garante, o condomínio recebe 100% da arrecadação prevista, todos os meses, mesmo com condôminos em atraso. O custo é de 1% do valor total da arrecadação.',
        },
        {
          pergunta: 'A Semog tem aplicativo?',
          resposta:
            'Sim. Síndicos e condôminos acessam boletos, reservas, assembleias e avisos pelo aplicativo.',
        },
      ],
    },
    'joao-pessoa': {
      nome: 'João Pessoa',
      emCidade: 'em João Pessoa',
      uf: 'PB',
      foto: '/site-v2/fotos/joao-pessoa.webp',
      fotoMovel: '/site-v2/fotos/joao-pessoa-800.webp',
      alt: 'Orla de João Pessoa vista do alto',
      sub: 'Desde 2004 em João Pessoa, com equipe em Manaíra e assembleia digital para quem mora longe.',
      unidadeTitulo: 'Em João Pessoa desde 2004, com equipe em Manaíra.',
      contexto:
        'A Semog chegou a João Pessoa em 2004 e acompanha o crescimento da orla, de Manaíra, Tambaú e Cabo Branco ao Bessa, e de bairros como Altiplano e Bancários. Na orla, muito proprietário mora fora da cidade: com assembleia digital e aplicativo, ele participa e acompanha o condomínio de longe. É também na orla de João Pessoa que a Semog faz o Semog Experience, uma manhã de bem-estar gratuita para síndicos, conselheiros e moradores.',
      bairros: [
        'Manaíra',
        'Tambaú',
        'Cabo Branco',
        'Bessa',
        'Aeroclube',
        'Altiplano',
        'Bancários',
        'Jardim Oceania',
        'Miramar',
        'Intermares',
      ],
      endereco: 'Av. Guarabira, 834 · Manaíra · João Pessoa/PB',
      telefone: '(83) 3224-1228',
      mapa: 'https://www.google.com/maps?cid=1666358071032665691',
      avaliacoes: [
        {
          texto:
            'Gostaria de registrar formalmente a minha imensa satisfação com os serviços prestados por vocês. Como síndica profissional, sei o valor de uma administradora competente e parceira, e a Semog tem superado as minhas expectativas.',
          nome: 'Nicia A.',
          data: 'jun/2025',
        },
        {
          texto:
            'Atendimento aconchegante e familiar! Impecável e super me ajudou. Parabéns para todos pelo trabalho 🫶🏼',
          nome: 'Adila P.',
          data: 'abr/2026',
        },
        {
          texto:
            'A empresa oferece serviço de qualidade atendendo as necessidades de seus clientes. Contamos com seu serviço em nosso condomínio e somos muito satisfeitos!',
          nome: 'Sara A.',
          data: 'out/2024',
        },
      ],
      perguntas: [
        {
          pergunta: 'Qual a melhor administradora de condomínios de João Pessoa?',
          resposta:
            'Depende do que o seu condomínio precisa, e vale comparar com dados. A Semog administra condomínios desde 1991, está em João Pessoa desde 2004 e está em 5º lugar entre mais de 3.500 administradoras no Ranking Top 200 da Superlógica, a mais bem posicionada do Norte e Nordeste. A equipe fica em Manaíra.',
        },
        {
          pergunta: 'Quanto custa uma administradora de condomínios em João Pessoa?',
          resposta:
            'Depende do porte do condomínio e dos serviços contratados. Preencha o formulário desta página e receba uma proposta personalizada em até 24 horas úteis, sem compromisso.',
        },
        {
          pergunta: 'Como funciona a troca de administradora?',
          resposta:
            'Aprovada a troca em assembleia, a equipe local assessora a migração completa: documentos, comunicação aos condôminos e transição financeira, sem interromper boletos nem pagamentos.',
        },
        {
          pergunta: 'Vocês atendem a Grande João Pessoa?',
          resposta:
            'Sim. A Unidade João Pessoa atende a capital e a região, como Cabedelo, Bayeux e Santa Rita, com equipe local do financeiro à assembleia.',
        },
        {
          pergunta: 'Moro fora da cidade. Consigo acompanhar o condomínio?',
          resposta:
            'Sim. A assembleia pode ser digital, com voto por link e presença registrada, e boletos, avisos e reservas ficam no aplicativo.',
        },
        {
          pergunta: 'O que é o Semog Garante?',
          resposta:
            'Com o Semog Garante, o condomínio recebe 100% da arrecadação prevista, todos os meses, mesmo com condôminos em atraso. O custo é de 1% do valor total da arrecadação.',
        },
      ],
    },
    'campina-grande': {
      nome: 'Campina Grande',
      emCidade: 'em Campina Grande',
      uf: 'PB',
      foto: '/site-v2/fotos/campina-grande.webp',
      fotoMovel: '/site-v2/fotos/campina-grande-800.webp',
      alt: 'Campina Grande vista do alto, com o açude ao centro',
      sub: 'A estrutura da Semog no Catolé, com equipe local e prestação de contas conferida antes de sair.',
      unidadeTitulo: 'Em Campina Grande desde 2025, com equipe no Catolé.',
      contexto:
        'A Semog chegou a Campina Grande em 2025, ampliando a presença na Paraíba. Do Catolé ao Mirante e ao Alto Branco, o mercado de condomínios cresce com a cidade, polo universitário e de tecnologia do interior. A Unidade Campina Grande, no Catolé, une a estrutura de quem administra condomínios há 35 anos ao atendimento próximo.',
      bairros: [
        'Catolé',
        'Mirante',
        'Alto Branco',
        'Centro',
        'Prata',
        'Liberdade',
        'Bodocongó',
        'Itararé',
        'Sandra Cavalcante',
        'Palmeira',
      ],
      endereco: 'R. José Adnoste Roberto, 1001 · Catolé · Campina Grande/PB',
      telefone: '(83) 3201-9039',
      mapa: 'https://www.google.com/maps?cid=13577165401970724901',
      avaliacoes: [],
      perguntas: [
        {
          pergunta: 'Qual a melhor administradora de condomínios de Campina Grande?',
          resposta:
            'Depende do que o seu condomínio precisa, e vale comparar com dados. A Semog administra condomínios desde 1991, tem mais de 650 condomínios sob gestão e está em 5º lugar entre mais de 3.500 administradoras no Ranking Top 200 da Superlógica, a mais bem posicionada do Norte e Nordeste. Em Campina Grande, a equipe fica no Catolé.',
        },
        {
          pergunta: 'Quanto custa uma administradora de condomínios em Campina Grande?',
          resposta:
            'Depende do porte do condomínio e dos serviços contratados. Preencha o formulário desta página e receba uma proposta personalizada em até 24 horas úteis, sem compromisso.',
        },
        {
          pergunta: 'Como funciona a troca de administradora?',
          resposta:
            'Aprovada a troca em assembleia, a equipe local assessora a migração completa: documentos, comunicação aos condôminos e transição financeira, sem interromper boletos nem pagamentos.',
        },
        {
          pergunta: 'Vocês atendem a região de Campina Grande?',
          resposta:
            'Sim. A Unidade Campina Grande atende a cidade e a região, como Queimadas e Lagoa Seca, com equipe local do financeiro à assembleia.',
        },
        {
          pergunta: 'O que é o Semog Garante?',
          resposta:
            'Com o Semog Garante, o condomínio recebe 100% da arrecadação prevista, todos os meses, mesmo com condôminos em atraso. O custo é de 1% do valor total da arrecadação.',
        },
        {
          pergunta: 'A Semog tem aplicativo?',
          resposta:
            'Sim. Síndicos e condôminos acessam boletos, reservas, assembleias e avisos pelo aplicativo.',
        },
      ],
    },
    belem: {
      nome: 'Belém',
      emCidade: 'em Belém',
      uf: 'PA',
      foto: '/site-v2/fotos/belem.webp',
      fotoMovel: '/site-v2/fotos/belem-800.webp',
      alt: 'Belém vista do alto, com o porto e a orla',
      sub: 'Desde 2019 em Belém, com equipe na Cremação e prestação de contas conferida antes de sair.',
      unidadeTitulo: 'Em Belém desde 2019, com equipe na Cremação.',
      contexto:
        'A Semog chegou a Belém em 2019, levando o seu método para além do Nordeste. Da Cidade Velha a Umarizal, Nazaré e Batista Campos, a cidade une prédios históricos e lançamentos recentes, e cada um pede uma gestão diferente. A Unidade Belém fica na Cremação, com equipe local. É em Belém também que a Semog organiza o Café com Condomínio, encontros gratuitos em que o síndico é protagonista.',
      bairros: [
        'Umarizal',
        'Nazaré',
        'Batista Campos',
        'Marco',
        'Cremação',
        'Reduto',
        'São Brás',
        'Cidade Velha',
        'Pedreira',
        'Guamá',
      ],
      endereco: 'Av. Alcindo Cacela, 2351, sala 201 · Cremação · Belém/PA',
      telefone: '(91) 3115-4700',
      mapa: 'https://www.google.com/maps?cid=17883612711195798886',
      avaliacoes: [
        {
          texto:
            'Me ajuda em tudo. Desde o início. Comecei como síndica sem saber nada. E eles são meu braço direito',
          nome: 'Izabelle A.',
          data: 'ago/2026',
        },
        {
          texto:
            'Uma administradora super competente, completa em todos os níveis desde orçamentos até uma assessoria completa nas assembléias do início ao final, garantindo pra nós síndicos uma tranquilidade e harmonia nas assembléias e em toda gestão.',
          nome: 'Ana Cláudia D.',
          data: 'set/2026',
        },
        {
          texto:
            'A Semog Administradora de Condomínio tem sido uma parceira essencial na gestão dos condomínios em que atuo como síndico profissional. Quando comecei, ainda sem experiência, a administradora me ajudou muito no dia a dia da função (e sabemos que não é fácil). …',
          nome: 'Josias A.',
          data: 'abr/2026',
        },
      ],
      perguntas: [
        {
          pergunta: 'Qual a melhor administradora de condomínios de Belém?',
          resposta:
            'Depende do que o seu condomínio precisa, e vale comparar com dados. A Semog administra condomínios desde 1991, está em Belém desde 2019 e está em 5º lugar entre mais de 3.500 administradoras no Ranking Top 200 da Superlógica, a mais bem posicionada do Norte e Nordeste. A equipe fica na Cremação.',
        },
        {
          pergunta: 'Quanto custa uma administradora de condomínios em Belém?',
          resposta:
            'Depende do porte do condomínio e dos serviços contratados. Preencha o formulário desta página e receba uma proposta personalizada em até 24 horas úteis, sem compromisso.',
        },
        {
          pergunta: 'Como funciona a troca de administradora?',
          resposta:
            'Aprovada a troca em assembleia, a equipe local assessora a migração completa: documentos, comunicação aos condôminos e transição financeira, sem interromper boletos nem pagamentos.',
        },
        {
          pergunta: 'Vocês atendem a Grande Belém?',
          resposta:
            'Sim. A Unidade Belém atende a capital e a Região Metropolitana, com equipe local do financeiro à assembleia.',
        },
        {
          pergunta: 'O que é o Semog Garante?',
          resposta:
            'Com o Semog Garante, o condomínio recebe 100% da arrecadação prevista, todos os meses, mesmo com condôminos em atraso. O custo é de 1% do valor total da arrecadação.',
        },
        {
          pergunta: 'A Semog tem aplicativo?',
          resposta:
            'Sim. Síndicos e condôminos acessam boletos, reservas, assembleias e avisos pelo aplicativo.',
        },
      ],
    },
  },
  propostaPagina: {
    titulo: 'Peça sua',
    enfase: 'proposta.',
    sub: 'Personalizada para o seu condomínio e sem compromisso, em até 24 horas úteis.',
    formTitulo: 'Conte sobre o seu condomínio',
    porque: {
      titulo: 'Por que a Semog',
      anos: 'Administrando condomínios desde 1991, hoje com mais de 650 sob gestão.',
      garante: 'O condomínio recebe 100% da arrecadação prevista, todos os meses.',
      prestacao: {
        destaque: 'Prestação de contas conferida',
        texto: 'Digital e conferida antes de sair: se um total não bate, o documento não sai.',
      },
    },
    depois: {
      titulo: 'O que acontece',
      enfase: 'depois do pedido.',
      primeiroPasso: 'Proposta em até 24 horas úteis',
      contato: 'Prefere falar com uma Unidade?',
      contatoLink: 'Telefones e endereços',
    },
  },
  contatoPagina: {
    titulo: 'Fale com',
    enfase: 'a gente.',
    sub: 'Dúvida de condômino, fornecedor, imprensa ou quem quer trabalhar na Semog: aqui estão as quatro Unidades e um caminho para escrever.',
    atalhos: {
      proposta: {
        titulo: 'Pedir proposta',
        texto: 'Para o seu condomínio, personalizada e em até 24 horas úteis.',
      },
      segundaVia: {
        titulo: '2ª via de boleto',
        texto: 'Pelo CPF: um código chega no e-mail e os boletos em aberto aparecem.',
      },
      login: {
        titulo: 'Área do cliente',
        texto: 'Login de síndicos e condôminos.',
      },
      mensagem: {
        titulo: 'Mandar mensagem',
        texto: 'Condômino, fornecedor, imprensa ou trabalhe conosco.',
      },
    },
    unidades: {
      titulo: 'As quatro',
      enfase: 'Unidades Semog.',
    },
    mensagem: {
      titulo: 'Escreva para',
      enfase: 'a gente.',
      texto: 'Escolha o assunto e conte o que precisa. Se for sobre o seu condomínio, diga qual.',
      assuntos: [
        'Sou condômino e tenho uma dúvida',
        'Sou fornecedor',
        'Imprensa',
        'Trabalhe conosco',
        'Outro assunto',
      ],
      botao: 'Enviar mensagem',
    },
  },
  naoEncontrada: {
    rotulo: 'Erro 404',
    titulo: 'Não achamos',
    enfase: 'esta página.',
    texto:
      'O endereço pode ter mudado ou ter sido digitado com algum erro. Daqui, você chega aonde precisa:',
    links: {
      inicio: {
        titulo: 'Página inicial',
        texto: 'Há 35 anos, a líder do Nordeste cuida do condomínio para você cuidar da vida.',
      },
      unidades: { titulo: 'Unidades Semog', texto: 'Recife, João Pessoa, Campina Grande e Belém.' },
      proposta: {
        titulo: 'Pedir proposta',
        texto: 'Para o seu condomínio, personalizada e em até 24 horas úteis.',
      },
      blog: {
        titulo: 'Blog',
        texto: 'Conteúdo para síndicos, escrito por quem administra condomínios há 35 anos.',
      },
      // TEXTO-NOVO: o cliente chega à 2ª via pelo Contato (a 404 não tem "Sou cliente" no corpo, DP6)
      contato: {
        titulo: 'Fale com a gente',
        texto: 'Telefones e endereços das quatro Unidades, e a 2ª via do boleto para clientes.',
      },
    },
  },
  souCliente: {
    botao: 'Sou cliente',
    titulo: 'Sou cliente',
    // TEXTO-NOVO: frase de abertura do painel
    lead: 'Escolha o que você precisa.',
    segundaVia: {
      titulo: '2ª via do boleto',
      texto: 'Pelo CPF: um código chega no e-mail e os boletos em aberto aparecem.',
    },
    // TEXTO-NOVO: quando a 2ª via do site está desligada, ela sai pelo WhatsApp (como a triagem)
    segundaViaPeloWhatsApp: {
      titulo: '2ª via do boleto',
      texto: 'Peça a 2ª via à equipe da Semog pelo WhatsApp.',
    },
    // TEXTO-NOVO
    atendimento: {
      titulo: 'Atendimento ao condômino',
      texto: 'Fale com a equipe da Semog pelo WhatsApp.',
    },
    area: {
      titulo: 'Área do cliente',
      texto: 'Login de síndicos e condôminos.',
    },
  },
  solucoesPagina: {
    abertura: {
      antes: 'Tudo o que um condomínio precisa,',
      enfase: 'com uma equipe só.',
      lead: 'Gestão financeira, contábil e de pessoas, suporte jurídico com escritório parceiro, prestação de contas digital e o Semog Garante, para o condomínio receber 100% da arrecadação prevista.',
      botao: 'Pedir proposta',
    },
    tipos: [
      {
        id: 'residenciais',
        rotulo: 'Condomínios residenciais',
        titulo: 'O prédio funciona. O morador nem percebe.',
        texto:
          'Auxiliamos em toda a operação do condomínio para que síndico e moradores tenham uma única preocupação: viver bem. Financeiro em dia, funcionários cuidados, manutenção prevista e assembleias organizadas.',
        itens: [
          'Gestão financeira',
          'Cobrança e boletos',
          'Folha e RH do condomínio',
          'Assembleias',
          'Manutenção preventiva',
          'Seguros obrigatórios',
        ],
      },
      {
        id: 'comerciais',
        rotulo: 'Condomínios comerciais',
        titulo: 'Eficiência que valoriza o metro quadrado.',
        texto:
          'Edifícios corporativos e centros empresariais exigem previsibilidade de custos, rateios bem feitos e fornecedores acompanhados de perto. A Semog entrega relatórios gerenciais que o conselho entende e aprova.',
        itens: [
          'Rateios e provisões',
          'Gestão de contratos',
          'Relatórios gerenciais',
          'Compliance condominial',
          'Gestão de facilities',
          'Previsão orçamentária',
        ],
      },
      {
        id: 'associacoes',
        rotulo: 'Associações',
        titulo: 'Governança para comunidades inteiras.',
        texto:
          'Loteamentos, associações de moradores e clubes têm regras, receitas e desafios próprios. Organizamos contribuições e conselhos e, com escritório parceiro, estruturamos os estatutos.',
        itens: [],
      },
    ],
    porque: {
      titulo: 'O que muda com a Semog.',
      itens: [
        {
          valor: '24h',
          titulo: 'Resposta em um dia útil',
          texto: 'Demandas de síndicos e condôminos com prazo de resposta definido e cumprido.',
        },
        { valor: '', titulo: 'Acesso fácil aos sócios', texto: 'Regra da casa desde 1991.' },
        { valor: '35', titulo: 'Anos de mercado', texto: 'Solidez comprovada desde 1991.' },
        { valor: '', titulo: 'Equipes locais', texto: 'Presença física em quatro cidades.' },
        { valor: '100%', titulo: 'Digital', texto: 'Do boleto à assembleia, tudo online.' },
      ],
    },
    prestacao: {
      titulo: 'Prestação de contas digital, conferida antes de sair.',
      texto:
        'Digital desde 2023. A nova prestação de contas, lançada em maio de 2026, transforma o balancete em algo que qualquer condômino entende.',
      itens: [
        {
          titulo: 'Todos os documentos',
          texto: 'Notas, comprovantes e extratos anexados a cada lançamento.',
        },
        {
          titulo: 'Gráficos claros',
          texto: 'Receita, despesa e evolução do fundo de reserva em visual simples.',
        },
        {
          titulo: 'Assinatura digital',
          texto: 'Síndico e conselho assinam digitalmente e registram o parecer.',
        },
        {
          titulo: 'Sempre disponível',
          texto: 'O condômino confere a versão atual pelo link permanente ou pelo QR.',
        },
      ],
      link: 'Ver a Tecnologia',
    },
    garante: {
      titulo: 'Semog Garante.',
      texto:
        'O condomínio recebe 100% da arrecadação prevista, todos os meses. Se um condômino não paga, a Semog Garante paga o boleto ao condomínio e a equipe própria da Semog cobra quem atrasou. Uma parceria Semog e G5 Partners.',
      itens: [
        {
          titulo: 'O condomínio recebe tudo',
          texto: 'Todo mês, 100% da arrecadação prevista entra no caixa, com ou sem atrasos.',
        },
        {
          titulo: 'A cobrança fica com a equipe da Semog',
          texto: 'Quem atrasou recebe lembretes numa régua e, depois, proposta de acordo.',
        },
        {
          titulo: 'O orçamento vira certeza',
          texto:
            'Sem buracos no fluxo de caixa: obras, manutenção e melhorias saem do papel no prazo.',
        },
        {
          titulo: 'O síndico fica fora da cobrança',
          texto: 'Sem constrangimento com vizinhos e sem assembleia tensa por causa de devedores.',
        },
      ],
      custo: '1% do valor total da arrecadação, sem taxa de adesão.',
      link: 'Ver o Semog Garante',
    },
    aplicativo: {
      titulo: 'Um aplicativo que o morador usa de verdade.',
      texto:
        'O app da Semog concentra o dia a dia do condomínio numa interface simples, no bolso de cada morador.',
      itens: [
        { titulo: 'Boletos e 2ª via', texto: 'Histórico completo e pagamento na hora.' },
        { titulo: 'Reservas', texto: 'Salão de festas, churrasqueira e quadra.' },
        { titulo: 'Assembleias e votações', texto: 'Participação e voto de onde estiver.' },
        { titulo: 'Avisos', texto: 'Comunicados da administração no celular.' },
        { titulo: 'Ocorrências', texto: 'Registro e acompanhamento.' },
        { titulo: 'Documentos', texto: 'Convenção, atas e regulamentos sempre à mão.' },
      ],
    },
    tecnologia: {
      titulo: 'Software de dono, não de prateleira.',
      texto:
        'A Semog tem equipe de desenvolvimento própria. Em 2019, lançamos um chatbot de atendimento. Hoje, a operação roda na Semog One, a plataforma que construímos sobre o ERP, e ela evolui toda semana.',
      itens: [
        {
          titulo: 'Nova prestação de contas digital',
          texto:
            'Lançada em maio de 2026: documentos anexados, gráficos e assinatura digital com parecer.',
          estado: 'No ar',
        },
        {
          titulo: 'Chatbot de atendimento',
          texto: 'Lançado em 2019, em evolução contínua.',
          estado: 'No ar',
        },
        {
          titulo: 'Gestão de manutenção',
          texto: 'Preventivas programadas, chamados e histórico por equipamento.',
          estado: 'Em desenvolvimento',
        },
      ],
      link: 'Ver a Tecnologia',
    },
    clube: {
      titulo: 'Clube de benefícios.',
      texto:
        'O clube de benefícios da Semog está sendo atualizado. Estamos criando novas soluções e novos parceiros para condomínios e moradores.',
    },
    perguntas: {
      titulo: 'Perguntas frequentes.',
      itens: [
        {
          pergunta: 'Em que a Semog assessora o condomínio?',
          resposta:
            'Atendemos condomínios residenciais, condomínios comerciais e associações de moradores ou loteamentos. Auxiliamos na gestão financeira, na contabilidade, no departamento pessoal, nas assembleias, na manutenção e nos seguros. A administração do condomínio cabe ao síndico, que decide e responde por ele; a Semog assessora e executa com método.',
        },
        {
          pergunta: 'Como funciona o Semog Garante?',
          resposta:
            'Em parceria com a G5 Partners, o condomínio recebe 100% da arrecadação prevista, todos os meses, mesmo com condôminos em atraso. A cobrança de quem atrasou é feita pela equipe própria da Semog, e o custo é de 1% do valor total da arrecadação.',
        },
        {
          pergunta: 'Como funciona a prestação de contas digital?',
          resposta:
            'Cada lançamento traz documentos e comprovantes anexados, os números viram gráficos fáceis de ler, e síndico e conselho assinam digitalmente com parecer. Qualquer condômino consulta a qualquer hora.',
        },
        {
          pergunta: 'Em quais cidades a Semog atua?',
          resposta:
            'Unidades em Recife (PE), João Pessoa (PB), Campina Grande (PB) e Belém (PA), com equipe local em cada cidade.',
        },
        {
          pergunta: 'Como migrar meu condomínio para a Semog?',
          resposta:
            'A equipe da Semog assessora a transição de ponta a ponta: documentos, comunicação aos condôminos e migração dos dados, sem interromper a operação do condomínio.',
        },
      ],
    },
  },
} as const

export type Conteudo = typeof conteudo
