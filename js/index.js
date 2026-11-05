let rolSeleccionado;
const $ = id => document.getElementById(id);

const ROLES = {
  estudiante: { ico:'🎓', titulo:'Acceso estudiante / profesor', sub:'Ingresa con tu DNI para pedir o devolver una computadora.',
                placeholder:'DNI', modo:'numeric', pista:'Tu DNI es tu usuario y también tu contraseña.' },
  admin:      { ico:'🛡️', titulo:'Acceso administrador', sub:'Panel de gestión de alumnos, préstamos y equipos.',
                placeholder:'Usuario', modo:'text', pista:'Acceso exclusivo para personal autorizado.' }
};

function inicioSesionRol(role) {
  rolSeleccionado = role;
  const r = ROLES[role];
  $('tarjeta-login').dataset.rol = role;
  $('login-ico').textContent = r.ico;
  $('titulo-login').textContent = r.titulo;
  $('sub-login').textContent = r.sub;
  $('pista-login').textContent = r.pista;
  $('usuario').placeholder = r.placeholder;
  $('usuario').inputMode = r.modo;
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
function iniciandoSesion() {
  const user = $('usuario').value.trim(), pass = $('contraseña').value.trim();
  if (!user || !pass) return falla('Completa usuario y contraseña.');

  if (rolSeleccionado === 'admin') {
    if (user === 'yago' && pass === '49096596') return entrar({ usuario:user, nombre:'Administrador', rol:'admin' }, 'panel-admin.html');
    return falla('Usuario o contraseña incorrectos.');
  }
  // Estudiante / profesor: usuario = DNI registrado, contraseña = DNI (o el usuario de prueba yago)
  const dni = user === 'yago' ? '49096596' : user;
  const a = SPE.alumno(dni);
  if (!a || pass !== a.dni) return falla('Usuario o contraseña incorrectos.');
  if (a.estado !== 'Activo') return falla(`Tu cuenta figura como "${a.estado}". Consulta con el administrador.`);
  entrar({ usuario:user, nombre:SPE.nombreCompleto(a), dni:a.dni, rol:'estudiante' }, 'menu.html');
}
['usuario', 'contraseña'].forEach(id => $(id).addEventListener('input', () => { $('error-login').textContent = ''; }));
document.addEventListener('keydown', e => { if (e.key === 'Enter' && !$('seccion-login').classList.contains('hidden')) iniciandoSesion(); });
