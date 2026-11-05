const ses = SPE.requerir('estudiante');
const $ = id => document.getElementById(id);
const AVATAR_DEFECTO = 'img/hermanito.jpg';
let base = { foto:'', desc:'' };   // lo último que está guardado, para detectar cambios

/* Duración legible: "35 min", "2 h 10 min", "1 d 4 h" */
function duracion(ms) {
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'menos de 1 min';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ${m % 60} min`;
  return `${Math.floor(h / 24)} d ${h % 24} h`;
}

/* ---------- Tarjeta 1: computadoras ---------- */
function renderPcs() {
  const pcs = SPE.pcs(), libres = pcs.filter(p => p.estado === 'Disponible').length;
  $('pcs-libres').textContent = libres;
  $('pcs-total').textContent = `de ${pcs.length} equipo${pcs.length === 1 ? '' : 's'} libre${libres === 1 ? '' : 's'}`;
  $('pcs-barra').style.width = (pcs.length ? libres / pcs.length * 100 : 0) + '%';
}

/* ---------- Tarjeta 2: devolución ---------- */
function renderDevolucion() {
  const pr = SPE.prestamoDe(ses.dni), btn = $('btn-action-devolver'), t = $('tarjeta-devolver');
  t.classList.toggle('en-uso', !!pr);
  if (pr) {
    const p = SPE.pc(pr.pcId);
    $('info-devolucion').innerHTML = `
      <span class="pulso-estado"><i></i>En uso</span>
      <b class="dev-pc">${SPE.esc(p ? p.nombre : pr.pcId)}</b>
      <small>${p ? SPE.esc(p.marca + ' ' + p.modelo) : ''}</small>
      <div class="dev-tiempo">⏱ Hace <b id="tiempo-uso">${duracion(Date.now() - new Date(pr.fecha))}</b> · desde ${SPE.fmtFecha(pr.fecha)}</div>`;
    btn.disabled = false; btn.textContent = 'Marcar como devuelto';
  } else {
    $('info-devolucion').innerHTML = `
      <span class="check-grande">✓</span>
      <b class="dev-pc">Todo en orden</b>
      <small>No tienes equipos pendientes de devolución.</small>`;
    btn.disabled = true; btn.textContent = 'Nada para devolver';
  }
}
async function devolverEquipo() {
  const pr = SPE.prestamoDe(ses.dni); if (!pr) return;
  const p = SPE.pc(pr.pcId);
  if (!await SPE.confirmar('Confirmar devolución', `¿Entregaste ${p ? p.nombre : 'el equipo'} en la sala de informática?`, 'Sí, lo devolví', false)) return;
  const r = SPE.devolver(pr.id);
  SPE.toast(r.msg, r.ok ? 'ok' : 'error');
  renderTodo();
  if (r.ok) destello('tarjeta-devolver');
}

/* ---------- Tarjeta 3: perfil ---------- */
function renderPerfil() {
  const a = SPE.alumno(ses.dni);
  $('perfil-nombre').textContent = a ? SPE.nombreCompleto(a) : ses.nombre;
  $('perfil-curso').textContent = a ? SPE.curso(a) : '';
  $('perfil-email').textContent = a && a.email ? a.email : 'Sin correo registrado';
  base = { foto:(a && a.foto) || '', desc:(a && a.desc) || '' };
  $('avatar').src = base.foto || AVATAR_DEFECTO;
  $('desc-perfil').value = base.desc;
  actualizarPerfil();
}
function actualizarPerfil() {
  const d = $('desc-perfil').value, src = $('avatar').getAttribute('src');
  const nuevaFoto = src.startsWith('data:') && src !== base.foto;
  const cambios = nuevaFoto || d.trim() !== base.desc;
  $('desc-contador').textContent = `${d.length}/140`;
  $('desc-contador').classList.toggle('lleno', d.length >= 130);
  const b = $('btn-guardar-perfil');
  b.disabled = !cambios; b.textContent = cambios ? 'Guardar cambios' : 'Sin cambios';
  $('tarjeta-perfil').classList.toggle('con-cambios', cambios);
}
function cambiarFoto() { $('archivo-foto').click(); }
$('archivo-foto').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => { // se reduce a 128px para que entre en localStorage
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const s = Math.min(img.width, img.height), ctx = c.getContext('2d');
    ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 128, 128);
    $('avatar').src = c.toDataURL('image/jpeg', .8); URL.revokeObjectURL(url);
    actualizarPerfil();
  };
  img.src = url;
});
$('desc-perfil').addEventListener('input', actualizarPerfil);
function guardarPerfil() {
  const todos = SPE.alumnos(), a = todos.find(x => x.dni === ses.dni); if (!a) return;
  const src = $('avatar').getAttribute('src'); a.foto = src.startsWith('data:') ? src : a.foto;
  a.desc = $('desc-perfil').value.trim(); SPE.guardarAlumnos(todos);
  SPE.toast('Perfil guardado con éxito.', 'ok');
  renderPerfil(); destello('tarjeta-perfil');
}

/* ---------- Tarjeta 4: historial ---------- */
function renderHistorial() {
  const todos = SPE.prestamos().filter(p => p.dni === ses.dni).reverse(), mis = todos.slice(0, 8);
  $('hist-cant').textContent = todos.length;
  $('menu-registros').innerHTML = mis.length ? mis.map((p, i) => {
    const pc = SPE.pc(p.pcId), activo = !p.devuelto;
    const detalle = activo ? 'En uso ahora' : `Usada ${duracion(new Date(p.devuelto) - new Date(p.fecha))}`;
    return `<li class="${activo ? 'activo' : 'cerrado'}" style="animation-delay:${i * 60}ms">
      <span class="punto"></span>
      <div><b>${SPE.esc(pc ? pc.nombre : p.pcId)}</b><small>${SPE.fmtFecha(p.fecha)} · ${detalle}</small></div>
      <span class="chip ${activo ? 'chip-info' : 'chip-ok'}">${activo ? 'En uso' : 'Devuelta'}</span></li>`;
  }).join('') : '<li class="hist-vacio"><span>📭</span>Todavía no hiciste ninguna petición.</li>';
}

function destello(id) { const t = $(id); t.classList.remove('destello'); void t.offsetWidth; t.classList.add('destello'); }
function renderTodo() {
  const a = SPE.alumno(ses.dni);
  $('user-mostrar').innerText = ses.nombre;
  $('saludo').innerText = `Hola, ${a ? a.nombre : ses.nombre}`;
  renderPcs(); renderDevolucion(); renderHistorial();
}
renderTodo(); renderPerfil();
// El tiempo de uso se actualiza solo, y el stock se refresca si cambia en otra pestaña
setInterval(() => {
  const pr = SPE.prestamoDe(ses.dni), el = $('tiempo-uso');
  if (pr && el) el.textContent = duracion(Date.now() - new Date(pr.fecha));
}, 30000);
window.addEventListener('storage', renderTodo);
