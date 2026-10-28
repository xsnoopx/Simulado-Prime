import { createClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://tobdeehicqircazdtbnx.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvYmRlZWhpY3FpcmNhemR0Ym54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNTUwMzksImV4cCI6MjA5NDczMTAzOX0.VY3oMLeg94CJmsTfta8550iIrFo68mtJO3XlN3eLYeg';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_KEY;

// Não há mais wrapper de fetch. Antes, um "Failed to fetch" era convertido em
// HTTP 200 com corpo {} — o que fazia falha de rede passar por sucesso: ranking
// vazio, lista vazia, sessão "válida" sem usuário. Agora o erro chega a quem
// chamou e o app mostra a mensagem de conexão.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

let dynamicSupabaseClient: any = null;

export async function getSupabase() {
  if (typeof window === 'undefined') {
    const serverUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_URL;
    const serverKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_KEY;
    return createClient(serverUrl, serverKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
  }

  if (dynamicSupabaseClient) {
    return dynamicSupabaseClient;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('/api/supabase-config', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const config = await res.json();
      if (config.supabaseUrl && config.supabaseAnonKey) {
        // Se o runtime devolve a mesma configuração do build, reaproveita o
        // singleton. Criar um segundo client fazia o GoTrue reclamar de
        // "Multiple GoTrueClient instances" e duplicava listeners de auth.
        if (
          config.supabaseUrl === supabaseUrl &&
          config.supabaseAnonKey === supabaseAnonKey
        ) {
          dynamicSupabaseClient = supabase;
          return dynamicSupabaseClient;
        }

        dynamicSupabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false
          }
        });
        return dynamicSupabaseClient;
      }
    }
  } catch (err) {
    // Configuração de runtime indisponível: segue com a do build.
    console.log("Using build-time Supabase client configuration.");
  }

  dynamicSupabaseClient = supabase;
  return dynamicSupabaseClient;
}
