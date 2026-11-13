// /api/actividad  ·  GET (últimos 60 movimientos) · POST { msg } (registrar un movimiento)
import { supabase, configurado, responder, faltanVariables } from './config.js';

export default async function handler(req, res) {
  if (!configurado) return faltanVariables(res);
  if (req.method === 'GET')
    return responder(res, await supabase.from('actividad').select('t,msg').order('t', { ascending: false }).limit(60));
  if (req.method === 'POST') {
    const msg = String(req.body?.msg ?? '').trim().slice(0, 300);
    if (!msg) return res.status(400).json({ error: 'Falta el mensaje.' });
    return responder(res, await supabase.from('actividad').insert({ msg }).select().single(), 201);
  }
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Método no permitido.' });
}
