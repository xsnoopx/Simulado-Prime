export type CategoriaEnigmaId =
  | 'classicos'
  | 'logica'
  | 'matematica'
  | 'palavras'
  | 'lateral'
  | 'misterio'
  | 'ciencia'
  | 'historia';

export type DificuldadeEnigma = 'Simples' | 'Médio' | 'Complexo';

export interface Enigma {
  id: string;
  titulo: string;
  enigma: string;
  resposta: string;
  dica?: string;
  explicacao?: string;
  categoria: CategoriaEnigmaId;
  dificuldade: DificuldadeEnigma;
  tags?: string[];
  fonte?: string;
}

export interface CategoriaEnigma {
  id: CategoriaEnigmaId;
  label: string;
  emoji: string;
  descricao: string;
}
