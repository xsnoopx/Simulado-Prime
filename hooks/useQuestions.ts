import { useState, useEffect } from 'react';

export interface Questao {
  id: string;
  ano: string;
  texto_base: string;
  pergunta: string;
  alternativas: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  gabarito: string;
}

export function useQuestions(categoria: string, localData: Questao[]) {
  const [questions, setQuestions] = useState<Questao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const shuffled = [...localData].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setLoading(false);
  }, [categoria, localData]);

  return { questions, setQuestions, loading };
}
