SPE.requerir('estudiante');
const pcs = SPE.pcs();
const libres = pcs.filter(p => p.estado === 'Disponible').length;
document.getElementById('resumen').textContent = `${libres} de ${pcs.length} equipos libres en este momento.`;
document.getElementById('lista-pcs').innerHTML = pcs.map(p => `
  <div class="pc-card">
    ${SPE.chip(p.estado)}
    <h4>${SPE.esc(p.nombre)}</h4>
    <div class="detalle">${SPE.esc(p.marca)} ${SPE.esc(p.modelo)}<br>${SPE.esc(p.ram)} RAM · ${SPE.esc(p.almacenamiento)}</div>
    ${p.estado === 'Disponible' ? '<a class="btn btn-primarios btn-chico" href="cu-pedir.html">Pedir</a>' : ''}
  </div>`).join('');
