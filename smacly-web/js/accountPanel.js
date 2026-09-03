/*
Panel de cuenta de SmaCly: barra superior con el usuario autenticado y modales para perfil,
workspaces, logs de actividad, administración de usuarios y conversión a e3value. Todo habla
con el backend Java "compilador" a través de los endpoints /api/** que proxya server.js
(ver server.js y compilerProxy.js) usando la sesión del usuario ya logueado.
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
    '#accountBar button{cursor:pointer;background-color:#057fd0;color:#fff;border:1px solid #f0f7fa;border-radius:6px;padding:5px 10px;font-size:13px;}' +
    '#accountBar button:hover{background-color:#019ad2;}' +
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
    '.smaclyBadgeBlocked{color:#c0392b;font-weight:bold;}' +
    '.smaclyBadgeOk{color:#1e8449;font-weight:bold;}';
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
function apiPut(url, body) {
  return apiFetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
function apiPatch(url, body) {
  return apiFetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
function apiDelete(url) {
  return apiFetch(url, { method: 'DELETE' });
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
    '<button id="btnAbrirPerfil">My profile</button>' +
    '<button id="btnAbrirWorkspaces">📂 Workspaces</button>' +
    '<button id="btnAbrirLogs">📋 Activity logs</button>' +
    (esGestor ? '<button id="btnAbrirAdmin">👥 Users</button>' : '') +
    '<button id="btnAbrirE3Value">🧮 e3value</button>' +
    '<button id="btnCerrarSesion">🚪 Log out</button>';

  document.getElementById('btnAbrirPerfil').addEventListener('click', abrirPanelPerfil);
  document.getElementById('btnAbrirWorkspaces').addEventListener('click', abrirPanelWorkspaces);
  document.getElementById('btnAbrirLogs').addEventListener('click', abrirPanelLogs);
  if (esGestor) {
    document.getElementById('btnAbrirAdmin').addEventListener('click', abrirPanelAdmin);
  }
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

/* -------------------------------------------------------------- MI PERFIL --- */

async function abrirPanelPerfil() {
  var overlay = crearModalBase('modalPerfil', 'My profile');
  var contenido = overlay.querySelector('.smaclyModalContent');
  contenido.innerHTML = '<p>Loading...</p>';
  abrirModal(overlay);

  try {
    var usuario = await apiGet('/api/miPerfil');
    contenido.innerHTML =
      '<label>Username</label><input type="text" id="perfilUser" value="' + escapeHtml(usuario.user) + '">' +
      '<label>First name</label><input type="text" id="perfilNombre" value="' + escapeHtml(usuario.nombre) + '">' +
      '<label>Last name</label><input type="text" id="perfilApellidos" value="' + escapeHtml(usuario.apellido) + '">' +
      '<label>Institution</label><input type="text" id="perfilInstitucion" value="' + escapeHtml(usuario.institucion) + '">' +
      '<label>Email</label><input type="email" id="perfilEmail" value="' + escapeHtml(usuario.email) + '">' +
      '<label>New password (leave blank to keep it)</label><input type="password" id="perfilPassword">' +
      '<div class="smaclyModalActions">' +
      '<button type="button" class="button secondary" onclick="cerrarModal(\'modalPerfil\')">Close</button>' +
      '<button type="button" class="button" id="btnGuardarPerfil">Save</button>' +
      '</div>';

    document.getElementById('btnGuardarPerfil').addEventListener('click', async function () {
      try {
        var payload = {
          user: document.getElementById('perfilUser').value.trim(),
          nombre: document.getElementById('perfilNombre').value.trim(),
          apellidos: document.getElementById('perfilApellidos').value.trim(),
          institucion: document.getElementById('perfilInstitucion').value.trim(),
          email: document.getElementById('perfilEmail').value.trim(),
          password: document.getElementById('perfilPassword').value
        };
        var resultado = await apiPut('/api/miPerfil', payload);
        if (resultado.exito) {
          toastr.success(resultado.mensaje || 'Profile updated successfully');
          cerrarModal('modalPerfil');
          inicializarAccountBar();
        }
        else {
          toastr.error(resultado.mensaje || 'The profile could not be updated');
        }
      }
      catch (error) {
        toastr.error(error.message);
      }
    });
  }
  catch (error) {
    contenido.innerHTML = '<p>Error loading profile: ' + escapeHtml(error.message) + '</p>';
  }
}

/* ------------------------------------------------------------ WORKSPACES ---- */

function obtenerCodigoSoliditySiHaceFalta() {
  if (typeof SolidityGenerator === 'undefined' || !window.workspace) return '';
  return SolidityGenerator.workspaceToCode(window.workspace);
}
function obtenerCodigoVyperSiHaceFalta() {
  if (typeof VyperGenerator === 'undefined' || !window.workspace) return '';
  return VyperGenerator.workspaceToCode(window.workspace);
}

async function abrirPanelWorkspaces() {
  var overlay = crearModalBase('modalWorkspaces', '📂 Workspaces');
  var contenido = overlay.querySelector('.smaclyModalContent');
  contenido.innerHTML = '<p>Loading...</p>';
  abrirModal(overlay);

  var workspaceActualId = localStorage.getItem('workspaceIdActual') || '';
  var workspaceActualNombre = localStorage.getItem('nombreWorkspaceActual') || '';

  try {
    var propios = await apiGet('/api/listarWorkspaces');
    var visibles = await apiGet('/api/workspaces/visibles');

    var filasPropios = (propios || []).map(function (workspace) {
      return filaWorkspace(workspace, workspaceActualId);
    }).join('');

    var filasPlantillas = (visibles || []).filter(function (w) { return w.isTemplate; }).map(function (workspace) {
      return filaWorkspace(workspace, workspaceActualId);
    }).join('');

    contenido.innerHTML =
      '<h3>Save current workspace</h3>' +
      '<label>Name</label><input type="text" id="wsNombreNuevo" placeholder="My workspace" value="' + escapeHtml(workspaceActualNombre) + '">' +
      '<label><input type="checkbox" id="wsIncluirSolidity"> Include generated Solidity code</label><br>' +
      '<label><input type="checkbox" id="wsIncluirVyper"> Include generated Vyper code</label><br>' +
      (currentAccountUser && (currentAccountUser.rol === 'PROFESSOR' || currentAccountUser.rol === 'ADMIN')
        ? '<label><input type="checkbox" id="wsEsPlantilla"> Save as template (visible to your users)</label><br>'
        : '') +
      '<div class="smaclyModalActions">' +
      '<button type="button" class="button" id="btnGuardarWorkspaceNuevo">Save as new</button>' +
      (workspaceActualId ? '<button type="button" class="button" id="btnSobreescribirWorkspace">Overwrite current</button>' : '') +
      '</div>' +
      '<h3>My workspaces</h3>' +
      '<table><thead><tr><th>Name</th><th>Updated</th><th>Actions</th></tr></thead><tbody>' +
      (filasPropios || '<tr><td colspan="3">No saved workspaces</td></tr>') +
      '</tbody></table>' +
      (filasPlantillas ? '<h3>Templates</h3><table><thead><tr><th>Name</th><th>Updated</th><th>Actions</th></tr></thead><tbody>' + filasPlantillas + '</tbody></table>' : '') +
      '<div class="smaclyModalActions"><button type="button" class="button secondary" onclick="cerrarModal(\'modalWorkspaces\')">Close</button></div>';

    document.getElementById('btnGuardarWorkspaceNuevo').addEventListener('click', function () { guardarWorkspace(false); });
    var btnSobreescribir = document.getElementById('btnSobreescribirWorkspace');
    if (btnSobreescribir) {
      btnSobreescribir.addEventListener('click', function () { guardarWorkspace(true); });
    }

    contenido.querySelectorAll('[data-cargar-workspace]').forEach(function (boton) {
      boton.addEventListener('click', function () { cargarWorkspacePorId(boton.getAttribute('data-cargar-workspace')); });
    });
    contenido.querySelectorAll('[data-borrar-workspace]').forEach(function (boton) {
      boton.addEventListener('click', function () { borrarWorkspace(boton.getAttribute('data-borrar-workspace')); });
    });
  }
  catch (error) {
    contenido.innerHTML = '<p>Error loading workspaces: ' + escapeHtml(error.message) + '</p>';
  }
}

function filaWorkspace(workspace, workspaceActualId) {
  var actualizado = workspace.fechaActualizacion ? new Date(workspace.fechaActualizacion).toLocaleString() : '';
  var esActual = workspace.id === workspaceActualId;
  return '<tr>' +
    '<td>' + escapeHtml(workspace.nombreWorkspace) + (esActual ? ' <b>(current)</b>' : '') + (workspace.isTemplate ? ' 🧩' : '') + '</td>' +
    '<td>' + escapeHtml(actualizado) + '</td>' +
    '<td>' +
    '<button type="button" class="button" data-cargar-workspace="' + escapeHtml(workspace.id) + '">Load</button> ' +
    '<button type="button" class="button secondary" data-borrar-workspace="' + escapeHtml(workspace.id) + '">Delete</button>' +
    '</td></tr>';
}

async function guardarWorkspace(sobreescribir) {
  if (!window.workspace) {
    toastr.error('The editor is not ready yet');
    return;
  }
  var nombre = document.getElementById('wsNombreNuevo').value.trim();
  if (!nombre) {
    toastr.error('You must enter a name for the workspace');
    return;
  }
  var xmlDom = Blockly.Xml.workspaceToDom(window.workspace);
  var xmlTexto = Blockly.Xml.domToText(xmlDom);
  var incluirSolidity = document.getElementById('wsIncluirSolidity').checked;
  var incluirVyper = document.getElementById('wsIncluirVyper').checked;
  var checkPlantilla = document.getElementById('wsEsPlantilla');

  var payload = {
    nombreWorkspace: nombre,
    xml: xmlTexto,
    codigoSolidity: incluirSolidity ? obtenerCodigoSoliditySiHaceFalta() : '',
    codigoVyper: incluirVyper ? obtenerCodigoVyperSiHaceFalta() : '',
    isTemplate: !!(checkPlantilla && checkPlantilla.checked)
  };
  if (sobreescribir) {
    payload.workspaceId = localStorage.getItem('workspaceIdActual');
  }

  try {
    var workspaceGuardado = await apiPost('/api/registrarWorkspace', payload);
    if (workspaceGuardado && workspaceGuardado.id) {
      localStorage.setItem('workspaceIdActual', workspaceGuardado.id);
      localStorage.setItem('nombreWorkspaceActual', workspaceGuardado.nombreWorkspace || nombre);
      toastr.success('Workspace saved successfully');
      abrirPanelWorkspaces();
    }
    else {
      toastr.error('The workspace could not be saved (there may already be another workspace with that name)');
    }
  }
  catch (error) {
    toastr.error(error.message);
  }
}

async function cargarWorkspacePorId(workspaceId) {
  try {
    var data = await apiPost('/api/cargarWorkspace', workspaceId);
    if (!data || !data.xml) {
      toastr.error('The workspace does not contain any XML content');
      return;
    }
    var xmlDom = Blockly.Xml.textToDom(data.xml);
    window.workspace.clear();
    Blockly.Xml.appendDomToWorkspace(xmlDom, window.workspace);

    if (data.templateCopy === true || !data.id) {
      localStorage.removeItem('workspaceIdActual');
    }
    else {
      localStorage.setItem('workspaceIdActual', data.id);
    }
    localStorage.setItem('nombreWorkspaceActual', data.nombreWorkspace || '');
    toastr.success('Workspace "' + data.nombreWorkspace + '" loaded');
    cerrarModal('modalWorkspaces');
  }
  catch (error) {
    toastr.error('Error loading the workspace: ' + error.message);
  }
}

async function borrarWorkspace(workspaceId) {
  if (!window.confirm('Delete this workspace? This cannot be undone.')) return;
  try {
    var resultado = await apiDelete('/api/workspaces/' + encodeURIComponent(workspaceId));
    if (resultado.exito) {
      if (localStorage.getItem('workspaceIdActual') === workspaceId) {
        localStorage.removeItem('workspaceIdActual');
        localStorage.removeItem('nombreWorkspaceActual');
      }
      toastr.success(resultado.mensaje || 'Workspace deleted');
      abrirPanelWorkspaces();
    }
    else {
      toastr.error(resultado.mensaje || 'The workspace could not be deleted');
    }
  }
  catch (error) {
    toastr.error(error.message);
  }
}

/* -------------------------------------------------------------- LOGS -------- */

async function abrirPanelLogs() {
  var overlay = crearModalBase('modalLogs', '📋 Activity logs');
  var contenido = overlay.querySelector('.smaclyModalContent');
  contenido.innerHTML = '<p>Loading...</p>';
  abrirModal(overlay);

  try {
    var logs = await apiGet('/api/logs/mostrarLogs');
    var filas = (logs || []).map(function (log) {
      var fecha = log.fecha ? new Date(log.fecha).toLocaleString() : '';
      return '<tr><td>' + escapeHtml(fecha) + '</td><td>' + escapeHtml(log.tipoEvento) + '</td>' +
        '<td>' + escapeHtml(log.user) + '</td><td>' + escapeHtml(log.workspaceName) + '</td></tr>';
    }).join('');

    contenido.innerHTML =
      '<div class="smaclyModalActions">' +
      '<button type="button" class="button" id="btnEnviarLogsPendientes">Send pending logs from this session</button>' +
      '<button type="button" class="button secondary" id="btnBorrarLogs">Clear all logs</button>' +
      '</div>' +
      '<table><thead><tr><th>Date</th><th>Event</th><th>User</th><th>Workspace</th></tr></thead><tbody>' +
      (filas || '<tr><td colspan="4">No logs recorded</td></tr>') +
      '</tbody></table>' +
      '<div class="smaclyModalActions"><button type="button" class="button secondary" onclick="cerrarModal(\'modalLogs\')">Close</button></div>';

    document.getElementById('btnEnviarLogsPendientes').addEventListener('click', enviarLogsPendientes);
    document.getElementById('btnBorrarLogs').addEventListener('click', async function () {
      if (!window.confirm('Delete every log entry you are allowed to manage?')) return;
      try {
        var resultado = await apiDelete('/api/logs');
        toastr[resultado.exito ? 'success' : 'error'](resultado.mensaje);
        abrirPanelLogs();
      }
      catch (error) {
        toastr.error(error.message);
      }
    });
  }
  catch (error) {
    contenido.innerHTML = '<p>Error loading logs: ' + escapeHtml(error.message) + '</p>';
  }
}

async function enviarLogsPendientes() {
  if (typeof logsEventos === 'undefined' || logsEventos.length === 0) {
    toastr.info('There are no pending logs in this session');
    return;
  }
  try {
    var payload = {
      workspaceId: localStorage.getItem('workspaceIdActual') || null,
      logs: logsEventos
    };
    var resultado = await apiPost('/api/registrarLogs', payload);
    if (resultado.exito) {
      logsEventos.length = 0;
      toastr.success(resultado.mensaje || 'Logs saved successfully');
      abrirPanelLogs();
    }
    else {
      toastr.error(resultado.mensaje || 'The logs could not be saved');
    }
  }
  catch (error) {
    toastr.error(error.message);
  }
}

/* ------------------------------------------------------------ ADMINISTRACIÓN */

async function abrirPanelAdmin() {
  var overlay = crearModalBase('modalAdmin', '👥 User management');
  var contenido = overlay.querySelector('.smaclyModalContent');
  contenido.innerHTML = '<p>Loading...</p>';
  abrirModal(overlay);

  try {
    var usuarios = await apiGet('/api/admin/usuarios/gestionables');
    var filas = (usuarios || []).map(filaUsuarioAdmin).join('');

    contenido.innerHTML =
      '<h3>Create user</h3>' +
      '<label>Username</label><input type="text" id="adminNuevoUser">' +
      '<label>First name</label><input type="text" id="adminNuevoNombre">' +
      '<label>Last name</label><input type="text" id="adminNuevoApellidos">' +
      '<label>Institution</label><input type="text" id="adminNuevoInstitucion">' +
      '<label>Email</label><input type="email" id="adminNuevoEmail">' +
      '<label>Password</label><input type="password" id="adminNuevoPassword">' +
      '<label>Role</label><select id="adminNuevoRol"><option value="USER">USER</option>' +
      '<option value="PROFESSOR">PROFESSOR</option><option value="ADMIN">ADMIN</option></select>' +
      '<div class="smaclyModalActions"><button type="button" class="button" id="btnCrearUsuarioAdmin">Create user</button></div>' +
      '<h3>Managed users</h3>' +
      '<table><thead><tr><th>User</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
      (filas || '<tr><td colspan="6">No manageable users</td></tr>') +
      '</tbody></table>' +
      '<div class="smaclyModalActions"><button type="button" class="button secondary" onclick="cerrarModal(\'modalAdmin\')">Close</button></div>';

    document.getElementById('btnCrearUsuarioAdmin').addEventListener('click', crearUsuarioAdmin);
    contenido.querySelectorAll('[data-bloquear-usuario]').forEach(function (boton) {
      boton.addEventListener('click', function () {
        cambiarBloqueoUsuarioAdmin(boton.getAttribute('data-bloquear-usuario'), boton.getAttribute('data-nuevo-estado') === 'true');
      });
    });
    contenido.querySelectorAll('[data-borrar-usuario]').forEach(function (boton) {
      boton.addEventListener('click', function () { borrarUsuarioAdmin(boton.getAttribute('data-borrar-usuario')); });
    });
  }
  catch (error) {
    contenido.innerHTML = '<p>Error loading users: ' + escapeHtml(error.message) + '</p>';
  }
}

function filaUsuarioAdmin(usuario) {
  var bloqueada = !!usuario.cuentaBloqueada;
  return '<tr>' +
    '<td>' + escapeHtml(usuario.user) + '</td>' +
    '<td>' + escapeHtml(usuario.nombre) + ' ' + escapeHtml(usuario.apellido) + '</td>' +
    '<td>' + escapeHtml(usuario.email) + '</td>' +
    '<td>' + escapeHtml(usuario.rol) + '</td>' +
    '<td>' + (bloqueada ? '<span class="smaclyBadgeBlocked">Blocked</span>' : '<span class="smaclyBadgeOk">Active</span>') + '</td>' +
    '<td>' +
    '<button type="button" class="button" data-bloquear-usuario="' + escapeHtml(usuario.id) + '" data-nuevo-estado="' + (!bloqueada) + '">' +
    (bloqueada ? 'Unblock' : 'Block') + '</button> ' +
    '<button type="button" class="button secondary" data-borrar-usuario="' + escapeHtml(usuario.id) + '">Delete</button>' +
    '</td></tr>';
}

async function crearUsuarioAdmin() {
  var payload = {
    user: document.getElementById('adminNuevoUser').value.trim(),
    nombre: document.getElementById('adminNuevoNombre').value.trim(),
    apellidos: document.getElementById('adminNuevoApellidos').value.trim(),
    institucion: document.getElementById('adminNuevoInstitucion').value.trim(),
    email: document.getElementById('adminNuevoEmail').value.trim(),
    password: document.getElementById('adminNuevoPassword').value
  };
  var rol = document.getElementById('adminNuevoRol').value;
  try {
    var resultado = await apiPost('/api/admin/usuarios?rol=' + encodeURIComponent(rol), payload);
    toastr[resultado.exito ? 'success' : 'error'](resultado.mensaje);
    if (resultado.exito) {
      abrirPanelAdmin();
    }
  }
  catch (error) {
    toastr.error(error.message);
  }
}

async function cambiarBloqueoUsuarioAdmin(userId, nuevoEstado) {
  try {
    var resultado = await apiPatch('/api/admin/usuarios/' + encodeURIComponent(userId) + '/bloqueo', { bloqueada: nuevoEstado });
    toastr[resultado.exito ? 'success' : 'error'](resultado.mensaje);
    abrirPanelAdmin();
  }
  catch (error) {
    toastr.error(error.message);
  }
}

async function borrarUsuarioAdmin(userId) {
  if (!window.confirm('Delete this user and everything they own (workspaces, logs)?')) return;
  try {
    var resultado = await apiDelete('/api/admin/usuarios/' + encodeURIComponent(userId));
    toastr[resultado.exito ? 'success' : 'error'](resultado.mensaje);
    abrirPanelAdmin();
  }
  catch (error) {
    toastr.error(error.message);
  }
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
