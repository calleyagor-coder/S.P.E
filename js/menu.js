const ses = SPE.requerir('estudiante');
const $ = id => document.getElementById(id);
const AVATAR_DEFECTO = 'img/hermanito.jpg';

function render() {
  const a = SPE.alumno(ses.dni);
  $('user-mostrar').innerText = ses.nombre;
  $('saludo').innerText = `Hola, ${a ? a.nombre : ses.nombre}`;
  $('avatar').src = (a && a.foto) || AVATAR_DEFECTO;
  $('desc-perfil').value = (a && a.desc) || '';

  const pr = SPE.prestamoDe(ses.dni), btn = $('btn-action-devolver');
  if (pr) {
    const p = SPE.pc(pr.pcId);
    $('info-devolucion').innerHTML = `Posees: <strong style="color:var(--cyan)">${SPE.esc(p ? p.nombre : pr.pcId)}</strong><br><small style="color:var(--muted)">desde ${SPE.fmtFecha(pr.fecha)}</small>`;
    btn.disabled = false; btn.style.opacity = ''; btn.style.cursor = '';
  } else {
    $('info-devolucion').innerHTML = '<span style="color:var(--muted)">No tienes equipos pendientes de devolución.</span>';
    btn.disabled = true; btn.style.opacity = '.5'; btn.style.cursor = 'not-allowed';
  }

  const mis = SPE.prestamos().filter(p => p.dni === ses.dni).reverse().slice(0, 8);
  $('menu-registros').innerHTML = mis.length
    ? mis.map(p => { const pc = SPE.pc(p.pcId); return `<p>• ${SPE.fmtFecha(p.fecha)} · ${SPE.esc(pc ? pc.nombre : p.pcId)} · ${p.devuelto ? 'devuelta' : '<span class="ok">en uso</span>'}</p>`; }).join('')
    : '<p>Todavía no hiciste ninguna petición.</p>';
}

async function devolverEquipo() {
  const pr = SPE.prestamoDe(ses.dni); if (!pr) return;
  const r = SPE.devolver(pr.id);
  SPE.toast(r.msg, r.ok ? 'ok' : 'error'); render();
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
    SPE.toast('Foto lista. Presiona "Guardar cambios".', 'info');
  };
  img.src = url;
});
function guardarPerfil() {
  const todos = SPE.alumnos(), a = todos.find(x => x.dni === ses.dni); if (!a) return;
  const src = $('avatar').getAttribute('src'); a.foto = src.startsWith('data:') ? src : a.foto;
  a.desc = $('desc-perfil').value.trim(); SPE.guardarAlumnos(todos);
  SPE.toast('Perfil guardado con éxito.', 'ok');
}
render();
