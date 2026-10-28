import { getSupabase } from './supabase';

export const AI_AUTH_REQUIRED_MESSAGE =
  'Entre na sua conta para usar os recursos de inteligência artificial.';

export interface AiResponse {
  text: string;
}

/**
 * Calls the server-side AI proxy with the current Supabase session token.
 * The proxy rejects anonymous calls, so a signed-in session is required.
 */
export async function requestAi(
  prompt: string,
  responseSchema?: unknown,
): Promise<AiResponse> {
  const client = await getSupabase();
  const { data, error } = await client.auth.getSession();

  const token = data?.session?.access_token;
  if (error || !token) {
    throw new Error(AI_AUTH_REQUIRED_MESSAGE);
  }

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ prompt, responseSchema }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(payload?.error || AI_AUTH_REQUIRED_MESSAGE);
    }
    throw new Error(payload?.error || 'Erro na requisição para a API');
  }

  return { text: typeof payload?.text === 'string' ? payload.text : '' };
}
