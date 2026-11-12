// api/config.js - Conexión con Supabase (las claves vienen de variables de entorno, nunca escritas en el código)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export const configurado = Boolean(supabaseUrl && supabaseKey);
export const supabase = createClient(supabaseUrl || 'http://localhost', supabaseKey || 'sin-clave');

// Responde en JSON: si Supabase devolvió error → 400, si no → los datos
export function responder(res, { data, error }, codigoOk = 200) {
  if (error) return res.status(400).json({ error: error.message });
  return res.status(codigoOk).json(data ?? { ok: true });
}

export const faltanVariables = res =>
  res.status(500).json({ error: 'Faltan las variables de entorno SUPABASE_URL y SUPABASE_ANON_KEY.' });
