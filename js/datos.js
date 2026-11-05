/* ===== S.P.E. · Capa de datos compartida (usa localStorage como base de datos) ===== */
const SPE = (() => {
  const K = { pcs:'spe_pcs', alumnos:'spe_alumnos', prestamos:'spe_prestamos', log:'spe_log', sesion:'spe_sesion' };
  const get = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } };
  const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  /* ---- Datos iniciales (solo la primera vez) ---- */
  if (!localStorage.getItem(K.pcs)) set(K.pcs, [
    { id:'HP-01',  nombre:'Hp 01',              marca:'HP',            modelo:'ProBook 450 G8',   ram:'8 GB',  almacenamiento:'256 GB SSD', estado:'Disponible' },
    { id:'LEN-06', nombre:'Lenovo 06',          marca:'Lenovo',        modelo:'ThinkPad E14',     ram:'8 GB',  almacenamiento:'512 GB SSD', estado:'Disponible' },
    { id:'JM-18',  nombre:'Juana Manso 18',     marca:'Juana Manso',   modelo:'Netbook JM-2021',  ram:'4 GB',  almacenamiento:'128 GB SSD', estado:'Disponible' },
    { id:'CI-08',  nombre:'Conectar Igualdad 08', marca:'Conectar Igualdad', modelo:'Positivo BGH',  ram:'4 GB',  almacenamiento:'320 GB HDD', estado:'Prestada' },
    { id:'HP-02',  nombre:'Hp 02',              marca:'HP',            modelo:'250 G7',           ram:'4 GB',  almacenamiento:'500 GB HDD', estado:'En reparación' }
  ]);
  if (!localStorage.getItem(K.alumnos)) set(K.alumnos, [
    { dni:'49096596', nombre:'Yago',   apellido:'Cll',       email:'yago@ejemplo.com',   telefono:'3825671774', anio:'6°', division:'1° Div', estado:'Activo', foto:'', desc:'' },
    { dni:'45123456', nombre:'Lucía',  apellido:'Fernández', email:'lucia@ejemplo.com',  telefono:'3825400111', anio:'5°', division:'2° Div', estado:'Activo', foto:'', desc:'' },
    { dni:'46234567', nombre:'Mateo',  apellido:'Ramírez',   email:'mateo@ejemplo.com',  telefono:'3825400222', anio:'4°', division:'1° Div', estado:'Activo', foto:'', desc:'' }
  ]);
  /* Migración de datos guardados con la versión anterior: se agrega el correo y las divisiones A/B pasan a 1° Div / 2° Div */
  (() => {
    const l = get(K.alumnos, []), m = { A:'1° Div', B:'2° Div' }; let c = false;
    l.forEach(a => {
      if (a.email === undefined) { a.email = ''; c = true; }
      if (m[a.division]) { a.division = m[a.division]; c = true; }
    });
    if (c) set(K.alumnos, l);
  })();
  if (!localStorage.getItem(K.prestamos)) set(K.prestamos, [
    { id:'P-1', pcId:'CI-08', dni:'46234567', fecha:new Date().toISOString(), devuelto:null }
  ]);
  if (!localStorage.getItem(K.log)) set(K.log, []);
  localStorage.removeItem('prestamo_activo'); // clave de la versión anterior

  /* ---- Utilidades ---- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtFecha = iso => iso ? new Date(iso).toLocaleString('es-AR', { dateStyle:'short', timeStyle:'short' }) : '—';
  const chip = estado => {
    const m = { 'Disponible':'ok', 'Activo':'ok', 'Prestada':'bad', 'En reparación':'warn', 'Inactivo':'warn', 'Suspendido':'bad' };
    return `<span class="chip chip-${m[estado] || 'info'}">${esc(estado)}</span>`;
  };

  /* ---- Sesión ---- */
  const sesion = () => get(K.sesion, null);
  const setSesion = s => set(K.sesion, s);
  const cerrarSesion = () => { localStorage.removeItem(K.sesion); location.href = 'index.html'; };
  const requerir = rol => { const s = sesion(); if (!s || s.rol !== rol) { location.replace('index.html'); return null; } return s; };

  /* ---- Tablas ---- */
  const alumnos = () => get(K.alumnos, []);
  const guardarAlumnos = v => set(K.alumnos, v);
  const alumno = dni => alumnos().find(a => a.dni === dni);
  const nombreCompleto = a => a ? `${a.nombre} ${a.apellido}` : 'Desconocido';
  const curso = a => !a ? '—' : (a.anio === 'Profesor' ? 'Profesor' : `${a.anio} año · ${a.division}`);
  const pcs = () => get(K.pcs, []);
  const guardarPcs = v => set(K.pcs, v);
  const pc = id => pcs().find(p => p.id === id);
  const prestamos = () => get(K.prestamos, []);
  const guardarPrestamos = v => set(K.prestamos, v);
  const activos = () => prestamos().filter(p => !p.devuelto);
  const prestamoDe = dni => activos().find(p => p.dni === dni);

  /* ---- Registro de actividad ---- */
  const log = msg => { const l = get(K.log, []); l.unshift({ t:new Date().toISOString(), msg }); set(K.log, l.slice(0, 60)); };
  const logs = () => get(K.log, []);

  /* ---- Acciones de préstamo ---- */
  function pedir(pcId, dni) {
    const a = alumno(dni), p = pc(pcId);
    if (!a || !p) return { ok:false, msg:'No se encontró el usuario o el equipo.' };
    if (a.estado !== 'Activo') return { ok:false, msg:`Tu estado es "${a.estado}". Consulta con el administrador.` };
    if (prestamoDe(dni)) return { ok:false, msg:'Ya tienes un equipo en uso. Devuélvelo antes de pedir otro.' };
    if (p.estado !== 'Disponible') return { ok:false, msg:`${p.nombre} no está disponible (${p.estado}).` };
    const todos = pcs(); todos.find(x => x.id === pcId).estado = 'Prestada'; guardarPcs(todos);
    const ps = prestamos(); ps.push({ id:'P-' + Date.now(), pcId, dni, fecha:new Date().toISOString(), devuelto:null }); guardarPrestamos(ps);
    log(`${nombreCompleto(a)} pidió ${p.nombre}`);
    return { ok:true, msg:`Reserva registrada para ${p.nombre}.` };
  }
  function devolver(prestamoId, porAdmin = false) {
    const ps = prestamos(), pr = ps.find(x => x.id === prestamoId && !x.devuelto);
    if (!pr) return { ok:false, msg:'No hay un préstamo activo.' };
    pr.devuelto = new Date().toISOString(); guardarPrestamos(ps);
    const todos = pcs(), p = todos.find(x => x.id === pr.pcId);
    if (p) { if (p.estado === 'Prestada') p.estado = 'Disponible'; guardarPcs(todos); }
    log(`${p ? p.nombre : pr.pcId} devuelta por ${nombreCompleto(alumno(pr.dni))}${porAdmin ? ' (confirmado por admin)' : ''}`);
    return { ok:true, msg:'El equipo fue reincorporado al stock.' };
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

  return { sesion, setSesion, cerrarSesion, requerir, alumnos, guardarAlumnos, alumno, nombreCompleto, curso, pcs, guardarPcs, pc,
           prestamos, guardarPrestamos, activos, prestamoDe, pedir, devolver, log, logs, toast, confirmar, esc, fmtFecha, chip };
})();
