/**
 * Gerador de dicas de estudo.
 *
 * A dica nasce do comando da questão e do tema detectado no enunciado —
 * nunca das alternativas. Assim ela orienta o raciocínio sem entregar a
 * resposta e funciona offline, sem depender de IA em tempo real.
 */

export type AreaDica = 'matematica' | 'humanas' | 'linguagens' | 'natureza';

export interface QuestaoComDica {
  pergunta?: string;
  texto_base?: string;
}

interface TemaDica {
  termos: string[];
  dica: string;
}

/** Remove acentos e caixa para comparar palavras-chave com segurança. */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Compara por palavra/frase inteira, não por pedaço de palavra.
 * Evita casos como "romance" ativando o tema "Roma" ou "imediatamente"
 * ativando o tema "média".
 */
function contemTermo(texto: string, termo: string): boolean {
  const escapado = termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escapado}([^a-z0-9]|$)`).test(texto);
}

/**
 * Escolhe o tema mais específico: frases valem mais que palavras soltas e
 * o enunciado vale mais que o texto-base. O limiar recebido define quantos
 * pontos são necessários para o tema valer — nas exatas um termo técnico
 * basta; em Humanas e Linguagens são exigidos dois indícios (ou uma frase).
 * Empates são resolvidos pelo termo mais específico.
 */
function melhorTema(
  pergunta: string,
  apoio: string,
  temas: TemaDica[],
  limiar: number
): TemaDica | null {
  let melhor: TemaDica | null = null;
  let melhorPontos = 0;
  let melhorEspecificidade = 0;

  for (const tema of temas) {
    let pontos = 0;
    let especificidade = 0;
    for (const termo of tema.termos) {
      const peso = termo.includes(' ') ? 3 : 1;
      const forca = termo.length + (termo.includes(' ') ? 20 : 0);
      if (contemTermo(pergunta, termo)) {
        pontos += peso * 2;
        especificidade = Math.max(especificidade, forca);
        continue;
      }
      if (contemTermo(apoio, termo)) {
        pontos += peso;
        especificidade = Math.max(especificidade, forca);
      }
    }
    if (
      pontos > melhorPontos ||
      (pontos > 0 && pontos === melhorPontos && especificidade > melhorEspecificidade)
    ) {
      melhor = tema;
      melhorPontos = pontos;
      melhorEspecificidade = especificidade;
    }
  }

  return melhorPontos >= limiar ? melhor : null;
}

/** Dica extra conforme o verbo/comando da questão. */
function dicaDeComando(pergunta: string): string {
  const p = normalizar(pergunta);

  if (/\bexceto\b|\bincorreta\b|\bincorreto\b|nao se aplica|nao e correto/.test(p)) {
    return 'Atenção: a questão pede a alternativa que NÃO se aplica. Encontre a exceção antes de marcar.';
  }
  if (/\bcausa\b|\bmotivo\b|\bpor que\b/.test(p)) {
    return 'O comando pede a causa: descarte alternativas que apenas descrevem o efeito.';
  }
  if (/\bconsequencia\b|\befeito\b|\bdesdobramento\b/.test(p)) {
    return 'O comando pede a consequência: cuidado com alternativas que trazem causas ou só repetem o texto.';
  }
  if (/\bobjetivo\b|\bfinalidade\b|\bproposito\b|\bpara que\b/.test(p)) {
    return 'O comando pede o objetivo (o “para quê”), não apenas a descrição do fato.';
  }
  if (/\bintencao\b|\bpretende\b/.test(p)) {
    return 'O comando pede a intenção do enunciador: diferencie o que o texto diz do efeito que ele quer produzir.';
  }
  if (/\binfere\b|\binferencia\b|\bdepreende\b|\bsubentende\b|\bconclui\b/.test(p)) {
    return 'O comando pede uma inferência: a resposta precisa ser sustentada pelo texto, mesmo sem estar escrita literalmente.';
  }
  if (/\bfuncao\b|\bpapel\b/.test(p)) {
    return 'O comando pede a função: identifique o papel do elemento ou a relação de dependência entre as grandezas.';
  }
  if (/\bautor\b/.test(p) && /defende|afirma|sustenta|argumenta/.test(p)) {
    return 'O comando pede a posição do autor: identifique a tese, não o assunto geral do texto.';
  }
  return '';
}

const TEMAS_MATEMATICA: TemaDica[] = [
  {
    termos: ['porcentagem', 'porcentagens', 'por cento', 'desconto', 'juros', 'acrescimo', 'taxa de', 'aumento de', 'aumento da', 'aumento percentual', 'reajuste', 'reajustada'],
    dica:
      'Porcentagem: transforme a taxa em fator multiplicativo (20% = ×1,20; desconto de 20% = ×0,80) e confira se ela incide sobre o valor inicial ou sobre o valor já alterado.',
  },
  {
    termos: ['probabilidade', 'probabilidades', 'chance', 'sorteio', 'aleatoriamente', 'dado honesto', 'moeda'],
    dica:
      'Probabilidade: conte os casos possíveis e os favoráveis. Em retiradas sucessivas, verifique se há reposição antes de multiplicar as chances.',
  },
  {
    termos: ['media', 'medias', 'mediana', 'moda', 'desvio', 'amostra'],
    dica:
      'Estatística: média, mediana e moda medem coisas diferentes. Organize os dados em ordem e veja se a questão pede tendência central, dispersão ou leitura de gráfico.',
  },
  {
    termos: ['graficos', 'leitura de grafico', 'eixo das', 'eixo vertical', 'eixo horizontal'],
    dica:
      'Leitura de gráficos: identifique o que cada eixo mede e as unidades. Em gráficos de velocidade por tempo, a área representa a distância percorrida.',
  },
  {
    termos: ['funcao', 'funcoes', 'f(x)', 'parabola', 'coeficiente', 'dominio', 'contra-dominio'],
    dica:
      'Função: identifique a variável independente, o coeficiente angular (variação) e o linear (valor inicial). Substituir os pontos dados costuma revelar a lei da função.',
  },
  {
    termos: ['area', 'areas', 'perimetro', 'triangulo', 'retangulo', 'circulo', 'trapezio', 'poligono', 'semelhanca'],
    dica:
      'Geometria plana: desenhe a figura, marque as medidas e veja quais relações ligam os dados — semelhança, Teorema de Pitágoras ou fórmulas de área.',
  },
  {
    termos: ['volume', 'volumes', 'cilindro', 'cone', 'esfera', 'prisma', 'piramide', 'paralelepipedo', 'mililitro', 'litro', 'capacidade'],
    dica:
      'Geometria espacial: separe área da superfície de volume e confira as unidades. Um esboço com as dimensões ajuda a escolher a fórmula.',
  },
  {
    termos: ['seno', 'cosseno', 'tangente', 'trigonometria', 'angulo'],
    dica:
      'Trigonometria: identifique o triângulo retângulo e escolha a razão que relaciona o ângulo aos lados dados (seno, cosseno ou tangente).',
  },
  {
    termos: ['progressao aritmetica', 'progressao geometrica', 'termo geral', 'razao da pa', 'razao da pg'],
    dica:
      'PA/PG: encontre a razão e use o termo geral. Na PA a diferença entre termos é constante; na PG, a divisão entre termos consecutivos é constante.',
  },
  {
    termos: ['algarismo', 'contagem', 'quantidade minima', 'numero de possibilidades'],
    dica:
      'Contagem: organize os casos por etapa (por exemplo, andar por andar) e some as possibilidades. Cuidado para não contar o mesmo caso duas vezes.',
  },
  {
    termos: ['combinacao', 'combinacoes', 'permutacao', 'arranjo', 'fatorial', 'anagrama', 'anagramas', 'quantas maneiras', 'de quantas formas', 'numero de possibilidades'],
    dica:
      'Análise combinatória: pergunte se a ordem importa. Se importa, é arranjo/permutação; se não, é combinação — e cuidado com repetições.',
  },
  {
    termos: ['logaritmo', 'logaritmos', 'exponencial', 'exponenciais', 'potenciacao'],
    dica:
      'Logaritmos e exponenciais: use a relação logₐ(b) = x ⇔ aˣ = b e lembre as propriedades de produto, quociente e potência.',
  },
  {
    termos: ['matriz', 'determinante'],
    dica:
      'Matrizes: confira a ordem das matrizes antes de multiplicar e lembre que, em geral, a multiplicação não é comutativa.',
  },
  {
    termos: ['regra de tres', 'proporcao', 'escala', 'diretamente proporcional', 'inversamente proporcional'],
    dica:
      'Proporção: monte a regra de três alinhando grandezas da mesma espécie e verifique se são diretamente ou inversamente proporcionais.',
  },
  {
    termos: ['equacao', 'equacoes', 'inequacao', 'incognita'],
    dica:
      'Equações: isole a incógnita passo a passo e substitua o valor encontrado na equação original para conferir.',
  },
];

const TEMAS_HUMANAS: TemaDica[] = [
  {
    termos: ['escravidao', 'escravo', 'escravos', 'abolicao', 'abolicionismo', 'quilombo'],
    dica:
      'Escravidão: relacione o fato ao contexto econômico e às resistências (quilombos, revoltas, abolicionismo). Desconfie de alternativas que suavizam a violência do sistema.',
  },
  {
    termos: ['brasil colonia', 'colonial', 'capitania', 'pau-brasil', 'bandeirante', 'metropole', 'mercantilismo', 'pirataria', 'corsario', 'independencia do brasil', 'processo de independencia'],
    dica:
      'Brasil colonial: situe o fato entre exploração metropolitana, economia açucareira ou mineradora e resistências locais. Evite projetar valores atuais no período.',
  },
  {
    termos: ['imperio', 'dom pedro', 'regencia', 'segundo reinado'],
    dica:
      'Brasil imperial: conecte o acontecimento aos conflitos entre elite agrária, centralização política e pressões abolicionistas e republicanas.',
  },
  {
    termos: ['republica', 'proclamacao', 'coronelismo', 'era vargas', 'getulio'],
    dica:
      'República: observe a disputa entre oligarquias, trabalhadores e Estado. Em Vargas, separe o período autoritário (1937–1945) das fases democráticas.',
  },
  {
    termos: ['ditadura', 'regime militar', 'ai-5', '1964'],
    dica:
      'Ditadura militar: associe o fato à lógica de segurança nacional, censura e aliança com setores civis. Atenção a alternativas que tratam o regime como algo monolítico.',
  },
  {
    termos: ['revolucao industrial', 'industrializacao', 'maquina a vapor', 'operariado'],
    dica:
      'Revolução Industrial: ligue a transformação técnica às mudanças nas relações de trabalho, à urbanização e ao aumento das desigualdades.',
  },
  {
    termos: ['iluminismo', 'revolucao francesa', 'jacobino', 'bastilha'],
    dica:
      'Iluminismo e Revolução Francesa: relacione as ideias de razão, liberdade e igualdade jurídica ao fim dos privilégios de estamento.',
  },
  {
    termos: ['primeira guerra', 'segunda guerra', 'nazismo', 'fascismo', 'holocausto'],
    dica:
      'Guerras mundiais: situe o fato entre nacionalismos, alianças e disputas imperialistas. Verifique se a alternativa descreve causa, desenvolvimento ou consequência.',
  },
  {
    termos: ['guerra fria', 'urss', 'socialismo', 'capitalismo', 'muro de berlim'],
    dica:
      'Guerra Fria: pense na oposição EUA–URSS e nos desdobramentos na América Latina. Não confunda socialismo com políticas sociais.',
  },
  {
    termos: ['feudal', 'feudalismo', 'idade media', 'senhor feudal', 'servo'],
    dica:
      'Feudalismo: relacione terra, trabalho servil e poder descentralizado. O servo não era escravo: havia obrigações, mas não propriedade da pessoa.',
  },
  {
    termos: ['grecia', 'roma', 'antiguidade', 'mesopotamia', 'egito'],
    dica:
      'Antiguidade: situe o povo e o período antes de comparar instituições. Grécia e Roma têm modelos políticos e sociais distintos.',
  },
  {
    termos: ['indigena', 'indigenas', 'povos originarios', 'yanomami', 'xavante', 'guarani', 'tupi', 'bem viver'],
    dica:
      'Povos indígenas: considere a diversidade de etnias e o protagonismo histórico. Evite tratá-los como categoria homogênea ou passiva.',
  },
  {
    termos: ['cultura popular', 'patrimonio imaterial', 'tradicao oral', 'contador de historias', 'folclore', 'manifestacao cultural', 'saberes tradicionais'],
    dica:
      'Cultura popular: trate a manifestação como patrimônio vivo, ligado à memória e à identidade do grupo. Evite julgá-la por padrões eruditos.',
  },
  {
    termos: ['urbanizacao', 'metropole', 'exodo rural', 'espaco urbano', 'brasilia', 'mobilidade urbana', 'segregacao socioespacial', 'urbanismo', 'cidade planejada'],
    dica:
      'Urbanização: relacione êxodo rural, industrialização e estrutura fundiária. Observe se a questão fala de causa ou de consequência.',
  },
  {
    termos: ['agricultura', 'agraria', 'reforma agraria', 'latifundio', 'apropriacao da terra', 'posse da terra', 'concentracao de terra', 'estrutura fundiaria'],
    dica:
      'Questão agrária: relacione concentração de terra, tecnologia e conflitos sociais no campo. Veja se o comando pede causa, consequência ou característica.',
  },
  {
    termos: ['globalizacao', 'mundializacao', 'blocos economicos'],
    dica:
      'Globalização: pense em fluxos econômicos, divisão internacional do trabalho e desigualdades. Cuidado com alternativas que prometem benefícios iguais para todos.',
  },
  {
    termos: ['cidadania', 'direitos', 'constituicao', 'democracia', 'voto', 'eleicao', 'eleicoes', 'sufragio', 'tribunal constitucional'],
    dica:
      'Cidadania: diferencie direitos civis, políticos e sociais e identifique quais grupos foram excluídos em cada período. Observe se o comando trata da conquista ou da efetivação do direito.',
  },
  {
    termos: ['filosofia', 'filosofo', 'platao', 'aristoteles', 'socrates', 'descartes', 'kant', 'tomas de aquino', 'rousseau', 'locke', 'hobbes', 'nietzsche', 'morte', 'existencialismo', 'existencialista', 'finitude'],
    dica:
      'Filosofia: identifique o autor, a corrente e o problema em debate (conhecimento, ética ou política). Compare as alternativas pelo argumento, não pela fama do filósofo.',
  },
  {
    termos: ['etica', 'moralidade', 'bentham', 'utilitarismo', 'virtude', 'juizo moral'],
    dica:
      'Ética: distinga descrever um costume de justificar uma norma. O comando costuma pedir o princípio que fundamenta a ação, não o hábito em si.',
  },
  {
    termos: ['meio ambiente', 'ambiental', 'sustentabilidade', 'desenvolvimento sustentavel', 'degradacao', 'desmatamento', 'poluicao', 'biodiversidade', 'mudanca climatica', 'mudancas climaticas', 'veredas', 'compensacao ambiental', 'credito de carbono'],
    dica:
      'Meio ambiente: separe a causa (uso do solo, emissões, desmatamento) da consequência (escassez, perda de biodiversidade). Confira qual das duas o comando pede.',
  },
  {
    termos: ['migracao', 'migratorio', 'imigrante', 'imigracao', 'refugiado', 'refugiados', 'movimento migratorio'],
    dica:
      'Migrações: diferencie o fator de expulsão (guerra, perseguição, economia) do efeito no destino (urbanização, xenofobia, remessas). O comando costuma pedir o impulso do deslocamento.',
  },
  {
    termos: ['mundo do trabalho', 'trabalhador', 'trabalhadores', 'operario', 'operariado', 'sindicato', 'direitos trabalhistas', 'jornada de trabalho'],
    dica:
      'Mundo do trabalho: relacione a mudança técnica ou econômica à condição do trabalhador (jornada, salário, informalidade). Evite alternativas que descrevem a técnica sem tratar do trabalho.',
  },
  {
    termos: ['tecnologia', 'tecnologias', 'tecnologico', 'inovacao', 'inteligencia artificial', 'microeletronica', 'digital', 'internet', 'iluminacao', 'ferrovia'],
    dica:
      'Tecnologia: identifique a inovação e o setor afetado. A questão costuma cobrar o efeito social ou econômico dela, não apenas a descrição do dispositivo.',
  },
  {
    termos: ['mercantilizacao', 'mercado', 'neoliberalismo', 'privatizacao', 'sociedade de consumo', 'consumismo', 'austeridade'],
    dica:
      'Economia e mercado: relacione a prática ao interesse econômico que a sustenta e aos efeitos sociais. Desconfie de alternativas que tratam o mercado como algo neutro.',
  },
  {
    termos: ['modernidade', 'modernizacao', 'mundo moderno', 'seculo xvii', 'ruptura'],
    dica:
      'Modernidade: associe o termo às transformações sociais, técnicas e culturais que rompem com a ordem anterior. Não trate modernidade como sinônimo automático de progresso.',
  },
  {
    termos: ['saude publica', 'doenca', 'epidemia', 'vacina', 'saneamento', 'moribundos', 'febris'],
    dica:
      'Saúde pública: relacione a medida sanitária ao problema coletivo que ela enfrenta. Diferencie prevenção de tratamento e atenção individual de política pública.',
  },
  {
    termos: ['arte', 'artistico', 'pintura', 'escultura', 'fotografia', 'vanguarda', 'exposicao de arte'],
    dica:
      'Arte: identifique a linguagem, o suporte e o contexto de produção. A questão costuma cobrar a ruptura estética ou a crítica social, não só o estilo.',
  },
  {
    termos: ['patrimonio', 'patrimonio historico', 'patrimonio cultural', 'memoria', 'identidade cultural', 'manifestacoes culturais', 'festas populares', 'destruicao de patrimonio'],
    dica:
      'Cultura e memória: trate a manifestação como patrimônio vivo, ligado à identidade do grupo. Evite julgá-la por padrões eruditos ou por valores de outra época.',
  },
  {
    termos: ['geopolitica', 'territorio', 'fronteira', 'soberania', 'nacao', 'estado nacional'],
    dica:
      'Geopolítica: localize os atores (Estados, blocos, empresas) e o interesse em disputa. O comando costuma pedir a razão estratégica, não a descrição do mapa.',
  },
  {
    termos: ['energia', 'hidreletrica', 'usina', 'petroleo', 'mineracao', 'minerios', 'extrativismo', 'jazidas'],
    dica:
      'Recursos e energia: relacione a exploração ao território, aos atores econômicos e aos impactos socioambientais. O comando costuma pedir o conflito em jogo.',
  },
  {
    termos: ['religiao', 'religioso', 'igreja', 'cristianismo', 'catolicismo', 'protestantismo'],
    dica:
      'Religião: situe a prática no contexto histórico e nas relações de poder. Evite ler o passado com categorias religiosas atuais.',
  },
  {
    termos: ['movimento social', 'movimentos sociais', 'protesto', 'manifestacao popular', 'manifestacoes', 'revolta', 'resistencia', 'repressao', 'coibicao'],
    dica:
      'Movimentos sociais: identifique sujeitos, reivindicações e formas de ação. A questão costuma cobrar o significado político da mobilização.',
  },
  {
    termos: ['absolutismo', 'monarquia', 'soberano', 'estado moderno', 'centralizacao do poder', 'limitacao do poder'],
    dica:
      'Estado moderno: observe a disputa entre centralização e limites ao poder (leis, parlamento, direitos). O comando costuma cobrar o que mudou na organização política.',
  },
  {
    termos: ['mapa', 'mapas', 'coordenadas', 'latitude', 'longitude', 'fuso horario', 'escala cartografica', 'trajeto', 'cartografia'],
    dica:
      'Cartografia: identifique o tipo de mapa, a escala e a legenda antes de interpretar o fenômeno. Distância no papel e distância real não são a mesma coisa.',
  },
];

const TEMAS_LINGUAGENS: TemaDica[] = [
  {
    termos: ['figura de linguagem', 'figuras de linguagem', 'metafora', 'metonimia', 'ironia', 'hiperbole', 'personificacao', 'antitese'],
    dica:
      'Figura de linguagem: identifique o efeito de sentido produzido no contexto, não apenas o significado literal da palavra.',
  },
  {
    termos: ['genero textual', 'generos textuais', 'genero discursivo', 'cronica', 'conto', 'poema', 'noticia', 'reportagem', 'artigo de opiniao', 'entrevista', 'carta'],
    dica:
      'Gênero textual: observe finalidade, suporte e interlocutor. A mesma informação muda de forma conforme o gênero.',
  },
  {
    termos: ['variacao linguistica', 'variacoes linguisticas', 'preconceito linguistico', 'norma culta', 'dialeto', 'sotaque', 'coloquial', 'linguagem coloquial', 'escolhas linguisticas', 'variedade informal'],
    dica:
      'Variação linguística: diferencie norma-padrão de variedades regionais e sociais. Nenhuma variedade é “errada”; o adequado depende do contexto.',
  },
  {
    termos: ['concordancia', 'regencia', 'crase', 'pontuacao', 'ortografia', 'sintaxe', 'morfologia'],
    dica:
      'Gramática: releia a frase completa e teste a substituição ou a retirada do termo. Concordância, regência e crase dependem da estrutura, não da sonoridade.',
  },
  {
    termos: ['literatura', 'modernismo', 'romantismo', 'realismo', 'naturalismo', 'barroco', 'arcadismo', 'parnasianismo', 'simbolismo'],
    dica:
      'Literatura: situe a obra no movimento e observe as marcas de estilo (linguagem, tema, visão de mundo) antes de comparar as alternativas.',
  },
  {
    termos: ['funcao da linguagem', 'funcoes da linguagem', 'conativa', 'fatica', 'metalinguistica', 'poetica', 'referencial', 'emissor', 'receptor'],
    dica:
      'Funções da linguagem: identifique o elemento em destaque (emissor, receptor, mensagem, código, canal ou contexto) — é ele que define a função.',
  },
  {
    termos: ['intertextualidade', 'intertexto', 'parodia', 'parafrase', 'dialogo entre textos'],
    dica:
      'Intertextualidade: compare os dois textos e veja se o segundo reforça, critica ou subverte o primeiro. Paródia e paráfrase não são a mesma coisa.',
  },
  {
    termos: ['coesao', 'coerencia', 'conectivo', 'anafo'],
    dica:
      'Coesão: siga os conectivos e os pronomes para saber a que cada termo se refere. Troque o conectivo por outro equivalente e veja se o sentido se mantém.',
  },
  {
    termos: ['publicidade', 'propaganda', 'anuncio', 'campanha publicitaria', 'marketing', 'slogan'],
    dica:
      'Publicidade: observe o público-alvo, o recurso persuasivo e a promessa feita. O comando costuma pedir a intenção do enunciador ou o efeito de sentido.',
  },
  {
    termos: ['charge', 'tirinha', 'cartum', 'humor', 'comicidade', 'critica social'],
    dica:
      'Humor e crítica: identifique o alvo da crítica e o recurso que a constrói (ironia, exagero, contraste). A charge não ilustra o fato: ela o interpreta.',
  },
  {
    termos: ['musica', 'cancao', 'letra de musica', 'samba', 'rap', 'mpb', 'ritmo', 'melodia', 'composicao', 'rock', 'pop', 'folclorica'],
    dica:
      'Música e canção: separe a letra (o que é dito) da melodia e do ritmo (como é dito). As marcas sociais da letra sustentam a interpretação.',
  },
  {
    termos: ['esporte', 'olimpiada', 'olimpiadas', 'jogos olimpicos', 'atleta', 'esporte radical', 'parasurf', 'surfe', 'futebol', 'volei', 'exergame', 'exergames', 'saude', 'atividade fisica'],
    dica:
      'Esporte e sociedade: observe valores, interesses econômicos e mudanças de regra. O texto costuma usar o esporte para falar de algo maior.',
  },
  {
    termos: ['arte', 'artistico', 'pintura', 'pintor', 'escultura', 'fotografia', 'vanguarda', 'exposicao', 'xilogravura', 'gravura', 'danca', 'ilustracao', 'surrealismo', 'onirico'],
    dica:
      'Arte e linguagem: identifique suporte, técnica e contexto. A ruptura estética costuma ser o ponto cobrado, não a biografia do artista.',
  },
  {
    termos: ['narrador', 'narradora', 'personagem', 'personagens', 'narrativa', 'enredo', 'ficcao', 'foco narrativo'],
    dica:
      'Narrativa: localize narrador, ponto de vista e conflito. O efeito de sentido nasce de como a história é contada, não apenas do que acontece.',
  },
  {
    termos: ['midia', 'redes sociais', 'software livre', 'cultura digital', 'tecnologia digital', 'algoritmo'],
    dica:
      'Mídia e cultura digital: identifique quem produz, quem distribui e quem lucra com a informação. O comando costuma cobrar um efeito social dessa mediação.',
  },
  {
    termos: ['argumento', 'argumentacao', 'argumentativo', 'tese do autor', 'persuasao', 'dissertacao', 'procedimentos argumentativos', 'direitos humanos'],
    dica:
      'Argumentação: separe tese, argumentos e conclusão. A alternativa correta costuma respeitar o recorte do texto, sem generalizações.',
  },
];

const TEMAS_NATUREZA: TemaDica[] = [
  {
    termos: ['velocidade', 'aceleracao', 'movimento', 'queda livre', 'mru', 'mruv'],
    dica:
      'Cinemática: anote posição, velocidade e tempo com unidades iguais. No movimento uniforme, v = Δs/Δt; na queda livre, a aceleração é constante.',
  },
  {
    termos: ['forca', 'newton', 'atrito', 'peso', 'tensao', 'plano inclinado'],
    dica:
      'Leis de Newton: desenhe as forças em cada corpo e escolha um sentido positivo. Atrito e tração entram no somatório de forças.',
  },
  {
    termos: ['energia', 'trabalho', 'potencia', 'cinetica', 'potencial'],
    dica:
      'Energia: verifique se há conservação ou dissipação. Trabalho, potência e energia se conectam pela variação, não pelo valor absoluto.',
  },
  {
    termos: ['meia-vida', 'radioativo', 'radioatividade', 'decaimento radioativo'],
    dica:
      'Radioatividade: a cada meia-vida a quantidade cai pela metade. Conte quantas meias-vidas cabem no tempo total antes de calcular a massa restante.',
  },
  {
    termos: ['radiacao', 'eletromagnetica', 'onda eletromagnetica', 'ultravioleta', 'infravermelho', 'radiacao ionizante'],
    dica:
      'Radiação: diferencie radiação ionizante de não ionizante e relacione frequência, energia e poder de penetração. Quanto maior a frequência, maior a energia.',
  },
  {
    termos: ['corrente', 'resistor', 'circuito', 'ohm', 'carga eletrica', 'campo eletrico'],
    dica:
      'Eletricidade: identifique se o circuito é em série (mesma corrente) ou paralelo (mesma tensão) e aplique U = R·i.',
  },
  {
    termos: ['onda', 'luz', 'reflexao', 'refracao', 'lente', 'espelho', 'frequencia', 'frequencias', 'som', 'sirene', 'doppler'],
    dica:
      'Óptica e ondas: relacione frequência, comprimento de onda e velocidade (v = λ·f). Na refração, a frequência não muda.',
  },
  {
    termos: ['calor', 'temperatura', 'termica', 'dilatacao', 'calorimetria'],
    dica:
      'Termologia: diferencie calor de temperatura e verifique mudança de estado. Em trocas de calor, a soma das quantidades cedidas e recebidas é zero.',
  },
  {
    termos: ['pressao', 'empuxo', 'densidade', 'flutua', 'hidrostatica'],
    dica:
      'Hidrostática: compare densidades para prever flutuação e use p = p₀ + ρgh para a pressão em líquidos.',
  },
  {
    termos: ['estequiometria', 'balanceamento', 'mol', 'massa molar'],
    dica:
      'Estequiometria: balanceie a equação, converta para mol e use as proporções. Só depois volte para massa, volume ou número de partículas.',
  },
  {
    termos: ['ph', 'acido', 'titulacao', 'solubilidade', 'solucao aquosa', 'concentracao molar'],
    dica:
      'Soluções: concentração é quantidade de soluto por volume ou massa de solução. Em misturas, some as quantidades de soluto e os volumes antes de recalcular.',
  },
  {
    termos: ['ligacao', 'ligacoes quimicas', 'ionica', 'covalente', 'metalica', 'polaridade'],
    dica:
      'Ligações químicas: compare eletronegatividade e tipo de interação. A iônica envolve transferência de elétrons; a covalente, compartilhamento.',
  },
  {
    termos: ['quimica organica', 'grupo funcional', 'hidrocarboneto', 'isomeria'],
    dica:
      'Química orgânica: identifique a função e o grupo funcional antes de prever propriedades ou reações.',
  },
  {
    termos: ['pilha', 'eletrolise', 'eletroquimica', 'anodo', 'catodo', 'eletrons', 'oxidacao de eletrons', 'reducao de eletrons', 'reacao de oxidacao', 'reacao de reducao'],
    dica:
      'Eletroquímica: separe oxidação (perda de elétrons) de redução (ganho). Na pilha o ânodo oxida; na eletrólise o processo é forçado.',
  },
  {
    termos: ['cinetica', 'equilibrio', 'catalisador', 'velocidade da reacao'],
    dica:
      'Cinética e equilíbrio: concentração, pressão e temperatura deslocam a reação em sentidos diferentes. Catalisador acelera, mas não desloca o equilíbrio.',
  },
  {
    termos: ['celula', 'membrana', 'mitocondria', 'organela', 'mitose', 'meiose'],
    dica:
      'Célula: relacione cada organela à sua função e lembre as diferenças entre célula procarionte e eucarionte.',
  },
  {
    termos: ['genetica', 'dna', 'rna', 'heredograma', 'alelo', 'cromossomo'],
    dica:
      'Genética: monte o quadro de cruzamento e separe genótipo de fenótipo. Em heredogramas, comece pelos indivíduos afetados.',
  },
  {
    termos: ['evolucao biologica', 'selecao natural', 'darwin'],
    dica:
      'Evolução: a seleção natural atua sobre variação já existente; não é “esforço” do indivíduo nem progresso rumo à perfeição.',
  },
  {
    termos: ['ecossistema', 'cadeia alimentar', 'populacao', 'habitat', 'bioma', 'sustentabilidade'],
    dica:
      'Ecologia: siga o fluxo de energia e as relações alimentares. A energia diminui ao longo da cadeia; a matéria cicla.',
  },
  {
    termos: ['hormonio', 'sangue', 'anemia', 'digestao', 'respiracao', 'neuronio', 'imunidade', 'fisiologia'],
    dica:
      'Fisiologia: localize o sistema e sua função integrada. Hormônios e nervos costumam agir por feedback.',
  },
  {
    termos: ['planta', 'fotossintese', 'bacteria', 'virus', 'fungo'],
    dica:
      'Seres vivos: relacione estrutura, ambiente e modo de vida. Fungos não são plantas e vírus não são células.',
  },
];

const DICAS_PADRAO: Record<AreaDica, string> = {
  matematica:
    'Separe os dados do que é pedido e escreva a relação entre as grandezas antes de calcular. Uma estimativa rápida ajuda a descartar resultados absurdos.',
  humanas:
    'Localize no texto ou no contexto o trecho que trata diretamente do tema e elimine alternativas que extrapolam o que é possível afirmar.',
  linguagens:
    'A resposta deve se sustentar no texto: localize o trecho que atende ao comando e evite opiniões externas ou conclusões que o autor não autoriza.',
  natureza:
    'Identifique o fenômeno e as grandezas envolvidas; escreva a lei ou o conceito que relaciona os dados antes de comparar as alternativas.',
};

const BANCOS: Record<AreaDica, TemaDica[]> = {
  matematica: TEMAS_MATEMATICA,
  humanas: TEMAS_HUMANAS,
  linguagens: TEMAS_LINGUAGENS,
  natureza: TEMAS_NATUREZA,
};

/**
 * Nas exatas o vocabulário é técnico e um único termo já costuma bastar.
 * Em Humanas e Linguagens as palavras são mais ambíguas, então exigimos
 * pelo menos dois indícios (ou uma frase feita) para escolher o tema.
 */
const LIMIAR_TEMA: Record<AreaDica, number> = {
  matematica: 1,
  natureza: 1,
  humanas: 2,
  linguagens: 2,
};

/**
 * Gera uma dica curta e contextualizada para a questão atual.
 * Retorna string vazia quando ainda não há questão carregada.
 */
export function gerarDica(area: AreaDica, questao?: QuestaoComDica | null): string {
  if (!questao) return '';

  const pergunta = normalizar(questao.pergunta || '');
  const apoio = normalizar(questao.texto_base || '');
  const banco = BANCOS[area] || BANCOS.linguagens;

  // O enunciado decide sozinho quando reconhece um tema; o texto-base só
  // entra quando o comando da questão não dá nenhuma pista temática.
  const tema =
    melhorTema(pergunta, '', banco, LIMIAR_TEMA[area]) ||
    melhorTema('', apoio, banco, LIMIAR_TEMA[area]);
  const base = tema ? tema.dica : DICAS_PADRAO[area];
  const comando = dicaDeComando(pergunta);

  return comando ? `${comando} ${base}` : base;
}
