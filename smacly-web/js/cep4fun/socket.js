var socket = io();

socket.on('Points', (newPoints) => {
    var points = parseInt(document.getElementById('points').innerHTML);
    if (points == NaN) {
        points = 0;
    } else {
        points = newPoints + points;
        if (points < 0) {
            points = 0;
        }
    }
    document.getElementById('points').textContent = points;
});
toastr.options = {
    "closeButton": true,
    "debug": false,
    "newestOnTop": true,
    "progressBar": true,
    "positionClass": "toast-top-right",
    "preventDuplicates": true,
    "onclick": null,
    "timeOut": "15000",
    "extendedTimeOut": "6000",
    "resetTimeoutOnDuplicate": true,
    "showEasing": "swing",
    "showMethod": "fadeIn"
}

// Escuchar por el evento 'mensaje' emitido por el servidor
socket.on('Toasts', function (data) {

    if (data.type && data.message) {
        if (data.type == 'Warning') {
            toastr.warning(window.I18N.data.message);
        } else if (data.type == 'Info') {
            toastr.info(window.I18N.data.message);
        } else if (data.type == 'Error') {
            toastr.error(window.I18N.data.message);
        }
        else {
            toastr.success(window.I18N.data.message);
        }
    }
});