/*
Cuando una pagina de gestion (workspaces, logs, perfil, usuarios) se abre como
popup dentro del editor (iframe), se oculta su cabecera y su botonera de
navegacion: el popup ya es el contexto, y asi se ve igual que la pagina sola
pero sin duplicar la barra superior.
*/
(function () {
  if (window.self === window.top) return;
  var style = document.createElement('style');
  style.textContent =
    '.app-header,#botoneraNavegacion,.botonera_navegacion{display:none!important;}' +
    'body{min-height:0!important;}';
  document.head.appendChild(style);
})();
