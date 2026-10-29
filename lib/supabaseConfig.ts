// Configuração do Supabase compartilhada entre o cliente e a rota
// /api/supabase-config.
//
// A chave anon é pública por natureza (vai no bundle), mas precisa ser a do
// mesmo projeto da URL. Se a variável de ambiente vier de outro projeto (ou
// com um caractere trocado), o Supabase responde "Invalid API key" e ninguém
// consegue entrar. Aqui a gente confere o claim `ref` do JWT com o subdomínio
// da URL e, se não bater, usa a configuração padrão do app em vez de derrubar
// o login.

export const DEFAULT_SUPABASE_URL = 'https://tobdeehicqircazdtbnx.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvYmRlZWhpY3FpcmNhemR0Ym54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNTUwMzksImV4cCI6MjA5NDczMTAzOX0.VY3oMLeg94CJmsTfta8550iIrFo68mtJO3XlN3eLYeg';

function refDoProjeto(url: string): string | null {
  try {
    return new URL(url).hostname.split('.')[0] || null;
  } catch {
    return null;
  }
}

// Devolve o `ref` do projeto dentro do JWT, ou null quando a chave não é um
// JWT (as chaves novas `sb_publishable_...` não são).
function refDaChave(key: string): string | null {
  const payload = key.split('.')[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const data = JSON.parse(json);
    return typeof data.ref === 'string' ? data.ref : null;
  } catch {
    return null;
  }
}

export function resolveSupabaseConfig(
  envUrl?: string | null,
  envKey?: string | null
): { supabaseUrl: string; supabaseAnonKey: string } {
  const url = envUrl || DEFAULT_SUPABASE_URL;
  const key = envKey || DEFAULT_SUPABASE_ANON_KEY;
  const refUrl = refDoProjeto(url);
  const refKey = refDaChave(key);

  // Chave em formato novo (não-JWT) ou sem `ref`: não dá para validar aqui,
  // então confia na configuração.
  if (!refKey) {
    return { supabaseUrl: url, supabaseAnonKey: key };
  }

  if (refUrl && refKey === refUrl) {
    return { supabaseUrl: url, supabaseAnonKey: key };
  }

  console.warn(
    `[supabase] A chave anon configurada pertence ao projeto "${refKey}", mas a URL é "${url}" (ref "${refUrl}"). Usando a configuração padrão do app.`
  );
  return {
    supabaseUrl: DEFAULT_SUPABASE_URL,
    supabaseAnonKey: DEFAULT_SUPABASE_ANON_KEY,
  };
}
