const ses = SPE.requerir('estudiante');
const $ = id => document.getElementById(id);
const FILTROS = [['Disponible', 'Disponibles'], ['', 'Todas'], ['Prestada', 'En préstamo'], ['En reparación', 'En reparación']];
const ICONO = { 'Disponible':'💻', 'Prestada':'🔒', 'En reparación':'🛠️' };
let filtro = 'Disponible';

function render() {
  const pcs = SPE.pcs(), q = $('compu').value.trim().toLowerCase(), prestamo = SPE.prestamoDe(ses.dni);
  const libres = pcs.filter(p => p.estado === 'Disponible').length;
  $('resumen').textContent = `${libres} de ${pcs.length} equipos libres en este momento. Busca, filtra y pide el que necesites.`;

  const aviso = $('aviso-uso');
  if (prestamo) {
    const p = SPE.pc(prestamo.pcId);
    aviso.innerHTML = `Ya tienes <b>${SPE.esc(p ? p.nombre : prestamo.pcId)}</b> en uso. Devuélvelo desde el <a href="menu.html">menú</a> para poder pedir otra.`;
    aviso.classList.remove('hidden');
  } else aviso.classList.add('hidden');

  $('filtros').innerHTML = FILTROS.map(([v, t]) => {
    const n = v ? pcs.filter(p => p.estado === v).length : pcs.length;
    return `<button type="button" class="filtro ${v === filtro ? 'activo' : ''}" onclick="setFiltro('${v}')">${t} <span>${n}</span></button>`;
  }).join('');

  const lista = pcs.filter(p => (!filtro || p.estado === filtro) &&
    [p.nombre, p.marca, p.modelo, p.ram, p.almacenamiento, p.estado].join(' ').toLowerCase().includes(q));
  $('lista-pcs').innerHTML = lista.length ? lista.map((p, i) => `
    <div class="pc-card pc-${p.estado === 'Disponible' ? 'libre' : 'ocupada'}" style="animation-delay:${Math.min(i, 8) * 50}ms">
      <div class="pc-top"><span class="pc-ico">${ICONO[p.estado] || '💻'}</span>${SPE.chip(p.estado)}</div>
      <h4>${SPE.esc(p.nombre)}</h4>
      <div class="detalle">${SPE.esc(p.marca)} ${SPE.esc(p.modelo)}</div>
      <div class="specs"><span class="spec">${SPE.esc(p.ram)} RAM</span><span class="spec">${SPE.esc(p.almacenamiento)}</span></div>
      ${p.estado === 'Disponible'
        ? `<button class="btn btn-primarios btn-chico w-100" ${prestamo ? 'disabled title="Ya tienes un equipo en uso"' : ''} onclick="pedir('${SPE.esc(p.id)}')">Pedir esta computadora</button>`
        : ''}
    </div>`).join('')
    : '<p class="vacio" style="grid-column:1/-1">No hay equipos que coincidan. Prueba con otro filtro o búsqueda.</p>';
}
function setFiltro(v) { filtro = v; render(); }

async function pedir(id) {
  const p = SPE.pc(id); if (!p) return;
  if (!await SPE.confirmar(`Pedir ${p.nombre}`, `${p.marca} ${p.modelo} · ${p.ram} RAM · ${p.almacenamiento}. Quedará a tu nombre hasta que la devuelvas.`, 'Confirmar pedido', false)) return;
  const r = SPE.pedir(id, ses.dni);
  SPE.toast(r.msg, r.ok ? 'ok' : 'error');
  if (r.ok) setTimeout(() => location.href = 'menu.html', 900); else render();
}
render();
