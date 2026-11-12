// /api/prestamos
//   GET            → historial completo (con ?activos=1 solo los que siguen en uso)
//   POST           → pedir una computadora   { "pc_id": "HP-01", "dni": "49096596" }
//   PUT ?id=       → devolver una computadora (id del préstamo)
import { supabase, configurado, responder, faltanVariables } from './config.js';

export default async function handler(req, res) {
  if (!configurado) return faltanVariables(res);

  if (req.method === 'GET') {
    let q = supabase.from('prestamos').select('*').order('fecha', { ascending: false });
    if (req.query.activos) q = q.is('devuelto', null);
    return responder(res, await q);
  }

  if (req.method === 'POST') {
    const { pc_id, dni } = req.body ?? {};
    if (!pc_id || !dni) return res.status(400).json({ error: 'Faltan pc_id y dni.' });

    const { data: alumno } = await supabase.from('alumnos').select('estado').eq('dni', dni).maybeSingle();
    if (!alumno) return res.status(404).json({ error: 'No se encontró al alumno.' });
    if (alumno.estado !== 'Activo') return res.status(400).json({ error: `Tu estado es "${alumno.estado}". Consulta con el administrador.` });

    const { data: enUso } = await supabase.from('prestamos').select('id').eq('dni', dni).is('devuelto', null).limit(1);
    if (enUso?.length) return res.status(400).json({ error: 'Ya tienes un equipo en uso. Devuélvelo antes de pedir otro.' });

    const { data: pc } = await supabase.from('computadoras').select('estado').eq('id', pc_id).maybeSingle();
    if (!pc) return res.status(404).json({ error: 'No se encontró el equipo.' });
    if (pc.estado !== 'Disponible') return res.status(400).json({ error: `El equipo no está disponible (${pc.estado}).` });

    const nuevo = await supabase.from('prestamos').insert({ pc_id, dni }).select().single();
    if (nuevo.error) return responder(res, nuevo);
    await supabase.from('computadoras').update({ estado: 'Prestada' }).eq('id', pc_id);
    return res.status(201).json(nuevo.data);
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Falta el parámetro id.' });

    const { data: prestamo } = await supabase.from('prestamos').select('*').eq('id', id).maybeSingle();
    if (!prestamo || prestamo.devuelto) return res.status(400).json({ error: 'No hay un préstamo activo con ese id.' });

    const hecho = await supabase.from('prestamos').update({ devuelto: new Date().toISOString() }).eq('id', id).select().single();
    if (hecho.error) return responder(res, hecho);
    if (prestamo.pc_id) await supabase.from('computadoras').update({ estado: 'Disponible' }).eq('id', prestamo.pc_id).eq('estado', 'Prestada');
    return res.status(200).json(hecho.data);
  }

  res.setHeader('Allow', 'GET, POST, PUT');
  return res.status(405).json({ error: 'Método no permitido.' });
}
