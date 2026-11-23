// Funciones propias de CEP4Fun. El resto del editor (logs, workspaces, descargas, compilacion,
// E3Value, importacion de Solidity) viene de los modulos originales de SmaCly:
// editorLogs.js, editorWorkspace.js, cargarWorkspace.js, compilacionDescargas.js,
// conversorE3Value.js y parsearSolidity.js.

// Listeners de puntuacion de CEP4Fun (eventos que se envian a n8n/Flink).
// Se registran UNA sola vez al crear el workspace; antes colgaban de registerLogs()
// y se duplicaban (y no puntuaban) segun la casilla "register log events".
var cep4funListenersRegistrados = false;
function registrarListenersCep4fun() {
  if (cep4funListenersRegistrados || !window.workspace) return;
  cep4funListenersRegistrados = true;
  workspace.addChangeListener(dep001_sye001Listener);
  workspace.addChangeListener(ntd001_prg003_prg004_Listener);
  workspace.addChangeListener(ntd002_sce003_Listener);
  workspace.addChangeListener(ntd003Listener);
  workspace.addChangeListener(ntd004Listener);
  workspace.addChangeListener(prg002Listener);
  workspace.addChangeListener(sye002Listener);
  workspace.addChangeListener(sye003Listener);
  workspace.addChangeListener(sye004Listener);
  workspace.addChangeListener(sce002Listener);
  workspace.addChangeListener(sce005Listener);
  workspace.addChangeListener(sce006Listener);
}
