// /api/login  ·  POST { usuario, clave, rol }  →  valida en el servidor y devuelve solo los datos de la sesión
// Así el navegador nunca descarga la lista de DNI (que son las contraseñas) para poder iniciar sesión.
import { supabase, configurado, faltanVariables } from './config.js';

const norm = t => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// El administrador se puede cambiar con variables de entorno en Vercel (ADMIN_USUARIO / ADMIN_CLAVE)
const ADMIN_USUARIO = process.env.ADMIN_USUARIO || 'Yago Calle';
const ADMIN_CLAVE = process.env.ADMIN_CLAVE || '49096596';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Método no permitido.' }); }
  const { usuario, clave, rol } = req.body ?? {};
  const u = norm(usuario), c = String(clave ?? '').trim();
  if (!u || !c) return res.status(400).json({ error: 'Completa usuario y contraseña.' });

  if (rol === 'admin') {
    if (u === norm(ADMIN_USUARIO) && c === ADMIN_CLAVE) return res.status(200).json({ usuario: ADMIN_USUARIO, nombre: 'Administrador', rol: 'admin' });
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }

  if (!configurado) return faltanVariables(res);
  if (!/^\d{7,8}$/.test(c)) return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  const { data: a, error } = await supabase.from('alumnos').select('dni,nombre,apellido,estado').eq('dni', c).maybeSingle();
  if (error) return res.status(400).json({ error: error.message });
  const completo = a && `${a.nombre} ${a.apellido}`;
  if (!a || (norm(completo) !== u && a.dni !== u)) return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  if (a.estado !== 'Activo') return res.status(403).json({ error: `Tu cuenta figura como "${a.estado}". Consulta con el administrador.` });
  return res.status(200).json({ usuario: completo, nombre: completo, dni: a.dni, rol: 'estudiante' });
}
