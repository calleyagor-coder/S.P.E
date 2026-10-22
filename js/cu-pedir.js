if (localStorage.getItem('prestamo_activo')) {
    document.getElementById('formulario-pedido').style.display = 'none';
    document.getElementById('contenedor-bloqueo').classList.remove('hidden');
}

function solicitar() {
    let item = document.getElementById('pc-seleccionada').value;
    localStorage.setItem('prestamo_activo', item);
    alert("Reserva registrada para: " + item);
    window.location.href = 'menu.html';
}