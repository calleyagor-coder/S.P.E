// /api/estadisticas  ·  GET → solo números (los usa la pantalla de inicio, que es pública)
import { supabase, configurado, faltanVariables } from './config.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Método no permitido.' }); }
  if (!configurado) return faltanVariables(res);
  const [pcs, alu] = await Promise.all([supabase.from('computadoras').select('estado'), supabase.from('alumnos').select('estado')]);
  if (pcs.error || alu.error) return res.status(400).json({ error: (pcs.error || alu.error).message });
  return res.status(200).json({
    disponibles: pcs.data.filter(p => p.estado === 'Disponible').length,
    computadoras: pcs.data.length,
    activos: alu.data.filter(a => a.estado === 'Activo').length
  });
}
