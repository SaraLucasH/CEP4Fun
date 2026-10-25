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
    '#accountBar{display:flex;justify-content:flex-end;align-items:center;gap:10px;' +
    'background-color:rgb(75,86,185);color:#fff;padding:6px 14px;font-family:sans-serif;font-size:14px;}' +
    '#accountBar .accountUser{font-weight:bold;}' +
    '#accountBar .accountRole{opacity:0.8;font-size:12px;border:1px solid #fff;border-radius:10px;padding:1px 8px;}' +
    '#accountBar a,#accountBar button{cursor:pointer;background-color:#057fd0;color:#fff;border:1px solid #f0f7fa;' +
    'border-radius:6px;padding:5px 10px;font-size:13px;text-decoration:none;}' +
    '#accountBar a:hover,#accountBar button:hover{background-color:#019ad2;}' +
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
    '.smaclyModalActions .secondary{background-color:#888;}';
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
  var barra = document.getElementById('accountBar');
  if (!barra || !currentAccountUser) return;

  var esGestor = currentAccountUser.rol === 'PROFESSOR' || currentAccountUser.rol === 'ADMIN';

  barra.innerHTML =
    '<span class="accountUser">👤 ' + escapeHtml(currentAccountUser.user || currentAccountUser.email) + '</span>' +
    '<span class="accountRole">' + escapeHtml(currentAccountUser.rol || 'USER') + '</span>' +
    '<a href="/home.html">🏠 Home</a>' +
    '<a href="/edicion_datos_usuario.html">My profile</a>' +
    '<a href="/workspaces.html">📂 Workspaces</a>' +
    '<a href="/logs.html">📋 Activity logs</a>' +
    (esGestor ? '<a href="/gestion_usuarios.html">👥 Users</a>' : '') +
    '<button id="btnAbrirE3Value">🧮 e3value</button>' +
    '<button id="btnCerrarSesion">🚪 Log out</button>';

  document.getElementById('btnAbrirE3Value').addEventListener('click', function () {
    iniciarConversionE3Value();
  });
  document.getElementById('btnCerrarSesion').addEventListener('click', cerrarSesionUsuario);
}

async function cerrarSesionUsuario() {
  if (!window.confirm('Would you like to log out?')) {
    return;
  }
  try {
    await fetch('/logout', { method: 'POST' });
  }
  catch (error) { /* seguimos igualmente al login */ }
  window.location.href = '/login.html';
}

/* ---------------------------------------------------------------- E3VALUE --- */

var e3ValueEstado = { codigoSolidity: '', contrato: '', eventos: [], preguntas: [] };

async function iniciarConversionE3Value() {
  if (typeof SolidityGenerator === 'undefined' || !window.workspace) {
    toastr.error('The Blockly editor is not ready yet');
    return;
  }
  var codigo = SolidityGenerator.workspaceToCode(window.workspace);
  if (!codigo || !codigo.trim()) {
    toastr.error('There is no Solidity code to convert. Build a contract first.');
    return;
  }
  e3ValueEstado.codigoSolidity = codigo;

  var overlay = crearModalBase('modalE3Value', '🧮 Convert to e3value');
  var contenido = overlay.querySelector('.smaclyModalContent');
  contenido.innerHTML = '<p>Looking for contracts in the generated code...</p>';
  abrirModal(overlay);

  try {
    var contratos = await apiPost('/api/e3value/contratos', { codigoFuenteContrato: codigo });
    if (!contratos || contratos.length === 0) {
      contenido.innerHTML = '<p>No contracts were found in the generated Solidity code.</p>';
      return;
    }
    contenido.innerHTML =
      '<label>Contract</label><select id="e3ValueSelectContrato">' +
      contratos.map(function (c) { return '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>'; }).join('') +
      '</select>' +
      '<div class="smaclyModalActions">' +
      '<button type="button" class="button" id="btnContinuarE3Value">Continue</button>' +
      '<button type="button" class="button secondary" onclick="cerrarModal(\'modalE3Value\')">Cancel</button>' +
      '</div>';
    document.getElementById('btnContinuarE3Value').addEventListener('click', configurarEventosE3Value);
  }
  catch (error) {
    contenido.innerHTML = '<p>Error contacting the e3value converter: ' + escapeHtml(error.message) + '</p>';
  }
}

async function configurarEventosE3Value() {
  var contrato = document.getElementById('e3ValueSelectContrato').value;
  e3ValueEstado.contrato = contrato;
  var overlay = document.getElementById('modalE3Value');
  var contenido = overlay.querySelector('.smaclyModalContent');
  contenido.innerHTML = '<p>Loading events...</p>';

  var base = { codigoFuenteContrato: e3ValueEstado.codigoSolidity, contratoElegido: contrato };
  try {
    var eventos = await apiPost('/api/e3value/eventos', base);
    var preguntas = await apiPost('/api/e3value/preguntasObjetos', base);
    e3ValueEstado.eventos = eventos || [];
    e3ValueEstado.preguntas = preguntas || [];

    var filasEventos = e3ValueEstado.eventos.map(function (evento) {
      return '<div><label>' + escapeHtml(evento) + '</label>' +
        '<select data-evento-tipo="' + escapeHtml(evento) + '">' +
        '<option value="inicial">Initial event</option><option value="final">Final event</option>' +
        '</select></div>';
    }).join('');

    var filasObjetos = e3ValueEstado.preguntas.map(function (pregunta) {
      var clave = pregunta.evento || pregunta.clave || pregunta.key || JSON.stringify(pregunta);
      var texto = pregunta.pregunta || pregunta.texto || pregunta.mensaje || clave;
      return '<div><label>' + escapeHtml(texto) + '</label>' +
        '<input type="text" data-objeto-valor="' + escapeHtml(clave) + '" placeholder="Value object name (optional)"></div>';
    }).join('');

    contenido.innerHTML =
      '<h3>Event types</h3>' + (filasEventos || '<p>No events found.</p>') +
      '<h3>Return value objects</h3>' + (filasObjetos || '<p>Nothing to configure.</p>') +
      '<div class="smaclyModalActions">' +
      '<button type="button" class="button" id="btnGenerarE3Value">Generate e3value diagram</button>' +
      '<button type="button" class="button secondary" onclick="cerrarModal(\'modalE3Value\')">Cancel</button>' +
      '</div>';

    document.getElementById('btnGenerarE3Value').addEventListener('click', generarE3Value);
  }
  catch (error) {
    contenido.innerHTML = '<p>Error loading events: ' + escapeHtml(error.message) + '</p>';
  }
}

async function generarE3Value() {
  var overlay = document.getElementById('modalE3Value');
  var contenido = overlay.querySelector('.smaclyModalContent');

  var tiposEventos = {};
  contenido.querySelectorAll('[data-evento-tipo]').forEach(function (select) {
    tiposEventos[select.getAttribute('data-evento-tipo')] = select.value;
  });
  var objetosValorVuelta = {};
  contenido.querySelectorAll('[data-objeto-valor]').forEach(function (input) {
    if (input.value.trim() !== '') {
      objetosValorVuelta[input.getAttribute('data-objeto-valor')] = input.value.trim();
    }
  });

  var payload = {
    codigoFuenteContrato: e3ValueEstado.codigoSolidity,
    contratoElegido: e3ValueEstado.contrato,
    tiposEventos: tiposEventos,
    objetosValorVuelta: objetosValorVuelta
  };

  contenido.innerHTML = '<p>Generating diagram...</p>';
  try {
    var validacion = await apiPost('/api/e3value/validar', payload);
    if (validacion && validacion.valido === false) {
      toastr.warning('The contract may be missing e3value elements, generating anyway');
    }
    var resultado = await apiPost('/api/e3value/convertirE3Value', payload);
    var xml = (resultado && resultado.xml) || '';
    contenido.innerHTML =
      '<p>Diagram generated (mxGraph/draw.io XML). Copy it or download it and open it with draw.io.</p>' +
      '<textarea readonly id="e3ValueXmlResultado">' + escapeHtml(xml) + '</textarea>' +
      '<div class="smaclyModalActions">' +
      '<button type="button" class="button" id="btnDescargarE3Value">Download .xml</button>' +
      '<button type="button" class="button secondary" onclick="cerrarModal(\'modalE3Value\')">Close</button>' +
      '</div>';
    document.getElementById('btnDescargarE3Value').addEventListener('click', function () {
      var contratoSeguro = (e3ValueEstado.contrato || 'contract').replace(/[^a-z0-9_-]/gi, '_');
      window.open('data:application/octet-stream,' + encodeURIComponent(xml), contratoSeguro + '_e3value.xml');
    });
  }
  catch (error) {
    contenido.innerHTML = '<p>Error generating the e3value diagram: ' + escapeHtml(error.message) + '</p>';
  }
}

/* -------------------------------------------------------------------- INIT -- */

document.addEventListener('DOMContentLoaded', inicializarAccountBar);
