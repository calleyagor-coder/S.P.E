let rolSeleccionado;
const $ = id => document.getElementById(id);

const ROLES = {
  estudiante: { ico:'🎓', titulo:'Acceso estudiante / profesor', sub:'Ingresa con tu nombre y apellido para pedir o devolver una computadora.',
                placeholder:'Nombre y apellido (o DNI)' },
  admin:      { ico:'🛡️', titulo:'Acceso administrador', sub:'Panel de gestión de alumnos, préstamos y equipos.',
                placeholder:'Nombre y apellido' }
};

function inicioSesionRol(role) {
  rolSeleccionado = role;
  const r = ROLES[role];
  $('tarjeta-login').dataset.rol = role;
  $('login-ico').textContent = r.ico;
  $('titulo-login').textContent = r.titulo;
  $('sub-login').textContent = r.sub;
  $('usuario').placeholder = r.placeholder;
  $('rol-seleccionado').classList.add('hidden');
  $('seccion-login').classList.remove('hidden');
  $('usuario').focus();
}
function volverRoles() {
  $('usuario').value = ''; $('contraseña').value = ''; $('error-login').textContent = '';
  $('contraseña').type = 'password';
  $('seccion-login').classList.add('hidden');
  $('rol-seleccionado').classList.remove('hidden');
}
function verClave() { const i = $('contraseña'); i.type = i.type === 'password' ? 'text' : 'password'; }
function falla(msg) {
  $('error-login').textContent = msg;
  const t = $('tarjeta-login'); t.classList.remove('sacudir'); void t.offsetWidth; t.classList.add('sacudir');
}
function entrar(sesion, destino) {
  const b = $('btn-ingresar'); b.disabled = true; b.textContent = 'Ingresando…';
  SPE.setSesion(sesion);
  setTimeout(() => { location.href = destino; }, 450);
}
let ingresando = false;
async function iniciandoSesion() {
  if (ingresando) return;
  const user = $('usuario').value.trim(), pass = $('contraseña').value.trim();
  if (!user || !pass) return falla('Completa usuario y contraseña.');
  ingresando = true;
  const b = $('btn-ingresar'), txt = b.textContent; b.disabled = true; b.textContent = 'Verificando…';
  try {
    // La contraseña se valida en el servidor (api/login.js): el navegador no descarga ningún dato de otros usuarios
    const ses = await SPE.login(user, pass, rolSeleccionado);
    entrar(ses, ses.rol === 'admin' ? 'panel-admin.html' : 'menu.html');
  } catch (e) {
    ingresando = false; b.disabled = false; b.textContent = txt;
    falla(e.message);
  }
}
['usuario', 'contraseña'].forEach(id => $(id).addEventListener('input', () => { $('error-login').textContent = ''; }));
document.addEventListener('keydown', e => { if (e.key === 'Enter' && !$('seccion-login').classList.contains('hidden')) iniciandoSesion(); });

/* ================= Presentación dinámica ================= */

/* Frases que se escriben y se borran solas */
(() => {
  const frases = ['Pide una computadora en segundos.', 'Devuélvela con un solo toque.', 'Todo el inventario, siempre al día.', 'Simple para alumnos y profesores.'];
  const el = $('frase'); let f = 0, c = 0, borrando = false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = frases[0]; return; }
  (function paso() {
    const t = frases[f];
    el.textContent = t.slice(0, c);
    if (!borrando && c === t.length) { borrando = true; return setTimeout(paso, 1800); }
    if (borrando && c === 0) { borrando = false; f = (f + 1) % frases.length; return setTimeout(paso, 350); }
    c += borrando ? -1 : 1;
    setTimeout(paso, borrando ? 28 : 55);
  })();
})();

/* Contadores animados con datos reales del sistema */
SPE.estadisticas().then(e => {
  const metas = { 'st-disp': e.disponibles, 'st-pcs': e.computadoras, 'st-alu': e.activos };
  Object.entries(metas).forEach(([id, meta]) => {
    const el = $(id), ini = performance.now(), dur = 1300;
    (function tick(ahora) {
      const p = Math.min((ahora - ini) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(meta * e);
      if (p < 1) requestAnimationFrame(tick);
    })(ini);
  });
}).catch(() => {}); // si la API no responde, los contadores quedan en 0

/* Las tarjetas flotantes se mueven suavemente con el mouse */
document.addEventListener('mousemove', e => {
  const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
  document.querySelectorAll('.flota').forEach(f => {
    const k = Number(f.dataset.prof) || 10;
    f.style.transform = `translate(${x * k * 2}px, ${y * k * 2}px)`;
  });
});
