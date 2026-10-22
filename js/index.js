let rolSeleccionado;

function inicioSesionRol(role) {
    rolSeleccionado = role;
    document.getElementById('rol-seleccionado').classList.add('hidden');
    document.getElementById('seccion-login').classList.remove('hidden');
    document.getElementById('titulo-login').innerText = role === 'admin' ? "Acceso Administrador" : "Acceso Estudiante / Profesor";
}

function iniciandoSesion() {
    const user = document.getElementById('usuario').value.trim();
    const pass = document.getElementById('contraseña').value.trim();

    if (user === "yagocll" && pass === "49096596") {
        localStorage.setItem('usuario', user);
        window.location.href = (rolSeleccionado === 'admin') ? 'panel-admin.html' : 'menu.html';
    } else {
        alert("Usuario o contraseña incorrectos.");
    }
}