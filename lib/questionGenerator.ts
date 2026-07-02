import { Questao } from '@/hooks/useQuestions';

// A simple, fast seedable pseudo-random number generator for deterministic questions
function createRandom(seed: number) {
  let h = seed ^ 0xDEADBEEF;
  return function() {
    h = Math.sin(h) * 10000;
    return h - Math.floor(h);
  };
}

const MATH_CONTEXTS = [
  {
    topic: "Otimização Algorítmica",
    intro: "Um data center de inteligência artificial espacial em órbita terrestre ajusta sua taxa de aprendizado para minimizar a perda acumulada.",
    formula: (a: number, b: number) => `f(x) = ${a}x² - ${2 * a * b}x + ${a * b * b + 3}`,
    question: (a: number, b: number) => `Considerando a função de perda f(x), qual deve ser a taxa de aprendizado ideal x para minimizar a perda, e qual é esse valor mínimo de perda?`,
    calc: (a: number, b: number) => {
      const x = b;
      const minVal = 3;
      return {
        x,
        minVal,
        correct: `x = ${x} e f(x) = ${minVal} unidades.`,
        others: [
          `x = ${x + 2} e f(x) = ${minVal + a * 4} unidades.`,
          `x = ${x - 1} e f(x) = ${minVal + a} unidades.`,
          `x = 0 e f(x) = ${a * b * b + 3} unidades.`,
          `x = 1 e f(x) = ${a * (1 - b) * (1 - b) + 3} unidades.`
        ]
      };
    }
  },
  {
    topic: "Crescimento Exponencial",
    intro: "Um reator de fusão a frio experimental aumenta sua potência térmica de maneira estável de acordo com uma curva de crescimento exponencial.",
    formula: (a: number, b: number) => `P(t) = ${a} * 2^(k * t)`,
    question: (a: number, b: number) => `Se a potência inicial é de ${a} MW e o fator k é de 0,1, após quantos minutos t o reator atingirá uma potência total de ${a * 32} MW?`,
    calc: (a: number, b: number) => {
      const t = 50; // 2^5 = 32, so 0.1 * t = 5 => t = 50
      return {
        correct: `t = 50 minutos.`,
        others: [
          `t = 10 minutos.`,
          `t = 25 minutos.`,
          `t = 100 minutos.`,
          `t = 5 minutos.`
        ]
      };
    }
  },
  {
    topic: "Análise Combinatória",
    intro: "Um novo sistema de segurança criptográfico baseado em criptografia pós-quântica sintoniza chaves compostas por N caracteres.",
    formula: (a: number, b: number) => `C_N = (N escolhas)`,
    question: (a: number, b: number) => `Para uma chave confidencial de exatamente ${a} caracteres usando um alfabeto de 4 símbolos quânticos, onde exatamente 2 deles precisam ser o símbolo especial '|X>', quantas combinações de chaves válidas são possíveis?`,
    calc: (a: number, b: number) => {
      const n = a; // e.g. 8
      const comb = (n * (n - 1)) / 2;
      const rem = Math.pow(3, n - 2);
      const total = comb * rem;
      return {
        correct: `${comb} * 3^${n - 2} chaves distintas.`,
        others: [
          `${comb} * 4^${n - 2} chaves distintas.`,
          `3^${n} chaves distintas.`,
          `${n * 3} chaves distintas.`,
          `${comb * 2} chaves distintas.`
        ]
      };
    }
  },
  {
    topic: "Matrizes e Sistemas",
    intro: "Três usinas solares de última geração (Alfa, Beta e Gama) operam em regime complementar suprindo energia sustentável para uma metrópole futurista.",
    formula: (a: number, b: number) => `Sistemas lineares de produção elétrica`,
    question: (a: number, b: number) => `Sabendo que a operação conjunta de 1 Alfa, 1 Beta e 1 Gama gera ${a + b + 50} MW, enquanto 2 Alfas e 1 Beta geram ${2 * a + b} MW, e 1 Beta e 2 Gamas geram ${b + 100} MW, qual é a potência individual da usina Gama?`,
    calc: (a: number, b: number) => {
      // Gamma is 50 MW
      return {
        correct: `50 MW.`,
        others: [
          `40 MW.`,
          `30 MW.`,
          `60 MW.`,
          `25 MW.`
        ]
      };
    }
  },
  {
    topic: "Progressão Geométrica",
    intro: "Um programa de reflorestamento inteligente planeja o plantio clonal de mudas nativas em áreas degradadas de modo progressivo a cada ano.",
    formula: (a: number, b: number) => `A_n = A_1 * q^(n-1)`,
    question: (a: number, b: number) => `Se no primeiro ano são plantadas ${a} mudas e o planejamento dobra a quantidade a cada ano subsequente (razão q=2), qual será o total acumulado de mudas plantadas após ${b} anos de projeto?`,
    calc: (a: number, b: number) => {
      const sum = a * (Math.pow(2, b) - 1);
      return {
        correct: `${sum.toLocaleString('pt-BR')} mudas de árvores.`,
        others: [
          `${(sum - a).toLocaleString('pt-BR')} mudas de árvores.`,
          `${(sum + a * 2).toLocaleString('pt-BR')} mudas de árvores.`,
          `${(a * b).toLocaleString('pt-BR')} mudas de árvores.`,
          `${(a * Math.pow(2, b)).toLocaleString('pt-BR')} mudas de árvores.`
        ]
      };
    }
  }
];

const NATUREZA_CONTEXTS = [
  {
    topic: "Biotecnologia e DNA",
    intro: "A tecnologia CRISPR-Cas14-Max foi aprimorada no Brasil para viabilizar edições genômicas pontuais e reversíveis em lavouras de soja resistentes à seca extrema.",
    question: "O reconhecimento ultraespecífico e a subsequente ancoragem do complexo bioproteico de inserção no segmento do nucleotídeo alvo ocorrem por meio de:",
    correct: "Pontes de hidrogênio geradas por pareamento estrito de bases nitrogenadas complementares entre o RNA-guia e a fita de DNA.",
    others: [
      "Atração eletrostática puramente inespecífica exercida por íons fosfatos na camada lipídica celular.",
      "Clivagem hidrolítica imediata promovida por ribossomos mitocondriais na parede celular externa.",
      "Interações hidrofóbicas aleatórias que desestabilizam todo o envelope nuclear citoplasmático primário.",
      "Duplicação mecânica de centríolos sob efeito de descargas elétricas estocásticas induzidas."
    ]
  },
  {
    topic: "Física Quântica e Supercondutividade",
    intro: "Supercondutores modernos operando em pressões próximas da atmosfera padrão revolucionaram os sistemas nacionais de transmissão de alta eficiência.",
    question: "Ao resfriar estes compostos abaixo de sua temperatura crítica (Tc), a corrente elétrica flui com resistência nula devido a:",
    correct: "Formação de Pares de Cooper que transitam pela rede cristalina sem sofrer espalhamento ou dissipação por colisões iônicas.",
    others: [
      "Evaporação imediata de elétrons livres para a atmosfera seca ao redor dos condutores metálicos.",
      "Alinhamento puramente caótico de prótons livres no núcleo interno dos átomos supercondutores artificiais.",
      "Aumento drástico do Efeito Joule promovendo a liberação acelerada de ondas térmicas de alto comprimento.",
      "Criação de monopolos magnéticos estáticos que isolam os elétrons na periferia cristalina."
    ]
  },
  {
    topic: "Química Verde e Polímeros",
    intro: "Bactérias sintéticas foram empregadas para purificar lagoas industriais degradando polímeros plásticos de descarte através de enzimas adaptadas.",
    question: "O processo químico que cliva as ligações de ésteres repetitivas que estruturam a cadeia polimérica do plástico em monômeros solúveis é:",
    correct: "Reação de hidrólise catalisada que fragmenta as macromoléculas com adição de água.",
    others: [
      "Polimerização por condensação direta sob vácuo parcial livre de umidade residual.",
      "Craqueamento puramente térmico catalisado por gases nobres em reatores de alta pressão.",
      "Alquilação eletrofílica contínua em anéis aromáticos saturados livres.",
      "Eliminação desidratante extrema com liberação secundária de ácido clorídrico concentrado."
    ]
  },
  {
    topic: "Fisiologia e Nanomedicina",
    intro: "Nanocápsulas revestidas de anticorpos monoclonais são inseridas na corrente circulatória humana buscando detectar focos tumorais primários com extrema precisão.",
    question: "Após a ancoragem bem-sucedida das nanocápsulas nas proteínas receptoras hiper-expressas pelas células neoplásicas, o sistema imune é alertado por meio de:",
    correct: "Ativação local de macrófagos e quimiotaxia celular de linfócitos T citotóxicos contra a região neoantígena demarcada.",
    others: [
      "Inibição sistêmica de glóbulos vermelhos reduzindo imediatamente o aporte de oxigênio pulmonar.",
      "Dilação mecânica e inespecífica generalizada de todos os capilares linfáticos da derme profunda.",
      "Coagulação intravascular dispersa que bloqueia o transporte de nutrientes em todas as artérias coronárias.",
      "Neutralização química completa das plaquetas sanguíneas promovendo quadros agudos de diapedese corporal."
    ]
  },
  {
    topic: "Ecologia e Absorção de Carbono",
    intro: "A implantação de turbinas de microalgas artificiais em fachadas de prédios urbanos inteligentes otimiza o sequestro de carbono atmosférico.",
    question: "A fixação acelerada do CO2 gasoso nestes biorreatores fotossintéticos microscópicos depende diretamente da enzima:",
    correct: "RuBisCO, que atua na carboxilação inicial da ribulose-1,5-bifosfato no ciclo de Calvin.",
    others: [
      "Amilase salivar, que desdobra carboidratos complexos livres em açúcares menores de rápida queima.",
      "DNA polimerase, que repara erros estruturais em trechos expostos da fita de RNA mitocondrial.",
      "Helicase, que consome moléculas de trifosfato de adenosina para quebrar ligações peptídicas residuais.",
      "Lactato desidrogenase, responsável por reciclar o ácido lático produzido em regime anaeróbico estrito."
    ]
  }
];

const HUMANAS_CONTEXTS = [
  {
    topic: "Sociologia do Trabalho",
    intro: "A expansão de aplicativos cooperativos autogeridos por entregadores e motoristas no Brasil institui o modelo de Plataformização Mutualista.",
    question: "A principal aspiração desse modelo socioeconômico de inovação trabalhista consiste em:",
    correct: "Promover a autonomia decisória coletiva e a repatriação das taxas operacionais aos trabalhadores via governança horizontal distributiva.",
    others: [
      "Fomentar o monopólio exclusivo de grandes multinacionais proprietárias dos servidores centrais de processamento.",
      "Desregulamentar totalmente as condições sanitárias de trabalho visando ampliar lucros empresariais sem controle fiscal.",
      "Substituir o uso de internet móvel por redes analógicas de rádio amador de alcance extremamente limitado.",
      "Obrigar os cooperados a doar parte significativa de seu patrimônio familiar a fundos de previdência estatal militarizada."
    ]
  },
  {
    topic: "Antropologia Digital",
    intro: "A proliferação de avatares com renderização fotorrealista e identidade modular em ambientes virtuais de sociabilidade redefine conceitos de pertencimento social.",
    question: "Sob a ótica de antropólogos digitais, essa identidade modular possibilita aos sujeitos:",
    correct: "Desconstruir marcadores coloniais estereotipados de raça, gênero e origem e criar redes democráticas transnacionais de apoio de forma autônoma.",
    others: [
      "Eliminar por completo a autoconsciência corporal forçando a imersão crônica em mundos de ilusão puramente mercadológica.",
      "Garantir a obediência absoluta às regras estritas corporativas impostas centralizadamente pelas Big Techs proprietárias.",
      "Padronizar de forma unânime a linguagem falada humana por meio de códigos computacionais obrigatórios de som único.",
      "Rejeitar todo e qualquer tipo de organização política civil no ambiente real extra-metaverso."
    ]
  },
  {
    topic: "Geopolítica e Direitos Humanos",
    intro: "No ano de 2026, comitês globais discutem a criação da 'Cidadania Climática Virtual' para salvaguardar os direitos de refugiados de nações insulares ameaçadas de inundação.",
    question: "Essa inovação nas relações institucionais mundiais flexibiliza conceitos modernos clássicos ao:",
    correct: "Desvincular a atribuição legal da soberania identitária de um povo e sua nacionalidade da existência contínua de um território geográfico material.",
    others: [
      "Conceder imunidade jurídica criminal irrestrita aos indivíduos que imigrarem ilegalmente para as nações ricas europeias.",
      "Substituir todas as moedas fiduciárias locais por um sistema único de arrecadação obrigatória gerido pela ONU.",
      "Impor o uso obrigatório de apenas um idioma oficial global sintonizado por softwares centrais de chat.",
      "Extinguir todas as formas de proteção ambiental sob o pretexto de acelerar a reconstrução civil em solos secos."
    ]
  },
  {
    topic: "Filosofia e Ética Algorítmica",
    intro: "O emprego intensivo de algoritmos 'Black-Box' para filtrar contratações de pessoas e concessão de microcréditos financeiros acirrou os debates sobre ética contemporânea.",
    question: "A opacidade inerente a esses sistemas automáticos agride princípios filosóficos de justiça à medida que:",
    correct: "Priva a pessoa humana do direito de obter uma justificativa inteligível e auditável para escolhas que afetam severamente sua existência.",
    others: [
      "Otimiza de forma excessiva a separação de classes promovendo e incentivando naturalmente a exclusão social meritória.",
      "Reduz a zero os lucros das corporações ao exigir o monitoramento constante por painéis físicos governamentais.",
      "Favorece unicamente os interesses sindicais em detrimento da meritocracia estritamente industrial computada.",
      "Inibe a inovação tecnológica no país ao banir a pesquisa acadêmica de algoritmos computacionais avançados."
    ]
  },
  {
    topic: "Geografia Urbana",
    intro: "Cidades inteligentes brasileiras implementam malhas dinâmicas de micro-mobilidade ativa integradas por sistemas de monitoramento contínuo em 2026.",
    question: "Para a geografia humana, a democratização do espaço viário decorrente desse planejamento dinâmico apoia-se em:",
    correct: "Garantir o direito social à cidade e circulação segura integrando transporte coletivo elétrico de baixo carbono e modais cicláveis integrados.",
    others: [
      "Fomentar a segregação espacial removendo as moradias periféricas das imediações das áreas comerciais abastecidas.",
      "Assegurar a livre circulação exclusiva de automóveis pesados de combustão fóssil nas áreas residenciais centrais.",
      "Privatizar calçadas urbanas para exploração comercial livre de marcas de varejo associadas ao governo regional.",
      "Impor taxas de pedágio urbano estritas baseadas puramente na renda nominal mensal de cada pedestre circulante."
    ]
  }
];

const LINGUAGENS_CONTEXTS = [
  {
    topic: "Poéticas Digitais",
    intro: "Instalações artísticas de 2026 exploram poemas gerados de forma interativa por algoritmos neurais alimentados por sensores biomecanizados.",
    question: "Nessas poéticas digitais contemporâneas, o conceito tradicional de autoria e recepção é profundamente transformado porque:",
    correct: "Funde a criação programada original do designer à interferência física imediata do leitor, reposicionando-o como coautor.",
    others: [
      "Obriga o leitor a memorizar fórmulas de programação de computadores complexas antes de contemplar os versos projetados.",
      "Substitui a beleza fonética das palavras por estímulos acústicos inaudíveis que geram tonturas induzidas.",
      "Consolida a supremacia absoluta da Inteligência Artificial como a única produtora autorizada de arte contemporânea.",
      "Privilegia apenas a elite acadêmica impedindo leitores autônomos de desfrutarem das reflexões estéticas provocadas."
    ]
  },
  {
    topic: "Semiótica da Comunicação",
    intro: "A adoção sistêmica dos 'Neo-Emojis Neurais' que modificam suas expressões conforme o tom e o vocabulário empregado nos e-mails ilustra a evolução da escrita digital.",
    question: "Essa tecnologia que enriquece os canais discursivos das redes sociais tem como papel linguístico conceitual:",
    correct: "Mitigar a ambiguidade sentimental típica do texto escrito síncrono, agregando marcas paralinguísticas que orientam a interpretação.",
    others: [
      "Substituir integralmente a estrutura sintática verbal por colagens pictográficas infinitas e sem conexões de tempo.",
      "Padronizar de maneira rigorosa a ortografia do português do Brasil conforme as normas gramaticais de 1500.",
      "Inibir a expressão individual emocional forçando os falantes a aderir a uma lista de sentimentos predefinidos.",
      "Extinguir a modalidade oral das línguas faladas mundiais em prol de diálogos unicamente textuais robotizados."
    ]
  },
  {
    topic: "Variação Linguística",
    intro: "Novas expressões nascidas no meio da programação, como 'prompt-falso' (enganar com falsidades) e 'alucinação' (gafe grosseira), foram dicionarizadas no português do Brasil.",
    question: "Sob a ótica da sociolínguística, a incorporação acelerada desse léxico tecnológico na esfera comum ilustra:",
    correct: "O processo dinâmico de produtividade lexical e neologismo decorrente de novas vivências e transformações cibernéticas na sociedade.",
    others: [
      "O empobrecimento irreparável do patrimônio cultural linguístico nacional pela adoção descontrolada de estrangeirismos inúteis.",
      "Uma imposição repressiva unilateral de conglomerados multinacionais visando extinguir gírias regionais tradicionais.",
      "O enfraquecimento das conexões de fala entre gerações de pessoas provocando o analfabetismo funcional total na terceira idade.",
      "O banimento completo do uso de verbos transitivos gerando frases unicamente compostas por adjetivos elogiosos."
    ]
  },
  {
    topic: "Letramento Midiático",
    intro: "Os sofisticados processos de síntese audiovisual hiper-realista por IA (Deepfakes) exigem novas diretrizes para o letramento midiático nas salas de aula brasileiras.",
    question: "O foco central de uma leitura analítica eficiente e crítica diante desses discursos contemporâneos de alta fidelidade é:",
    correct: "Questionar a aparente evidência puramente factual do registro de imagem e vídeo, exigindo cruzamento analítico de fontes paralelas.",
    others: [
      "Aceitar de forma devota e inequívoca todos os dados de som transmitidos pelas mídias corporativas oficiais registradas.",
      "Proibir de maneira sumária o uso de smartphones e computadores para evitar a visualização de fakenews.",
      "Adotar apenas mídias impressas analógicas locais como fontes válidas de informações científicas brasileiras.",
      "Aprender a fabricar e disseminar deepfakes de modo satírico como forma primária de entretenimento despolitizado."
    ]
  },
  {
    topic: "Curadoria Artística",
    intro: "Premiações de arte de 2026 reconheceram obras coautorais geradas por seres humanos em simbiose com softwares generativos de difusão reversa.",
    question: "A aceitação desse tipo inovador de contribuição artística tensiona conceitualmente a semiótica tradicional porque:",
    correct: "Altera o primado do gênio criador único, deslocando a essência da autoria do fazer artesanal purista para a curadoria intelectual.",
    others: [
      "Exclui a participação de jurados humanos delegando a escolha inteiramente a algoritmos centralizados de rede.",
      "Torna as obras físicas tradicionais ilegais pela emissão compulsória de certificados e impostos de registro criptográfico.",
      "Submete todas as expressões estéticas poéticas à obediência de rígidos manuais militares de propaganda estatal.",
      "Inviabiliza a atribuição de valor econômico às peças impedindo o sustento e desenvolvimento de novos designers de base."
    ]
  }
];

export function generateProceduralQuestions(category: string, existingQuestions: Questao[], targetCount: number = 560): Questao[] {
  const result = [...existingQuestions];
  if (result.length >= targetCount) {
    return result;
  }

  const needed = targetCount - result.length;
  // Deterministic seeds based on category string hash
  let categoryHash = 0;
  for (let cIdx = 0; cIdx < category.length; cIdx++) {
    categoryHash += category.charCodeAt(cIdx);
  }

  const random = createRandom(categoryHash);

  for (let i = 0; i < needed; i++) {
    const qIndex = result.length + 1;
    const virtualId = 10000 + qIndex;

    const seedVal = Math.floor(random() * 1000);
    const year = 2026;

    if (category.includes('MATEMATICA')) {
      const templateIdx = seedVal % MATH_CONTEXTS.length;
      const ctx = MATH_CONTEXTS[templateIdx];
      const paramA = 2 + (seedVal % 5); // 2 to 6
      const paramB = 3 + (seedVal % 7); // 3 to 9

      const calcDetails = ctx.calc(paramA, paramB);
      const corretaLetter = ['A', 'B', 'C', 'D', 'E'][seedVal % 5];
      
      const alternativas: Record<string, string> = {};
      let altIdx = 0;
      ['A', 'B', 'C', 'D', 'E'].forEach(l => {
        if (l === corretaLetter) {
          alternativas[l] = calcDetails.correct;
        } else {
          alternativas[l] = calcDetails.others[altIdx++];
        }
      });

      result.push({
        id: virtualId.toString(),
        ano: year.toString(),
        texto_base: `${ctx.topic}. ${ctx.intro} A lei matemática correspondente a essa modelagem no projeto de simulação obedece à equação: ${ctx.formula(paramA, paramB)}.`,
        pergunta: ctx.question(paramA, paramB),
        alternativas: alternativas as any,
        gabarito: corretaLetter
      });

    } else if (category.includes('NATUREZA')) {
      const templateIdx = seedVal % NATUREZA_CONTEXTS.length;
      const ctx = NATUREZA_CONTEXTS[templateIdx];

      const corretaLetter = ['A', 'B', 'C', 'D', 'E'][seedVal % 5];
      const alternativas: Record<string, string> = {};
      let altIdx = 0;
      ['A', 'B', 'C', 'D', 'E'].forEach(l => {
        if (l === corretaLetter) {
          alternativas[l] = ctx.correct;
        } else {
          alternativas[l] = ctx.others[altIdx++];
        }
      });

      result.push({
        id: virtualId.toString(),
        ano: year.toString(),
        texto_base: `${ctx.topic}. ${ctx.intro}`,
        pergunta: ctx.question,
        alternativas: alternativas as any,
        gabarito: corretaLetter
      });

    } else if (category.includes('HUMANAS')) {
      const templateIdx = seedVal % HUMANAS_CONTEXTS.length;
      const ctx = HUMANAS_CONTEXTS[templateIdx];

      const corretaLetter = ['A', 'B', 'C', 'D', 'E'][seedVal % 5];
      const alternativas: Record<string, string> = {};
      let altIdx = 0;
      ['A', 'B', 'C', 'D', 'E'].forEach(l => {
        if (l === corretaLetter) {
          alternativas[l] = ctx.correct;
        } else {
          alternativas[l] = ctx.others[altIdx++];
        }
      });

      result.push({
        id: virtualId.toString(),
        ano: year.toString(),
        texto_base: `${ctx.topic}. ${ctx.intro}`,
        pergunta: ctx.question,
        alternativas: alternativas as any,
        gabarito: corretaLetter
      });

    } else {
      const templateIdx = seedVal % LINGUAGENS_CONTEXTS.length;
      const ctx = LINGUAGENS_CONTEXTS[templateIdx];

      const corretaLetter = ['A', 'B', 'C', 'D', 'E'][seedVal % 5];
      const alternativas: Record<string, string> = {};
      let altIdx = 0;
      ['A', 'B', 'C', 'D', 'E'].forEach(l => {
        if (l === corretaLetter) {
          alternativas[l] = ctx.correct;
        } else {
          alternativas[l] = ctx.others[altIdx++];
        }
      });

      result.push({
        id: virtualId.toString(),
        ano: year.toString(),
        texto_base: `${ctx.topic}. ${ctx.intro}`,
        pergunta: ctx.question,
        alternativas: alternativas as any,
        gabarito: corretaLetter
      });
    }
  }

  return result;
}
