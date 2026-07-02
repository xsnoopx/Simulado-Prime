import { Questao } from '@/hooks/useQuestions';
import { questoes } from './questoes_linguagens_códigos';
import { generateProceduralQuestions } from './questionGenerator';

function mapRawToQuestao(q: any): Questao {
  const rawPergunta = q.pergunta || "";
  const cleanedRawPergunta = rawPergunta.replace(/^(?:QUEST[ÃA]O|Quest[ãa]o)\s*\d+[-)\s]*\s*/i, "").trim();
  const parts = cleanedRawPergunta.split('\n');
  let texto_base = "";
  let pergunta = cleanedRawPergunta;
  if (parts.length > 1) {
    pergunta = parts.pop() || "";
    texto_base = parts.join('\n');
  }

  const alternativas = {
    A: "",
    B: "",
    C: "",
    D: "",
    E: ""
  };

  if (Array.isArray(q.opcoes)) {
    q.opcoes.forEach((opcao: string) => {
      const match = opcao.match(/^([A-E])\)\s*([\s\S]*)/i);
      if (match) {
        const letter = match[1] as 'A' | 'B' | 'C' | 'D' | 'E';
        alternativas[letter] = match[2];
      } else {
        const letter = opcao.trim().charAt(0).toUpperCase() as 'A' | 'B' | 'C' | 'D' | 'E';
        if (['A', 'B', 'C', 'D', 'E'].includes(letter)) {
          alternativas[letter] = opcao.replace(/^[A-E]\s*[-)]\s*/i, '');
        }
      }
    });
  }

  return {
    id: q.id.toString(),
    ano: q.ano?.toString() || '2020',
    texto_base,
    pergunta,
    alternativas,
    gabarito: q.correta || ""
  };
}

const baseData = questoes.perguntas.map(mapRawToQuestao);
export const LINGUAGENS_CODIGOS_E_SUAS_TECNOLOGIAS_DATA: Questao[] = generateProceduralQuestions('LINGUAGENS', baseData, 560);

