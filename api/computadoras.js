// /api/computadoras  ·  GET (leer) · POST (crear) · PUT ?id= (editar) · DELETE ?id= (eliminar)
import { supabase, configurado, responder, faltanVariables } from './config.js';

export default async function handler(req, res) {
  if (!configurado) return faltanVariables(res);
  const { id } = req.query;
  const tabla = supabase.from('computadoras');

  switch (req.method) {
    case 'GET':
      return responder(res, await tabla.select('*').order('nombre'));
    case 'POST':
      return responder(res, await tabla.insert(req.body).select().single(), 201);
    case 'PUT':
      if (!id) return res.status(400).json({ error: 'Falta el parámetro id.' });
      return responder(res, await tabla.update(req.body).eq('id', id).select().single());
    case 'DELETE':
      if (!id) return res.status(400).json({ error: 'Falta el parámetro id.' });
      return responder(res, await tabla.delete().eq('id', id));
    default:
      res.setHeader('Allow', 'GET, POST, PUT, DELETE');
      return res.status(405).json({ error: 'Método no permitido.' });
  }
}
