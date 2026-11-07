export type CategoriaCharadaId =
  | 'classicas'
  | 'trocadilhos'
  | 'animais'
  | 'comida'
  | 'escola'
  | 'profissoes'
  | 'geografia'
  | 'logica'
  | 'matematica';

export type DificuldadeCharada = 'Simples' | 'Médio' | 'Complexo';

export interface Charada {
  id: string;
  pergunta: string;
  resposta: string;
  dica?: string;
  explicacao?: string;
  categoria: CategoriaCharadaId;
  dificuldade: DificuldadeCharada;
  tags?: string[];
  fonte?: string;
}

export interface CategoriaCharada {
  id: CategoriaCharadaId;
  label: string;
  emoji: string;
  descricao: string;
}
