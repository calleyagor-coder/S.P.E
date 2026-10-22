const usuarioSesion = localStorage.getItem('usuario') || 'Usuario';
document.getElementById('user-mostrar').innerText = usuarioSesion;

const prestamo = localStorage.getItem('prestamo_activo');
const infoDev = document.getElementById('info-devolucion');
const btnDev = document.getElementById('btn-action-devolver');

if (prestamo) {
    infoDev.innerHTML = `Posees: <span style="color:var(--student-color)"><strong>${prestamo}</strong></span>`;
} else {
    infoDev.innerHTML = '<span style="color:var(--text-muted)">No registras deudas técnicas.</span>';
    btnDev.disabled = true;
    btnDev.style.opacity = ".5";
    btnDev.style.cursor = "not-allowed";
}

function devolverEquipo() {
    localStorage.removeItem('prestamo_activo');
    alert("El equipo fue reincorporado al stock.");
    window.location.reload();
}

function cambiarFoto() {
    alert("Cambiando foto de perfil");
}

function guardarPerfil() {
    alert("Perfil guardado con éxito.");
}

function cerrarSesion() {
    localStorage.clear();
    window.location.href = 'index.html';
}