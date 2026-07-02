import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, BookOpen } from 'lucide-react';
import { Questao } from '@/hooks/useQuestions';

interface ExpertExplanationProps {
  missedQuestions: Questao[];
  subject: string;
}

export function ExpertExplanation({ missedQuestions, subject }: ExpertExplanationProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{
    topicos: string[];
    planoLeitura: string[];
  } | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (missedQuestions.length === 0) {
      setError('Você não errou nenhuma questão neste simulado!');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const prompt = `
Analise as seguintes questões de ${subject} que um estudante errou no simulado.
Identifique os 2 a 3 tópicos/competências principais em que ele teve dificuldade, baseando-se no conteúdo das questões.
Depois, sugira um pequeno plano de leitura ou estudo focado nesses tópicos para melhorar.

Questões erradas:
${missedQuestions.map((q, i) => `
Questão ${i + 1}:
Texto longo (opcional): ${q.texto_base ? q.texto_base.slice(0, 200) + '...' : 'N/A'}
Pergunta: ${q.pergunta}
Gabarito correto: ${q.gabarito}
`).join('\n')}
      `;

      // Define the required response schema for Gemini
      const responseSchema = {
        type: "OBJECT",
        properties: {
          topicos: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "Lista de 2 a 3 tópicos ou competências identificadas como fracas baseadas no erro."
          },
          planoLeitura: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "Lista de sugestões práticas para um plano de leitura e estudo rápido focando na dificuldade."
          }
        },
        required: ["topicos", "planoLeitura"]
      };

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, responseSchema })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar a análise.');
      }
      
      // text is a JSON string because of the responseMimeType in API
      const parsed = JSON.parse(data.text);
      setAnalysis(parsed);
      
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mt-4 space-y-4">
      {!analysis && (
        <button
          onClick={handleAnalyze}
          disabled={loading || missedQuestions.length === 0}
          className="w-full py-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-display font-bold tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          {loading ? 'ANALISANDO SEUS ERROS...' : 'EXPLICAÇÃO DE ESPECIALISTA'}
        </button>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium text-center">
          {error}
        </div>
      )}

      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 space-y-6 text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] pointer-events-none" />
            
            <div className="flex items-center gap-2 text-indigo-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-display font-bold uppercase tracking-widest text-sm">Análise da IA</h3>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Tópicos para Focar:</h4>
              <ul className="space-y-2">
                {analysis.topicos.map((topico, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-on-surface-variant">
                    <span className="text-indigo-400 font-bold">•</span>
                    {topico}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Plano de Leitura Sugerido:
              </h4>
              <div className="space-y-3">
                {analysis.planoLeitura.map((dica, idx) => (
                  <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-xl text-sm text-on-surface-variant">
                    {dica}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
