SPE.requerir('admin');
const $ = id => document.getElementById(id), esc = SPE.esc;
const vacio = (cols, txt) => `<tr><td colspan="${cols}" class="vacio">${txt}</td></tr>`;

/* ---------- Ventana de edición (formulario emergente) ----------
   guardar(valores) puede ser async y debe devolver true si se guardó, o false para dejar la ventana abierta (por ejemplo, si hay un error). */
function abrirEditor(titulo, subtitulo, campos, guardar) {
  const f = document.createElement('div'); f.className = 'modal-fondo';
  const campo = c => `<div class="${c.ancho ? 'ancho' : ''}"><label for="ed-${c.id}">${esc(c.label)}</label>` + (c.opciones
    ? `<select id="ed-${c.id}" ${c.disabled ? 'disabled' : ''}>${c.opciones.map(o => `<option ${o === c.valor ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`
    : `<input id="ed-${c.id}" type="${c.tipo || 'text'}" value="${esc(c.valor)}" ${c.max ? `maxlength="${c.max}"` : ''} ${c.modo ? `inputmode="${c.modo}"` : ''} autocomplete="off">`) + '</div>';
  f.innerHTML = `<div class="modal modal-ancho" role="dialog" aria-modal="true"><h3>${esc(titulo)}</h3><p>${esc(subtitulo)}</p>
    <div class="form-modal">${campos.map(campo).join('')}</div>
    <div class="fila"><button class="btn btn-secundarios btn-chico" data-r="0">Cancelar</button><button class="btn btn-primarios btn-chico" data-r="1">Guardar cambios</button></div></div>`;
  const cerrar = () => { f.remove(); document.removeEventListener('keydown', esc_); };
  const esc_ = e => { if (e.key === 'Escape') cerrar(); };
  let ocupado = false;
  const intentar = async () => {
    if (ocupado) return;
    const v = {}; campos.forEach(c => { v[c.id] = f.querySelector('#ed-' + c.id).value.trim(); });
    const btn = f.querySelector('[data-r="1"]'); ocupado = true; btn.disabled = true; btn.textContent = 'Guardando…';
    let ok = false;
    try { ok = await guardar(v); } catch (e) { SPE.toast(e.message, 'error'); }
    ocupado = false; btn.disabled = false; btn.textContent = 'Guardar cambios';
    if (ok) cerrar();
  };
  f.addEventListener('click', e => { const r = e.target.dataset.r; if (e.target === f || r === '0') cerrar(); else if (r === '1') intentar(); });
  f.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') intentar(); });
  document.addEventListener('keydown', esc_);
  document.body.appendChild(f); f.querySelector('input,select').focus();
  return f;
}

/* ---------- Pestañas ---------- */
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => mostrarTab(t.dataset.tab)));
function mostrarTab(n) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('activo', t.dataset.tab === n));
  ['resumen','alumnos','prestamos','equipos'].forEach(x => $('tab-' + x).classList.toggle('hidden', x !== n));
  localStorage.setItem('spe_tab_admin', n);
}

/* ---------- Resumen ---------- */
function renderResumen() {
  const al = SPE.alumnos(), pcs = SPE.pcs();
  const n = e => pcs.filter(p => p.estado === e).length;
  const datos = [[al.length,'Alumnos registrados'],[al.filter(a => a.estado === 'Activo').length,'Alumnos activos'],
                 [pcs.length,'Computadoras'],[n('Disponible'),'Disponibles'],[n('Prestada'),'En préstamo'],[n('En reparación'),'En reparación']];
  $('stats').innerHTML = datos.map(d => `<div class="stat"><b>${d[0]}</b><span>${d[1]}</span></div>`).join('');
  const l = SPE.logs();
  $('actividad').innerHTML = '<p class="ok">• Conectado a la base de datos (Supabase).</p>' +
    l.map(x => `<p>• ${SPE.fmtFecha(x.t)} — ${esc(x.msg)}</p>`).join('');
}

/* ---------- Alumnos ---------- */
async function registrarAlumno() {
  const nombre = $('a-nombre').value.trim(), apellido = $('a-apellido').value.trim(),
        dni = $('a-dni').value.trim(), tel = $('a-tel').value.trim(), email = $('a-email').value.trim().toLowerCase();
  const soloLetras = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{2,40}$/;
  if (!soloLetras.test(nombre)) return SPE.toast('Escribe un nombre válido (solo letras).', 'error');
  if (!soloLetras.test(apellido)) return SPE.toast('Escribe un apellido válido (solo letras).', 'error');
  if (!/^\d{7,8}$/.test(dni)) return SPE.toast('El DNI debe tener 7 u 8 números.', 'error');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return SPE.toast('Escribe un correo electrónico válido.', 'error');
  if (!/^\d{6,15}$/.test(tel)) return SPE.toast('El teléfono debe tener entre 6 y 15 números.', 'error');
  const todos = SPE.alumnos();
  if (todos.some(a => a.dni === dni)) return SPE.toast('Ya existe un alumno con ese DNI.', 'error');
  if (todos.some(a => (a.email || '').toLowerCase() === email)) return SPE.toast('Ya existe un alumno con ese correo.', 'error');
  const esProf = $('a-anio').value === 'Profesor';
  try {
    await SPE.crearAlumno({ dni, nombre, apellido, email, telefono:tel, anio:$('a-anio').value, division:esProf ? '—' : $('a-div').value, estado:$('a-estado').value });
  } catch (e) { return SPE.toast(e.message, 'error'); }
  SPE.log(`Alumno registrado: ${nombre} ${apellido} (DNI ${dni})`);
  ['a-nombre','a-apellido','a-dni','a-email','a-tel'].forEach(i => $(i).value = '');
  SPE.toast(`${nombre} ${apellido} fue registrado.`, 'ok'); renderTodo();
}
/* Los profesores no pertenecen a una división */
function ajustarDivision() { const p = $('a-anio').value === 'Profesor'; $('a-div').disabled = p; $('a-div').style.opacity = p ? '.45' : ''; }
function renderAlumnos() {
  const q = $('buscar-alumno').value.trim().toLowerCase(), todos = SPE.alumnos();
  const lista = todos.filter(a => [a.nombre, a.apellido, a.dni, a.email, a.anio, a.division, a.estado].join(' ').toLowerCase().includes(q));
  $('cant-alumnos').textContent = todos.length;
  $('tabla-alumnos').innerHTML = lista.length ? lista.map(a => {
    const pr = SPE.prestamoDe(a.dni), p = pr && SPE.pc(pr.pcId);
    return `<tr><td><b>${esc(a.nombre)} ${esc(a.apellido)}</b></td><td>${esc(a.dni)}</td><td>${a.email ? esc(a.email) : '<small>—</small>'}</td><td>${esc(a.telefono)}</td>
      <td>${esc(SPE.curso(a))}</td><td>${SPE.chip(a.estado)}</td>
      <td>${pr ? `<span class="chip chip-info">${esc(p ? p.nombre : pr.pcId)}</span>` : '<small>Ninguno</small>'}</td>
      <td><div class="acciones"><button class="btn btn-secundarios btn-chico" onclick="editarAlumno('${esc(a.dni)}')">Editar</button><button class="btn btn-peligro btn-chico" onclick="eliminarAlumno('${esc(a.dni)}')">Eliminar</button></div></td></tr>`;
  }).join('') : vacio(8, 'No hay alumnos que coincidan. Registra uno con el formulario de arriba.');
}
function editarAlumno(dniOriginal) {
  const a = SPE.alumno(dniOriginal); if (!a) return;
  const ed = abrirEditor(`Editar a ${a.nombre} ${a.apellido}`, 'Modifica los datos y guarda los cambios.', [
    { id:'nombre', label:'Nombre', valor:a.nombre, max:40 },
    { id:'apellido', label:'Apellido', valor:a.apellido, max:40 },
    { id:'dni', label:'DNI', valor:a.dni, max:8, modo:'numeric' },
    { id:'email', label:'Correo electrónico', valor:a.email || '', max:60, tipo:'email' },
    { id:'tel', label:'Número de teléfono', valor:a.telefono, max:15, tipo:'tel', modo:'tel' },
    { id:'anio', label:'Año', valor:a.anio, opciones:['1°','2°','3°','4°','5°','6°','Profesor'] },
    { id:'division', label:'División', valor:a.division, opciones:['1° Div','2° Div'] },
    { id:'estado', label:'Estado', valor:a.estado, opciones:['Activo','Inactivo','Suspendido'] }
  ], async v => {
    const soloLetras = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{2,40}$/, email = v.email.toLowerCase();
    if (!soloLetras.test(v.nombre)) return SPE.toast('Escribe un nombre válido (solo letras).', 'error'), false;
    if (!soloLetras.test(v.apellido)) return SPE.toast('Escribe un apellido válido (solo letras).', 'error'), false;
    if (!/^\d{7,8}$/.test(v.dni)) return SPE.toast('El DNI debe tener 7 u 8 números.', 'error'), false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return SPE.toast('Escribe un correo electrónico válido.', 'error'), false;
    if (!/^\d{6,15}$/.test(v.tel)) return SPE.toast('El teléfono debe tener entre 6 y 15 números.', 'error'), false;
    const todos = SPE.alumnos(), otros = todos.filter(x => x.dni !== dniOriginal);
    if (otros.some(x => x.dni === v.dni)) return SPE.toast('Ya existe otro alumno con ese DNI.', 'error'), false;
    if (otros.some(x => (x.email || '').toLowerCase() === email)) return SPE.toast('Ya existe otro alumno con ese correo.', 'error'), false;
    // si cambia el DNI, los préstamos del alumno lo siguen solos (ON UPDATE CASCADE en la base)
    await SPE.editarAlumno(dniOriginal, { nombre:v.nombre, apellido:v.apellido, dni:v.dni, email, telefono:v.tel, anio:v.anio,
                                          division:v.anio === 'Profesor' ? '—' : v.division, estado:v.estado });
    SPE.log(`Alumno editado: ${v.nombre} ${v.apellido} (DNI ${v.dni})`);
    SPE.toast('Datos del alumno actualizados.', 'ok'); renderTodo(); return true;
  });
  /* Los profesores no pertenecen a una división */
  const anio = ed.querySelector('#ed-anio'), div = ed.querySelector('#ed-division');
  if (a.anio === 'Profesor' || !['1° Div','2° Div'].includes(a.division)) div.value = '1° Div';
  const ajustar = () => { const p = anio.value === 'Profesor'; div.disabled = p; div.style.opacity = p ? '.45' : ''; };
  anio.addEventListener('change', ajustar); ajustar();
}
async function eliminarAlumno(dni) {
  const a = SPE.alumno(dni); if (!a) return;
  const pr = SPE.prestamoDe(dni);
  const ok = await SPE.confirmar(`Eliminar a ${a.nombre} ${a.apellido}`,
    pr ? 'Tiene un equipo en préstamo: se marcará como devuelto y el alumno será eliminado. Esta acción no se puede deshacer.'
       : 'El alumno será eliminado del sistema. Esta acción no se puede deshacer.', 'Eliminar');
  if (!ok) return;
  try { await SPE.eliminarAlumno(dni); } catch (e) { return SPE.toast(e.message, 'error'); }
  SPE.log(`Alumno eliminado: ${a.nombre} ${a.apellido} (DNI ${dni})`);
  SPE.toast('Alumno eliminado.', 'ok'); renderTodo();
}

/* ---------- Préstamos ---------- */
function renderPrestamos() {
  const act = SPE.activos().slice().reverse();
  $('tabla-prestamos').innerHTML = act.length ? act.map(pr => {
    const p = SPE.pc(pr.pcId), a = SPE.alumno(pr.dni);
    return `<tr><td><b>${esc(p ? p.nombre : pr.pcId)}</b></td><td>${p ? esc(p.marca) + ' ' + esc(p.modelo) : '—'}</td>
      <td>${a ? `<b>${esc(a.nombre)} ${esc(a.apellido)}</b><small>DNI ${esc(a.dni)}</small>` : 'Alumno eliminado'}</td>
      <td>${a ? esc(SPE.curso(a)) : '—'}</td><td>${a ? esc(a.telefono) : '—'}</td><td>${SPE.fmtFecha(pr.fecha)}</td>
      <td><button class="btn btn-secundarios btn-chico" onclick="devolverAdmin('${esc(pr.id)}')">Marcar devuelta</button></td></tr>`;
  }).join('') : vacio(7, 'No hay computadoras en préstamo ahora mismo.');
  const hist = SPE.prestamos().filter(p => p.devuelto).slice(-10).reverse();
  $('tabla-historial').innerHTML = hist.length ? hist.map(pr => {
    const p = SPE.pc(pr.pcId), a = SPE.alumno(pr.dni);
    return `<tr><td>${esc(p ? p.nombre : pr.pcId)}</td><td>${a ? esc(a.nombre) + ' ' + esc(a.apellido) : 'Alumno eliminado'}</td><td>${SPE.fmtFecha(pr.fecha)}</td><td>${SPE.fmtFecha(pr.devuelto)}</td></tr>`;
  }).join('') : vacio(4, 'Aún no hay devoluciones.');
}
async function devolverAdmin(id) { const r = await SPE.devolver(id, true); SPE.toast(r.msg, r.ok ? 'ok' : 'error'); renderTodo(); }

/* ---------- Computadoras ---------- */
function renderEquipos() {
  $('tabla-equipos').innerHTML = SPE.pcs().map(p => {
    const pr = SPE.activos().find(x => x.pcId === p.id), a = pr && SPE.alumno(pr.dni);
    const estado = p.estado === 'Prestada' ? SPE.chip('Prestada') :
      `<select class="mini" onchange="cambiarEstadoPc('${esc(p.id)}', this.value)">
        ${['Disponible','En reparación'].map(e => `<option ${e === p.estado ? 'selected' : ''}>${e}</option>`).join('')}</select>`;
    return `<tr><td><b>${esc(p.nombre)}</b></td><td>${esc(p.marca)}<small>${esc(p.modelo)}</small></td>
      <td>${esc(p.ram)} RAM<small>${esc(p.almacenamiento)}</small></td><td>${estado}</td>
      <td>${a ? esc(a.nombre) + ' ' + esc(a.apellido) : '<small>—</small>'}</td>
      <td><div class="acciones"><button class="btn btn-secundarios btn-chico" onclick="editarPc('${esc(p.id)}')">Editar</button><button class="btn btn-peligro btn-chico" onclick="eliminarPc('${esc(p.id)}')">Eliminar</button></div></td></tr>`;
  }).join('') || vacio(6, 'No hay computadoras cargadas.');
}
async function cambiarEstadoPc(id, estado) {
  const p = SPE.pc(id); if (!p) return;
  try { await SPE.editarPc(id, { estado }); } catch (e) { SPE.toast(e.message, 'error'); return renderTodo(); }
  SPE.log(`${p.nombre} cambió a "${estado}"`); SPE.toast(`${p.nombre}: ${estado}`, 'ok'); renderTodo();
}
async function agregarPc() {
  const v = i => $(i).value.trim(), nombre = v('e-nombre'), marca = v('e-marca'), modelo = v('e-modelo');
  if (!nombre || !marca || !modelo) return SPE.toast('Completa nombre, marca y modelo.', 'error');
  const t = SPE.pcs(), id = nombre.toUpperCase().replace(/\s+/g, '-');
  if (t.some(p => p.id === id)) return SPE.toast('Ya existe una computadora con ese nombre.', 'error');
  try { await SPE.crearPc({ id, nombre, marca, modelo, ram:v('e-ram') || '—', almacenamiento:v('e-alm') || '—', estado:'Disponible' }); }
  catch (e) { return SPE.toast(e.message, 'error'); }
  SPE.log(`Computadora agregada: ${nombre}`);
  ['e-nombre','e-marca','e-modelo','e-ram','e-alm'].forEach(i => $(i).value = '');
  SPE.toast('Computadora agregada.', 'ok'); renderTodo();
}
function editarPc(id) {
  const p = SPE.pc(id); if (!p) return;
  const prestada = p.estado === 'Prestada';
  abrirEditor(`Editar ${p.nombre}`, prestada ? 'Está en préstamo: su estado cambia cuando se devuelva.' : 'Modifica los datos y guarda los cambios.', [
    { id:'nombre', label:'Nombre / etiqueta', valor:p.nombre, max:30 },
    { id:'marca', label:'Marca', valor:p.marca, max:30 },
    { id:'modelo', label:'Modelo', valor:p.modelo, max:40 },
    { id:'ram', label:'Memoria RAM', valor:p.ram === '—' ? '' : p.ram, max:10 },
    { id:'alm', label:'Almacenamiento', valor:p.almacenamiento === '—' ? '' : p.almacenamiento, max:20 },
    { id:'estado', label:'Estado', valor:p.estado, disabled:prestada, opciones:prestada ? ['Prestada'] : ['Disponible','En reparación'] }
  ], async v => {
    if (!v.nombre || !v.marca || !v.modelo) return SPE.toast('Completa nombre, marca y modelo.', 'error'), false;
    const todas = SPE.pcs();
    if (todas.some(x => x.id !== id && x.nombre.toLowerCase() === v.nombre.toLowerCase())) return SPE.toast('Ya existe otra computadora con ese nombre.', 'error'), false;
    // el identificador interno (id) no cambia, así los préstamos siguen asociados
    await SPE.editarPc(id, { nombre:v.nombre, marca:v.marca, modelo:v.modelo, ram:v.ram || '—', almacenamiento:v.alm || '—', estado:prestada ? 'Prestada' : v.estado });
    SPE.log(`Computadora editada: ${v.nombre}`);
    SPE.toast('Computadora actualizada.', 'ok'); renderTodo(); return true;
  });
}
async function eliminarPc(id) {
  const p = SPE.pc(id); if (!p) return;
  if (p.estado === 'Prestada') return SPE.toast('No se puede eliminar una computadora en préstamo.', 'error');
  if (!await SPE.confirmar(`Eliminar ${p.nombre}`, 'La computadora saldrá del inventario.', 'Eliminar')) return;
  try { await SPE.eliminarPc(id); } catch (e) { return SPE.toast(e.message, 'error'); }
  SPE.log(`Computadora eliminada: ${p.nombre}`); SPE.toast('Computadora eliminada.', 'ok'); renderTodo();
}

function renderTodo() { renderResumen(); renderAlumnos(); renderPrestamos(); renderEquipos(); }
mostrarTab(localStorage.getItem('spe_tab_admin') || 'resumen');
SPE.cargar().then(renderTodo).catch(e => SPE.toast(e.message, 'error'));
