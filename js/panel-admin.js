SPE.requerir('admin');
const $ = id => document.getElementById(id), esc = SPE.esc;
const vacio = (cols, txt) => `<tr><td colspan="${cols}" class="vacio">${txt}</td></tr>`;

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
  $('actividad').innerHTML = '<p class="ok">• Servidor en funcionamiento. Monitoreando cambios...</p>' +
    l.map(x => `<p>• ${SPE.fmtFecha(x.t)} — ${esc(x.msg)}</p>`).join('');
}

/* ---------- Alumnos ---------- */
function registrarAlumno() {
  const nombre = $('a-nombre').value.trim(), apellido = $('a-apellido').value.trim(),
        dni = $('a-dni').value.trim(), tel = $('a-tel').value.trim();
  const soloLetras = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{2,40}$/;
  if (!soloLetras.test(nombre)) return SPE.toast('Escribe un nombre válido (solo letras).', 'error');
  if (!soloLetras.test(apellido)) return SPE.toast('Escribe un apellido válido (solo letras).', 'error');
  if (!/^\d{7,8}$/.test(dni)) return SPE.toast('El DNI debe tener 7 u 8 números.', 'error');
  if (!/^\d{6,15}$/.test(tel)) return SPE.toast('El teléfono debe tener entre 6 y 15 números.', 'error');
  const todos = SPE.alumnos();
  if (todos.some(a => a.dni === dni)) return SPE.toast('Ya existe un alumno con ese DNI.', 'error');
  todos.push({ dni, nombre, apellido, telefono:tel, anio:$('a-anio').value, division:$('a-div').value, estado:$('a-estado').value, foto:'', desc:'' });
  SPE.guardarAlumnos(todos); SPE.log(`Alumno registrado: ${nombre} ${apellido} (DNI ${dni})`);
  ['a-nombre','a-apellido','a-dni','a-tel'].forEach(i => $(i).value = '');
  SPE.toast(`${nombre} ${apellido} fue registrado.`, 'ok'); renderTodo();
}
function renderAlumnos() {
  const q = $('buscar-alumno').value.trim().toLowerCase(), todos = SPE.alumnos();
  const lista = todos.filter(a => [a.nombre, a.apellido, a.dni, a.anio + a.division, a.estado].join(' ').toLowerCase().includes(q));
  $('cant-alumnos').textContent = todos.length;
  $('tabla-alumnos').innerHTML = lista.length ? lista.map(a => {
    const pr = SPE.prestamoDe(a.dni), p = pr && SPE.pc(pr.pcId);
    return `<tr><td><b>${esc(a.nombre)} ${esc(a.apellido)}</b></td><td>${esc(a.dni)}</td><td>${esc(a.telefono)}</td>
      <td>${esc(a.anio)} ${esc(a.division)}</td><td>${SPE.chip(a.estado)}</td>
      <td>${pr ? `<span class="chip chip-info">${esc(p ? p.nombre : pr.pcId)}</span>` : '<small>Ninguno</small>'}</td>
      <td><div class="acciones"><button class="btn btn-peligro btn-chico" onclick="eliminarAlumno('${esc(a.dni)}')">Eliminar</button></div></td></tr>`;
  }).join('') : vacio(7, 'No hay alumnos que coincidan. Registra uno con el formulario de arriba.');
}
async function eliminarAlumno(dni) {
  const a = SPE.alumno(dni); if (!a) return;
  const pr = SPE.prestamoDe(dni);
  const ok = await SPE.confirmar(`Eliminar a ${a.nombre} ${a.apellido}`,
    pr ? 'Tiene un equipo en préstamo: se marcará como devuelto y el alumno será eliminado. Esta acción no se puede deshacer.'
       : 'El alumno será eliminado del sistema. Esta acción no se puede deshacer.', 'Eliminar');
  if (!ok) return;
  if (pr) SPE.devolver(pr.id, true);
  SPE.guardarAlumnos(SPE.alumnos().filter(x => x.dni !== dni));
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
      <td>${a ? esc(a.anio) + ' ' + esc(a.division) : '—'}</td><td>${a ? esc(a.telefono) : '—'}</td><td>${SPE.fmtFecha(pr.fecha)}</td>
      <td><button class="btn btn-secundarios btn-chico" onclick="devolverAdmin('${esc(pr.id)}')">Marcar devuelta</button></td></tr>`;
  }).join('') : vacio(7, 'No hay computadoras en préstamo ahora mismo.');
  const hist = SPE.prestamos().filter(p => p.devuelto).slice(-10).reverse();
  $('tabla-historial').innerHTML = hist.length ? hist.map(pr => {
    const p = SPE.pc(pr.pcId), a = SPE.alumno(pr.dni);
    return `<tr><td>${esc(p ? p.nombre : pr.pcId)}</td><td>${a ? esc(a.nombre) + ' ' + esc(a.apellido) : 'Alumno eliminado'}</td><td>${SPE.fmtFecha(pr.fecha)}</td><td>${SPE.fmtFecha(pr.devuelto)}</td></tr>`;
  }).join('') : vacio(4, 'Aún no hay devoluciones.');
}
function devolverAdmin(id) { const r = SPE.devolver(id, true); SPE.toast(r.msg, r.ok ? 'ok' : 'error'); renderTodo(); }

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
      <td><button class="btn btn-peligro btn-chico" onclick="eliminarPc('${esc(p.id)}')">Eliminar</button></td></tr>`;
  }).join('') || vacio(6, 'No hay computadoras cargadas.');
}
function cambiarEstadoPc(id, estado) {
  const t = SPE.pcs(); const p = t.find(x => x.id === id); p.estado = estado; SPE.guardarPcs(t);
  SPE.log(`${p.nombre} cambió a "${estado}"`); SPE.toast(`${p.nombre}: ${estado}`, 'ok'); renderTodo();
}
function agregarPc() {
  const v = i => $(i).value.trim(), nombre = v('e-nombre'), marca = v('e-marca'), modelo = v('e-modelo');
  if (!nombre || !marca || !modelo) return SPE.toast('Completa nombre, marca y modelo.', 'error');
  const t = SPE.pcs(), id = nombre.toUpperCase().replace(/\s+/g, '-');
  if (t.some(p => p.id === id)) return SPE.toast('Ya existe una computadora con ese nombre.', 'error');
  t.push({ id, nombre, marca, modelo, ram:v('e-ram') || '—', almacenamiento:v('e-alm') || '—', estado:'Disponible' });
  SPE.guardarPcs(t); SPE.log(`Computadora agregada: ${nombre}`);
  ['e-nombre','e-marca','e-modelo','e-ram','e-alm'].forEach(i => $(i).value = '');
  SPE.toast('Computadora agregada.', 'ok'); renderTodo();
}
async function eliminarPc(id) {
  const p = SPE.pc(id); if (!p) return;
  if (p.estado === 'Prestada') return SPE.toast('No se puede eliminar una computadora en préstamo.', 'error');
  if (!await SPE.confirmar(`Eliminar ${p.nombre}`, 'La computadora saldrá del inventario.', 'Eliminar')) return;
  SPE.guardarPcs(SPE.pcs().filter(x => x.id !== id)); SPE.log(`Computadora eliminada: ${p.nombre}`); renderTodo();
}

function renderTodo() { renderResumen(); renderAlumnos(); renderPrestamos(); renderEquipos(); }
renderTodo();
mostrarTab(localStorage.getItem('spe_tab_admin') || 'resumen');
