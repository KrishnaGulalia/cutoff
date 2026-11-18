import { supabase } from './supabase';
export async function api(path, options = {}) {
  const { data } = supabase ? await supabase.auth.getSession() : { data: {} };
  const response = await fetch((import.meta.env.VITE_API_URL || '') + '/api' + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(data.session ? { Authorization: 'Bearer ' + data.session.access_token } : {}), ...options.headers },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(result.error || 'Could not complete this request.'); error.status = response.status; throw error; }
  return result;
}
