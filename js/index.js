let rolSeleccionado;
const $ = id => document.getElementById(id);

function inicioSesionRol(role) {
  rolSeleccionado = role;
  $('rol-seleccionado').classList.add('hidden');
  $('seccion-login').classList.remove('hidden');
  $('titulo-login').innerText = role === 'admin' ? 'Acceso administrador' : 'Acceso estudiante / profesor';
  $('usuario').placeholder = role === 'admin' ? 'Usuario' : 'DNI';
  $('usuario').focus();
}
function verClave() { const i = $('contraseña'); i.type = i.type === 'password' ? 'text' : 'password'; }
function falla(msg) {
  $('error-login').textContent = msg;
  const t = document.querySelector('.tarjeta-centro'); t.classList.remove('sacudir'); void t.offsetWidth; t.classList.add('sacudir');
}
function iniciandoSesion() {
  const user = $('usuario').value.trim(), pass = $('contraseña').value.trim();
  if (!user || !pass) return falla('Completa usuario y contraseña.');

  if (rolSeleccionado === 'admin') {
    if (user === 'yagocll' && pass === '49096596') {
      SPE.setSesion({ usuario:user, nombre:'Administrador', rol:'admin' });
      return void (location.href = 'panel-admin.html');
    }
    return falla('Usuario o contraseña incorrectos.');
  }
  // Estudiante / profesor: usuario = DNI registrado, contraseña = DNI (o el usuario de prueba yagocll)
  const dni = user === 'yagocll' ? '49096596' : user;
  const a = SPE.alumno(dni);
  if (!a || pass !== a.dni) return falla('Usuario o contraseña incorrectos.');
  if (a.estado !== 'Activo') return falla(`Tu cuenta figura como "${a.estado}". Consulta con el administrador.`);
  SPE.setSesion({ usuario:user, nombre:SPE.nombreCompleto(a), dni:a.dni, rol:'estudiante' });
  location.href = 'menu.html';
}
document.addEventListener('keydown', e => { if (e.key === 'Enter' && !$('seccion-login').classList.contains('hidden')) iniciandoSesion(); });
