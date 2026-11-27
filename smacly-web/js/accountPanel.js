/*
Panel de cuenta de SmaCly: barra superior con el usuario autenticado, enlaces a
las páginas de gestión (workspaces, logs, perfil, administración de usuarios -
cada una un port directo de su .html equivalente en
compilador/src/main/resources/static/) y el modal de conversión a e3value, que
no tiene página equivalente en el original. Todo habla con el backend Java
"compilador" a través de los endpoints /api/** que proxya server.js (ver
server.js y compilerProxy.js) usando la sesión del usuario ya logueado.
*/

var currentAccountUser = null;

/* ---------------------------------------------------------------- ESTILOS ---- */

(function injectAccountPanelStyles() {
  var style = document.createElement('style');
  style.textContent =
    '.smaclyModalOverlay{display:none;position:fixed;top:0;left:0;width:100%;height:100%;' +
    'background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center;}' +
    '.smaclyModalOverlay.open{display:flex;}' +
    '.smaclyModalBox{background:#fff;border-radius:10px;padding:20px;max-width:800px;width:92%;' +
    'max-height:85vh;overflow:auto;font-family:sans-serif;}' +
    '.smaclyModalBox h2{margin-top:0;color:rgb(75,86,185);}' +
    '.smaclyModalBox table{width:100%;border-collapse:collapse;margin:10px 0;font-size:13px;}' +
    '.smaclyModalBox th,.smaclyModalBox td{border:1px solid #ddd;padding:6px;text-align:left;}' +
    '.smaclyModalBox th{background-color:#f0f0f8;}' +
    '.smaclyModalBox input[type="text"],.smaclyModalBox input[type="email"],.smaclyModalBox input[type="password"],' +
    '.smaclyModalBox select,.smaclyModalBox textarea{width:100%;box-sizing:border-box;padding:6px;margin:4px 0 10px 0;' +
    'border-radius:6px;border:1px solid #ccc;}' +
    '.smaclyModalBox textarea{min-height:120px;font-family:monospace;}' +
    '.smaclyModalActions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap;}' +
    '.smaclyModalActions .button{padding:6px 12px;}' +
    '.smaclyModalActions .secondary{background-color:#888;}' +
    '.popupPaginaCaja{position:relative;width:94%;max-width:1150px;height:90vh;background:#fff;border-radius:12px;' +
    'box-shadow:0 12px 30px rgba(0,0,0,.35);overflow:hidden;}' +
    '.popupPaginaFrame{width:100%;height:100%;border:0;display:block;}' +
    '.popupPaginaCerrar{position:absolute;top:8px;right:12px;z-index:2;width:34px;height:34px;border-radius:50%;' +
    'border:1px solid #bcc6ee;background:#fff;color:#243388;font-size:16px;font-weight:bold;cursor:pointer;}' +
    '.popupPaginaCerrar:hover{background:#dde4ff;}';
  document.head.appendChild(style);
})();

/* ------------------------------------------------------------ MODAL BASE ---- */

function crearModalBase(id, titulo) {
  var existente = document.getElementById(id);
  if (existente) {
    existente.remove();
  }
  var overlay = document.createElement('div');
  overlay.id = id;
  overlay.className = 'smaclyModalOverlay';
  overlay.innerHTML =
    '<div class="smaclyModalBox">' +
    '<h2>' + titulo + '</h2>' +
    '<div class="smaclyModalContent"></div>' +
    '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) {
      overlay.classList.remove('open');
    }
  });
  return overlay;
}

function abrirModal(overlay) {
  overlay.classList.add('open');
}

function cerrarModal(id) {
  var overlay = document.getElementById(id);
  if (overlay) {
    overlay.classList.remove('open');
  }
}

function escapeHtml(texto) {
  if (texto == null) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function apiFetch(url, options) {
  var response = await fetch(url, options);
  if (response.status === 401) {
    toastr.error('Your session has expired, please log in again');
    setTimeout(function () { window.location.href = '/login.html'; }, 1200);
    throw new Error('Session expired');
  }
  var data = null;
  try { data = await response.json(); } catch (e) { data = null; }
  if (!response.ok) {
    var mensaje = (data && (data.mensaje || data.message)) || ('HTTP ' + response.status);
    throw new Error(mensaje);
  }
  return data;
}

function apiPost(url, body) {
  return apiFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
function apiGet(url) {
  return apiFetch(url);
}

/* ------------------------------------------------------------ ACCOUNT BAR --- */

async function inicializarAccountBar() {
  try {
    currentAccountUser = await apiGet('/api/sesionActual');
  }
  catch (error) {
    return;
  }
  if (!currentAccountUser) return;

  var esGestor = currentAccountUser.rol === 'PROFESSOR' || currentAccountUser.rol === 'ADMIN';

  // El acceso a la gestion de usuarios solo se muestra a profesores y admins.
  var menuUsuarios = document.getElementById('menuUsuariosEditor');
  if (menuUsuarios && esGestor) {
    menuUsuarios.style.display = '';
  }
}

/* ------------------------------------------------------- POPUP DE PAGINAS --- */

/*
Abre una de las paginas de gestion (workspaces, logs, perfil, usuarios) como
popup sobre el editor, dentro de un iframe, para no perder el trabajo en curso.
La pagina se ve y se comporta igual que abierta sola: dentro del iframe solo
oculta su cabecera y su botonera de navegacion (ver /js/embed.js).
*/
function abrirPopupPagina(url) {
  var existente = document.getElementById('popupPaginaOverlay');
  if (existente) {
    existente.remove();
  }
  var overlay = document.createElement('div');
  overlay.id = 'popupPaginaOverlay';
  overlay.className = 'smaclyModalOverlay open';
  overlay.innerHTML =
    '<div class="popupPaginaCaja">' +
    '<button type="button" class="popupPaginaCerrar" title="Close" aria-label="Close">✕</button>' +
    '<iframe class="popupPaginaFrame" src="' + url + '"></iframe>' +
    '</div>';
  document.body.appendChild(overlay);
  var cerrar = function () { overlay.remove(); };
  overlay.querySelector('.popupPaginaCerrar').addEventListener('click', cerrar);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) cerrar();
  });
  document.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Escape') {
      cerrar();
      document.removeEventListener('keydown', onKey);
    }
  });
}

// cerrarSesionUsuario: cerrarSesion.js; conversion a e3value: conversorE3Value.js (originales de SmaCly)

/* -------------------------------------------------------------------- INIT -- */

document.addEventListener('DOMContentLoaded', inicializarAccountBar);
