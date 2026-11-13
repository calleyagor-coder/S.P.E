/* ===== S.P.E. · Capa de datos compartida (habla con la API /api → Supabase) =====
   Los datos se descargan una vez con SPE.cargar() y se guardan en memoria (C).
   Las funciones de lectura (alumnos(), pcs(), prestamos()...) son síncronas y leen esa copia.
   Las que modifican algo (crearAlumno, pedir, devolver...) son async: llaman a la API y luego recargan. */
const SPE = (() => {
  const K_SESION = 'spe_sesion';            // la sesión sí queda en el navegador (solo quién entró)
  let C = { alumnos:[], pcs:[], prestamos:[], log:[] };

  /* ---- Llamada a la API ---- */
  async function api(ruta, metodo = 'GET', cuerpo) {
    let r;
    try {
      r = await fetch('/api/' + ruta, { method:metodo, headers:cuerpo ? { 'Content-Type':'application/json' } : undefined, body:cuerpo ? JSON.stringify(cuerpo) : undefined });
    } catch (e) { throw new Error('No hay conexión con el servidor.'); }
    let d = null; try { d = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error((d && d.error) || `Error del servidor (${r.status}).`);
    return d;
  }
  const q = v => encodeURIComponent(v);

  /* ---- Conversión entre la base (pc_id, descripcion) y la página (pcId, desc) ---- */
  const deAlumno = a => ({ ...a, foto:a.foto || '', desc:a.descripcion || '', email:a.email || '' });
  const dePrestamo = p => ({ id:p.id, pcId:p.pc_id, dni:p.dni, fecha:p.fecha, devuelto:p.devuelto });
  const aAlumnoDB = a => { const o = {}; ['dni','nombre','apellido','email','telefono','anio','division','estado'].forEach(k => { if (a[k] !== undefined) o[k] = a[k]; });
                           if (a.foto !== undefined) o.foto = a.foto || null; if (a.desc !== undefined) o.descripcion = a.desc; return o; };

  /* ---- Carga de datos ---- */
  const CARGAS = {
    alumnos:    async () => { C.alumnos = (await api('alumnos')).map(deAlumno); },
    pcs:        async () => { C.pcs = await api('computadoras'); },
    prestamos:  async () => { C.prestamos = (await api('prestamos')).map(dePrestamo).reverse(); }, // la API los manda del más nuevo al más viejo; acá quedan del más viejo al más nuevo
    log:        async () => { C.log = await api('actividad'); }
  };
  const cargar = (...cuales) => Promise.all((cuales.length ? cuales : Object.keys(CARGAS)).map(k => CARGAS[k]()));

  /* ---- Utilidades ---- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtFecha = iso => iso ? new Date(iso).toLocaleString('es-AR', { dateStyle:'short', timeStyle:'short' }) : '—';
  const chip = estado => {
    const m = { 'Disponible':'ok', 'Activo':'ok', 'Prestada':'bad', 'En reparación':'warn', 'Inactivo':'warn', 'Suspendido':'bad' };
    return `<span class="chip chip-${m[estado] || 'info'}">${esc(estado)}</span>`;
  };
  const norm = t => String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

  /* ---- Sesión ---- */
  const sesion = () => { try { return JSON.parse(localStorage.getItem(K_SESION)); } catch (e) { return null; } };
  const setSesion = s => localStorage.setItem(K_SESION, JSON.stringify(s));
  const cerrarSesion = () => { localStorage.removeItem(K_SESION); location.href = 'index.html'; };
  const requerir = rol => { const s = sesion(); if (!s || s.rol !== rol) { location.replace('index.html'); return null; } return s; };
  const login = (usuario, clave, rol) => api('login', 'POST', { usuario, clave, rol });
  const estadisticas = () => api('estadisticas');

  /* ---- Lectura (sobre la copia en memoria) ---- */
  const alumnos = () => C.alumnos;
  const alumno = dni => C.alumnos.find(a => a.dni === dni);
  const nombreCompleto = a => a ? `${a.nombre} ${a.apellido}` : 'Desconocido';
  const curso = a => !a ? '—' : (a.anio === 'Profesor' ? 'Profesor' : `${a.anio} año · ${a.division}`);
  const pcs = () => C.pcs;
  const pc = id => C.pcs.find(p => p.id === id);
  const prestamos = () => C.prestamos;
  const activos = () => C.prestamos.filter(p => !p.devuelto);
  const prestamoDe = dni => activos().find(p => p.dni === dni);
  const logs = () => C.log;

  /* ---- Registro de actividad (no frena la acción si falla) ---- */
  const log = msg => { C.log.unshift({ t:new Date().toISOString(), msg }); C.log = C.log.slice(0, 60); return api('actividad', 'POST', { msg }).catch(() => {}); };

  /* ---- Alumnos ---- */
  async function crearAlumno(a) { await api('alumnos', 'POST', aAlumnoDB(a)); await cargar('alumnos'); }
  async function editarAlumno(dniOriginal, cambios) { await api('alumnos?dni=' + q(dniOriginal), 'PUT', aAlumnoDB(cambios)); await cargar('alumnos', 'prestamos'); }
  async function eliminarAlumno(dni) {
    const pr = prestamoDe(dni); if (pr) await devolver(pr.id, true);
    await api('alumnos?dni=' + q(dni), 'DELETE'); await cargar('alumnos', 'prestamos', 'pcs');
  }
  /* ---- Computadoras ---- */
  async function crearPc(p) { await api('computadoras', 'POST', p); await cargar('pcs'); }
  async function editarPc(id, cambios) { await api('computadoras?id=' + q(id), 'PUT', cambios); await cargar('pcs'); }
  async function eliminarPc(id) { await api('computadoras?id=' + q(id), 'DELETE'); await cargar('pcs', 'prestamos'); }

  /* ---- Acciones de préstamo (devuelven { ok, msg } como antes) ---- */
  async function pedir(pcId, dni) {
    try {
      await cargar('alumnos', 'pcs', 'prestamos');                       // valida con los datos más nuevos
      const a = alumno(dni), p = pc(pcId);
      await api('prestamos', 'POST', { pc_id:pcId, dni });               // el servidor vuelve a validar todo
      log(`${nombreCompleto(a)} pidió ${p ? p.nombre : pcId}`);
      await cargar('pcs', 'prestamos');
      return { ok:true, msg:`Reserva registrada para ${p ? p.nombre : 'el equipo'}.` };
    } catch (e) { return { ok:false, msg:e.message }; }
  }
  async function devolver(prestamoId, porAdmin = false) {
    try {
      const pr = C.prestamos.find(x => String(x.id) === String(prestamoId) && !x.devuelto), p = pr && pc(pr.pcId), a = pr && alumno(pr.dni);
      await api('prestamos?id=' + q(prestamoId), 'PUT');
      log(`${p ? p.nombre : (pr ? pr.pcId : 'Equipo')} devuelta por ${nombreCompleto(a)}${porAdmin ? ' (confirmado por admin)' : ''}`);
      await cargar('pcs', 'prestamos');
      return { ok:true, msg:'El equipo fue reincorporado al stock.' };
    } catch (e) { return { ok:false, msg:e.message }; }
  }

  /* ---- Avisos y confirmación (reemplazan alert/confirm) ---- */
  function toast(msg, tipo = 'info') {
    let c = document.getElementById('toasts');
    if (!c) { c = document.createElement('div'); c.id = 'toasts'; document.body.appendChild(c); }
    const t = document.createElement('div'); t.className = 'toast ' + tipo; t.textContent = msg; c.appendChild(t);
    setTimeout(() => { t.classList.add('saliendo'); setTimeout(() => t.remove(), 300); }, 3200);
  }
  function confirmar(titulo, texto, textoBoton = 'Confirmar', peligro = true) {
    return new Promise(res => {
      const f = document.createElement('div'); f.className = 'modal-fondo';
      f.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h3>${esc(titulo)}</h3><p>${esc(texto)}</p>
        <div class="fila"><button class="btn btn-secundarios btn-chico" data-r="0">Cancelar</button><button class="btn ${peligro ? 'btn-peligro' : 'btn-primarios'} btn-chico" data-r="1">${esc(textoBoton)}</button></div></div>`;
      f.addEventListener('click', e => { const r = e.target.dataset.r; if (r !== undefined || e.target === f) { f.remove(); res(r === '1'); } });
      document.body.appendChild(f); f.querySelector('[data-r="0"]').focus();
    });
  }

  /* Luz que sigue al mouse sobre las tarjetas */
  document.addEventListener('mousemove', e => {
    const t = e.target.closest && e.target.closest('.tarjeta'); if (!t) return;
    const r = t.getBoundingClientRect(); t.style.setProperty('--mx', (e.clientX - r.left) + 'px'); t.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });

  return { cargar, login, estadisticas, norm, sesion, setSesion, cerrarSesion, requerir, alumnos, alumno, nombreCompleto, curso, pcs, pc,
           prestamos, activos, prestamoDe, crearAlumno, editarAlumno, eliminarAlumno, crearPc, editarPc, eliminarPc, pedir, devolver,
           log, logs, toast, confirmar, esc, fmtFecha, chip };
})();
