const ses = SPE.requerir('estudiante');
const sel = document.getElementById('pc-seleccionada');
function detalle() {
  const p = SPE.pc(sel.value);
  document.getElementById('detalle-pc').textContent = p ? `${p.marca} ${p.modelo} · ${p.ram} RAM · ${p.almacenamiento}` : '';
}
function iniciar() {
  if (SPE.prestamoDe(ses.dni)) {
    document.getElementById('formulario-pedido').classList.add('hidden');
    document.getElementById('contenedor-bloqueo').classList.remove('hidden'); return;
  }
  const libres = SPE.pcs().filter(p => p.estado === 'Disponible');
  if (!libres.length) {
    sel.innerHTML = '<option value="">No hay equipos disponibles</option>';
    document.querySelector('#formulario-pedido .btn-primarios').disabled = true;
  } else sel.innerHTML = libres.map(p => `<option value="${SPE.esc(p.id)}">${SPE.esc(p.nombre)}</option>`).join('');
  detalle();
}
function solicitar() {
  const r = SPE.pedir(sel.value, ses.dni);
  SPE.toast(r.msg, r.ok ? 'ok' : 'error');
  if (r.ok) setTimeout(() => location.href = 'menu.html', 900);
}
iniciar();
