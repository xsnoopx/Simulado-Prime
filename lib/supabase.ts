import { createClient } from '@supabase/supabase-js';
import { resolveSupabaseConfig } from './supabaseConfig';

const buildConfig = resolveSupabaseConfig(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const supabaseUrl = buildConfig.supabaseUrl;
const supabaseAnonKey = buildConfig.supabaseAnonKey;

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
    const serverConfig = resolveSupabaseConfig(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    );
    return createClient(serverConfig.supabaseUrl, serverConfig.supabaseAnonKey, {
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
