// /api/alumnos  ·  GET (leer) · POST (crear) · PUT ?dni= (editar) · DELETE ?dni= (eliminar)
import { supabase, configurado, responder, faltanVariables } from './config.js';

export default async function handler(req, res) {
  if (!configurado) return faltanVariables(res);
  const { dni } = req.query;
  const tabla = supabase.from('alumnos');

  switch (req.method) {
    case 'GET':
      return responder(res, await tabla.select('*').order('apellido'));
    case 'POST':
      return responder(res, await tabla.insert(req.body).select().single(), 201);
    case 'PUT':
      if (!dni) return res.status(400).json({ error: 'Falta el parámetro dni.' });
      return responder(res, await tabla.update(req.body).eq('dni', dni).select().single());
    case 'DELETE':
      if (!dni) return res.status(400).json({ error: 'Falta el parámetro dni.' });
      return responder(res, await tabla.delete().eq('dni', dni));
    default:
      res.setHeader('Allow', 'GET, POST, PUT, DELETE');
      return res.status(405).json({ error: 'Método no permitido.' });
  }
}
