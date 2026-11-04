SPE.requerir('estudiante');
function buscar() {
  const q = document.getElementById('compu').value.trim().toLowerCase();
  const r = SPE.pcs().filter(p => [p.nombre, p.marca, p.modelo, p.ram, p.almacenamiento, p.estado].join(' ').toLowerCase().includes(q));
  document.getElementById('resultados').innerHTML = r.length ? r.map(p => `
    <div class="pc-card">${SPE.chip(p.estado)}<h4>${SPE.esc(p.nombre)}</h4>
    <div class="detalle">${SPE.esc(p.marca)} ${SPE.esc(p.modelo)}<br>${SPE.esc(p.ram)} RAM · ${SPE.esc(p.almacenamiento)}</div></div>`).join('')
    : '<p class="vacio" style="grid-column:1/-1">No hay equipos que coincidan con tu búsqueda.</p>';
}
buscar();
